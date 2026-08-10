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
  tagline:   "DIGZ = Digital Innovators & Growth Zone.",

  /* Shown in the welcome/hero area on the dashboard — explains what "Digz" means. */
  about: "<b>DIGZ</b> = Digital Innovators & Growth Zone. Ka Digz is a community of digital creators turning ideas into digital products.",

  /* Banner on the dashboard. Set to "" to hide it. HTML is allowed. */
  announcement: "<b>New!</b> New templates added this month — scroll down to see.",

  supportEmail: "strategicresource.dc@gmail.com",

  /* The Systeme.io link members share on the "Refer a Friend" tab.
     Their personal ?agent=<code> is appended automatically if the
     admin has set an agent code for them in the Members tab. */
  agentLinkBase: "https://ebookcoaching.systeme.io/ebook",

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


  /* ── 4. FAQ — shown in the FAQ tab. Edit freely, any length. ────── */
  faq: [
    { q: "How do I upgrade my membership?",
      d: "Go to the \"Upgrade\" section on your dashboard, send the GCash payment, then submit the screenshot with your reference number. It's usually approved within 24 hours." },
    { q: "I paid but my account still shows Free. What do I do?",
      d: "Check the message banner near the top of your dashboard — it shows the status of your last payment submission. If it's been more than 24 hours, email us using the Contact Us link in the footer." },
    { q: "I forgot my password. How do I reset it?",
      d: "Click \"Forgot password?\" on the login screen and enter your email. If the reset email doesn't arrive, contact us directly and we'll reset it from our end." },
    { q: "Can I download a product more than once?",
      d: "Yes — as long as it's included in your current tier, you can download it anytime, as many times as you like." },
    { q: "A download link isn't working. What should I do?",
      d: "Download links expire after an hour for security. Just go back to the product and click Download again to get a fresh link. If it still doesn't work, contact us." },
    { q: "Can I share my account or the files with someone else?",
      d: "No — access is for your personal use only. Please don't share your login or redistribute the files." },
    { q: "How does \"Invite & Earn\" work?",
      d: "Go to the \"Invite & Earn\" tab to get your personal invite link. When someone signs up using your link and their ₱2,500 membership payment is approved, you earn ₱500 — tracked automatically on that tab. We'll send your payout via GCash." },
    { q: "What's in the \"Resources\" tab?",
      d: "A curated list of useful links and tools for making ebooks, templates, and other digital products — things like design tools, writing helpers, and more. Filter by category using the chips at the top." }
  ],


  /* ── 5. IBA PA ────────────────────────────────────────────────── */
  signedUrlSeconds: 3600,   // gaano katagal valid ang download link (1 oras)
  adminPath: "admin.html"
};
