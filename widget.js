function buildLeadModal(onSubmit) {
  const overlay = create("div", {}, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.35)",
    zIndex: "99998", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "10px"
  });
  const card = create("div", {}, {
    width: "100%", maxWidth: "420px", background: theme.background, color: theme.text,
    borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", padding: "20px",
    boxSizing: "border-box"
  });
  const title = create("div", { innerText: "Hi! To get started, can I grab your name and email?" }, {
    fontSize: "18px", fontWeight: "600", marginBottom: "10px"
  });
  const desc = create("div", { innerText: "This helps me remember our conversation and follow up if needed." }, {
    fontSize: "14px", opacity: "0.9", marginBottom: "16px"
  });

  const form = create("form");
  const nameInput = create("input", { type: "text", placeholder: "Your name" }, {
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd",
    marginBottom: "12px", outline: "none"
  });
  const emailInput = create("input", { type: "email", placeholder: "you@example.com" }, {
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd",
    marginBottom: "12px", outline: "none"
  });
  const err = create("div", { innerText: "" }, { color: "#c0392b", fontSize: "12px", minHeight: "16px", marginBottom: "8px" });

  const row = create("div", {}, { display: "flex", gap:
