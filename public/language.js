(() => {
  const key = 'pegcanvas-site-language';
  const explicitLocale = location.pathname.match(/^\/(en|zh-cn|zh)(?:\/|$)/)?.[1];
  if (explicitLocale) {
    try { localStorage.setItem(key, explicitLocale); } catch { /* Storage is optional. */ }
    return;
  }
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Use the browser language. */ }
  const browser = navigator.language.toLowerCase();
  const locale = saved === 'zh' || saved === 'zh-cn' || saved === 'en'
    ? saved
    : !browser.startsWith('zh') ? 'en' : /^zh-(cn|sg|my|hans)/.test(browser) ? 'zh-cn' : 'zh';
  location.replace(`/${locale}/${location.search}${location.hash}`);
})();
