import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const pages = [
  ['src/page.html', ''],
  ['src/legal.html', 'legal/'],
  ['src/faq.html', 'faq/'],
];
// Browsers keep styles and scripts for hours. Each link carries a stamp of the
// file's contents, so a page never arrives with an older stylesheet than it needs.
const stamped = ['site.css', 'chat-widget.css', 'site.js', 'language.js', 'chat-widget.js'];
const stamps = new Map();
for (const file of stamped) {
  const contents = await readFile(new URL(`public/${file}`, root));
  stamps.set(file, createHash('sha256').update(contents).digest('hex').slice(0, 10));
}
const stamp = html => html.replace(/(href|src)="\/([\w.-]+\.(?:css|js))"/g, (whole, attribute, file) =>
  stamps.has(file) ? `${attribute}="/${file}?v=${stamps.get(file)}"` : whole);

const copy = JSON.parse(await readFile(new URL('src/copy.json', root), 'utf8'));
for (const [source, folder] of pages) {
  const template = await readFile(new URL(source, root), 'utf8');
  for (const [locale, strings] of Object.entries(copy)) {
    const html = stamp(template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in strings)) throw new Error(`Missing ${locale} copy: ${key}`);
      return strings[key];
    }));
    await mkdir(new URL(`public/${locale}/${folder}`, root), { recursive: true });
    await writeFile(new URL(`public/${locale}/${folder}index.html`, root), html);
    // Root is a usable English fallback without JavaScript. The small head script
    // routes visitors to their saved language or browser preference.
    if (locale === 'en' && !folder)
      await writeFile(new URL('public/index.html', root), html);
  }
}
