(function () {
  const cfg = window.MyBotConfig || {};
  const clientId = cfg.clientId || "default";
  const avatarUrl = cfg.avatar || "";
  const greeting = cfg.greeting || "Hi! How can I help you today?";
  const apiBase = (cfg.api || "").replace(/\/+$/, "");
  const theme = cfg.theme || {
    background: "#ffffff",
    text: "#222222",
    primary: "#4a90e2"
  };

  let lead = null;

  // --- Auto-detect CRM endpoint if not provided ---
  function detectCRMEndpoint() {
    const forms = document.querySelectorAll("form[action]");
    for (let form of forms) {
      const action = form.getAttribute("action");
      if (action && /crm|lead|form/i.test(action)) {
        return new URL(action, window.location.origin).href;
      }
    }
    const meta = document.querySelector("meta[name='crm-endpoint']");
    if (meta && meta.content) return meta.content;
    if (window.CRM_ENDPOINT) return window.CRM_ENDPOINT;
    return null;
  }
  if (!cfg.leadCaptureUrl) {
    const detected = detectCRMEndpoint();
    if (detected) cfg.leadCaptureUrl = detected;
  }

  // Inject breathing animation CSS + modal styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathing {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .bb-overlay {
      position: fixed; top:0; left:0; right:0; bottom:0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .bb-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      position: relative;
      font-family: sans-serif;
    }
    .bb-card-close, .bb-chat-close {
      position: absolute;
      top: 8px; right: 8px;
      background: none; border: none;
      font-size: 18px; cursor: pointer;
    }
    .bb-input {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .bb-send {
      background: ${theme.primary};
      color: #fff;
      border: none;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Create avatar button with preload + fallback
  const avatarWrap = document.createElement("div");
  avatarWrap.style.position = "fixed";
  avatarWrap.style.bottom = "60px"; // raised higher on desktop
  avatarWrap.style.right = "20px";
  avatarWrap.style.width = "60px";
  avatarWrap.style.height = "60px";
  avatarWrap.style.borderRadius = "50%";
  avatarWrap.style.cursor = "pointer";
  avatarWrap.style.zIndex = "9999";
  avatarWrap.style.animation = "breathing 3s ease-in-out infinite";
  avatarWrap.style.background = theme.primary; // fallback color

  if (avatarUrl) {
    const img = new Image();
    img.onload = () => {
      avatarWrap.style.background = `url(${avatarUrl}) center/cover no-repeat`;
    };
    img.onerror = () => {
      avatarWrap.style.background = theme.primary;
    };
    img.src = avatarUrl;
  }

  // Create chat container
  const chat = document.createElement("div");
  chat.style.position = "fixed";
  chat.style.bottom = "130px"; // matches raised avatar
  chat.style.right = "20px";
  chat.style.width = "320px";
  chat.style.height = "400px";
  chat.style.background = theme.background;
  chat.style.color = theme.text;
  chat.style.border = `1px solid ${theme.primary}`;
  chat.style.borderRadius = "8px";
  chat.style.display = "none";
  chat.style.flexDirection = "column";
  chat.style.zIndex = "9999";

  // Add close button to chat
  const chatClose = document.createElement("button");
  chatClose.className = "bb-chat-close";
  chatClose.innerHTML = "×";
  chatClose.onclick = () => chat.style.display = "none";

  const messages = document.createElement("div");
  messages.style.flex = "1";
  messages.style.overflowY = "auto";
  messages.style.padding = "10px";

  const inputWrap = document.createElement("div");
  inputWrap.style.display = "flex";
  inputWrap.style.borderTop = `1px solid ${theme.primary}`;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your message...";
  input.style.flex = "1";
  input.style.border = "none";
  input.style.padding = "10px";

  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.style.background = theme.primary;
  sendBtn.style.color = "#fff";
  sendBtn.style.border = "none";
  sendBtn.style.padding = "10px 15px";
  sendBtn.style.cursor = "pointer";

  inputWrap.appendChild(input);
  inputWrap.appendChild(sendBtn);
  chat.appendChild(chatClose);
  chat.appendChild(messages);
  chat.appendChild(inputWrap);
  document.body.appendChild(avatarWrap);
  document.body.appendChild(chat);

  function addMsg(text, from = "bot") {
    const msg = document.createElement("div");
    msg.textContent = text;
    msg.style.margin = "5px 0";
    msg.style.padding = "8px";
    msg.style.borderRadius = "6px";
    msg.style.maxWidth = "80%";
    msg.style.wordWrap = "break-word";
    msg.style.display = "inline-block";
    if (from === "bot") {
      msg.style.background = theme.primary;
      msg.style.color = "#fff";
      msg.style.alignSelf = "flex-start";
    } else {
      msg.style.background = "#e0e0e0";
      msg.style.color = "#000";
      msg.style.alignSelf = "flex-end";
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendToBot(message) {
    addMsg(message, "user");
    input.value = "";
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message })
      });
      if (!res.ok) {
        addMsg(`I had trouble replying just now (status ${res.status}).`);
        return;
      }
      const data = await res.json();
      addMsg(data.reply || data.answer || data.message || "I had trouble replying just now.");
    } catch {
      addMsg("I had trouble replying just now.");
    }
  }

  function startChat() {
    chat.style.display = "flex";
    if (messages.childElementCount === 0) addMsg(greeting);
  }

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

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    card.querySelector(".bb-card-close").onclick = () => overlay.remove();
    card.querySelector(".bb-send").onclick = () => {
      const name = card.querySelector("input[type=text]").value.trim();
      const email = card
