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
  // Styles live in chat-widget.css, which each page loads itself.
  const FACE = 'data:image/webp;base64,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';
  const root = el('div', { className: 'pc-chat' });

  const stamp = at => new Date(at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const lastTeam = () => messages.reduce((seq, m) => m.from === 'team' ? Math.max(seq, m.seq) : seq, 0);
  const hasUnread = () => !!session && lastTeam() > (session.seen || 0);

  function render() {
    const draft = root.querySelector('textarea')?.value ?? '', email = root.querySelector('input')?.value ?? session?.email ?? '';
    root.replaceChildren();
    if (!isOpen) {
      if (config.launcher === false && !hasUnread()) return;
      const unread = hasUnread(), label = unread ? t('unread') : t('open');
      const launch = el('button', { className: `pc-chat-launch${unread ? ' has-unread' : ''}`, type: 'button', onclick: () => api.open() });
      const face = el('span', { className: 'pc-chat-face' }, [el('img', { src: FACE, alt: '' })]);
      face.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>');
      if (unread) face.append(el('i', { className: 'pc-chat-dot' }));
      launch.append(face, el('span', { className: 'pc-chat-label', textContent: label }));
      launch.setAttribute('aria-label', label);
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
      el('header', { className: 'pc-chat-head' }, [el('img', { src: FACE, alt: '' }), el('span', { textContent: t('title') }),
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
