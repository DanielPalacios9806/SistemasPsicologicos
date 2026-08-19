const alertBox = document.getElementById("alert");
const welcomeName = document.getElementById("welcomeName");
const welcomeMeta = document.getElementById("welcomeMeta");
const assignmentList = document.getElementById("assignmentList");
const logoutButton = document.getElementById("logoutButton");
const sessionUsername = document.getElementById("sessionUsername");
const sessionRole = document.getElementById("sessionRole");
const profileSummary = document.getElementById("profileSummary");
const overallProgressLabel = document.getElementById("overallProgressLabel");
const overallProgressMessage = document.getElementById("overallProgressMessage");
const overallProgressFill = document.getElementById("overallProgressFill");
const overallProgressValue = document.getElementById("overallProgressValue");
const profileAvatar = document.getElementById("profileAvatar");

const LABELS = {
  ema: "Asertividad",
  baron: "Inteligencia emocional",
  disc: "Estilo conductual DISC",
};

const DESCRIPTIONS = {
  ema: "Reconoce como expresas ideas, necesidades y limites en tus relaciones.",
  baron: "Explora recursos emocionales, adaptabilidad y manejo de situaciones exigentes.",
  disc: "Identifica tendencias de comportamiento y tu forma habitual de relacionarte.",
};

const INSTRUMENT_ICONS = {
  ema: "messages-square",
  baron: "heart-pulse",
  disc: "compass",
};

const PROFILE_ICONS = {
  Grado: "badge-check",
  Unidad: "building-2",
  Promocion: "calendar-days",
  Cedula: "badge-user",
};

const STATUS_CLASS = {
  completed: "is-completed",
  in_progress: "is-progress",
  pending: "is-pending",
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

function actionLabel(status) {
  if (status === "completed") return "Ver resultado";
  if (status === "in_progress") return "Continuar";
  return "Iniciar";
}

function initials(fullName) {
  return (
    String(fullName || "SP")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "SP"
  );
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

function renderProfileSummary(person) {
  const fields = [
    ["Grado", [person.rankCode, person.rankName].filter(Boolean).join(" - ")],
    ["Unidad", person.unit || person.unitName || person.unitCode],
    ["Promocion", person.promotion],
    ["Cedula", person.idNumber],
  ];
  profileSummary.innerHTML = fields
    .map(
      ([label, value]) => `
        <article class="summary-item profile-summary-item">
          <span><i data-lucide="${PROFILE_ICONS[label] || "circle"}"></i>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "-")}</strong>
        </article>
      `
    )
    .join("");
  window.renderParticipantIcons?.(profileSummary);
}

function renderOverallProgress(assignments) {
  const total = assignments.length;
  const completed = assignments.filter((assignment) => assignment.status === "completed").length;
  const inProgress = assignments.filter((assignment) => assignment.status === "in_progress").length;
  const progress = total
    ? Math.round(assignments.reduce((sum, assignment) => sum + Number(assignment.percentageComplete || 0), 0) / total)
    : 0;

  const pending = total - completed - inProgress;
  overallProgressLabel.textContent = total ? "Avance general" : "Sin evaluaciones asignadas";
  overallProgressMessage.textContent = total
    ? `${completed} completada${completed === 1 ? "" : "s"} · ${inProgress} en progreso · ${pending} pendiente${pending === 1 ? "" : "s"}`
    : "Tu cuenta esta activa, pero no hay instrumentos asignados para este perfil.";
  overallProgressValue.textContent = `${progress}%`;
  overallProgressFill.style.width = `${progress}%`;
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
  profileAvatar.textContent = initials(person.fullName);
  sessionUsername.textContent = payload.user?.username || person.idNumber || "-";
  sessionRole.textContent = payload.user?.role === "admin" ? "Administrador" : "Participante autenticado";
  renderProfileSummary(person);

  assignmentList.innerHTML = "";
  const assignments = payload.assignments || [];
  renderOverallProgress(assignments);
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
    card.className = `instrument-card assignment-card ${STATUS_CLASS[assignment.status] || STATUS_CLASS.pending}`;
    const percentage = assignment.percentageComplete || 0;
    card.innerHTML = `
      <div class="assignment-card-top">
        <span class="status-badge">${escapeHtml(statusLabel(assignment.status))}</span>
        <small>${assignment.required ? "Obligatoria" : "Opcional"}</small>
      </div>
      <span class="assignment-icon" aria-hidden="true"><i data-lucide="${INSTRUMENT_ICONS[assignment.instrumentCode] || "clipboard-list"}"></i></span>
      <h3>${escapeHtml(LABELS[assignment.instrumentCode] || assignment.instrumentCode.toUpperCase())}</h3>
      <p>${escapeHtml(DESCRIPTIONS[assignment.instrumentCode] || "Evaluacion asignada a tu perfil.")}</p>
      <div class="assignment-progress">
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill" style="width: ${Number(percentage)}%"></div>
        </div>
        <small>${assignment.completedAt ? `Finalizado: ${new Date(assignment.completedAt).toLocaleDateString()}` : `${percentage}% completado`}</small>
      </div>
      <button class="primary-button assignment-action" type="button"><span>${escapeHtml(actionLabel(assignment.status))}</span><i data-lucide="arrow-right"></i></button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      window.location.href = `/index.html?instrument=${encodeURIComponent(assignment.instrumentCode)}`;
    });
    assignmentList.appendChild(card);
  }
  window.renderParticipantIcons?.(assignmentList);
}

logoutButton.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
});

loadPortal().catch((error) => showAlert(error.message || "No se pudo cargar el portal."));
