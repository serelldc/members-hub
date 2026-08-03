/* ══════════════════════════════════════════════════════════════════════
   ⚙️  CONFIG — DITO LANG ANG EEDITIN MO
   Ginagamit ito ng index.html at admin.html.
   ══════════════════════════════════════════════════════════════════════ */

window.CFG = {

  /* ── 1. SUPABASE ───────────────────────────────────────────────────
     Kunin sa: Supabase Dashboard → Project Settings → API
     ⚠️ Ang "anon public" key LANG ang ilalagay dito — hindi ang
        service_role key. Ligtas ang anon key na makita ng publiko
        dahil protektado ng Row Level Security ang data mo.        */
  SUPABASE_URL:      "https://YOUR-PROJECT-REF.supabase.co",
  SUPABASE_ANON_KEY: "PASTE-YOUR-ANON-PUBLIC-KEY-HERE",


  /* ── 2. BRANDING ──────────────────────────────────────────────── */
  brandName: "Members Hub",
  initial:   "R",
  tagline:   "Lahat ng digital products mo, nasa isang lugar.",

  /* Banner sa dashboard. Gawing "" para itago. Pwede ang HTML. */
  announcement: "<b>Bago!</b> May bagong templates ngayong buwan — scroll down para makita.",

  supportEmail: "strategicresource.dc@gmail.com",


  /* ── 3. GCASH PAYMENT DETAILS ─────────────────────────────────── */
  gcash: {
    name:   "JUAN D.",           // pangalan sa GCash account mo
    number: "0917 123 4567",     // GCash number mo
    qrImage: ""                  // opsyonal: URL ng GCash QR code image
  },

  /* Presyo kada tier. Ipapakita sa upgrade page. */
  pricing: {
    premium: { price: 499,  label: "Premium",   perks: [
      "Lahat ng free products",
      "40+ Canva templates",
      "Video trainings",
      "Business tracker spreadsheet"
    ]},
    vip:     { price: 1499, label: "VIP Vault", perks: [
      "Lahat ng nasa Premium",
      "Complete bundle ng lahat ng products",
      "Lahat ng future releases — libre",
      "Private coaching replays",
      "Priority support"
    ]}
  },


  /* ── 4. IBA PA ────────────────────────────────────────────────── */
  signedUrlSeconds: 3600,   // gaano katagal valid ang download link (1 oras)
  adminPath: "admin.html"
};
