const alertBox = document.getElementById("alert");
const welcomeName = document.getElementById("welcomeName");
const welcomeMeta = document.getElementById("welcomeMeta");
const assignmentList = document.getElementById("assignmentList");
const logoutButton = document.getElementById("logoutButton");

const LABELS = {
  ema: "Asertividad EMA",
  baron: "Bar-On ICE",
  disc: "DISC",
};

function showAlert(message, isError = true) {
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  alertBox.style.background = isError ? "rgba(96, 33, 56, 0.94)" : "rgba(28, 78, 79, 0.94)";
  alertBox.style.color = isError ? "#ffe6ec" : "#e7fffb";
}

function statusLabel(status) {
  if (status === "completed") return "Completado";
  if (status === "in_progress") return "En progreso";
  return "Pendiente";
}

async function loadPortal() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    window.location.href = "/login.html";
    return;
  }
  const payload = await response.json();
  if (payload.user?.mustChangePassword) {
    window.location.href = "/login.html?change=1";
    return;
  }
  const person = payload.user?.person || {};
  welcomeName.textContent = `${person.fullName || "Participante"}`;
  welcomeMeta.textContent = [person.career, person.gender].filter(Boolean).join(" · ") || "Evaluaciones asignadas";

  assignmentList.innerHTML = "";
  for (const assignment of payload.assignments || []) {
    const card = document.createElement("article");
    card.className = "instrument-card";
    const disabled = assignment.status === "completed" && assignment.applicationId;
    card.innerHTML = `
      <span class="question-category">${statusLabel(assignment.status)}</span>
      <h3>${LABELS[assignment.instrumentCode] || assignment.instrumentCode.toUpperCase()}</h3>
      <p>${assignment.required ? "Instrumento obligatorio" : "Instrumento opcional"}</p>
      <small>${assignment.completedAt ? `Finalizado: ${new Date(assignment.completedAt).toLocaleDateString()}` : "Disponible"}</small>
    `;
    card.addEventListener("click", () => {
      window.location.href = `/index.html?instrument=${encodeURIComponent(assignment.instrumentCode)}`;
    });
    assignmentList.appendChild(card);
  }
}

logoutButton.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
});

loadPortal().catch((error) => showAlert(error.message || "No se pudo cargar el portal."));
