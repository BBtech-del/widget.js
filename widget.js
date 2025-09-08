(function () {
  // Avoid initializing inside iframes (prevents recursion/mirrors)
  if (window.self !== window.top) return;

  // Read per-client config from this script tag's data attributes
  const thisScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const ds = (thisScript && thisScript.dataset) || {};
  const CONFIG = {
    clientId: ds.clientId || "support@bizbuild.tech",
    chatUrl: ds.chatUrl || "https://chat.bizbuild.tech/chat",
    avatarUrl: ds.avatar || "https://bizbuild.tech/default-avatar.png",
    greeting: ds.greeting || "Hello! I’m here to help.",
    scrapeMode: (ds.scrape || "page").toLowerCase(),   // "page" or "custom"
    scrapeUrl: ds.scrapeUrl || "",
    theme: {
      background: "#ffffff",
      text: "#222222",
      accent: "#4a90e2",
      primary: "#4a90e2"
    }
  };

  // Inject required styles (breathing only; no blink)
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathing {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .bb-overlay {
      position: fixed; inset: 0;
      background: transparent; /* transparent, no darkening */
      display: flex; align-items: center; justify-content: center; padding: 10px;
      z-index: 2147483646;
    }
    .bb-card {
      width: 100%; max-width: 420px; background: ${CONFIG.theme.background}; color: ${CONFIG.theme.text};
      border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      padding: 20px; box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .bb-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .bb-desc { font-size: 14px; opacity: 0.9; margin-bottom: 16px; }
    .bb-input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; outline: none;
      margin-bottom: 12px; font-size: 14px; color: ${CONFIG.theme.text}; background: ${CONFIG.theme.background};
    }
    .bb-error { color: #c0392b; font-size: 12px; min-height: 16px; margin-bottom: 8px; }
    .bb-btn {
      width: 100%; padding: 10px; border-radius: 8px; border: none; background: ${CONFIG.theme.primary};
      color: #fff; font-weight: 700; cursor: pointer; font-size: 14px;
    }
    .bb-close {
      position: fixed; bottom: 640px; right: 20px; width: 32px; height: 32px;
      background: #fff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      display: none; z-index: 2147483647; cursor: pointer; text-align: center; line-height: 32px;
      font-weight: 700; font-size: 18px; color: #333;
      user-select: none;
    }
    @media (max-height: 720px) {
      .bb-close { bottom: calc(110px + 520px - 12px); } /* keep roughly above iframe */
    }
  `;
  document.head.appendChild(style);

  function create(tag, attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    for (const k in attrs) el[k] = attrs[k];
    Object.assign(el.style, styles);
    return el;
  }

  function showLeadModal(onSubmit) {
    // Prevent multiple overlays if user taps avatar repeatedly
    if (document.querySelector(".bb-overlay")) return;

    const overlay = create("div"); overlay.className = "bb-overlay";
    const card = create("div"); card.className = "bb-card";

    const title = create("div", { innerText: "👋 Welcome! I'm here to help..." }); title.className = "bb-title";
    const desc = create("div", { innerText: "Before we begin, may I have your name and email?" }); desc.className = "bb-desc";

    const nameInput = create("input", { type: "text", placeholder: "Your name", required: true }); nameInput.className = "bb-input";
    const emailInput = create("input", { type: "email", placeholder: "you@example.com", required: true }); emailInput.className = "bb-input";
    const err = create("div", { innerText: "" }); err.className = "bb-error";

    const submitBtn = create("button", { innerText: "Start Chat", type: "button" }); submitBtn.className = "bb-btn";
    submitBtn.addEventListener("click", () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name || !email) { err.innerText = "Please fill in both fields."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.innerText = "Please enter a valid email address."; return; }
      document.body.removeChild(overlay);
      onSubmit({ name, email });
    });

    card.append(title, desc, nameInput, emailInput, err, submitBtn);
    overlay.append(card);
    document.body.appendChild(overlay);
  }

  function autoDetectForm(name, email) {
    const forms = document.querySelectorAll("form");
    for (let form of forms) {
      const nameField = form.querySelector("input[name*='name' i]");
      const emailField = form.querySelector("input[type='email'], input[name*='email' i]");
      if (nameField && emailField) {
        nameField.value = name;
        emailField.value = email;
        try { form.submit(); } catch (_) {}
        return true;
      }
    }
    return false;
  }

  // Floating avatar (breathing only)
  const avatar = create("div", {}, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: `url('${CONFIG.avatarUrl}') center/cover no-repeat`,
    cursor: "pointer",
    zIndex: 2147483647,
    animation: "breathing 4s ease-in-out infinite",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)"
  });
  document.body.appendChild(avatar);

  // Chat iframe (hidden by default)
  const pageUrlRaw = (CONFIG.scrapeMode === "custom" && CONFIG.scrapeUrl) ? CONFIG.scrapeUrl : window.location.href;
  const pageUrl = encodeURIComponent(pageUrlRaw);
  const chat = create("iframe");
  chat.src = `${CONFIG.chatUrl}?clientId=${encodeURIComponent(CONFIG.clientId)}&pageUrl=${pageUrl}&greeting=${encodeURIComponent(CONFIG.greeting)}`;
  Object.assign(chat.style, {
    position: "fixed",
    bottom: "110px",
    right: "20px",
    width: "360px",
    height: "520px",
    border: `1px solid ${CONFIG.theme.accent}`,
    borderRadius: "12px",
    display: "none",
    background: CONFIG.theme.background,
    color: CONFIG.theme.text,
    zIndex: 2147483646
  });
  chat.setAttribute("title", "Chat");
  chat.setAttribute("allow", "clipboard-read; clipboard-write; microphone");
  document.body.appendChild(chat);

  // Close button
  const closeBtn = create("div"); closeBtn.className = "bb-close"; closeBtn.innerText = "×";
  closeBtn.addEventListener("click", () => {
    chat.style.display = "none";
    closeBtn.style.display = "none";
  });
  document.body.appendChild(closeBtn);

  let lead = null;
  let chatLoaded = false;

  chat.addEventListener("load", () => {
    chatLoaded = true;
    chat.contentWindow && chat.contentWindow.postMessage({
      type: "bb:init",
      clientId: CONFIG.clientId,
      pageUrl: pageUrlRaw,
      greeting: CONFIG.greeting,
      lead
    }, "*");
  });

  window.addEventListener("message", (e) => {
    if (!e.data || typeof e.data !== "object") return;

    if (e.data.type === "bb:requestLead" && !lead) {
      showLeadModal((data) => {
        lead = data;
        autoDetectForm(lead.name, lead.email);
        chat.contentWindow && chat.contentWindow.postMessage({ type: "bb:lead", lead }, "*");
        chat.style.display = "block";
        closeBtn.style.display = "block";
      });
    }

    if (e.data.type === "bb:ready") {
      if (lead) chat.contentWindow && chat.contentWindow.postMessage({ type: "bb:lead", lead }, "*");
      chat.contentWindow && chat.contentWindow.postMessage({ type: "bb:context", pageUrl: pageUrlRaw }, "*");
    }
  });

  avatar.addEventListener("click", () => {
    // If lead missing, prompt first
    if (!lead) {
      showLeadModal((data) => {
        lead = data;
        autoDetectForm(lead.name, lead.email);
        if (chatLoaded) chat.contentWindow && chat.contentWindow.postMessage({ type: "bb:lead", lead }, "*");
        chat.style.display = "block";
        closeBtn.style.display = "block";
      });
      return;
    }
    // Toggle chat visibility
    const show = chat.style.display === "none";
    chat.style.display = show ? "block" : "none";
    closeBtn.style.display = show ? "block" : "none";
  });

})();
