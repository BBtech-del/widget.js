function buildLeadModal(onSubmit) {
  const overlay = create("div", {}, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.35)",
    zIndex: "99998",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px"
  });

  const card = create("div", {}, {
    width: "100%",
    maxWidth: "420px",
    background: theme.background,
    color: theme.text,
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    padding: "20px",
    boxSizing: "border-box"
  });

  const title = create("div", {
    innerText: "👋 Welcome! I'm here to help..."
  }, {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "10px"
  });

  const desc = create("div", {
    innerText: "Before we begin, may I have your name and email?"
  }, {
    fontSize: "14px",
    opacity: "0.9",
    marginBottom: "16px"
  });

  const form = create("form");
  const nameInput = create("input", {
    type: "text",
    placeholder: "Your name",
    required: true
  }, {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "12px",
    outline: "none"
  });

  const emailInput = create("input", {
    type: "email",
    placeholder: "you@example.com",
    required: true
  }, {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "12px",
    outline: "none"
  });

  const err = create("div", { innerText: "" }, {
    color: "#c0392b",
    fontSize: "12px",
    minHeight: "16px",
    marginBottom: "8px"
  });

  const submitBtn = create("button", {
    type: "submit",
    innerText: "Start Chat"
  }, {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: theme.primary,
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer"
  });

  form.append(nameInput, emailInput, err, submitBtn);
  card.append(title, desc, form);
  overlay.append(card);
  document.body.append(overlay);

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      err.innerText = "Please fill in both fields.";
      return;
    }
    overlay.remove();
    onSubmit({
      name: nameInput.value.trim(),
      email: emailInput.value.trim()
    });
  });
}
