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

Hero (split-panel interaction) → feature marquee → free designs → beta campaign → room-scene tabs → slogan band → how-it-works demo (color count, panel size, 3MF plates) → specs → wall preview → plan pricing → FAQ → launch notification. Pricing and plan rights follow `docs/PRICING_PLAN.md` in the private core repository; keep both in sync.

## Languages

`/zh/` is fully Traditional Chinese and `/en/` is fully English. The header language links work without JavaScript. The root route uses a small script to select the saved language, then the browser language (Chinese browsers use Traditional Chinese; others use English). Explicit locale URLs always take precedence. Without JavaScript, the root provides the complete English page.

Edit shared markup in `src/page.html`, translations in `src/copy.json`, styling in `public/site.css` and the small progressive-enhancement script in `public/site.js` (the page stays readable without JavaScript). Run `node scripts/build.mjs` to regenerate the static pages; deployment runs the same dependency-free command. The approved slogan and AI disclaimers are displayed in one language at a time. Brand names, file formats and email addresses retain their original spelling.

## Simplified Chinese

The `/zh-cn/` pages are the Traditional copy put through `scripts/zh-cn-map.json` at build time; nothing is written twice. The table is made in the editor repository (`pnpm make:zh-cn`) from the OpenCC dictionaries (Apache-2.0, via opencc-js) plus a short list of our own wording. Regenerate it there after adding Chinese copy that uses new vocabulary.

## Free designs (2026-10-12)

The homepage's `#free-downloads` collection sits after the hero/marquee and before the beta campaign. The header, hero's secondary button and footer link directly to it. It gives visitors a ready-made print alongside the existing create-your-own path, using the site's cream, navy and cobalt colors. One design uses a wide photo-and-description layout; additional designs automatically become a responsive grid. No empty placeholder cards, carousel, login gate or JavaScript dependency.

Add works to `src/free-designs.json`, newest first. Copy the existing entry and supply the MakerWorld model ID, slug and print profile ID, verified color/panel counts and assembled dimensions, plus English and Traditional Chinese titles, descriptions and image alt text. Add optimized `public/assets/<preview>-480.webp` and `-960.webp` copies, and record the 960-copy's actual width/height in `imageSize`. Use `previewKind` `photo`, `render` or `ai` accurately; the build supplies the corresponding caption and generates Simplified Chinese. Links preserve the print profile and use MakerWorld's Chinese/English page according to the website language. Only approved preview images go in this public repository; working `.pegcanvas` files and local `.3mf` files stay private, with downloads handled by MakerWorld.

The first work is **Girl with a Pearl**, MakerWorld model **3423601**, profile **3901666**: 12 colors, four 200 × 200 mm panels, 400 × 400 mm assembled, checked against the supplied project. Its preview is an optimized copy of the owner's actual print photo, not the Chinese promotional graphic or an AI render. Source originals remain unchanged in the private workspace.

Run `node scripts/build.mjs`, check all three languages and 320/768/1024/1440 px layouts, then commit/push; the existing GitHub Actions workflow publishes the site. Build validation checks metadata, translated copy, preview files and unique IDs. Public release notes describe the free-design collection without changing editor/account features.
