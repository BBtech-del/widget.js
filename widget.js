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
  style.textContent = `/* your full CSS here, unchanged */`;
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
      <button class="bb-send" id="bb-send">Send</button>
    </div>
  `;
  document.body.appendChild(chat);

  // ===== Chat Logic =====
  const body = chat.querySelector("#bb-body");
  const input = chat.querySelector("#bb-input");
  const sendBtn = chat.querySelector("#bb-send");
  const closeBtn = chat.querySelector("#bb-close");

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

    // Grab hidden FAQ text from the page
    const faqData = document.getElementById('faq-data')?.innerText || '';

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl: scrapeUrl,
          url: scrapeUrl,
          lead,
          message,
          faqData,
          mode: scrapeMode,
          source: "widget",
          site: location.hostname,
          referrer: document.referrer || null
        })
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

  function startChat(user) {
    lead = user;
    chat.style.display = "flex";
    addMsg(greeting);
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
})();
