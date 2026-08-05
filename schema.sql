-- ══════════════════════════════════════════════════════════════════════
--  MEMBERS HUB — Supabase schema
--  Paano gamitin: Supabase Dashboard → SQL Editor → New query →
--                 i-paste LAHAT ng ito → Run.
--  Ligtas patakbuhin nang paulit-ulit (idempotent).
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
--  1. TABLES
-- ─────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  tier        text not null default 'free' check (tier in ('free','premium','vip')),
  is_admin    boolean not null default false,
  notes       text,
  expires_at  timestamptz,                  -- null = habambuhay
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  category      text not null default 'General',
  kind          text not null default 'PDF',    -- PDF / Template / Video / Audio / Bundle
  tier          text not null default 'free' check (tier in ('free','premium','vip')),
  cover         text default '📦',               -- emoji o image URL
  storage_path  text,                            -- path sa 'products' bucket (secure)
  external_url  text,                            -- Google Drive link (malalaking video)
  file_size     text,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  requested_tier text not null check (requested_tier in ('premium','vip')),
  amount         numeric(10,2),
  reference      text,                           -- GCash reference number
  proof_path     text,                           -- screenshot sa 'proofs' bucket
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note     text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);

create table if not exists public.downloads (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  product_id  uuid references public.products(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_products_tier    on public.products(tier) where published;
create index if not exists idx_payreq_status    on public.payment_requests(status, created_at desc);
create index if not exists idx_downloads_user   on public.downloads(user_id, created_at desc);


-- ─────────────────────────────────────────────
--  2. HELPER FUNCTIONS
--     SECURITY DEFINER para hindi mag-infinite
--     recursion ang RLS sa profiles table.
-- ─────────────────────────────────────────────

create or replace function public.tier_rank(t text)
returns int language sql immutable parallel safe as $$
  select case t when 'vip' then 3 when 'premium' then 2 else 1 end;
$$;

create or replace function public.my_tier()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case
       when p.expires_at is not null and p.expires_at < now() then 'free'
       else p.tier
     end
     from public.profiles p where p.id = auth.uid()),
    'free');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;


-- ─────────────────────────────────────────────
--  3. TRIGGERS
-- ─────────────────────────────────────────────

-- Gumawa ng profile awtomatiko kapag may bagong signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ⛔ Pinipigilan ang member na i-upgrade ang sarili niyang tier.
--    Kahit i-hack pa niya ang browser console, ibabalik nito ang lumang value.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() ay NULL kapag galing sa SQL editor o service_role —
  -- server-side iyon, at protektado na ng RLS ang browser requests.
  if auth.uid() is not null and not public.is_admin() then
    new.tier       := old.tier;
    new.is_admin   := old.is_admin;
    new.expires_at := old.expires_at;
    new.notes      := old.notes;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_fields();


-- ─────────────────────────────────────────────
--  4. ADMIN ACTIONS (RPC)
-- ─────────────────────────────────────────────

create or replace function public.approve_payment(req_id uuid, note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.payment_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin lang ang pwedeng mag-approve.';
  end if;

  select * into r from public.payment_requests where id = req_id for update;
  if not found then raise exception 'Wala ang request na ito.'; end if;

  update public.profiles
     set tier = r.requested_tier
   where id = r.user_id;

  update public.payment_requests
     set status = 'approved', reviewed_at = now(), admin_note = note
   where id = req_id;
end $$;

create or replace function public.reject_payment(req_id uuid, note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admin lang ang pwedeng mag-reject.';
  end if;
  update public.payment_requests
     set status = 'rejected', reviewed_at = now(), admin_note = note
   where id = req_id;
end $$;

create or replace function public.set_member_tier(target uuid, new_tier text, until timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admin lang ang pwedeng magpalit ng tier.';
  end if;
  if new_tier not in ('free','premium','vip') then
    raise exception 'Invalid tier: %', new_tier;
  end if;
  update public.profiles set tier = new_tier, expires_at = until where id = target;
end $$;

-- Ginagamit ng admin panel para makita ang lahat ng members (kasama ang email)
create or replace function public.admin_list_members()
returns table (
  id uuid, email text, full_name text, tier text,
  is_admin boolean, expires_at timestamptz, created_at timestamptz,
  downloads bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.full_name, p.tier, p.is_admin, p.expires_at, p.created_at,
         (select count(*) from public.downloads d where d.user_id = p.id)
  from public.profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;


-- ─────────────────────────────────────────────
--  5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.payment_requests enable row level security;
alter table public.downloads        enable row level security;

-- PROFILES ────────────────────────────────
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin());
  -- ↑ ang tier/is_admin ay protektado ng protect_profile_fields() trigger

-- PRODUCTS ────────────────────────────────
-- Nakikita LANG ng member ang products na kasya sa tier niya.
-- Hindi lumalabas sa API ang naka-lock na rows, kaya hindi rin
-- makikita ang storage_path o external_url nila.
drop policy if exists products_select_by_tier on public.products;
create policy products_select_by_tier on public.products
  for select using (
    public.is_admin()
    or (published and public.tier_rank(tier) <= public.tier_rank(public.my_tier()))
  );

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- PAYMENT REQUESTS ────────────────────────
drop policy if exists payreq_select on public.payment_requests;
create policy payreq_select on public.payment_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists payreq_insert_own on public.payment_requests;
create policy payreq_insert_own on public.payment_requests
  for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists payreq_admin_update on public.payment_requests;
create policy payreq_admin_update on public.payment_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- DOWNLOADS ───────────────────────────────
drop policy if exists downloads_insert_own on public.downloads;
create policy downloads_insert_own on public.downloads
  for insert with check (user_id = auth.uid());

drop policy if exists downloads_select on public.downloads;
create policy downloads_select on public.downloads
  for select using (user_id = auth.uid() or public.is_admin());


-- ─────────────────────────────────────────────
--  6. STORAGE BUCKETS + POLICIES
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('products', 'products', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = true;

-- PRODUCTS bucket ─── signed URL lang, at kung kasya sa tier mo
drop policy if exists st_products_read on storage.objects;
create policy st_products_read on storage.objects
  for select using (
    bucket_id = 'products'
    and (
      public.is_admin()
      or name in (
        select p.storage_path
        from public.products p
        where p.storage_path is not null
          and p.published
          and public.tier_rank(p.tier) <= public.tier_rank(public.my_tier())
      )
    )
  );

drop policy if exists st_products_write on storage.objects;
create policy st_products_write on storage.objects
  for all using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

-- PROOFS bucket ─── ang member ay sa sarili niyang folder lang: {uid}/file.jpg
drop policy if exists st_proofs_insert on storage.objects;
create policy st_proofs_insert on storage.objects
  for insert with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists st_proofs_read on storage.objects;
create policy st_proofs_read on storage.objects
  for select using (
    bucket_id = 'proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- COVERS bucket ─── public images para sa product thumbnails
drop policy if exists st_covers_read on storage.objects;
create policy st_covers_read on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists st_covers_write on storage.objects;
create policy st_covers_write on storage.objects
  for all using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());


-- ═══════════════════════════════════════════════════════════════
--  7. HULING HAKBANG — GAWIN MONG ADMIN ANG SARILI MO
--
--  a) Mag-signup muna sa hub mo gamit ang email mo.
--  b) Balik dito, palitan ang email sa baba, tapos i-run:
--
--       update public.profiles
--          set is_admin = true, tier = 'vip'
--        where email = 'strategicresource.dc@gmail.com';
--
--  c) I-refresh ang admin.html — makakapasok ka na.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
--  8. PRODUCT SUGGESTIONS — members can request products
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.product_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  details     text,
  status      text not null default 'new' check (status in ('new','planned','done','declined')),
  admin_note  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_prodreq_status on public.product_requests(status, created_at desc);

alter table public.product_requests enable row level security;

drop policy if exists prodreq_select on public.product_requests;
create policy prodreq_select on public.product_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists prodreq_insert_own on public.product_requests;
create policy prodreq_insert_own on public.product_requests
  for insert with check (user_id = auth.uid());

drop policy if exists prodreq_admin_update on public.product_requests;
create policy prodreq_admin_update on public.product_requests
  for update using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════
--  9. REFERRALS
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by   uuid references public.profiles(id);

-- Backfill referral codes for any existing members that don't have one yet
update public.profiles set referral_code = substr(md5(id::text), 1, 8)
where referral_code is null;

create unique index if not exists idx_profiles_referral_code on public.profiles(referral_code);

-- Update the new-user trigger so every signup gets a referral code, and
-- honors a ?ref=CODE passed through signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ref_id uuid;
begin
  if new.raw_user_meta_data->>'ref' is not null then
    select id into ref_id from public.profiles
      where referral_code = new.raw_user_meta_data->>'ref' limit 1;
  end if;

  insert into public.profiles (id, email, full_name, referral_code, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    substr(md5(new.id::text), 1, 8),
    ref_id
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- A member can check their OWN referral count without being able to see
-- other members' profiles (RLS still blocks that).
create or replace function public.my_referral_count()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.profiles where referred_by = auth.uid();
$$;


-- ═══════════════════════════════════════════════════════════════
--  10. ANALYTICS (admin only)
-- ═══════════════════════════════════════════════════════════════

create or replace function public.admin_analytics()
returns table (
  total_members       bigint,
  total_downloads     bigint,
  total_revenue        numeric,
  members_this_month  bigint,
  members_last_month  bigint
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.profiles where public.is_admin()),
    (select count(*) from public.downloads where public.is_admin()),
    (select coalesce(sum(amount),0) from public.payment_requests where status = 'approved' and public.is_admin()),
    (select count(*) from public.profiles where created_at >= date_trunc('month', now()) and public.is_admin()),
    (select count(*) from public.profiles
       where created_at >= date_trunc('month', now() - interval '1 month')
         and created_at <  date_trunc('month', now())
         and public.is_admin());
$$;

create or replace function public.admin_top_products(limit_n int default 5)
returns table (product_id uuid, title text, download_count bigint)
language sql stable security definer set search_path = public as $$
  select d.product_id, p.title, count(*) as download_count
  from public.downloads d
  join public.products p on p.id = d.product_id
  where public.is_admin()
  group by d.product_id, p.title
  order by download_count desc
  limit limit_n;
$$;

-- ═══════════════════════════════════════════════════════════════
--  11. AGENT LINKS — per-member Systeme.io referral link, set by
--      admin. Shown to the member on the "Refer a Friend" tab as
--      https://ebookcoaching.systeme.io/ebook?agent=<agent_code>
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists agent_code text;

-- One-time convenience backfill for known agents (safe to re-run).
update public.profiles set agent_code = 'Delia' where email = 'muhrddelia@gmail.com' and agent_code is null;
update public.profiles set agent_code = 'Mia'   where email = 'mdpanopio0423@gmail.com' and agent_code is null;
update public.profiles set agent_code = 'Agnes'  where email = 'miraplesagnes9@gmail.com' and agent_code is null;

create or replace function public.set_member_agent_code(target uuid, code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  update public.profiles set agent_code = nullif(trim(code), '') where id = target;
end $$;

-- Extend the members RPC with referral + agent-code info (recreated with new return shape)
drop function if exists public.admin_list_members();
create or replace function public.admin_list_members()
returns table (
  id uuid, email text, full_name text, tier text,
  is_admin boolean, expires_at timestamptz, created_at timestamptz,
  downloads bigint, referral_code text, referral_count bigint, agent_code text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.full_name, p.tier, p.is_admin, p.expires_at, p.created_at,
         (select count(*) from public.downloads d where d.user_id = p.id),
         p.referral_code,
         (select count(*) from public.profiles r where r.referred_by = p.id),
         p.agent_code
  from public.profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;


-- Optional: sample products para may makita ka agad
insert into public.products (title, description, category, kind, tier, cover, external_url, file_size, sort_order)
select * from (values
  ('Starter Guide: Digital Products 101','Step-by-step ebook kung paano gumawa at magbenta ng first digital product mo.','Guides','Ebook','free','📘','https://example.com/replace-me','5.1 MB',1),
  ('Canva Brand Kit — 40 Templates','Editable Canva pack: posts, stories, reels covers, at carousel layouts.','Templates','Template','premium','🎨','https://example.com/replace-me','Canva link',2),
  ('VIP Vault — Complete Bundle','Lahat ng past at future releases, plus private coaching replays.','Bundles','Bundle','vip','👑','https://example.com/replace-me','1.2 GB',3)
) as v
where not exists (select 1 from public.products);
