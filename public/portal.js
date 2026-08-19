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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMilitaryMeta(person) {
  const rank = [person.rankCode, person.rankName].filter(Boolean).join(" - ");
  const details = [];
  if (rank) details.push(rank);
  if (person.unit || person.unitName || person.unitCode) details.push(`Unidad: ${person.unit || person.unitName || person.unitCode}`);
  if (person.promotion != null && person.promotion !== "") details.push(`Promocion: ${person.promotion}`);
  return details.join(" · ") || "Evaluaciones asignadas";
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
  const rankPrefix = person.rankCode ? `${person.rankCode}. ` : "";
  welcomeName.textContent = `${rankPrefix}${person.fullName || "Participante"}`;
  welcomeMeta.textContent = formatMilitaryMeta(person);

  assignmentList.innerHTML = "";
  const assignments = payload.assignments || [];
  if (!assignments.length) {
    assignmentList.innerHTML = `
      <article class="instrument-card">
        <span class="question-category">Sin asignaciones</span>
        <h3>No tienes evaluaciones asignadas actualmente.</h3>
        <p>Tu cuenta esta activa, pero no hay instrumentos disponibles para este perfil.</p>
      </article>
    `;
    return;
  }

  for (const assignment of assignments) {
    const card = document.createElement("article");
    card.className = "instrument-card";
    const percentage = assignment.percentageComplete || 0;
    const actionLabel = assignment.status === "completed" ? "VER RESULTADO" : assignment.status === "in_progress" ? "CONTINUAR" : "INICIAR";
    card.innerHTML = `
      <span class="question-category">${escapeHtml(statusLabel(assignment.status))}</span>
      <h3>${escapeHtml(LABELS[assignment.instrumentCode] || assignment.instrumentCode.toUpperCase())}</h3>
      <p>${assignment.required ? "Instrumento obligatorio" : "Instrumento opcional"}</p>
      <small>${assignment.completedAt ? `Finalizado: ${new Date(assignment.completedAt).toLocaleDateString()}` : `${statusLabel(assignment.status)} · ${percentage}%`}</small>
      <button class="primary-button" type="button">${actionLabel}</button>
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
