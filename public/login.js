const alertBox = document.getElementById("alert");
const loginForm = document.getElementById("loginForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const loginSubmitButton = document.getElementById("loginSubmitButton");
const changeSubmitButton = document.getElementById("changeSubmitButton");
let authenticatedRole = "participant";

function renderIcons(root = document) {
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 }, root });
}

function destinationForRole(role) {
  return role === "admin" || role === "psychologist" ? "/admin.html" : "/portal.html";
}

function showAlert(message, type = "error") {
  alertBox.textContent = message;
  alertBox.className = `login-alert ${type}`;
}

function setBusy(button, isBusy, label) {
  button.disabled = isBusy;
  button.innerHTML = isBusy
    ? '<span class="button-spinner" aria-hidden="true"></span><span>Verificando...</span>'
    : `<span>${label}</span><i data-lucide="arrow-right"></i>`;
  renderIcons(button);
}

function showChangePassword() {
  loginForm.classList.add("hidden");
  changePasswordForm.classList.remove("hidden");
  document.querySelector(".login-heading:not(.compact)")?.classList.add("hidden");
  document.getElementById("currentPassword").focus();
  renderIcons(changePasswordForm);
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(loginSubmitButton, true, "Ingresar");
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value,
      }),
    });
    const payload = await readJson(response);
    if (!response.ok) throw new Error(payload.error || "Usuario o contraseña incorrectos.");
    authenticatedRole = payload.user?.role || "participant";
    if (payload.user?.mustChangePassword) {
      showAlert("Crea una contraseña personal para proteger tu cuenta.", "info");
      showChangePassword();
      return;
    }
    window.location.replace(destinationForRole(authenticatedRole));
  } catch (error) {
    showAlert(error.message || "No fue posible iniciar sesión.");
  } finally {
    setBusy(loginSubmitButton, false, "Ingresar");
  }
});

changePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(changeSubmitButton, true, "Guardar y continuar");
  try {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: document.getElementById("currentPassword").value,
        newPassword: document.getElementById("newPassword").value,
        confirmPassword: document.getElementById("confirmPassword").value,
      }),
    });
    const payload = await readJson(response);
    if (!response.ok) throw new Error(payload.error || "No se pudo cambiar la contraseña.");
    const sessionResponse = await fetch("/api/auth/me");
    const session = await readJson(sessionResponse);
    if (sessionResponse.ok) authenticatedRole = session.user?.role || authenticatedRole;
    window.location.replace(destinationForRole(authenticatedRole));
  } catch (error) {
    showAlert(error.message || "No se pudo cambiar la contraseña.");
  } finally {
    setBusy(changeSubmitButton, false, "Guardar y continuar");
  }
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
    button.setAttribute("title", visible ? "Mostrar contraseña" : "Ocultar contraseña");
    button.innerHTML = `<i data-lucide="${visible ? "eye" : "eye-off"}"></i>`;
    renderIcons(button);
  });
});

if (new URLSearchParams(window.location.search).get("change")) showChangePassword();
renderIcons();
