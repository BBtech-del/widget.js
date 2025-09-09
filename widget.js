(function () {
  const cfg = window.MyBotConfig || {};
  const clientId = cfg.clientId || "default";
  const avatarUrl = cfg.avatar || "";
  const botName = cfg.botName || "Chatbot";
  const botImage = cfg.botImage || avatarUrl;
  const greeting = cfg.greeting || "Hi! How can I help you today?";
  const apiBase = (cfg.api || "").replace(/\/+$/, "");
  const theme = cfg.theme || {
    background: "#ffffff",
    text: "#222222",
    primary: "#4a90e2"
  };

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathing {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .bb-avatar {
      position: fixed;
      bottom: 60px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: url(${avatarUrl}) center/cover no-repeat;
      cursor: pointer;
      z-index: 9999;
      animation: breathing 3s ease-in-out infinite;
    }
    .bb-chat {
      position: fixed;
      bottom: 130px;
      right: 20px;
      width: 320px;
      height: 400px;
      background: ${theme.background};
      color: ${theme.text};
      border: 1px solid ${theme.primary};
      border-radius: 8px;
      display: none;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      font-family: sans-serif;
    }
    .bb-chat-header {
      display: flex;
      align-items: center;
      background: ${theme.primary};
      color: #fff;
      padding: 8px;
    }
    .bb-chat-header img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .bb-chat-header span {
      flex: 1;
      font-weight: bold;
    }
    .bb-chat-header button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
    }
    .bb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    .bb-inputbar {
      display: flex;
      border-top: 1px solid ${theme.primary};
    }
    .bb-inputbar input {
      flex: 1;
      border: none;
      padding: 10px;
    }
    .bb-inputbar button {
      background: ${theme.primary};
      color: #fff;
      border: none;
      padding: 10px 15px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Avatar button
  const avatar = document.createElement("div");
  avatar.className = "bb-avatar";
  document.body.appendChild(avatar);

  // Chat container
  const chat = document.createElement("div");
  chat.className = "bb-chat";

  // Header
  const header = document.createElement("div");
  header.className = "bb-chat-header";
  const headerImg = document.createElement("img");
  headerImg.src = botImage;
  const headerTitle = document.createElement("span");
  headerTitle.textContent = botName;
  const headerClose = document.createElement("button");
  headerClose.innerHTML = "×";
  headerClose.onclick = () => chat.style.display = "none";
  header.appendChild(headerImg);
  header.appendChild(headerTitle);
  header.appendChild(headerClose);

  // Messages area
  const messages = document.createElement("div");
  messages.className = "bb-messages";

  // Input bar
  const inputBar = document.createElement("div");
  inputBar.className = "bb-inputbar";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your message...";
  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  inputBar.appendChild(input);
  inputBar.appendChild(sendBtn);

  chat.appendChild(header);
  chat.appendChild(messages);
  chat.appendChild(inputBar);
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

  avatar.onclick = () => {
    chat.style.display = chat.style.display === "none" ? "flex" : "none";
    if (chat.style.display === "flex" && messages.childElementCount === 0) {
      addMsg(greeting);
    }
  };

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (msg) sendToBot(msg);
  };
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendBtn.click();
  });
})();
