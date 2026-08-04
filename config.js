/* ══════════════════════════════════════════════════════════════════════
   CONFIG — DITO LANG ANG EEDITIN MO
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
  brandName: "Digz Members",
  initial:   "D",
  tagline:   "All your digital products, in one place.",

  /* Banner on the dashboard. Set to "" to hide it. HTML is allowed. */
  announcement: "<b>New!</b> New templates added this month — scroll down to see.",

  supportEmail: "strategicresource.dc@gmail.com",

  /* Larawan per kategorya — ginagamit bilang cover ng product card kapag
     walang sariling cover image ang product mismo. I-match ang key sa
     eksaktong pangalan ng kategorya (case-sensitive) na nasa Admin →
     Products → Kategorya field. Pwedeng URL (https://...) o filename
     kung na-upload mo na ang image sa parehong folder nito (hal. "cat-guides.jpg").
     Kung walang match, monogram tile ang gagamitin bilang fallback. */
  categoryImages: {
    // "Guides":    "cat-guides.jpg",
    // "Templates": "cat-templates.jpg",
    // "Bundles":   "cat-bundles.jpg"
  },


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
      "Every digital product — no exceptions",
      "All future releases, free forever",
      "Templates, guides, and trainings",
      "Instant download anytime, as many times as you like",
      "Priority support via email"
    ]}
  },


  /* ── 4. IBA PA ────────────────────────────────────────────────── */
  signedUrlSeconds: 3600,   // gaano katagal valid ang download link (1 oras)
  adminPath: "admin.html"
};
