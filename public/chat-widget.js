// PegCanvas support chat bubble. One self-contained file, used as-is by the
// marketing site (a classic script) and bundled into the editor. It contacts the
// support service only once a visitor has started a conversation.
(() => {
  if (window.PegCanvasChat) return;
  const config = window.PegCanvasChatConfig || {};
  const API = config.api || 'https://support-api.pegcanvas.com';
  const STORE = 'pegcanvas-support-chat';
  const OPEN_POLL_MS = 5000;
  const IDLE_POLL_MS = 60000;
  const MAX_TEXT = 2000;
  const TEXT = {
    zh: {
      title: '聯絡客服', open: '聯絡客服', close: '關閉',
      intro: 'AI 助理會先回答常見問題，答不了的會轉給真人，真人回覆可能需要一些時間。你可以先離開，回覆會留在這裡，用同一個瀏覽器再開啟就看得到。',
      email: '你的電子郵件', emailHint: '你不在線上時，我們會改用這個信箱回覆你。',
      message: '想問什麼？', send: '送出', sending: '傳送中…',
      waiting: '已收到，正在回覆…',
      you: '你', team: 'PegCanvas 客服', ai: 'PegCanvas AI 助理',
      badEmail: '請輸入有效的電子郵件。', empty: '請輸入訊息。',
      slow: '訊息傳送得有點快，請稍等一分鐘。', busy: '目前詢問的人較多，請稍後再試，或寫信到 hello@pegcanvas.com。',
      failed: '沒有送出，請再試一次；也可以寫信到 hello@pegcanvas.com。',
      expired: '這段對話已過期，請重新開始。', privacy: '對話內容保存 90 天。', unread: '有新回覆',
    },
    en: {
      title: 'Contact support', open: 'Contact support', close: 'Close',
      intro: 'An AI assistant answers common questions first and passes the rest to a person, who may take some time to reply. You can leave; the reply stays here and shows when you open this site again in the same browser.',
      email: 'Your email', emailHint: 'If you are offline, we reply to this address instead.',
      message: 'How can we help?', send: 'Send', sending: 'Sending…',
      waiting: 'Received. Replying…',
      you: 'You', team: 'PegCanvas support', ai: 'PegCanvas AI assistant',
      badEmail: 'Enter a valid email address.', empty: 'Write a message first.',
      slow: 'That is a lot of messages. Please wait a minute.', busy: 'We are busy right now. Try again later, or email hello@pegcanvas.com.',
      failed: 'Not sent. Please try again, or email hello@pegcanvas.com.',
      expired: 'This conversation has expired. Please start a new one.', privacy: 'Conversations are kept for 90 days.', unread: 'New reply',
    },
  };
  let locale = config.locale;
  const t = key => TEXT[(locale || document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en'][key];

  const read = () => { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } };
  const write = value => { try { value ? localStorage.setItem(STORE, JSON.stringify(value)) : localStorage.removeItem(STORE); } catch { /* private window */ } };
  let session = read();
  let messages = [], isOpen = false, busy = false, notice = '', timer = 0;

  async function call(method, path, body, token) {
    const response = await fetch(API + path, {
      method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(result.error || 'failed'), { code: result.error || 'failed' });
    return result;
  }
  const complaint = code => ({ email: t('badEmail'), text: t('empty'), slow: t('slow'), full: t('slow'), busy: t('busy') }[code] || t('failed'));

  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    for (const child of children) node.append(child);
    return node;
  };
  const style = el('style', { textContent: `
.pc-chat{position:fixed;right:20px;bottom:20px;z-index:2147483000;font:14px/1.5 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;color:#13213f}
.pc-chat *{box-sizing:border-box}
.pc-chat-launch{display:flex;align-items:center;gap:8px;min-height:52px;padding:0 18px;border:0;border-radius:999px;background:#13213f;color:#fff;font:inherit;font-weight:600;cursor:pointer;box-shadow:0 6px 20px #13213f4d;position:relative}
.pc-chat-launch svg{flex:none}
.pc-chat-dot{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border:2px solid #fff;border-radius:50%;background:#e0218a}
.pc-chat-panel{display:flex;flex-direction:column;width:min(360px,calc(100vw - 24px));height:min(520px,calc(100vh - 110px));border-radius:16px;background:#fffdf8;box-shadow:0 12px 40px #13213f59;overflow:hidden}
.pc-chat-head{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 12px 16px;background:#13213f;color:#fff;font-weight:700}
.pc-chat-head button{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer}
.pc-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.pc-chat-note{margin:0;color:#5b6478;font-size:12px}
.pc-chat-msg{max-width:86%;padding:8px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.pc-chat-msg small{display:block;font-size:10px;opacity:.7}
.pc-chat-msg.you{align-self:flex-end;background:#13213f;color:#fff;border-bottom-right-radius:4px}
.pc-chat-msg.team{align-self:flex-start;background:#ece4d4;border-bottom-left-radius:4px}
.pc-chat-form{display:grid;gap:8px;padding:12px;border-top:1px solid #13213f1f;background:#fff}
.pc-chat-form label{display:grid;gap:4px;font-size:12px;color:#5b6478}
.pc-chat-form input,.pc-chat-form textarea{width:100%;padding:8px 10px;border:1px solid #13213f33;border-radius:10px;background:#fff;color:#13213f;font:inherit;font-size:16px}
.pc-chat-form textarea{resize:none;height:76px}
.pc-chat-form button{min-height:40px;border:0;border-radius:10px;background:#f4b731;color:#13213f;font:inherit;font-weight:700;cursor:pointer}
.pc-chat-form button:disabled{opacity:.6;cursor:default}
.pc-chat-error{margin:0;color:#9a3d25;font-size:12px}
@media (max-width:600px){.pc-chat{right:12px;bottom:12px}.pc-chat-launch span{display:none}.pc-chat-launch{width:52px;padding:0;justify-content:center}}
` });
  const root = el('div', { className: 'pc-chat' });

  const stamp = at => new Date(at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const lastTeam = () => messages.reduce((seq, m) => m.from === 'team' ? Math.max(seq, m.seq) : seq, 0);
  const hasUnread = () => !!session && lastTeam() > (session.seen || 0);

  function render() {
    const draft = root.querySelector('textarea')?.value ?? '', email = root.querySelector('input')?.value ?? session?.email ?? '';
    root.replaceChildren();
    if (!isOpen) {
      if (config.launcher === false && !hasUnread()) return;
      const launch = el('button', { className: 'pc-chat-launch', type: 'button', onclick: () => api.open() });
      launch.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>';
      launch.append(el('span', { textContent: hasUnread() ? t('unread') : t('open') }));
      launch.setAttribute('aria-label', hasUnread() ? t('unread') : t('open'));
      if (hasUnread()) launch.append(el('i', { className: 'pc-chat-dot' }));
      root.append(launch);
      return;
    }
    const body = el('div', { className: 'pc-chat-body' });
    body.setAttribute('aria-live', 'polite');
    if (!messages.length) body.append(el('p', { className: 'pc-chat-note', textContent: t('intro') }));
    for (const m of messages)
      body.append(el('div', { className: `pc-chat-msg ${m.from === 'team' ? 'team' : 'you'}` }, [
        el('small', { textContent: `${m.from !== 'team' ? t('you') : m.by === 'assistant' ? t('ai') : t('team')} · ${stamp(m.at)}` }), m.text,
      ]));
    if (messages.length && messages[messages.length - 1].from === 'you')
      body.append(el('p', { className: 'pc-chat-note', textContent: t('waiting') }));
    const form = el('form', { className: 'pc-chat-form', onsubmit: submit });
    if (!session) {
      form.append(el('label', {}, [t('email'), el('input', { type: 'email', name: 'email', required: true, maxLength: 254, value: email, autocomplete: 'email' })]));
      form.append(el('p', { className: 'pc-chat-note', textContent: t('emailHint') }));
    }
    form.append(el('textarea', { name: 'text', required: true, maxLength: MAX_TEXT, placeholder: t('message'), value: draft, ariaLabel: t('message') }));
    if (notice) form.append(el('p', { className: 'pc-chat-error', role: 'alert', textContent: notice }));
    form.append(el('button', { type: 'submit', disabled: busy, textContent: busy ? t('sending') : t('send') }));
    if (!session) form.append(el('p', { className: 'pc-chat-note', textContent: t('privacy') }));
    const panel = el('section', { className: 'pc-chat-panel' }, [
      el('header', { className: 'pc-chat-head' }, [el('span', { textContent: t('title') }),
        el('button', { type: 'button', textContent: '×', ariaLabel: t('close'), onclick: () => api.close() })]),
      body, form,
    ]);
    panel.setAttribute('aria-label', t('title'));
    root.append(panel);
    body.scrollTop = body.scrollHeight;
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget, text = form.elements.text.value.trim();
    if (!text) { notice = t('empty'); return render(); }
    busy = true; notice = ''; render();
    try {
      if (!session) {
        const email = form.elements.email.value.trim();
        const started = await call('POST', '/chat/start', { email, locale: t('title') === TEXT.zh.title ? 'zh' : 'en' });
        session = { ...started, email, seen: 0 };
        write(session);
      }
      const sent = await call('POST', '/chat/send', { id: session.id, text }, session.token);
      messages.push({ seq: sent.seq, from: 'you', text, at: Date.now() });
      root.querySelector('textarea').value = '';
    } catch (error) {
      if (error.code === 'unauthorized') { session = null; messages = []; write(null); notice = t('expired'); }
      else notice = complaint(error.code);
    }
    busy = false; render(); schedule();
  }

  async function poll() {
    if (!session || document.hidden) return;
    try {
      const after = messages.length ? messages[messages.length - 1].seq : 0;
      const result = await call('GET', `/chat/messages?id=${session.id}&after=${after}`, undefined, session.token);
      if (!result.messages.length) return;
      messages.push(...result.messages);
      if (isOpen) { session.seen = lastTeam(); write(session); }
      render();
    } catch (error) {
      if (error.code === 'unauthorized') { session = null; messages = []; write(null); render(); }
    }
  }
  function schedule() {
    clearInterval(timer);
    if (session) timer = setInterval(poll, isOpen ? OPEN_POLL_MS : IDLE_POLL_MS);
  }

  const api = {
    open() {
      isOpen = true; notice = '';
      if (session) { session.seen = lastTeam(); write(session); }
      render(); schedule(); poll();
      root.querySelector(session ? 'textarea' : 'input')?.focus();
    },
    close() { isOpen = false; render(); schedule(); },
    setLocale(next) { locale = next; render(); },
  };
  window.PegCanvasChat = api;

  const mount = () => {
    document.head.append(style);
    document.body.append(root);
    render(); schedule(); poll();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
    document.addEventListener('click', event => {
      if (!event.target.closest?.('[data-pegcanvas-chat]')) return;
      event.preventDefault();
      api.open();
    });
  };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
