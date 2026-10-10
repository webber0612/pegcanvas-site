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

// Simplified Chinese is the Traditional copy put through a table (made by the
// editor repository's tools/make-zh-cn-map.mjs): mainland wording for known
// phrases first, then character by character. Nothing is written twice.
const table = JSON.parse(await readFile(new URL('scripts/zh-cn-map.json', root), 'utf8'));
const longest = Math.max(2, ...Object.keys(table.phrases).map(key => key.length));
function simplify(text) {
  let out = '';
  for (let at = 0; at < text.length;) {
    let length = Math.min(longest, text.length - at);
    for (; length >= 2; length--) {
      const phrase = table.phrases[text.slice(at, at + length)];
      if (phrase === undefined) continue;
      out += phrase;
      break;
    }
    if (length >= 2) at += length;
    else { out += table.characters[text[at]] ?? text[at]; at++; }
  }
  return out;
}
copy['zh-cn'] = {
  ...Object.fromEntries(Object.entries(copy.zh).map(([key, value]) =>
    [key, simplify(value).replaceAll('"/zh/', '"/zh-cn/')])),
  locale: 'zh-cn', htmlLang: 'zh-Hans', zhCurrent: '', zhCnCurrent: copy.zh.zhCurrent,
};
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
