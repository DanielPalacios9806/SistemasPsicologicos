const adminState = {
  token: sessionStorage.getItem("adminToken") || "",
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

function renderSummary(participant, createdAt) {
  adminParticipantSummary.innerHTML = "";
  const fields = [
    ["Cedula", participant.idNumber],
    ["Nombre", participant.fullName],
    ["Carrera", participant.career],
    ["Edad", participant.age],
    ["Genero", participant.gender],
    ["Fecha", normalizeDate(createdAt)],
  ];

  fields.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<span>${label}</span><strong>${value || "-"}</strong>`;
    adminParticipantSummary.appendChild(card);
  });
}

function renderDimensions(scoring) {
  adminDimensionGrid.innerHTML = "";
  scoring.dimensions.forEach((dimension) => {
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
  answers.forEach((answer) => {
    const row = document.createElement("article");
    row.className = "answer-row";
    row.innerHTML = `
      <strong>Pregunta ${answer.questionId}</strong>
      <span>Respuesta: ${answer.value}</span>
    `;
    adminAnswersList.appendChild(row);
  });
}

function renderSubmission(submission) {
  adminResultCard.classList.remove("hidden");
  renderSummary(submission.participant, submission.createdAt);
  renderDimensions(submission.scoring);
  renderList(adminStrengthList, submission.scoring.observations.strengths);
  renderList(adminAttentionList, submission.scoring.observations.attentionAreas);
  renderList(adminSuggestionList, submission.scoring.observations.suggestions);
  renderAnswers(submission.answers);
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
    showAdminAlert("Sesion administrativa iniciada.", false);
  } catch (error) {
    showAdminAlert(error.message);
  }
});

adminSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const idNumber = String(document.getElementById("adminSearchIdNumber").value || "").trim();

  try {
    const response = await fetch(`/api/submissions/${encodeURIComponent(idNumber)}`, {
      headers: { "x-admin-token": adminState.token },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se encontro el registro.");
    renderSubmission(result);
  } catch (error) {
    showAdminAlert(error.message);
  }
});

adminExportButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/export/excel", {
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
    link.download = "resultados-ema.xls";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showAdminAlert(error.message);
  }
});

switchAdminScreen();
