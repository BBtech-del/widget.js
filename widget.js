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

  // Inject breathing animation CSS
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathing {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  // Create avatar button
  const avatarWrap = document.createElement("div");
  avatarWrap.style.position = "fixed";
  avatarWrap.style.bottom = "20px";
  avatarWrap.style.right = "20px";
  avatarWrap.style.width = "60px";
  avatarWrap.style.height = "60px";
  avatarWrap.style.borderRadius = "50%";
  avatarWrap.style.background = `url(${avatarUrl}) center/cover no-repeat`;
  avatarWrap.style.cursor = "pointer";
  avatarWrap.style.zIndex = "9999";
  avatarWrap.style.animation = "breathing 3s ease-in-out infinite";

  // Create chat container
  const chat = document.createElement("div");
  chat.style.position = "fixed";
  chat.style.bottom = "90px";
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
        body: JSON.stringify({
          clientId,
          message
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

  function startChat() {
    chat.style.display = "flex";
    addMsg(greeting);
  }

  avatarWrap.onclick = () => {
    if (!lead && cfg.leadCaptureUrl) {
      // Optional: show lead capture modal here and POST to cfg.leadCaptureUrl
      startChat();
    } else {
      chat.style.display = chat.style.display === "none" ? "flex" : "none";
    }
  };

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (msg) sendToBot(msg);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
})();
