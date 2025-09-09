(function () {
  // ===== Config =====
  const cfg = window.BizBuildConfig || {};
  const theme = cfg.theme || {
    background: "#ffffff",
    text: "#222222",
    accent: "#4a90e2",
    primary: "#4a90e2"
  };
  const avatarUrl = cfg.avatar || "";
  const greeting = cfg.greeting || "Howdy! How may I help you?";
  const scrapeMode = cfg.scrape || "page";
  const scrapeUrl = cfg.scrapeUrl || window.location.href;
  const apiBase = (cfg.api || "https://bizbuild-scraper.oluwasanu.workers.dev").replace(/\/+$/, "");

  // ===== Styles =====
  const style = document.createElement("style");
  style.textContent = `
    @keyframes bb-breathing {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .bb-avatar-wrap {
      position: fixed; bottom: 20px; right: 20px;
      width: 72px; height: 72px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      z-index: 2147483647;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      animation: bb-breathing 4s ease-in-out infinite;
      -webkit-tap-highlight-color: transparent;
      backface-visibility: hidden;
      transform: translateZ(0);
      will-change: transform;
      pointer-events: auto;
      outline: none !important;
    }
    .bb-avatar-img {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      background: transparent !important;
      border: none !important;
      pointer-events: none;
      outline: none !important;
    }
    .bb-overlay {
      position: fixed; inset: 0;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483646;
    }
    .bb-card {
      background: ${theme.background};
      color: ${theme.text};
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      max-width: 400px; width: 100%;
      position: relative;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    }
    .bb-card-close {
      position: absolute; top: 10px; right: 10px;
      cursor: pointer; font-size: 18px; font-weight: bold;
      line-height: 1; color: ${theme.text};
      background: transparent; border: none;
    }
    .bb-card .bb-input {
      display: block;
      width: 100%;
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
      background: #fff;
      color: #111;
    }
    .bb-send {
      padding: 10px 14px;
      background: ${theme.primary};
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .bb-chat {
      position: fixed; bottom: 100px; right: 20px;
      width: 360px; height: 500px;
      background: ${theme.background};
      color: ${theme.text};
      border: 1px solid ${theme.accent};
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      display: none; flex-direction: column;
      z-index: 2147483645; overflow: hidden;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    }
    .bb-chat-header {
      padding: 10px; background: ${theme.primary}; color: #fff;
      font-weight: bold; display: flex; justify-content: space-between; align-items: center;
    }
    .bb-chat-body { flex: 1; padding: 10px; overflow-y: auto; }
    .bb-chat-inputbar { display: flex; padding: 10px; border-top: 1px solid #eee; gap: 8px; }
    .bb-chat-inputbar .bb-input { flex: 1; margin: 0; }
    .bb-msg { margin: 8px 0; }
    .bb-msg.user { text-align: right; color: ${theme.accent}; }
    .bb-msg.bot { text-align: left; color: ${theme.text}; }
  `;
  document.head.appendChild(style);

  // ===== Avatar =====
  const avatarWrap = document.createElement("div");
  avatarWrap.className = "bb-avatar-wrap";
  avatarWrap.setAttribute("role", "button");
  avatarWrap.setAttribute("aria-label", "Open chat");

  const avatarImg = document.createElement("img");
  avatarImg.className = "bb-avatar-img";
  avatarImg.alt = "Assistant avatar";
  avatarImg.decoding = "async";
  avatarImg.referrerPolicy = "no-referrer";
  avatarImg.src = avatarUrl;

  avatarWrap.appendChild(avatarImg);
  document.body.appendChild(avatarWrap);

  // ===== Lead Modal =====
  function showLeadModal(onSubmit) {
    if (document.querySelector(".bb-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "bb-overlay";
    const card = document.createElement("div");
    card.className = "bb-card";
    card.innerHTML = `
      <button class="bb-card-close" aria-label="Close">×</button>
      <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">👋 Welcome! I'm here to help...</div>
      <div style="margin-bottom:6px;">Before we begin, may I have your name and email?</div>
      <input type="text" placeholder="Your name" class="bb-input" />
      <input type="email" placeholder="you@example.com" class="bb-input" />
      <button class="bb-send" style="width:100%; margin-top:6px;">Start Chat</button>
    `;
    const nameInput = card.querySelectorAll(".bb-input")[0];
    const emailInput = card.querySelectorAll(".bb-input")[1];
    const startBtn = card.querySelector(".bb-send");
    const closeBtn = card.querySelector(".bb-card-close");
    const closeOverlay = () => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    startBtn.onclick = () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name || !email || !email.includes("@")) return;
      closeOverlay();
      startChat({ name, email });
    };
    closeBtn.onclick = closeOverlay;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  // ===== Chat UI =====
  const chat = document.createElement("div");
  chat.className = "bb-chat";
  chat.innerHTML = `
    <div class="bb-chat-header">
      <span>Chat</span>
      <button class="bb-send" id="bb-close" aria-label="Close chat" style="background:transparent;border:none;color:#fff;font-weight:bold;font-size:18px;padding:0;">×</button>
    </div>
    <div class="bb-chat-body" id="bb-body"></div>
    <div class="bb-chat-inputbar">
      <input class="bb-input" id="bb-input" placeholder="Type your message..." />
      <button class="bb-send" id="bb
