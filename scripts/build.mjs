import { readFile, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('src/page.html', root), 'utf8');
const copy = JSON.parse(await readFile(new URL('src/copy.json', root), 'utf8'));
for (const [locale, strings] of Object.entries(copy)) {
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in strings)) throw new Error(`Missing ${locale} copy: ${key}`);
    return strings[key];
  });
  await mkdir(new URL(`public/${locale}/`, root), { recursive: true });
  await writeFile(new URL(`public/${locale}/index.html`, root), html);
  // Root is a usable English fallback without JavaScript. The small head script
  // routes visitors to their saved language or browser preference.
  if (locale === 'en') await writeFile(new URL('public/index.html', root), html);
}
