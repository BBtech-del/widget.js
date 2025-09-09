(function () {
  const config = window.BizBuildConfig || {};
  const theme = config.theme || {
    background: "#ffffff",
    text: "#222222",
    accent: "#4a90e2",
    primary: "#4a90e2"
  };

  const avatarUrl = config.avatar || "";
  const greeting = config.greeting || "Howdy! How may I help you?";
  const scrapeMode = config.scrape || "page";
  const scrapeUrl = config.scrapeUrl || window.location.href;
  const apiBase = "https://bizbuild-scraper.oluwasanu.workers.dev";

  const style = document.createElement("style");
  style.textContent = `
    @keyframes bb-breathing { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    .bb-avatar {
      position: fixed; bottom: 20px; right: 20px; width: 72px; height: 72px;
      border-radius: 50%; cursor: pointer; z-index: 999999;
      animation: bb-breathing 4s ease-in-out infinite;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      background-image: url('${avatarUrl}');
      background-size: cover; background-position: center;
      background-color: transparent;
    }
    .bb-overlay {
      position: fixed; inset: 0; background: transparent !important;
      display: flex; align-items: center; justify-content: center;
      z-index: 999998;
    }
  `;
  document.head.appendChild(style);

  const avatar = document.createElement("div");
  avatar.className = "bb-avatar";
  document.body.appendChild(avatar);
  function showLeadModal(onSubmit) {
    if (document.querySelector(".bb-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "bb-overlay";

    const card = document.createElement("div");
    card.style.cssText = `
      background: ${theme.background}; color: ${theme.text};
      padding: 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      max-width: 400px; width: 100%; font-family: sans-serif;
    `;

    card.innerHTML = `
      <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">👋 Welcome! I'm here to help...</div>
      <div style="margin-bottom:16px;">Before we begin, may I have your name and email?</div>
      <input type="text" placeholder="Your name" style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px; border:1px solid #ccc;" />
      <input type="email" placeholder="you@example.com" style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px; border:1px solid #ccc;" />
      <button style="width:100%; padding:10px; background:${theme.primary}; color:#fff; border:none; border-radius:8px; font-weight:bold;">Start Chat</button>
    `;

    const [nameInput, emailInput, button] = card.querySelectorAll("input, input, button");
    button.onclick = () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name || !email || !email.includes("@")) return;
      document.body.removeChild(overlay);
      startChat({ name, email });
    };

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  const chat = document.createElement("div");
  chat.style.cssText = `
    position: fixed; bottom: 100px; right: 20px; width: 360px; height: 500px;
    background: ${theme.background}; color: ${theme.text};
    border: 1px solid ${theme.accent}; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25); display: none;
    flex-direction: column; z-index: 999997; overflow: hidden;
  `;

  chat.innerHTML = `
    <div style="padding:10px; background:${theme.primary}; color:#fff; font-weight:bold; display:flex; justify-content:space-between;">
      <span>Chat</span>
      <span style="cursor:pointer; font-weight:bold;" id="bb-close">×</span>
    </div>
    <div id="bb-body" style="flex:1; padding:10px; overflow-y:auto;"></div>
    <div style="display:flex; padding:10px; border-top:1px solid #eee;">
      <input id="bb-input" placeholder="Type your message..." style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;" />
      <button id="bb-send" style="margin-left:8px; padding:10px; background:${theme.primary}; color:#fff; border:none; border-radius:8px;">Send</button>
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
    msg.style.margin = "8px 0";
    msg.style.textAlign = who === "user" ? "right" : "left";
    msg.style.color = who === "user" ? theme.accent : theme.text;
    msg.innerText = text;
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
        body: JSON.stringify({ pageUrl: scrapeUrl, lead, message })
      });
      const data = await res.json();
      addMsg(data.reply || "I had trouble replying just now. Please try again.");
    } catch {
      addMsg("I had trouble replying just now. Please try again.");
    }
  }

  function startChat(user) {
    lead = user;
    chat.style.display = "flex";
    addMsg(greeting);
    fetch(`${apiBase}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapeUrl })
    });
  }

  avatar.onclick = () => {
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

  input.onkeydown = (e) => {
    if (e.key === "Enter") sendBtn.click();
  };
})();
