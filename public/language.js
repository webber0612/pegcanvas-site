(() => {
  const key = 'pegcanvas-site-language';
  const explicitLocale = location.pathname.match(/^\/(en|zh)(?:\/|$)/)?.[1];
  if (explicitLocale) {
    try { localStorage.setItem(key, explicitLocale); } catch { /* Storage is optional. */ }
    return;
  }
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Use the browser language. */ }
  const locale = saved === 'zh' || saved === 'en'
    ? saved
    : navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  location.replace(`/${locale}/${location.search}${location.hash}`);
})();
