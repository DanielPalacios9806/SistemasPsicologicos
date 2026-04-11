const RESPONSE_UI = {
  1: { emoji: "😶", title: "Muy en desacuerdo" },
  2: { emoji: "🙂", title: "En desacuerdo" },
  3: { emoji: "🤔", title: "Neutral" },
  4: { emoji: "😊", title: "De acuerdo" },
  5: { emoji: "🌟", title: "Muy de acuerdo" },
};

const MOTIVATION_BY_DIMENSION = {
  asertividad_directa: "Piensa en como te expresas cuando necesitas decir algo importante. ✨",
  no_asertividad: "Responde desde tu experiencia real, no desde como quisieras reaccionar. 🌙",
  asertividad_indirecta: "Observa si te sale mas natural decir las cosas de frente o a traves de otro medio. 💭",
};

const state = {
  config: null,
  introSlideIndex: 0,
  idNumberExists: false,
  participant: { googleId: "", picture: "" },
  currentQuestionIndex: 0,
  answers: [],
};

const alertBox = document.getElementById("alert");
const introSlides = Array.from(document.querySelectorAll("[data-intro-slide]"));
const introDots = Array.from(document.querySelectorAll(".intro-dot"));
const introBackButton = document.getElementById("introBackButton");
const introNextButton = document.getElementById("introNextButton");
const instrumentDescription = document.getElementById("instrumentDescription");
const welcomeScreen = document.getElementById("welcomeScreen");
const questionScreen = document.getElementById("questionScreen");
const resultScreen = document.getElementById("resultScreen");
const publicFooter = document.getElementById("publicFooter");
const participantForm = document.getElementById("participantForm");
const idNumberInput = document.getElementById("idNumber");
const idNumberFeedback = document.getElementById("idNumberFeedback");
const startAssessmentButton = document.getElementById("startAssessmentButton");
const questionHeading = document.getElementById("questionHeading");
const questionHint = document.getElementById("questionHint");
const questionText = document.getElementById("questionText");
const questionMicrocopy = document.getElementById("questionMicrocopy");
const questionMotivation = document.getElementById("questionMotivation");
const progressLabel = document.getElementById("progressLabel");
const progressMessage = document.getElementById("progressMessage");
const progressFill = document.getElementById("progressFill");
const ratingGroup = document.getElementById("ratingGroup");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const resultHeading = document.getElementById("resultHeading");
const resultSubheading = document.getElementById("resultSubheading");
const globalProfile = document.getElementById("globalProfile");
const globalSummary = document.getElementById("globalSummary");
const overallAverage = document.getElementById("overallAverage");
const overallPercentage = document.getElementById("overallPercentage");
const participantSummary = document.getElementById("participantSummary");
const dimensionGrid = document.getElementById("dimensionGrid");
const strengthList = document.getElementById("strengthList");
const attentionList = document.getElementById("attentionList");
const suggestionList = document.getElementById("suggestionList");
const newAssessmentButton = document.getElementById("newAssessmentButton");

const USER_DIMENSION_COPY = {
  asertividad_directa: {
    title: "Expresion directa",
    high: "Este patron aparece como un recurso disponible y relativamente consistente en tus respuestas.",
    medium: "Este recurso aparece en varias situaciones, aunque no de forma totalmente estable.",
    low: "Aqui aparecen senales de reserva o dificultad para expresarte con claridad en algunos contextos.",
  },
  no_asertividad: {
    title: "Seguridad al expresarte",
    high: "Tus respuestas sugieren que la inhibicion o el temor a la evaluacion no dominan la mayoria de tus interacciones.",
    medium: "Aparecen algunas reservas al expresarte, sobre todo en situaciones sensibles o exigentes.",
    low: "Se observan respuestas compatibles con inhibicion, cautela excesiva o temor a expresar necesidades.",
  },
  asertividad_indirecta: {
    title: "Preferencia de comunicacion",
    high: "Predomina la disposicion a comunicarte de forma presencial y directa cuando la situacion lo requiere.",
    medium: "En ciertos momentos podrias preferir medios indirectos, aunque no de manera marcada.",
    low: "Se aprecia una tendencia a elegir formas indirectas para comunicar asuntos que tambien podrian hablarse cara a cara.",
  },
};

function getUserBandLabel(band) {
  if (band === "high") return "Tendencia favorable";
  if (band === "medium") return "Tendencia intermedia";
  return "Area a fortalecer";
}

function showAlert(message, isError = true) {
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  alertBox.style.background = isError ? "rgba(96, 33, 56, 0.94)" : "rgba(28, 78, 79, 0.94)";
  alertBox.style.color = isError ? "#ffe6ec" : "#e7fffb";
  clearTimeout(showAlert.timeoutId);
  showAlert.timeoutId = setTimeout(() => alertBox.classList.add("hidden"), 4200);
}

function setIdNumberFeedback(message = "", type = "") {
  idNumberFeedback.textContent = message;
  idNumberFeedback.classList.toggle("hidden", !message);
  idNumberFeedback.dataset.state = type;
}

function switchScreen(target) {
  [welcomeScreen, questionScreen, resultScreen].forEach((section) => section.classList.add("hidden"));
  target.classList.remove("hidden");
  publicFooter.classList.toggle("hidden", target !== welcomeScreen);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderIntroSlide() {
  introSlides.forEach((slide, index) => {
    slide.classList.toggle("hidden", index !== state.introSlideIndex);
  });
  introDots.forEach((dot, index) => dot.classList.toggle("is-active", index === state.introSlideIndex));
  introBackButton.disabled = state.introSlideIndex === 0;
  introNextButton.classList.toggle("hidden", state.introSlideIndex === introSlides.length - 1);
}

async function loadInstrument() {
  const response = await fetch("/api/instrument");
  const config = await response.json();
  state.config = config;
  state.answers = Array(config.questions.length).fill(null);
  instrumentDescription.textContent = config.description;
}

async function loadConfig() {
  const response = await fetch("/api/config");
  await response.json();
}

async function checkExistingIdNumber(idNumber) {
  const response = await fetch(`/api/check-id/${encodeURIComponent(idNumber)}`);
  if (!response.ok) return false;
  const payload = await response.json();
  return Boolean(payload.exists);
}

async function validateIdNumberField() {
  const idNumber = String(idNumberInput.value || "").trim();

  state.idNumberExists = false;
  startAssessmentButton.disabled = false;

  if (!idNumber) {
    setIdNumberFeedback("");
    return;
  }

  if (!/^\d{8,15}$/.test(idNumber)) {
    setIdNumberFeedback("Ingresa una cedula valida de 8 a 15 digitos.", "error");
    startAssessmentButton.disabled = true;
    return;
  }

  const alreadyExists = await checkExistingIdNumber(idNumber);
  state.idNumberExists = alreadyExists;

  if (alreadyExists) {
    setIdNumberFeedback("Esta cedula ya registro una encuesta y no puede volver a responder.", "error");
    startAssessmentButton.disabled = true;
    return;
  }

  setIdNumberFeedback("Cedula disponible para una nueva aplicacion.", "success");
}

function getDimensionLabel(key) {
  return state.config.dimensions.find((dimension) => dimension.key === key)?.label || key;
}

function renderQuestion() {
  const question = state.config.questions[state.currentQuestionIndex];
  const currentValue = state.answers[state.currentQuestionIndex];
  const percent = Math.round(((state.currentQuestionIndex + 1) / state.config.questions.length) * 100);

  questionHeading.textContent = `Pregunta ${question.id}`;
  questionText.textContent = question.text;
  questionHint.textContent = "Marca el nivel de acuerdo que mejor describa tu experiencia habitual, sin pensar en categorias ni resultados.";
  questionMicrocopy.textContent =
    question.reverseForGlobal
      ? "Recuerda responder como realmente sueles actuar, aunque no siempre te guste."
      : "Piensa en tu comportamiento cotidiano y responde con calma.";
  questionMotivation.textContent = MOTIVATION_BY_DIMENSION[question.dimension] || "Responde con honestidad para obtener una lectura mas util. ✨";
  progressLabel.textContent = `Pregunta ${question.id} de ${state.config.questions.length}`;
  progressMessage.textContent = "Una pregunta por hoja, sin prisa y sin juicio.";
  progressFill.style.width = `${percent}%`;
  backButton.disabled = state.currentQuestionIndex === 0;
  nextButton.textContent = state.currentQuestionIndex === state.config.questions.length - 1 ? "Ver resultado" : "Siguiente";

  ratingGroup.innerHTML = "";
  state.config.responseScale.forEach((option) => {
    const ui = RESPONSE_UI[option.value];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rating-button${currentValue === option.value ? " selected" : ""}`;
    button.innerHTML = `
      <span class="rating-emoji" aria-hidden="true">${ui.emoji}</span>
      <span class="rating-value">${option.value}</span>
      <span class="rating-title">${ui.title}</span>
    `;
    button.addEventListener("click", () => {
      state.answers[state.currentQuestionIndex] = option.value;
      renderQuestion();
    });
    ratingGroup.appendChild(button);
  });
}

function renderList(element, items) {
  element.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function normalizeSummaryDate(isoDate) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString("es-EC");
}

function renderParticipantSummary(participant, createdAt) {
  participantSummary.innerHTML = "";
  const fields = [
    ["Cedula", participant.idNumber],
    ["Nombre", participant.fullName],
    ["Carrera", participant.career],
    ["Edad", participant.age],
    ["Genero", participant.gender],
    ["Fecha", normalizeSummaryDate(createdAt)],
  ];
  fields.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<span>${label}</span><strong>${value || "-"}</strong>`;
    participantSummary.appendChild(card);
  });
}

function renderDimensionResults(scoring) {
  dimensionGrid.innerHTML = "";
  scoring.dimensions.forEach((dimension) => {
    const copy = USER_DIMENSION_COPY[dimension.key] || {
      title: dimension.label,
      high: dimension.interpretiveNote,
      medium: dimension.interpretiveNote,
      low: dimension.interpretiveNote,
    };

    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${copy.title}</p>
      <h3>${getUserBandLabel(dimension.band)}</h3>
      <p>${copy[dimension.band]}</p>
      <p>${dimension.interpretiveNote}</p>
    `;
    dimensionGrid.appendChild(card);
  });
}

function renderResult(submission) {
  resultHeading.textContent = "Tu lectura orientativa";
  resultSubheading.textContent =
    "Este resultado resume patrones de comunicacion observados en tus respuestas. No representa una etiqueta fija ni un diagnostico.";
  globalProfile.textContent = submission.scoring.profile;
  globalSummary.textContent = submission.scoring.summary;
  overallAverage.textContent =
    submission.scoring.strongestDimension?.label === submission.scoring.weakestDimension?.label
      ? "Perfil relativamente equilibrado"
      : `Predomina: ${submission.scoring.strongestDimension?.label || "Patron mixto"}`;
  overallPercentage.textContent =
    submission.scoring.weakestDimension
      ? `Conviene observar con mas calma: ${submission.scoring.weakestDimension.label}.`
      : "Conviene revisar tus respuestas con una mirada reflexiva y sin juicio.";
  renderParticipantSummary(submission.participant, submission.createdAt);
  renderDimensionResults(submission.scoring);
  renderList(strengthList, submission.scoring.observations.strengths);
  renderList(attentionList, submission.scoring.observations.attentionAreas);
  renderList(suggestionList, submission.scoring.observations.suggestions);
  switchScreen(resultScreen);
}

function collectParticipantData() {
  const formData = new FormData(participantForm);
  const payload = Object.fromEntries(formData.entries());
  return {
    ...state.participant,
    fullName: String(payload.fullName || "").trim(),
    idNumber: String(payload.idNumber || "").trim(),
    career: String(payload.career || "").trim(),
    age: String(payload.age || "").trim(),
    gender: String(payload.gender || "").trim(),
    email: String(payload.email || "").trim(),
  };
}

participantForm.addEventListener("submit", (event) => {
  event.preventDefault();

  (async () => {
    const participant = collectParticipantData();

    if (!participant.idNumber || !participant.fullName || !participant.career || !participant.age || !participant.gender) {
      showAlert("Completa cedula, nombre, carrera, edad y genero antes de continuar.");
      return;
    }

    if (state.idNumberExists) {
      showAlert("Esta cedula ya registro una encuesta. Solo se permite una aplicacion por cedula.");
      return;
    }

    const alreadyExists = await checkExistingIdNumber(participant.idNumber);
    if (alreadyExists) {
      state.idNumberExists = true;
      setIdNumberFeedback("Esta cedula ya registro una encuesta y no puede volver a responder.", "error");
      startAssessmentButton.disabled = true;
      showAlert("Esta cedula ya registro una encuesta. Solo se permite una aplicacion por cedula.");
      return;
    }

    state.participant = participant;
    state.answers = Array(state.config.questions.length).fill(null);
    state.currentQuestionIndex = 0;
    switchScreen(questionScreen);
    renderQuestion();
  })().catch(() => {
    showAlert("No se pudo validar la cedula antes de iniciar.");
  });
});

idNumberInput.addEventListener("blur", () => {
  validateIdNumberField().catch(() => {
    setIdNumberFeedback("No se pudo validar la cedula en este momento.", "error");
  });
});

idNumberInput.addEventListener("input", () => {
  state.idNumberExists = false;
  startAssessmentButton.disabled = false;
  setIdNumberFeedback("");
});

introBackButton.addEventListener("click", () => {
  if (state.introSlideIndex > 0) {
    state.introSlideIndex -= 1;
    renderIntroSlide();
  }
});

introNextButton.addEventListener("click", () => {
  if (state.introSlideIndex < introSlides.length - 1) {
    state.introSlideIndex += 1;
    renderIntroSlide();
  }
});

backButton.addEventListener("click", () => {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex -= 1;
    renderQuestion();
  }
});

nextButton.addEventListener("click", async () => {
  const currentValue = state.answers[state.currentQuestionIndex];
  if (!currentValue) {
    showAlert("Selecciona una respuesta antes de continuar.");
    return;
  }

  if (state.currentQuestionIndex < state.config.questions.length - 1) {
    state.currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  try {
    nextButton.disabled = true;
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...state.participant,
        answers: state.answers,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo guardar la aplicacion.");
    renderResult(result);
  } catch (error) {
    showAlert(error.message);
  } finally {
    nextButton.disabled = false;
  }
});

newAssessmentButton.addEventListener("click", () => {
  participantForm.reset();
  setIdNumberFeedback("");
  startAssessmentButton.disabled = false;
  state.idNumberExists = false;
  state.participant = { googleId: "", picture: "" };
  state.answers = Array(state.config.questions.length).fill(null);
  state.currentQuestionIndex = 0;
  state.introSlideIndex = 0;
  renderIntroSlide();
  switchScreen(welcomeScreen);
});

async function initialize() {
  await loadInstrument();
  await loadConfig();
  renderIntroSlide();
  switchScreen(welcomeScreen);
}

initialize().catch(() => {
  showAlert("No se pudo cargar la aplicacion.");
});
