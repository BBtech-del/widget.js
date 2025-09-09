(function () {
  // 🔷 START: Config setup section
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
  const apiBase = (cfg.api || "https://bizbuild-scraper.oluwasanu.workers.dev").replace(/\/+$/,"");
  const breathing = cfg.breathing !== false; // default true
  // 🔷 END: Config setup section

  // 🔷 START: Style injection section
  const style = document.createElement("style");
  style.textContent = `
    @keyframes bb-breathing { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

    .bb-reset, .bb-reset * {
      box-sizing: border-box;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji";
    }

    .bb-avatar-wrap {
      position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
      width: 72px; height: 72px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      padding: 0; margin: 0;
      background: transparent !important;
      border: none !important; outline: none !important;
      box-shadow: none !important;
      ${breathing ? "animation: bb-breathing 4s ease-in-out infinite;" : ""}
      -webkit-tap-highlight-color: transparent;
    }
    .bb-avatar-wrap:focus { outline: none !important; }
    .bb-avatar-img {
      width: 100%; height: 100%;
      border-radius: 50%;
      display: block;
      background: transparent !important;
      object-fit: cover;
      image-rendering: -webkit-optimize-contrast;
      pointer-events: none;
    }

    /* Absolute zero background safety for any UA quirks */
    .bb-avatar-wrap, .bb-avatar-wrap::before, .bb-avatar-wrap::after {
      background: transparent !important;
    }

    .bb-overlay {
      position: fixed; inset: 0;
      background: transparent !important;
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
    }

    .bb-card-close {
      position: absolute; top: 10px; right: 10px;
      cursor: pointer; font-size: 18px; font-weight: bold;
      line-height: 1; color: ${theme.text};
      background: transparent; border: none;
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
    }

    .bb-chat-header {
      padding: 10px; background: ${theme.primary}; color: #fff;
      font-weight: bold; display: flex; justify-content: space-between; align-items: center;
    }

    .bb-chat-close {
      cursor: pointer; font-weight: bold; background: transparent; border: none; color: #fff; font-size: 18px;
    }

    .bb-chat-body { flex: 1; padding: 10px; overflow-y: auto; }
    .bb-chat-inputbar { display: flex; padding: 10px; border-top: 1px solid #eee; gap: 8px; }
    .bb-input {
      flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; background: #fff; color: #111;
    }
    .bb-send {
      padding: 10px 14px; background: ${theme.primary}; color: #fff; border: none; border-radius: 8px; cursor: pointer;
    }

    .bb-msg { margin: 8px 0; }
    .bb-msg.user { text-align: right; color: ${theme.accent}; }
    .bb-msg.bot { text-align: left; color: ${theme.text}; }
  `;
  document.head.appendChild(style);
  // 🔷 END: Style injection section

  // 🔷 START: Avatar setup section
  const avatarWrap = document.createElement("button");
  avatarWrap.className = "bb-reset bb-avatar-wrap";
  avatarWrap.setAttribute("aria-label", "Open chat");

  const avatarImg = document.createElement("img");
  avatarImg.className = "bb-avatar-img";
  avatarImg.alt = "Assistant avatar";
  avatarImg.src = avatarUrl;
  avatarImg.decoding = "async";
  avatarImg.referrerPolicy = "no-referrer";
  avatarWrap.appendChild(avatarImg);

  document.body.appendChild(avatarWrap);
  // 🔷 END: Avatar setup section

  // 🔷 START: Lead modal section
  function showLeadModal(onSubmit) {
    if (document.querySelector(".bb-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "bb-overlay";

    const card = document.createElement("div");
    card.className = "bb-card";
    card.innerHTML = `
      <button class="bb-card-close" aria-label="Close">×</button>
      <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">👋 Welcome! I'm here to help...</div>
      <div style="margin-bottom:16px;">Before we begin, may I have your name and email?</div>
      <input type="text" placeholder="Your name" class="bb-input" style="margin-bottom:10px;" />
      <input type="email" placeholder="you@example.com" class="bb-input" style="margin-bottom:10px;" />
      <button class="bb-send" style="width:100%;">Start Chat</button>
    `;

    const fields = card.querySelectorAll(".bb-input");
    const nameInput = fields[0];
    const emailInput = fields[1];
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
  // 🔷 END: Lead modal section

  // 🔷 START: Chat UI section
  const chat = document.createElement("div");
  chat.className = "bb-reset bb-chat";
  chat.innerHTML = `
    <div class="bb-chat-header">
      <span>Chat</span>
      <button class="bb-chat-close" aria-label="Close chat">×</button>
    </div>
    <div class="bb-chat-body" id="bb-body"></div>
    <div class="bb-chat-inputbar">
      <input class="bb-input" id="bb-input" placeholder="Type your message..." />
      <button class="bb-send" id="bb-send">Send</button>
    </div>
  `;
  document.body.appendChild(chat);
  // 🔷 END: Chat UI section

  // 🔷 START: Chat logic section
  const body = chat.querySelector("#bb-body");
  const input = chat.querySelector("#bb-input");
  const sendBtn = chat.querySelector("#bb-send");
  const closeBtn = chat.querySelector(".bb-chat-close");

  let lead = null;

  function addMsg(text, who = "bot") {
    const div = document.createElement("div");
    div.className = `bb-msg ${who}`;
    div.textContent = text;
    body.appendChild(div);
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
          lead,
          message,
          mode: scrapeMode,
          source: "widget",
          site: location.hostname
        })
      });
      if (!res.ok) {
        addMsg(`I had trouble replying just now (status ${res.status}). Please try again.`);
        return;
      }
      const data = await res.json();
      addMsg((data && (data.reply || data.answer || data.message)) || "I had trouble replying just now. Please try again.");
    } catch (err) {
      addMsg("I had trouble replying just now. Please try again.");
    }
  }

  function startChat(user) {
    lead = user;
    chat.style.display = "flex";
    addMsg(greeting);

    // fire-and-forget scrape kickoff
    fetch(`${apiBase}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: scrapeUrl,
        pageUrl: scrapeUrl,
        mode: scrapeMode,
        source: "widget",
        site: location.hostname
      })
    }).catch(() => {});
  }

  avatarWrap.onclick = () => {
    if (!lead) {
      showLeadModal(startChat);
    } else {
      chat.style.display = chat.style.display === "none" ? "flex" : "none";
    }
  };

  closeBtn.onclick = () => {
    chat.style.display = "none";
  };

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (msg) sendToBot(msg);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
  // 🔷 END: Chat logic section
})();
