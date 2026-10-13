import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const pages = [
  ['src/page.html', ''],
  ['src/legal.html', 'legal/'],
  ['src/faq.html', 'faq/'],
  ['src/updates.html', 'updates/'],
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
const freeDesigns = JSON.parse(await readFile(new URL('src/free-designs.json', root), 'utf8'));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
assert(Array.isArray(freeDesigns) && freeDesigns.length > 0, 'Add at least one free design.');
assert.equal(new Set(freeDesigns.map(item => item.id)).size, freeDesigns.length, 'Duplicate free design.');
for (const item of freeDesigns) {
  if (item.downloadPending !== undefined) assert.equal(typeof item.downloadPending, 'boolean', 'Invalid downloadPending.');
  if (item.cultsPath !== undefined) assert(/^[a-z0-9-]+\/[a-z0-9-]+$/.test(item.cultsPath), 'Invalid cultsPath.');
  for (const field of ['id', 'preview']) assert(/^[a-z0-9-]+$/.test(item[field]), `Invalid ${field}.`);
  if (!item.downloadPending) {
    assert(/^[a-z0-9-]+$/.test(item.modelSlug), 'Invalid modelSlug.');
    assert(/^\d+$/.test(item.modelId), 'Invalid modelId.');
    if (item.profileId !== undefined) assert(/^\d+$/.test(item.profileId), 'Invalid profileId.');
  }
  if (item.originalPhoto) {
    assert(/^[a-z0-9-]+\.webp$/.test(item.originalPhoto), 'Invalid originalPhoto.');
    await readFile(new URL(`public/assets/${item.originalPhoto}`, root));
  }
  for (const field of ['colors', 'panels']) assert(Number.isSafeInteger(item[field]) && item[field] > 0, `Invalid ${field}.`);
  for (const field of ['sizeMm', 'imageSize']) assert(Array.isArray(item[field]) && item[field].length === 2 && item[field].every(n => Number.isFinite(n) && n > 0), `Invalid ${field}.`);
  assert(['photo', 'retouched-photo', 'render', 'ai'].includes(item.previewKind), 'Label each preview accurately.');
  if (item.previewKind === 'retouched-photo') assert(item.originalPhoto, 'Retouched photos must link to the original.');
  for (const lang of ['zh', 'en']) for (const field of ['title', 'description', 'imageAlt']) assert(typeof item[lang]?.[field] === 'string' && item[lang][field], `Missing ${lang} ${field}.`);
  for (const width of [480, 960]) await readFile(new URL(`public/assets/${item.preview}-${width}.webp`, root));
  if (item.sourcePreview !== undefined) {
    assert(/^[a-z0-9-]+$/.test(item.sourcePreview), 'Invalid sourcePreview.');
    assert(Array.isArray(item.sourceImageSize) && item.sourceImageSize.length === 2 && item.sourceImageSize.every(n => Number.isSafeInteger(n) && n > 0), 'Invalid sourceImageSize.');
    for (const lang of ['zh', 'en']) assert(typeof item[lang]?.sourceAlt === 'string' && item[lang].sourceAlt, `Missing ${lang} sourceAlt.`);
    for (const width of [480, 960]) await readFile(new URL(`public/assets/${item.sourcePreview}-${width}.webp`, root));
  }
}

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
for (const [locale, strings] of Object.entries(copy)) {
  const localize = value => locale === 'zh-cn' ? simplify(value) : value;
  strings.freeDesignCards = freeDesigns.map(item => {
    const text = item[locale === 'en' ? 'en' : 'zh'];
    const title = escapeHtml(localize(text.title));
    const url = item.downloadPending ? undefined : `https://makerworld.com/${locale === 'en' ? 'en' : 'zh'}/models/${item.modelId}-${item.modelSlug}${item.profileId ? `#profileId-${item.profileId}` : ''}`;
    const downloadLinks = [
      ...(url ? [{ name: 'MakerWorld', url, label: strings.freeDownload }] : []),
      ...(item.cultsPath ? [{ name: 'Cults3D', url: `https://cults3d.com/en/3d-model/${item.cultsPath}`, label: strings.freeDownloadCults }] : []),
    ];
    const downloads = downloadLinks.length ? `<div class="free-design-downloads" role="group" aria-label="${escapeHtml(strings.freeChoosePlatform)}">
      <p class="free-design-download-label">${escapeHtml(strings.freeChoosePlatform)}</p>
      <div class="free-design-download-links">${downloadLinks.map(link => `<a class="btn btn-ghost free-design-download" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(link.label + strings.freeNewTab)}"><span>${link.name}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>`).join('')}</div>
    </div>` : '';
    const caption = strings[{ photo: 'freePhotoLabel', 'retouched-photo': 'freeRetouchedLabel', render: 'freeRenderLabel', ai: 'freeAiLabel' }[item.previewKind]];
    const imageSizes = freeDesigns.length === 1 ? '(min-width: 860px) 620px, 100vw' : '(min-width: 1100px) 400px, (min-width: 760px) 50vw, 100vw';
    const printImage = `<img src="/assets/${item.preview}-960.webp" srcset="/assets/${item.preview}-480.webp 480w, /assets/${item.preview}-960.webp 960w" sizes="${imageSizes}" width="${item.imageSize[0]}" height="${item.imageSize[1]}" loading="lazy" decoding="async" alt="${escapeHtml(localize(text.imageAlt))}">`;
    const visual = item.sourcePreview ? `<div class="free-design-gallery" data-work-gallery role="group" aria-label="${escapeHtml(strings.freeComparisonLabel)}">
        <figure class="free-design-view" id="${item.id}-print" data-gallery-panel>
          ${printImage}
          <figcaption>${escapeHtml(strings.freePrintLabel)}</figcaption>
        </figure>
        <figure class="free-design-view" id="${item.id}-source" data-gallery-panel hidden>
          <img src="/assets/${item.sourcePreview}-960.webp" srcset="/assets/${item.sourcePreview}-480.webp 480w, /assets/${item.sourcePreview}-960.webp 960w" sizes="${imageSizes}" width="${item.sourceImageSize[0]}" height="${item.sourceImageSize[1]}" loading="lazy" decoding="async" alt="${escapeHtml(localize(text.sourceAlt))}">
          <figcaption>${escapeHtml(strings.freeSourceLabel)}</figcaption>
        </figure>
        <div class="free-design-thumbnails" data-gallery-controls hidden>
          <button type="button" aria-controls="${item.id}-print" aria-pressed="true"><img src="/assets/${item.preview}-480.webp" width="64" height="64" loading="lazy" alt=""><span>${escapeHtml(strings.freePrintLabel)}</span></button>
          <button type="button" aria-controls="${item.id}-source" aria-pressed="false"><img src="/assets/${item.sourcePreview}-480.webp" width="64" height="64" loading="lazy" alt=""><span>${escapeHtml(strings.freeSourceLabel)}</span></button>
        </div>
        <noscript><a class="free-design-source-link" href="/assets/${item.sourcePreview}-960.webp">${escapeHtml(strings.freeSourceLabel)}</a></noscript>
      </div>` : `<figure class="free-design-photo">
        ${printImage}
        <figcaption>${escapeHtml(caption)}</figcaption>
      </figure>`;
    return `<article class="free-design" aria-labelledby="work-${item.id}">
      ${visual}
      <div class="free-design-copy">
        <div class="free-design-details">
        <p class="eyebrow">${escapeHtml(strings.freeFileLabel)}</p>
        <h3 id="work-${item.id}">${title}</h3>
        <ul class="free-design-meta" aria-label="${escapeHtml(strings.freeSpecsLabel)}"><li>${item.colors} ${escapeHtml(strings.freeColors)}</li><li>${item.panels} ${escapeHtml(strings.freePanels)}</li><li>${item.sizeMm.join(' × ')} mm</li></ul>
        <p class="free-design-description">${escapeHtml(localize(text.description))}</p>
        </div>
        <div class="free-design-actions">
        ${item.originalPhoto ? `<a class="free-design-original" href="/assets/${item.originalPhoto}" target="_blank" rel="noopener noreferrer">${escapeHtml(strings.freeOriginalPhoto)}<span class="visually-hidden">${escapeHtml(strings.freeNewTab)}</span></a>` : ''}
        ${downloads}${item.downloadPending ? `\n        <p class="free-design-pending">${escapeHtml(strings.freeDownloadPending)}</p>` : ''}
        </div>
      </div>
    </article>`;
  }).join('\n');
  strings.freeGridClass = freeDesigns.length === 1 ? 'is-single' : '';
}
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
