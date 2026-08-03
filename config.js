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
  SUPABASE_URL:      "https://bvklzienfqwyzcwnvusb.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_Ldp9KQGQBGCNvhU-M7yZgA_CRfwSR-i",


  /* ── 2. BRANDING ──────────────────────────────────────────────── */
  brandName: "SRDC Members Hub",
  initial:   "S",
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

  /* Presyo ng membership. Ipapakita sa upgrade page.
     ISANG TIER lang ngayon — ₱2,500 all-access.
     Kung gusto mong magdagdag ng pangalawang tier balang araw,
     idagdag lang ang `vip: { price: ..., label: ..., perks: [...] }`
     dito — handa na ang database at ang site para dito. */
  pricing: {
    premium: { price: 2500, label: "All-Access Membership", perks: [
      "Lahat ng digital products — walang exception",
      "Lahat ng future releases, libre habambuhay",
      "Templates, guides, at trainings",
      "Instant download anytime, kahit ilang beses",
      "Priority support via email"
    ]}
  },


  /* ── 4. IBA PA ────────────────────────────────────────────────── */
  signedUrlSeconds: 3600,   // gaano katagal valid ang download link (1 oras)
  adminPath: "admin.html"
};
