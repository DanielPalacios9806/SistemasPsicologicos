const alertBox = document.getElementById("alert");
const loginForm = document.getElementById("loginForm");
const changeSection = document.getElementById("changeSection");
const changePasswordForm = document.getElementById("changePasswordForm");
const loginSubmitButton = document.getElementById("loginSubmitButton");

function showAlert(message, isError = true) {
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  alertBox.style.background = isError ? "rgba(96, 33, 56, 0.94)" : "rgba(28, 78, 79, 0.94)";
  alertBox.style.color = isError ? "#ffe6ec" : "#e7fffb";
}

function showChangePassword() {
  changeSection.classList.remove("hidden");
  changeSection.scrollIntoView({ behavior: "smooth" });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = String(document.getElementById("username").value || "").trim();
  const password = String(document.getElementById("password").value || "");
  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "Verificando...";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      showAlert(payload.error || "Usuario o contrasena incorrectos.");
      return;
    }
    if (payload.user?.mustChangePassword) {
      showAlert("Debes cambiar tu contrasena para continuar.", false);
      showChangePassword();
      return;
    }
    window.location.href = "/portal.html";
  } finally {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Ingresar al portal";
  }
});

changePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: document.getElementById("currentPassword").value,
      newPassword: document.getElementById("newPassword").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    showAlert(payload.error || "No se pudo cambiar la contrasena.");
    return;
  }
  window.location.href = "/portal.html";
});

if (new URLSearchParams(window.location.search).get("change")) {
  showChangePassword();
}
