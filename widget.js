(function () {
  const cfg = window.MyBotConfig || {};
  const clientId = cfg.clientId || "default";
  const avatarUrl = cfg.avatar || "";
  const botName = cfg.botName || "Chatbot";
  const botImage = cfg.botImage || avatarUrl;
  const greeting = cfg.greeting || "Hi! How can I help you today?";
  const apiBase = (cfg.api || "").replace(/\/+$/, "");
  const theme = cfg.theme || {};
  const background = theme.background || "#ffffff";
  const textColor = theme.text || "#222222";
  const primary = theme.primary || "#4a90e2";
  const userMsgBg = theme.userMsgBg || primary;
  const botMsgBg = theme.botMsgBg || "#e0e0e0";

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathing {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes blink {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
    .bb-avatar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: url(${avatarUrl}) center/cover no-repeat;
  cursor: pointer;
  z-index: 9999;
  animation: breathing 3s ease-in-out infinite;
  * Bubble effect */
  background-color: rgba(255, 255, 255, 0.12); /* subtle transparent fill */
  box-shadow:
    inset 0 0 8px rgba(255, 255, 255, 0.5), /* inner glow */
    0 4px 12px rgba(0, 0, 0, 0.25),         /* drop shadow */
    0 0 18px rgba(255, 255, 255, 0.25);     /* soft outer glow */
  backdrop-filter: blur(4px);               /* glass effect */
}

    .bb-chat {
      position: fixed;
      bottom: 130px;
      right: 20px;
      width: 320px;
      height: 400px;
      background: ${background};
      color: ${textColor};
      border: 1px solid ${primary};
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
      background: ${primary};
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
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bb-inputbar {
      display: flex;
      border-top: 1px solid ${primary};
    }
    .bb-inputbar input {
      flex: 1;
      border: none;
      padding: 10px;
    }
    .bb-inputbar button {
      background: ${primary};
      color: #fff;
      border: none;
      padding: 10px 15px;
      cursor: pointer;
    }
    .bb-bubble {
  position: fixed;
  bottom: 90px; /* desktop/tablet default */
  right: 20px;
  background: ${primary};
  color: #fff;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 9999;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* Mobile adjustment */
@media (max-width: 600px) {
  .bb-bubble {
    bottom: 85px; /* lower for mobile */
  }
}


    .bb-bubble button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      margin-left: 4px;
    }
    .bb-typing {
      display: inline-block;
      background: ${botMsgBg};
      color: #000;
      padding: 8px;
      border-radius: 6px;
      max-width: 80%;
      align-self: flex-start;
      font-style: italic;
    }
    .bb-typing span {
      animation: blink 1.4s infinite both;
    }
    .bb-typing span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .bb-typing span:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;
  document.head.appendChild(style);

  // Avatar button
  const avatar = document.createElement("div");
  avatar.className = "bb-avatar";
  document.body.appendChild(avatar);

  // --- start 100+ chat head ---
const langBubble = document.createElement("div");
langBubble.className = "bb-bubble";
langBubble.innerHTML = `Hi 👋 I'm fluent in 100+ languages <button aria-label="Close">×</button>`;
langBubble.querySelector("button").onclick = () => langBubble.remove();
document.body.appendChild(langBubble);
// --- end chat bubble 100+ language ---


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
      msg.style.background = botMsgBg;
      msg.style.color = "#000";
      msg.style.alignSelf = "flex-start";
    } else {
      msg.style.background = userMsgBg;
      msg.style.color = "#fff";
      msg.style.alignSelf = "flex-end";
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  // Typing indicator helpers
  let typingEl = null;
  function showTyping() {
    hideTyping();
    typingEl = document.createElement("div");
    typingEl.className = "bb-typing";
    typingEl.innerHTML = "<span>.</span><span>.</span><span>.</span>";
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  async function sendToBot(message) {
    addMsg(message, "user");
    input.value = "";
    showTyping();
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message })
      });
      hideTyping();
      if (!res.ok) {
        addMsg(`I had trouble replying just now (status ${res.status}).`);
        return;
      }
      const data = await res.json();
      let botReply = data.reply || data.answer || data.message || "I had trouble replying just now.";
      if (botReply.trim().toLowerCase() === "i don't know") {
        botReply = "I’m sorry, I don’t have that information right now. Could you try rephrasing your question?";
      }
      addMsg(botReply);
    } catch {
      hideTyping();
      addMsg("I had trouble replying just now.");
    }
  }

  function openChat() {
    chat.style.display = "flex";
    if (messages.childElementCount === 0) addMsg(greeting);
  }

  avatar.onclick = () => {
    openChat();
    bubble?.remove?.();
  };

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (msg) sendToBot(msg);
  };
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendBtn.click();
  });
})();
