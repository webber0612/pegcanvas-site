# pegcanvas-site

Official website repository for PegCanvas.

## Deployment

Deployments to Cloudflare Pages (`pegcanvas-site`) are automated via GitHub Actions on push to `main`.

- Production Domain: https://pegcanvas.com
- Redirect Domain: https://www.pegcanvas.com -> https://pegcanvas.com
- Cloudflare Pages Project: `pegcanvas-site` (`pegcanvas-site.pages.dev`)

## Product imagery

The product owner supplied the PegCanvas logo, an illustrated panel concept and four AI-rendered room scenes. Optimized WebP delivery copies are in `public/assets`; original PNG files remain in the private workspace. The hero panel is labelled as a 3D render and every room scene carries a visible "AI concept · not a photo" chip in the selected page language. These scenes are inspiration, not evidence of printed products, supported accessories or shipped features. Replace the hero with real print photos once they are available.

## Page structure (2026-10 redesign)

Hero (split-panel interaction) → feature marquee → room-scene tabs → slogan band → how-it-works demo (color count, panel size, 3MF plates) → specs → tentative Kickstarter pricing → FAQ → Kickstarter notify CTA (mailto hello@pegcanvas.com). Pricing and plan rights follow `docs/PRICING_PLAN.md` in the private core repository; keep both in sync.

## Languages

`/zh/` is fully Traditional Chinese and `/en/` is fully English. The header language links work without JavaScript. The root route uses a small script to select the saved language, then the browser language (Chinese browsers use Traditional Chinese; others use English). Explicit locale URLs always take precedence. Without JavaScript, the root provides the complete English page.

Edit shared markup in `src/page.html`, translations in `src/copy.json`, styling in `public/site.css` and the small progressive-enhancement script in `public/site.js` (the page stays readable without JavaScript). Run `node scripts/build.mjs` to regenerate the static pages; deployment runs the same dependency-free command. The approved slogan and AI disclaimers are displayed in one language at a time. Brand names, file formats and email addresses retain their original spelling.
