# pegcanvas-site

Official website repository for PegCanvas.

## Deployment

Deployments to Cloudflare Pages (`pegcanvas-site`) are automated via GitHub Actions on push to `main`.

- Production Domain: https://pegcanvas.com
- Redirect Domain: https://www.pegcanvas.com -> https://pegcanvas.com
- Cloudflare Pages Project: `pegcanvas-site` (`pegcanvas-site.pages.dev`)

## Product imagery

The product owner supplied the PegCanvas logo, an illustrated panel concept and four AI-rendered room scenes. Optimized WebP delivery copies are in `public/assets`; original PNG files remain in the private workspace. Each concept figure has a visible AI-rendered label and a disclosure in the selected page language. The working editor screenshots remain separate from the concept images and were captured from the live prototype in each language. These scenes are inspiration, not evidence of printed products, supported accessories or shipped features.

## Languages

`/zh/` is fully Traditional Chinese and `/en/` is fully English. The header language links work without JavaScript. The root route uses a small script to select the saved language, then the browser language (Chinese browsers use Traditional Chinese; others use English). Explicit locale URLs always take precedence. Without JavaScript, the root provides the complete English page.

Edit shared markup in `src/page.html`, translations in `src/copy.json`, and styling in `public/site.css`. Run `node scripts/build.mjs` to regenerate the static pages; deployment runs the same dependency-free command. The approved slogan and AI disclaimers are displayed in one language at a time. Brand names, file formats and email addresses retain their original spelling.
