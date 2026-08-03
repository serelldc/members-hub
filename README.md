# Members Hub — Setup Guide

Members portal na may tunay na login (Supabase Auth), tier-based access, secure downloads, at GCash payment approval. Naka-host sa GitHub Pages — libre.

```
index.html    ← members hub (login, products, download, upgrade)
admin.html    ← admin panel (approve bayad, manage products & members)
config.js     ← ⚙️ DITO LANG ANG EEDITIN MO
style.css     ← design
schema.sql    ← database schema, i-run sa Supabase SQL Editor
```

---

## Step 1 — Patakbuhin ang SQL sa Supabase

1. Supabase Dashboard → piliin ang project mo → **SQL Editor** → **New query**
2. Buksan ang `schema.sql`, kopyahin ang **lahat**, i-paste, pindutin **Run**
3. Dapat lumabas ang "Success. No rows returned"

Gagawa nito ng:

| Bagay | Para saan |
|---|---|
| `profiles` | member info + tier (free/premium/vip) + expiry |
| `products` | catalog ng digital products mo |
| `payment_requests` | GCash submissions na naghihintay ng approval |
| `downloads` | log kung sino ang nag-download ng ano |
| 3 storage buckets | `products` (private), `proofs` (private), `covers` (public) |
| Row Level Security | ang **server** mismo ang nag-e-enforce ng tier access |

> Ligtas i-run ulit ang SQL kahit ilang beses — hindi ito magdo-doble.

---

## Step 2 — I-off ang email confirmation (para sa testing)

Supabase → **Authentication → Sign In / Providers → Email**

- Habang nagte-test ka: **i-off** ang *Confirm email* para makapag-login agad.
- Bago mag-launch: **i-on** ulit — pinipigilan nito ang fake signups.

Sa **Authentication → URL Configuration**, ilagay ang GitHub Pages URL mo sa *Site URL* at *Redirect URLs* (hal. `https://USERNAME.github.io/REPO/`). Kailangan ito para gumana ang confirmation at password-reset links.

---

## Step 3 — Punan ang `config.js`

Kunin ang keys sa **Project Settings → API**:

```js
SUPABASE_URL:      "https://abcdefgh.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

> ⚠️ Ang **anon public** key lang — hindi ang `service_role`. Ligtas makita ng publiko ang anon key; protektado ng RLS ang data. Ang `service_role` key ay **hindi kailanman** dapat mapunta sa GitHub.

Palitan din ang `brandName`, `initial`, `tagline`, `supportEmail`, ang `gcash` details, at ang `pricing`.

---

## Step 4 — I-push sa GitHub at buksan ang Pages

```bash
git clone https://github.com/USERNAME/REPO.git
cd REPO
# kopyahin dito ang index.html, admin.html, config.js, style.css, schema.sql
git add .
git commit -m "Members hub"
git push
```

Tapos: repo → **Settings → Pages** → *Source:* **Deploy from a branch** → branch `main`, folder `/ (root)` → **Save**.

Pagkatapos ng ~1 minuto, live na sa:
```
https://USERNAME.github.io/REPO/
```

**Mahalaga:** gawing **public** ang repo (kailangan ng GitHub Pages sa free plan). Ok lang iyon — walang secret sa code mo. Ang mismong files at member data ay nasa Supabase, hindi sa repo.

---

## Step 5 — Gawin mong admin ang sarili mo

1. Buksan ang live site mo → **Gumawa ng account** gamit ang totoong email mo
2. Balik sa Supabase **SQL Editor**, i-run (palitan ang email):

```sql
update public.profiles
   set is_admin = true, tier = 'vip'
 where email = 'strategicresource.dc@gmail.com';
```

3. Pumunta sa `https://USERNAME.github.io/REPO/admin.html` — makakapasok ka na.

---

## Paano ito gumagana araw-araw

### Pag-add ng product

Admin panel → tab **📦 Products** → **+ Bagong product**

| Field | Paliwanag |
|---|---|
| Minimum tier | `free` = lahat makakakita · `premium` · `vip` |
| **I-upload ang file** | Para sa PDF, template, spreadsheet. Napupunta sa private bucket. Signed link na **nag-e-expire after 1 oras** ang makukuha ng member. |
| **…O Google Drive link** | Para sa malalaking video (>50 MB). Iniiwasan nitong maubos ang 1 GB free storage. |
| Cover | Emoji (`📘`) o image URL |
| Live | I-uncheck para itago muna habang inaayos |

Isa lang ang kailangan sa dalawa — file upload **o** Drive link. Kung pareho, ang na-upload na file ang mananaig.

### Pag-approve ng GCash payment

1. Magbabayad ang member sa GCash number mo, tapos mag-a-upload ng screenshot sa site.
2. Admin panel → tab **💰 Bayad** → makikita mo ang pending request.
3. **Tingnan** — bubuksan ang screenshot. I-check ang halaga at reference number.
4. **Approve** — awtomatikong nagiging premium/vip ang member. Pagpasok niya, unlocked na lahat.
5. **Reject** — hihingian ka ng dahilan, at makikita niya iyon sa dashboard niya.

### Pagpapalit ng tier nang manu-mano

Tab **👥 Members** → palitan lang ang dropdown ng tier. May **Set expiry** din kung gusto mong subscription-style (hal. 1 taon) — awtomatikong babalik sa `free` pagsapit ng petsa.

---

## Bakit mas secure ito kaysa sa simpleng password

| | Password-in-HTML | Supabase (ito) |
|---|---|---|
| Nakikita ang passwords sa page source | ❌ Oo | ✅ Hindi — hashed sa server |
| Nakikita ang locked na download links | ❌ Oo | ✅ Hindi — hindi man lang naipapadala ng server |
| Nag-e-expire ang download links | ❌ Hindi | ✅ Oo, 1 oras |
| Kaya i-upgrade ng member ang sarili niya | ❌ Wala namang tier | ✅ Hindi — may database trigger na pumipigil |
| Alam mo kung sino nag-download | ❌ Hindi | ✅ Oo, naka-log |
| Forgot password | ❌ Wala | ✅ Meron |

Ang tier filtering ay nasa **Row Level Security** — nangyayari sa Postgres bago pa man umalis ang data. Kahit buksan ng member ang devtools at direktang tawagin ang API, wala pa rin siyang makikitang locked na product.

---

## Mga limitasyon ng free tier

| | Free limit | Ano'ng gagawin kapag lumagpas |
|---|---|---|
| Supabase Storage | 1 GB | Ilagay ang mga video sa Google Drive |
| Supabase bandwidth | 5 GB/buwan | Pro plan ($25/buwan) o Drive para sa malalaki |
| Monthly active users | 50,000 | Sobra-sobra na iyan |
| GitHub Pages | 1 GB repo, 100 GB/buwan | Hindi mo aabutin — files lang ang nandito |

**Paalala:** nagpa-pause ang Supabase free project kapag walang activity ng 7 araw. Bumisita lang sa dashboard minsan sa isang linggo, o mag-upgrade sa Pro kapag may bayad na members ka.

---

## Kapag handa ka nang mag-automate ng bayad

Ngayon, manual ang approval. Kapag dumami na (30+ bayad kada buwan), lumipat sa **PayMongo** — tumatanggap ng GCash, Maya, GrabPay, at cards, at may webhook para sa tunay na automatic activation.

Ang kailangan lang idagdag:
1. PayMongo account (kailangan ng valid ID o DTI registration)
2. Isang Supabase **Edge Function** na tatanggap ng webhook at tatawag sa `set_member_tier()`
3. Checkout button sa upgrade page

Handa na ang database para dito — ang `set_member_tier()` function ay pwede nang tawagin ng Edge Function. Sabihan mo lang ako.

---

## Checklist bago mag-launch

- [ ] Na-run ang `schema.sql`, walang error
- [ ] Napunan ang `SUPABASE_URL` at `SUPABASE_ANON_KEY` sa `config.js`
- [ ] Napalitan ang branding, GCash number, at pricing
- [ ] Naka-set ang Site URL + Redirect URLs sa Supabase Auth settings
- [ ] Naka-**ON** ulit ang *Confirm email*
- [ ] Nagawa mong admin ang account mo
- [ ] Nabura ang 3 sample products, nailagay ang totoong products
- [ ] Na-test: gumawa ng pangalawang test account → dapat free tier products lang ang kita
- [ ] Na-test: nag-submit ng proof → lumabas sa admin panel → na-approve → na-unlock
- [ ] Na-test ang download sa cellphone
- [ ] `service_role` key ay **wala** sa repo
