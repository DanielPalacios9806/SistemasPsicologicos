const adminState = {
  token: sessionStorage.getItem("adminToken") || "",
  applications: [],
};

const adminAlert = document.getElementById("adminAlert");
const adminLoginScreen = document.getElementById("adminLoginScreen");
const adminPanelScreen = document.getElementById("adminPanelScreen");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminSearchForm = document.getElementById("adminSearchForm");
const adminResultCard = document.getElementById("adminResultCard");
const adminParticipantSummary = document.getElementById("adminParticipantSummary");
const adminDimensionGrid = document.getElementById("adminDimensionGrid");
const adminStrengthList = document.getElementById("adminStrengthList");
const adminAttentionList = document.getElementById("adminAttentionList");
const adminSuggestionList = document.getElementById("adminSuggestionList");
const adminAnswersList = document.getElementById("adminAnswersList");
const adminExportButton = document.getElementById("adminExportButton");
const adminInstrumentFilter = document.getElementById("adminInstrumentFilter");
const adminStatusFilter = document.getElementById("adminStatusFilter");
const adminApplicationList = document.getElementById("adminApplicationList");

function showAdminAlert(message, isError = true) {
  adminAlert.textContent = message;
  adminAlert.classList.remove("hidden");
  adminAlert.style.background = isError ? "rgba(96, 33, 56, 0.94)" : "rgba(28, 78, 79, 0.94)";
  adminAlert.style.color = isError ? "#ffe6ec" : "#e7fffb";
  clearTimeout(showAdminAlert.timeoutId);
  showAdminAlert.timeoutId = setTimeout(() => adminAlert.classList.add("hidden"), 4000);
}

function switchAdminScreen() {
  adminLoginScreen.classList.toggle("hidden", Boolean(adminState.token));
  adminPanelScreen.classList.toggle("hidden", !adminState.token);
}

function renderList(element, items) {
  element.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function normalizeDate(isoDate) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString("es-EC");
}

function renderSummary(application) {
  adminParticipantSummary.innerHTML = "";
  const fields = [
    ["Cedula", application.participant.idNumber],
    ["Nombre", application.participant.fullName],
    ["Carrera", application.participant.career],
    ["Edad", application.participant.age],
    ["Genero", application.participant.gender],
    ["Instrumento", application.instrumentName],
    ["Estado", application.status],
    ["Avance", `${application.percentageComplete || 0}%`],
    ["Fecha inicio", normalizeDate(application.startedAt)],
    ["Fecha fin", application.completedAt ? normalizeDate(application.completedAt) : "-"],
  ];

  fields.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<span>${label}</span><strong>${value || "-"}</strong>`;
    adminParticipantSummary.appendChild(card);
  });
}

function renderDimensions(application) {
  adminDimensionGrid.innerHTML = "";
  const scoring = application.scoringSnapshot || {};

  if (application.instrumentCode === "baron") {
    (scoring.components || []).forEach((component) => {
      const card = document.createElement("article");
      card.className = "dimension-card";
      card.innerHTML = `
        <p class="question-category">${component.label}</p>
        <h3>${component.ceScore ?? "Parcial"}</h3>
        <p>Categoria: ${component.category || "pendiente"}</p>
        <p>Puntaje bruto: ${component.rawScore} | Avance: ${component.answeredCount}/${component.expectedCount}</p>
      `;
      adminDimensionGrid.appendChild(card);
    });
    (scoring.validity?.warnings || []).forEach((warning) => {
      const card = document.createElement("article");
      card.className = "dimension-card";
      card.innerHTML = `
        <p class="question-category">Validez</p>
        <h3>Revisar</h3>
        <p>${warning}</p>
      `;
      adminDimensionGrid.appendChild(card);
    });
    return;
  }

  (scoring.dimensions || []).forEach((dimension) => {
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${dimension.label}</p>
      <h3>${dimension.favorablePercentage}%</h3>
      <p>${dimension.interpretiveLevel}</p>
      <p>${dimension.interpretiveNote}</p>
      <p>Puntaje bruto: ${dimension.rawTotal} | Promedio: ${dimension.rawAverage}</p>
    `;
    adminDimensionGrid.appendChild(card);
  });
}

function renderAnswers(answers) {
  adminAnswersList.innerHTML = "";
  (answers || []).forEach((answer) => {
    const row = document.createElement("article");
    row.className = "answer-row";
    row.innerHTML = `
      <strong>Item ${answer.itemId}</strong>
      <span>Respuesta: ${answer.value}</span>
      <span>${answer.moduleKey || ""}</span>
    `;
    adminAnswersList.appendChild(row);
  });
}

function renderApplication(application) {
  adminResultCard.classList.remove("hidden");
  renderSummary(application);
  renderDimensions(application);
  renderList(adminStrengthList, application.scoringSnapshot?.observations?.strengths || []);
  renderList(adminAttentionList, application.scoringSnapshot?.observations?.attentionAreas || []);
  renderList(adminSuggestionList, application.scoringSnapshot?.observations?.suggestions || []);
  renderAnswers(application.answers);
}

function renderApplicationList() {
  adminApplicationList.innerHTML = "";
  adminState.applications.forEach((application) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "answer-row application-row";
    row.innerHTML = `
      <strong>${application.participant.fullName}</strong>
      <span>${application.participant.idNumber} · ${application.instrumentCode.toUpperCase()}</span>
      <span>${application.status} · ${application.percentageComplete || 0}%</span>
    `;
    row.addEventListener("click", () => renderApplication(application));
    adminApplicationList.appendChild(row);
  });
}

async function loadApplications() {
  const params = new URLSearchParams();
  const cedula = String(document.getElementById("adminSearchIdNumber").value || "").trim();
  if (cedula) params.set("cedula", cedula);
  if (adminInstrumentFilter.value) params.set("instrument", adminInstrumentFilter.value);
  if (adminStatusFilter.value) params.set("status", adminStatusFilter.value);

  const response = await fetch(`/api/admin/applications?${params.toString()}`, {
    headers: { "x-admin-token": adminState.token },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudieron cargar las aplicaciones.");
  adminState.applications = payload.applications || [];
  renderApplicationList();
  if (adminState.applications[0]) {
    renderApplication(adminState.applications[0]);
  } else {
    adminResultCard.classList.add("hidden");
  }
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = String(document.getElementById("adminUsername").value || "").trim();
  const password = String(document.getElementById("adminPassword").value || "");

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo iniciar sesion.");

    adminState.token = result.token;
    sessionStorage.setItem("adminToken", result.token);
    switchAdminScreen();
    await loadApplications();
    showAdminAlert("Sesion administrativa iniciada.", false);
  } catch (error) {
    showAdminAlert(error.message);
  }
});

adminSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loadApplications();
  } catch (error) {
    showAdminAlert(error.message);
  }
});

adminExportButton.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (adminInstrumentFilter.value) params.set("instrument", adminInstrumentFilter.value);
    const response = await fetch(`/api/export/excel?${params.toString()}`, {
      headers: { "x-admin-token": adminState.token },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "No se pudo generar el Excel.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resultados-${adminInstrumentFilter.value || "consolidado"}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showAdminAlert(error.message);
  }
});

switchAdminScreen();
