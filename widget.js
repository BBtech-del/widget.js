(function () {
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
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.2);
      animation: bb-breathing 4s ease-in-out infinite;
    }
    .bb-avatar-img {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: transparent;
      pointer-events: none;
    }
    .bb-overlay {
      position: fixed; inset: 0;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483646;
    }
    .bb-card {
      background: ${theme.background}; color: ${theme.text};
      padding: 20px; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      max-width: 400px; width: 100%;
      font-family: sans-serif; position: relative;
    }
    .bb-card-close {
      position: absolute; top: 10px; right: 10px;
      cursor: pointer; font-size: 18px; font-weight: bold;
      background: transparent; border: none;
    }
    .bb-chat {
      position: fixed; bottom: 100px; right: 20px;
      width: 360px; height: 500px;
      background: ${theme.background}; color: ${theme.text};
      border: 1px solid ${theme.accent}; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      display: none; flex-direction: column;
      z-index: 2147483645; overflow: hidden;
    }
    .bb-chat-header {
      padding: 10px; background: ${theme.primary}; color: #fff;
      font-weight: bold; display: flex; justify-content: space-between;
    }
    .bb-chat-body { flex: 1; padding: 10px; overflow-y: auto; }
    .bb-chat-inputbar {
      display: flex; padding: 10px; border-top: 1px solid #eee;
    }
    .bb-input {
      flex: 1; padding: 10px; border-radius: 8px;
      border: 1px solid #ccc;
    }
    .bb-send {
      margin-left: 8px; padding: 10px;
      background: ${theme.primary}; color: #fff;
      border: none; border-radius: 8px;
    }
    .bb-msg { margin: 8px 0; }
    .bb-msg.user { text-align: right; color: ${theme.accent}; }
    .bb-msg.bot { text-align: left; color: ${theme.text}; }
  `;
  document.head.appendChild(style);

  const avatarWrap = document.createElement("div");
  avatarWrap.className = "bb-avatar-wrap";
  const avatarImg = document.createElement("img");
  avatarImg.className = "bb-avatar-img";
  avatarImg.src = avatarUrl;
  avatarWrap.appendChild(avatarImg);
  document.body.appendChild(avatarWrap);

  function showLeadModal(onSubmit) {
    if (document.querySelector(".bb-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "bb-overlay";
    const card = document.createElement("div");
    card.className = "bb-card";
    card.innerHTML = `
      <button class="bb-card-close">×</button>
      <div style="font-size:18px; font-weight:bold;">👋 Welcome! I'm here to help...</div>
      <div style="margin:10px 0;">May I have your name and email?</div>
      <input type="text" placeholder="Your name" class="bb-input" />
      <input type="email" placeholder="you@example.com" class="bb-input" />
      <button class="bb-send" style="width:100%; margin-top:10px;">Start Chat</button>
    `;
    const inputs = card.querySelectorAll(".bb-input");
    const button = card.querySelector(".bb-send");
    const closeBtn = card.querySelector(".bb-card-close");

    button.onclick = () => {
      const name = inputs[0].value.trim();
      const email = inputs[1].value.trim();
      if (!name || !email.includes("@")) return;
      document.body.removeChild(overlay);
      startChat({ name, email });
    };
    closeBtn.onclick = () => document.body.removeChild(overlay);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  const chat = document.createElement("div");
  chat.className = "bb-chat";
  chat.innerHTML = `
    <div class="bb-chat-header">
      <span>Chat</span>
      <span id="bb-close" style="cursor:pointer;">×</span>
    </div>
    <div id="bb-body" class="bb-chat-body"></div>
    <div class="bb-chat-inputbar">
      <input id="bb-input" class="bb-input" placeholder="Type your message..." />
      <button id="bb-send" class="bb-send">Send</button>
    </div>
  `;
  document.body.appendChild(chat);

  const body = chat.querySelector("#bb-body");
  const input = chat.querySelector("#bb-input");
  const sendBtn = chat.querySelector("#bb-send");
  const closeBtn = chat.querySelector("#bb-close");
  let lead = null;

  function addMsg(text, who = "bot") {
    const msg = document.createElement("div");
    msg.className = `bb-msg ${who}`;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  async function sendToBot(message) {
    addMsg(message, "user");
    input.value = "";
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl: scrapeUrl,
          url: scrapeUrl,
          lead,
          message,
          mode: scrapeMode,
          source: "widget",
          site: location.hostname,
          referrer: document.referrer || null
        })
      });
      const data = await res.json();
      addMsg(data.reply || data.answer || data.message || "I had trouble replying just now.");
    } catch {
      addMsg("I had trouble replying just now.");
    }
  }

  function kickoffScrape() {
    fetch(`${apiBase}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: scrapeUrl,
        pageUrl: scrapeUrl,
        mode: scrapeMode,
        source: "widget",
        site: location.hostname,
        referrer: document.referrer || null
      })
    }).catch(() => {});
  }

  function startChat(user) {
    lead = user;
    chat.style.display = "flex";
    addMsg(greeting);
    kickoffScrape();
  }

  avatarWrap.onclick = () => {
    if (!lead) {
      showLeadModal(startChat);
    } else {
      chat.style.display = chat.style.display === "none" ? "flex" : "none";
    }
  };
  closeBtn.onclick = () => chat.style.display = "none";
  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (msg) sendToBot(msg);
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") sendBtn.click();
  };
})();
