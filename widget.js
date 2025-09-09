(function () {
  // Read config from window.BizBuildConfig and query params, with precedence to window config.
  function getConfig() {
    const winCfg = (typeof window !== "undefined" && window.BizBuildConfig) ? window.BizBuildConfig : {};
    let scriptEl = document.currentScript;
    if (!scriptEl) {
      const scripts = document.getElementsByTagName('script');
      scriptEl = scripts[scripts.length - 1];
    }
    const src = scriptEl && scriptEl.src ? new URL(scriptEl.src) : null;
    const qp = src ? src.searchParams : new URLSearchParams();

    const cfg = {
      clientId: winCfg.clientId || qp.get('clientId') || '',

      avatarUrl: winCfg.avatar || qp.get('avatar') || '',

      greeting: winCfg.greeting || qp.get('greeting') || 'Hello! I’m here to help.',

      scrapeMode: (winCfg.scrape || qp.get('scrape') || 'page').toLowerCase(), // "page" or "custom"
      scrapeUrl: winCfg.scrapeUrl || qp.get('scrapeUrl') || '',

      // Default API base to your Worker so it works out of the box
      apiBase: winCfg.api || qp.get('api') || 'https://bizbuild-scraper.oluwasanu.workers.dev',

      theme: {
        background: (winCfg.bg || qp.get('bg')) || '#ffffff',
        text: (winCfg.text || qp.get('text')) || '#222222',
        accent: (winCfg.accent || qp.get('accent')) || '#4a90e2',
        primary: (winCfg.primary || qp.get('primary')) || '#4a90e2'
      }
    };
    return cfg;
  }

  const CONFIG = getConfig();

  function create(tag, attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    for (const k in attrs) el[k] = attrs[k];
    Object.assign(el.style, styles);
    return el;
  }

  function apiUrl(path) {
    const base = CONFIG.apiBase || '';
    if (!base) return path;
    return base.endsWith('/') ? base.slice(0, -1) + path : base + path;
  }

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bb-breathing { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    .bb-avatar {
      position: fixed; bottom: 20px; right: 20px; width: 72px; height: 72px; border-radius: 50%;
      cursor: pointer; z-index: 2147483647; animation: bb-breathing 4s ease-in-out infinite;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25); background-color: #f2f2f2; background-size: cover; background-position: center;
    }
    .bb-overlay {
      position: fixed; inset: 0; background: transparent; display: flex; align-items: center; justify-content: center;
      z-index: 2147483646; padding: 10px;
    }
    .bb-card {
      width: 100%; max-width: 420px; background: ${CONFIG.theme.background}; color: ${CONFIG.theme.text};
      border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); padding: 20px; box-sizing: border-box;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .bb-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .bb-desc { font-size: 14px; opacity: 0.9; margin-bottom: 16px; }
    .bb-input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; margin-bottom: 12px;
      font-size: 14px; color: ${CONFIG.theme.text}; background: ${CONFIG.theme.background};
    }
    .bb-error { color: #c0392b; font-size: 12px; min-height: 16px; margin-bottom: 8px; }
    .bb-btn {
      width: 100%; padding: 10px; border-radius: 8px; border: none; background: ${CONFIG.theme.primary};
      color: #fff; font-weight: 700; cursor: pointer; font-size: 14px;
    }
    .bb-chat {
      position: fixed; bottom: 110px; right: 20px; width: 360px; height: 520px; z-index: 2147483646;
      display: none; background: ${CONFIG.theme.background}; color: ${CONFIG.theme.text};
      border: 1px solid ${CONFIG.theme.accent}; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      overflow: hidden; display: flex; flex-direction: column;
    }
    .bb-chat-header {
      flex: 0 0 auto; padding: 10px 12px; background: ${CONFIG.theme.primary}; color: #fff;
      font-weight: 700; display: flex; align-items: center; justify-content: space-between;
    }
    .bb-chat-close {
      width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.2); color: #fff; font-weight: 900;
      display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;
    }
    .bb-chat-body { flex: 1 1 auto; overflow-y: auto; padding: 12px; }
    .bb-chat-input { flex: 0 0 auto; display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; background: ${CONFIG.theme.background}; }
    .bb-chat-input input {
      flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; color: ${CONFIG.theme.text}; background: ${CONFIG.theme.background};
    }
    .bb-chat-input button { padding: 10px 14px; border: none; border-radius: 8px; background: ${CONFIG.theme.primary}; color: #fff; font-weight: 700; cursor: pointer; }
    .bb-msg { margin: 8px 0; line-height: 1.4; }
    .bb-msg-user { text-align: right; color: ${CONFIG.theme.accent}; }
    .bb-msg-bot { color: #111; }
    @media (max-width: 420px) {
      .bb-chat { right: 10px; width: calc(100vw - 20px); height: 60vh; bottom: 90px; }
      .bb-avatar { bottom: 14px; right: 14px; width: 64px; height: 64px; }
    }
  `;
  document.head.appendChild(style);

  // Avatar
  const avatar = create('div');
  avatar.className = 'bb-avatar';
  if (CONFIG.avatarUrl) {
    avatar.style.backgroundImage = `url('${CONFIG.avatarUrl}')`;
  } else {
    avatar.style.background = 'radial-gradient(circle at 30% 30%, #e8e8e8, #cfcfcf)';
  }
  document.body.appendChild(avatar);

  // Chat UI
  const chat = create('div'); chat.className = 'bb-chat';
  const header = create('div'); header.className = 'bb-chat-header';
  header.appendChild(create('div', { innerText: 'Chat' }));
  const closeBtn = create('div', { innerText: '×' }); closeBtn.className = 'bb-chat-close';
  header.appendChild(closeBtn);
  const body = create('div'); body.className = 'bb-chat-body';
  const inputWrap = create('div'); inputWrap.className = 'bb-chat-input';
  const input = create('input', { placeholder: 'Type your message...' });
  const sendBtn = create('button', { innerText: 'Send' });
  inputWrap.appendChild(input);
  inputWrap.appendChild(sendBtn);
  chat.appendChild(header);
  chat.appendChild(body);
  chat.appendChild(inputWrap);
  document.body.appendChild(chat);

  // Lead modal
  function showLeadModal(onSubmit) {
    if (document.querySelector('.bb-overlay')) return;
    const overlay = create('div'); overlay.className = 'bb-overlay';
    const card = create('div'); card.className = 'bb-card';
    const title = create('div', { innerText: "👋 Welcome! I'm here to help..." }); title.className = 'bb-title';
    const desc = create('div', { innerText: 'Before we begin, may I have your name and email?' }); desc.className = 'bb-desc';
    const nameInput = create('input', { type: 'text', placeholder: 'Your name', required: true }); nameInput.className = 'bb-input';
    const emailInput = create('input', { type: 'email', placeholder: 'you@example.com', required: true }); emailInput.className = 'bb-input';
    const err = create('div', { innerText: '' }); err.className = 'bb-error';
    const submitBtn = create('button', { innerText: 'Start Chat', type: 'button' }); submitBtn.className = 'bb-btn';
    submitBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name || !email) { err.innerText = 'Please fill in both fields.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.innerText = 'Please enter a valid email address.'; return; }
      document.body.removeChild(overlay);
      onSubmit({ name, email });
    });
    card.append(title, desc, nameInput, emailInput, err, submitBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function addMsg(text, who = 'bot') {
    const el = create('div', { innerText: text });
    el.className = 'bb-msg ' + (who === 'user' ? 'bb-msg-user' : 'bb-msg-bot');
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function currentContextUrl() {
    if (CONFIG.scrapeMode === 'custom' && CONFIG.scrapeUrl) return CONFIG.scrapeUrl;
    return window.location.href;
  }

  async function fetchSummary(pageUrl) {
    try {
      const resp = await fetch(apiUrl('/scrape'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapeUrl: pageUrl })
      });
      if (!resp.ok) throw new Error('Scrape failed');
      const data = await resp.json();
      // Worker may just return success; show a friendly confirmation if no summary is included.
      return data.summary || '';
    } catch (e) {
      return '';
    }
  }

  async function sendToBot(message, pageUrl, lead) {
    try {
      const resp = await fetch(apiUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl, lead, message })
      });
      const data = await resp.json().catch(() => ({}));
      return data.reply || "Thanks! I’m on it.";
    } catch (e) {
      return "I had trouble replying just now. Please try again.";
    }
  }

  // Interaction
  let lead = null;
  let bootstrapped = false;

  async function openChatIfReady() {
    chat.style.display = 'flex';
    if (bootstrapped) return;
    bootstrapped = true;

    const name = lead && lead.name ? ` ${lead.name}` : '';
    addMsg((CONFIG.greeting || 'Hello!') + name, 'bot');

    const ctxUrl = currentContextUrl();
    const summary = await fetchSummary(ctxUrl);
    if (summary) addMsg('Here’s a quick summary of this page: ' + summary, 'bot');
  }

  avatar.addEventListener('click', () => {
    if (!lead) {
      showLeadModal((data) => { lead = data; openChatIfReady(); });
      return;
    }
    chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
  });

  closeBtn.addEventListener('click', () => { chat.style.display = 'none'; });

  function submitMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    const ctxUrl = currentContextUrl();
    sendToBot(text, ctxUrl, lead).then((reply) => addMsg(reply, 'bot'));
  }

  sendBtn.addEventListener('click', submitMessage);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitMessage(); });
})();
