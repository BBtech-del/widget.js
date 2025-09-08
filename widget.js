(function () {
  // ---- Config intake ----
  const cfg = (window.BizBuildConfig || {});
  const clientId = (cfg.clientId || "").trim();
  const scrapeUrl = (cfg.scrapeUrl || cfg.startUrl || "").trim();
  const avatarUrl = (cfg.avatarUrl || "").trim();
  const theme = cfg.theme || { background: "#ffffff", text: "#222222", accent: "#4a90e2" };

  if (!clientId) {
    console.error("[BizBuild Widget] Missing clientId in BizBuildConfig");
    return;
  }

  // ---- Endpoints (adjust if you move services) ----
  const WORKER_BASE = "https://bizbuild-scraper.oluwasanu.workers.dev";
  const CHAT_BASE = "https://chat.bizbuild.tech";

  // ---- Storage keys (per tenant) ----
  const KEY_PREFIX = `bizbuild_${clientId}_`;
  const KEY_LEAD = KEY_PREFIX + "lead";
  const KEY_SCRAPED = KEY_PREFIX + "scraped_once";
  const KEY_OPEN = KEY_PREFIX + "chat_open";

  // ---- Utilities ----
  function qs(sel, root = document) { return root.querySelector(sel); }
  function create(tag, props = {}, styles = {}) {
    const el = document.createElement(tag);
    Object.assign(el, props);
    Object.assign(el.style, styles);
    return el;
  }
  function once(fn) {
    let ran = false;
    return function () { if (!ran) { ran = true; fn(); } };
  }
  function validEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
  }

  // ---- Idempotent scrape trigger (per browser, per tenant) ----
  async function triggerScrape() {
    if (!scrapeUrl) return; // allow tenants without scraping
    if (localStorage.getItem(KEY_SCRAPED) === "done") return;

    try {
      const url = `${WORKER_BASE}/scrape?scrapeUrl=${encodeURIComponent(scrapeUrl)}&clientId=${encodeURIComponent(clientId)}`;
      const resp = await fetch(url, { method: "GET", credentials: "omit" });
      const data = await resp.json().catch(() => ({}));
      if (data && (data.success || data.ok)) {
        localStorage.setItem(KEY_SCRAPED, "done");
        console.log("[BizBuild Scraper] Scrape queued/ok for", scrapeUrl);
      } else {
        console.warn("[BizBuild Scraper] Non-success response:", data);
      }
    } catch (err) {
      console.error("[BizBuild Scraper] Error:", err);
    }
  }

  // ---- Lead capture modal ----
  function buildLeadModal(onSubmit) {
    const overlay = create("div", {}, {
      position: "fixed", inset: "0", background: "rgba(0,0,0,0.35)",
      zIndex: "99998", display: "flex", alignItems: "center", justifyContent: "center"
    });
    const card = create("div", {}, {
      width: "min(92vw, 420px)", background: theme.background, color: theme.text,
      borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", padding: "20px"
    });
    const title = create("div", { innerText: "Almost there — who am I chatting with?" }, {
      fontSize: "18px", fontWeight: "600", marginBottom: "10px"
    });
    const desc = create("div", { innerText: "Share your name and email so we can keep your conversation and follow-ups in one place." }, {
      fontSize: "14px", opacity: "0.9", marginBottom: "16px"
    });

    const form = create("form");
    const nameLabel = create("label", { innerText: "Name" }, { display: "block", marginBottom: "6px", fontSize: "13px" });
    const nameInput = create("input", { type: "text", placeholder: "Jane Doe" }, {
      width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd",
      marginBottom: "12px", outline: "none"
    });
    const emailLabel = create("label", { innerText: "Email" }, { display: "block", marginBottom: "6px", fontSize: "13px" });
    const emailInput = create("input", { type: "email", placeholder: "jane@example.com" }, {
      width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd",
      marginBottom: "12px", outline: "none"
    });

    const err = create("div", { innerText: "" }, { color: "#c0392b", fontSize: "12px", minHeight: "16px", marginBottom: "8px" });

    const row = create("div", {}, { display: "flex", gap: "8px", justifyContent: "flex-end" });
    const cancel = create("button", { type: "button", innerText: "Cancel" }, {
      padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer"
    });
    const submit = create("button", { type: "submit", innerText: "Start chat" }, {
      padding: "10px 14px", borderRadius: "8px", border: "0", background: theme.accent, color: "#fff", cursor: "pointer"
    });

    cancel.addEventListener("click", () => document.body.removeChild(overlay));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name) { err.innerText = "Please enter your name."; return; }
      if (!validEmail(email)) { err.innerText = "Enter a valid email address."; return; }
      err.innerText = "";
      try {
        localStorage.setItem(KEY_LEAD, JSON.stringify({ name, email, ts: Date.now() }));
      } catch {}
      document.body.removeChild(overlay);
      onSubmit({ name, email });
    });

    row.appendChild(cancel);
    row.appendChild(submit);
    form.appendChild(nameLabel); form.appendChild(nameInput);
    form.appendChild(emailLabel); form.appendChild(emailInput);
    form.appendChild(err);
    form.appendChild(row);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(form);
    overlay.appendChild(card);
    return overlay;
  }

  // ---- Chat iframe singleton ----
  let iframe = null;
  let frameContainer = null;

  function ensureFrame({ autoOpen = false } = {}) {
    if (frameContainer && iframe) {
      if (autoOpen) openChat();
      return;
    }

    frameContainer = create("div", {}, {
      position: "fixed", bottom: "110px", right: "20px", width: "380px", height: "560px",
      borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      display: "none", zIndex: "99997", background: "#0000"
    });

    const lead = getLead();
    const params = new URLSearchParams({
      clientId,
      name: lead?.name || "",
      email: lead?.email || "",
      avatarUrl
    });
    iframe = create("iframe", {
      src: `${CHAT_BASE}/?${params.toString()}`,
      allow: "clipboard-write; microphone; camera",
      referrerPolicy: "no-referrer",
      title: "BizBuild Chat"
    }, {
      width: "100%", height: "100%", border: "0", background: "#fff"
    });

    frameContainer.appendChild(iframe);
    document.body.appendChild(frameContainer);
    if (autoOpen) openChat();
  }

  function openChat() {
    frameContainer.style.display = "block";
    localStorage.setItem(KEY_OPEN, "1");
  }
  function closeChat() {
    frameContainer.style.display = "none";
    localStorage.removeItem(KEY_OPEN);
  }
  function toggleChat() {
    if (!frameContainer || !iframe) ensureFrame();
    if (frameContainer.style.display === "none") openChat(); else closeChat();
  }
  function getLead() {
    try {
      const val = localStorage.getItem(KEY_LEAD);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }

  // ---- Floating avatar with breathing animation ----
  const avatar = create("div", {}, {
    position: "fixed", bottom: "20px", right: "20px", width: "80px", height: "80px",
    borderRadius: "50%", cursor: "pointer", zIndex: "99999", animation: "bizbuild_breathe 4s ease-in-out infinite",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)", background: avatarUrl ? `url('${avatarUrl}') center/cover no-repeat` : theme.accent
  });
  const style = create("style");
  style.textContent = `
    @keyframes bizbuild_breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
    @keyframes bizbuild_blink { 0%,95%{opacity:1} 96%,100%{opacity:0.5} }
    .bizbuild-badge {
      position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%;
      background:${theme.accent}; color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:700; box-shadow:0 2px 10px rgba(0,0,0,0.25); animation: bizbuild_blink 6s infinite;
    }
  `;
  const badge = create("div", { innerText: "•", className: "bizbuild-badge" });
  document.head.appendChild(style);
  avatar.appendChild(badge);
  document.body.appendChild(avatar);

  avatar.addEventListener("click", () => {
    const lead = getLead();
    // If no lead yet, show modal first; otherwise toggle immediately
    if (!lead) {
      const modal = buildLeadModal(({ name, email }) => {
        // Ensure iframe picks up lead on first open
        ensureFrame({ autoOpen: true });
        // If already created with empty params, refresh query once
        try {
          const u = new URL(iframe.src);
          u.searchParams.set("name", name);
          u.searchParams.set("email", email);
          iframe.src = u.toString();
        } catch {}
      });
      document.body.appendChild(modal);
      return;
    }
    ensureFrame();
    toggleChat();
  });

  // ---- Auto behaviors on first load ----
  // 1) Trigger scrape once per tenant (per browser)
  triggerScrape();

  // 2) If we’ve opened before in this browser, restore open state
  if (localStorage.getItem(KEY_OPEN) === "1") {
    ensureFrame({ autoOpen: true });
  }

  // 3) Optional: auto-open for brand-new visitors once
  if (!getLead() && !localStorage.getItem(KEY_PREFIX + "auto_opened")) {
    localStorage.setItem(KEY_PREFIX + "auto_opened", "1");
    // Show lead capture after short delay to avoid jarring pop
    setTimeout(() => { avatar.click(); }, 1200);
  }
})();
