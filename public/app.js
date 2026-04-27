const RESPONSE_UI = {
  1: { emoji: "01", title: "Nivel 1" },
  2: { emoji: "02", title: "Nivel 2" },
  3: { emoji: "03", title: "Nivel 3" },
  4: { emoji: "04", title: "Nivel 4" },
  5: { emoji: "05", title: "Nivel 5" },
};

const MOTIVATION_BY_MODULE = {
  ema: "Responde desde tu experiencia real, sin intentar adivinar el perfil final.",
  intrapersonal: "Observa como te sientes, te nombras y te diriges internamente.",
  interpersonal: "Piensa en como te vinculas, escuchas y sostienes a otras personas.",
  adaptabilidad: "Aqui importa como resuelves, ajustas y verificas la realidad que enfrentas.",
  manejo_estres: "Respira un instante y responde pensando en momentos reales de tension.",
  estado_animo: "Mira este tramo como una lectura de energia, esperanza y disfrute cotidiano.",
};

const state = {
  config: null,
  instruments: [],
  introSlideIndex: 0,
  participant: { googleId: "", picture: "" },
  selectedInstrumentCode: "",
  currentApplication: null,
  activeQuestionIds: [],
  activeQuestionIndex: 0,
  activeModuleKey: "",
  draftAnswers: {},
};

const alertBox = document.getElementById("alert");
const introSlides = Array.from(document.querySelectorAll("[data-intro-slide]"));
const introDots = Array.from(document.querySelectorAll(".intro-dot"));
const introBackButton = document.getElementById("introBackButton");
const introNextButton = document.getElementById("introNextButton");
const instrumentDescription = document.getElementById("instrumentDescription");
const welcomeScreen = document.getElementById("welcomeScreen");
const instrumentScreen = document.getElementById("instrumentScreen");
const moduleScreen = document.getElementById("moduleScreen");
const questionScreen = document.getElementById("questionScreen");
const resultScreen = document.getElementById("resultScreen");
const publicFooter = document.getElementById("publicFooter");
const participantForm = document.getElementById("participantForm");
const idNumberInput = document.getElementById("idNumber");
const idNumberFeedback = document.getElementById("idNumberFeedback");
const continueToInstrumentButton = document.getElementById("continueToInstrumentButton");
const instrumentList = document.getElementById("instrumentList");
const moduleEyebrow = document.getElementById("moduleEyebrow");
const moduleHeading = document.getElementById("moduleHeading");
const moduleDescription = document.getElementById("moduleDescription");
const moduleSummaryCard = document.getElementById("moduleSummaryCard");
const moduleList = document.getElementById("moduleList");
const moduleActionButton = document.getElementById("moduleActionButton");
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
const baronDetailSection = document.getElementById("baronDetailSection");
const baronDetailGrid = document.getElementById("baronDetailGrid");
const validitySection = document.getElementById("validitySection");
const validityGrid = document.getElementById("validityGrid");
const methodologySection = document.getElementById("methodologySection");
const methodologyGrid = document.getElementById("methodologyGrid");
const strengthList = document.getElementById("strengthList");
const attentionList = document.getElementById("attentionList");
const suggestionList = document.getElementById("suggestionList");
const newAssessmentButton = document.getElementById("newAssessmentButton");

const CATEGORY_LABELS = {
  very_low: "Muy bajo",
  low: "Bajo",
  average: "Promedio",
  high: "Alto",
  very_high: "Muy alto",
  pending: "Pendiente",
};

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
  [welcomeScreen, instrumentScreen, moduleScreen, questionScreen, resultScreen].forEach((section) =>
    section.classList.add("hidden")
  );
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

async function loadConfig() {
  const response = await fetch("/api/config");
  state.config = await response.json();
}

async function loadInstruments() {
  const response = await fetch("/api/instruments");
  const payload = await response.json();
  state.instruments = payload.instruments || [];
  instrumentDescription.textContent =
    "Una lectura privada para reconocer como respondes, decides y sostienes presion en situaciones reales.";
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

function validateParticipantLocally(participant) {
  if (!participant.idNumber || !participant.fullName || !participant.career || !participant.age || !participant.gender) {
    return "Completa cedula, nombre, carrera, edad y genero antes de continuar.";
  }
  if (!/^\d{8,15}$/.test(participant.idNumber)) {
    return "Ingresa una cedula valida de 8 a 15 digitos.";
  }
  return "";
}

function renderInstrumentCards() {
  instrumentList.innerHTML = "";
  state.instruments.forEach((instrument) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `instrument-card${state.selectedInstrumentCode === instrument.code ? " selected" : ""}`;
    card.innerHTML = `
      <span class="question-category">${instrument.version}</span>
      <h3>${instrument.name}</h3>
      <p>${instrument.description}</p>
      <small>${instrument.moduleCount} modulo(s) / ${instrument.itemCount} reactivos</small>
    `;
    card.addEventListener("click", () => {
      state.selectedInstrumentCode = instrument.code;
      renderInstrumentCards();
    });
    instrumentList.appendChild(card);
  });
}

function getCurrentInstrument() {
  return state.currentApplication?.instrument || null;
}

function getCurrentAnswerMap() {
  const map = {};
  for (const answer of state.currentApplication?.answers || []) {
    map[answer.itemId] = answer.value;
  }
  return { ...map, ...state.draftAnswers };
}

async function startSelectedInstrument() {
  if (!state.selectedInstrumentCode) {
    showAlert("Selecciona un instrumento antes de continuar.");
    return;
  }

  const participant = collectParticipantData();
  const validationError = validateParticipantLocally(participant);
  if (validationError) {
    showAlert(validationError);
    return;
  }

  const response = await fetch("/api/applications/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participant,
      instrumentCode: state.selectedInstrumentCode,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo iniciar el instrumento.");

  state.currentApplication = payload;
  state.draftAnswers = {};

  if (payload.status === "completed" || payload.status === "invalid") {
    renderResult(payload);
    return;
  }

  renderModuleScreen();
}

function getModuleProgressMap() {
  const instrument = getCurrentInstrument();
  const answerMap = getCurrentAnswerMap();
  const scoringModules = new Map((state.currentApplication?.scoring?.modules || []).map((module) => [module.key, module]));

  return (instrument?.modules || []).map((module) => {
    const answeredCount = module.itemIds.filter((itemId) => answerMap[itemId] != null).length;
    const expectedCount = module.itemIds.length;
    return {
      ...(scoringModules.get(module.key) || {}),
      key: module.key,
      label: module.label,
      intro: module.intro,
      answeredCount,
      expectedCount,
      completionRatio: expectedCount ? Math.round((answeredCount / expectedCount) * 100) : 0,
      isComplete: answeredCount === expectedCount,
    };
  });
}

function renderModuleSummary() {
  const application = state.currentApplication;
  const instrument = getCurrentInstrument();
  const moduleProgress = getModuleProgressMap();
  const completedCount = moduleProgress.filter((module) => module.isComplete).length;

  moduleEyebrow.textContent = instrument.code === "ema" ? "EMA" : "BarOn ICE";
  moduleHeading.textContent = instrument.code === "ema" ? "Instrucciones EMA" : "Progreso por modulos";
  moduleDescription.textContent =
    instrument.code === "ema"
      ? "EMA conserva el flujo de una pregunta por pantalla. La lectura tecnica queda para admin y la vista publica prioriza una devolucion orientativa."
      : "BarOn se divide en 5 niveles para reducir fatiga, guardar avance y entregar resultados parciales por componente.";

  moduleSummaryCard.innerHTML = `
    <article class="report-score-card">
      <p class="report-label">Instrumento</p>
      <strong>${instrument.name}</strong>
      <p class="report-summary">${instrument.description}</p>
    </article>
    <article class="report-highlight-card">
      <p class="report-label">Avance actual</p>
      <strong>${application.percentageComplete || 0}%</strong>
      <p class="report-summary">${completedCount} de ${instrument.modules.length} modulo(s) listos.</p>
    </article>
  `;
}

function renderModuleCards() {
  const instrument = getCurrentInstrument();
  const moduleProgress = new Map(getModuleProgressMap().map((module) => [module.key, module]));
  if (!state.activeModuleKey) {
    const nextIncomplete = instrument.modules.find((module) => {
      const progress = moduleProgress.get(module.key);
      return !progress?.isComplete;
    });
    state.activeModuleKey = nextIncomplete?.key || instrument.modules[0]?.key || "";
  }
  moduleList.innerHTML = "";

  instrument.modules.forEach((module) => {
    const progress = moduleProgress.get(module.key) || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = `module-card${state.activeModuleKey === module.key ? " selected" : ""}`;
    card.innerHTML = `
      <span class="question-category">Modulo ${module.order}</span>
      <h3>${module.label}</h3>
      <p>${module.intro || module.summary}</p>
      <small>${progress.completionRatio || 0}% completado</small>
    `;
    card.addEventListener("click", () => {
      state.activeModuleKey = module.key;
      renderModuleCards();
    });
    moduleList.appendChild(card);
  });

  moduleActionButton.textContent =
    state.currentApplication.status === "completed" || state.currentApplication.status === "invalid"
      ? "Ver resultado"
      : instrument.code === "ema"
        ? "Comenzar EMA"
        : "Entrar al modulo seleccionado";
}

function renderModuleScreen() {
  renderModuleSummary();
  renderModuleCards();
  switchScreen(moduleScreen);
}

function getQuestionById(itemId) {
  return getCurrentInstrument().items.find((item) => item.id === itemId);
}

function enterModule(moduleKey) {
  const instrument = getCurrentInstrument();
  const module = instrument.modules.find((candidate) => candidate.key === moduleKey);
  if (!module) return;
  const answerMap = getCurrentAnswerMap();
  const pendingItemIds = module.itemIds.filter((itemId) => answerMap[itemId] == null);
  state.activeModuleKey = moduleKey;
  state.activeQuestionIds = pendingItemIds.length ? pendingItemIds : module.itemIds;
  state.activeQuestionIndex = 0;
  renderQuestion();
  switchScreen(questionScreen);
}

function renderQuestion() {
  const instrument = getCurrentInstrument();
  const itemId = state.activeQuestionIds[state.activeQuestionIndex];
  const question = getQuestionById(itemId);
  const currentValue = getCurrentAnswerMap()[itemId];
  const percent = Math.round(((state.activeQuestionIndex + 1) / state.activeQuestionIds.length) * 100);
  const module = instrument.modules.find((candidate) => candidate.key === state.activeModuleKey) || {};

  questionHeading.textContent = `${module.label || "Pregunta"} · item ${state.activeQuestionIndex + 1}`;
  questionText.textContent = question.text;
  questionHint.textContent =
    instrument.code === "ema"
      ? "Marca el nivel de acuerdo que mejor describa tu experiencia habitual, sin pensar en categorias ni resultados."
      : "Responde este reactivo pensando en situaciones reales y recientes, no en lo que seria ideal responder.";
  questionMicrocopy.textContent = question.reverse
    ? "Este reactivo se lee tal como esta escrito. Responde segun tu experiencia habitual."
    : "No hay respuestas correctas o incorrectas. Tu respuesta solo describe una tendencia actual.";
  questionMotivation.textContent =
    MOTIVATION_BY_MODULE[state.activeModuleKey] || MOTIVATION_BY_MODULE[instrument.code] || MOTIVATION_BY_MODULE.ema;
  progressLabel.textContent = `${module.label || "Modulo"} · item ${state.activeQuestionIndex + 1} de ${state.activeQuestionIds.length}`;
  progressMessage.textContent =
    instrument.code === "baron"
      ? "El avance se guarda automaticamente y podras continuar despues."
      : "Una pregunta por hoja, sin prisa y sin juicio.";
  progressFill.style.width = `${percent}%`;
  backButton.disabled = state.activeQuestionIndex === 0;
  nextButton.textContent = state.activeQuestionIndex === state.activeQuestionIds.length - 1 ? "Cerrar modulo" : "Siguiente";

  ratingGroup.innerHTML = "";
  instrument.responseScale.forEach((option) => {
    const ui = RESPONSE_UI[option.value];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rating-button${currentValue === option.value ? " selected" : ""}`;
    button.innerHTML = `
      <span class="rating-emoji" aria-hidden="true">${ui.emoji}</span>
      <span class="rating-value">${option.value}</span>
      <span class="rating-title">${option.shortLabel || option.label}</span>
    `;
    button.addEventListener("click", () => {
      state.draftAnswers[itemId] = option.value;
      renderQuestion();
    });
    ratingGroup.appendChild(button);
  });
}

async function persistCurrentAnswer() {
  const itemId = state.activeQuestionIds[state.activeQuestionIndex];
  const value = getCurrentAnswerMap()[itemId];
  if (!value) {
    throw new Error("Selecciona una respuesta antes de continuar.");
  }

  const response = await fetch(`/api/applications/${encodeURIComponent(state.currentApplication.id)}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: [{ itemId, value }],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo guardar el avance.");

  state.currentApplication = payload;
  delete state.draftAnswers[itemId];
  return payload;
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

function renderParticipantSummary(participant, date) {
  participantSummary.innerHTML = "";
  const fields = [
    ["Cedula", participant.idNumber],
    ["Nombre", participant.fullName],
    ["Carrera", participant.career],
    ["Edad", participant.age],
    ["Genero", participant.gender],
    ["Fecha", normalizeSummaryDate(date)],
  ];

  fields.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<span>${label}</span><strong>${value || "-"}</strong>`;
    participantSummary.appendChild(card);
  });
}

function formatCategory(category) {
  return CATEGORY_LABELS[category] || "Sin clasificar";
}

function formatCeScore(score) {
  return score == null ? "Pendiente" : score;
}

function formatRawScore(result) {
  if (result?.rawScore == null || result?.maxScore == null) return "Puntaje bruto pendiente.";
  return `Puntaje bruto: ${result.rawScore} de ${result.maxScore}.`;
}

function renderDimensionCardsFromBaron(scoring) {
  dimensionGrid.innerHTML = "";
  (scoring.components || []).forEach((component) => {
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${component.label}</p>
      <h3>CE ${formatCeScore(component.ceScore)}</h3>
      <p>${component.description}</p>
      <p>Categoria: ${formatCategory(component.category)}. ${formatRawScore(component)}</p>
    `;
    dimensionGrid.appendChild(card);
  });
}

function renderBaronFullDiagnostics(scoring) {
  baronDetailSection.classList.remove("hidden");
  baronDetailGrid.innerHTML = "";

  const totalCard = document.createElement("article");
  totalCard.className = "dimension-card";
  totalCard.innerHTML = `
    <p class="question-category">Resultado global</p>
    <h3>CE ${formatCeScore(scoring.total?.ceScore)}</h3>
    <p>${scoring.summary || "Lectura global disponible al completar todos los reactivos."}</p>
    <p>Categoria: ${formatCategory(scoring.total?.category)}. ${formatRawScore(scoring.total)}</p>
  `;
  baronDetailGrid.appendChild(totalCard);

  (scoring.subcomponents || []).forEach((subcomponent) => {
    const component = (scoring.components || []).find((item) => item.key === subcomponent.componentKey);
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${component?.label || "Subcomponente"}</p>
      <h3>${subcomponent.label}</h3>
      <p>${subcomponent.description}</p>
      <p>CE ${formatCeScore(subcomponent.ceScore)}. Categoria: ${formatCategory(subcomponent.category)}. ${formatRawScore(subcomponent)}</p>
    `;
    baronDetailGrid.appendChild(card);
  });
}

function renderValidity(scoring) {
  validitySection.classList.toggle("hidden", !scoring.validity);
  if (!scoring.validity) {
    validityGrid.innerHTML = "";
    return;
  }

  validityGrid.innerHTML = "";
  const cards = [
    {
      label: "Impresion positiva",
      value: scoring.validity.impressionPositive?.ceScore ?? "Pendiente",
      note: "Escala de validez orientada a deseabilidad social.",
    },
    {
      label: "Impresion negativa",
      value: scoring.validity.impressionNegative?.ceScore ?? "Pendiente",
      note: "Escala de validez orientada a autodescripcion extremadamente negativa.",
    },
    {
      label: "Omisiones",
      value: scoring.validity.omissionCount ?? 0,
      note: "Se recomienda revision cuando hay 8 o mas omisiones.",
    },
    {
      label: "Inconsistencia",
      value: scoring.validity.inconsistency?.score ?? "Pendiente",
      note: "Indice basado en 10 pares de reactivos similares. Mayor a 12 requiere revision.",
    },
  ];

  cards.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${entry.label}</p>
      <h3>${entry.value}</h3>
      <p>${entry.note}</p>
    `;
    validityGrid.appendChild(card);
  });

  if (scoring.validity.warnings?.length) {
    const warningCard = document.createElement("article");
    warningCard.className = "dimension-card";
    warningCard.innerHTML = `
      <p class="question-category">Revision recomendada</p>
      <h3>${scoring.validity.valid ? "Sin bloqueo" : "Revisar protocolo"}</h3>
      <ul class="clean-list"></ul>
    `;
    const list = warningCard.querySelector("ul");
    scoring.validity.warnings.forEach((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      list.appendChild(item);
    });
    validityGrid.appendChild(warningCard);
  }
}

function renderMethodology(scoring) {
  methodologySection.classList.remove("hidden");
  methodologyGrid.innerHTML = "";

  const notes = [
    {
      label: "Conversion CE",
      title: "Media 100, DE 15",
      detail: "CE = ((puntaje bruto - media normativa) / desviacion estandar normativa) * 15 + 100.",
    },
    {
      label: "Baremos",
      title: "Muestra peruana",
      detail: "El algoritmo usa medias y desviaciones del manual adulto BarOn ICE adaptado y estandarizado en Lima Metropolitana.",
    },
    {
      label: "Validez",
      title: scoring.validity?.valid ? "Interpretable" : "No interpretable",
      detail:
        "Antes de leer el perfil se revisan item 133, omisiones, impresion positiva, impresion negativa e inconsistencia.",
    },
    {
      label: "Alcance",
      title: "Orientativo",
      detail:
        "El informe no reemplaza entrevista, historia clinica ni juicio profesional; describe un perfil psicometrico actual.",
    },
  ];

  notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <p class="question-category">${note.label}</p>
      <h3>${note.title}</h3>
      <p>${note.detail}</p>
    `;
    methodologyGrid.appendChild(card);
  });
}

function renderResult(application) {
  const scoring = application.scoring;
  const isBaron = application.instrumentCode === "baron";
  const isBaronInvalid = isBaron && scoring.validity && !scoring.validity.valid;

  resultHeading.textContent = isBaron
    ? isBaronInvalid
      ? "Protocolo BarOn ICE requiere revision"
      : "Perfil interpretativo BarOn ICE"
    : "Tu lectura orientativa";
  resultSubheading.textContent =
    isBaron
      ? isBaronInvalid
        ? "La aplicacion esta completa, pero los criterios de validez impiden leerla como perfil psicometrico confiable."
        : "Resultado integral del instrumento, con lectura academica orientativa y no clinica."
      : "Este resultado resume patrones de comunicacion observados en tus respuestas. No representa una etiqueta fija ni un diagnostico.";

  globalProfile.textContent = isBaronInvalid
    ? "Protocolo no interpretable sin revision"
    : scoring.profile || application.finalResult?.profileGlobal || "Lectura disponible";
  globalSummary.textContent = isBaronInvalid
    ? "Las respuestas activaron uno o mas controles de validez. Los puntajes pueden revisarse como datos, pero no deben presentarse como diagnostico del evaluado."
    : scoring.summary || application.finalResult?.interpretationJson?.summary || "";

  if (isBaron) {
    overallAverage.textContent = scoring.total?.ceScore ? `CE total: ${scoring.total.ceScore}` : "Resultado parcial";
    overallPercentage.textContent = scoring.validity?.valid
      ? "La aplicacion cumple los criterios de validez implementados en esta version."
      : "La lectura queda bloqueada como perfil interpretable y requiere revision profesional.";
    renderDimensionCardsFromBaron(scoring);
    renderBaronFullDiagnostics(scoring);
    renderValidity(scoring);
    renderMethodology(scoring);
  } else {
    baronDetailSection.classList.add("hidden");
    baronDetailGrid.innerHTML = "";
    methodologySection.classList.add("hidden");
    methodologyGrid.innerHTML = "";
    overallAverage.textContent =
      scoring.strongestDimension?.label === scoring.weakestDimension?.label
        ? "Perfil relativamente equilibrado"
        : `Predomina: ${scoring.strongestDimension?.label || "Patron mixto"}`;
    overallPercentage.textContent =
      scoring.weakestDimension
        ? `Conviene observar con mas calma: ${scoring.weakestDimension.label}.`
        : "Conviene revisar tus respuestas con una mirada reflexiva y sin juicio.";
    dimensionGrid.innerHTML = "";
    (scoring.dimensions || []).forEach((dimension) => {
      const card = document.createElement("article");
      card.className = "dimension-card";
      card.innerHTML = `
        <p class="question-category">${dimension.label}</p>
        <h3>${dimension.interpretiveLevel || dimension.band}</h3>
        <p>${dimension.interpretiveNote || ""}</p>
      `;
      dimensionGrid.appendChild(card);
    });
    renderValidity({ validity: null });
  }

  renderParticipantSummary(application.participant, application.completedAt || application.startedAt);
  renderList(
    strengthList,
    isBaronInvalid
      ? ["No se emite perfil de fortalezas porque el protocolo no cumple criterios de validez."]
      : scoring.observations?.strengths || []
  );
  renderList(attentionList, isBaronInvalid ? scoring.validity?.warnings || [] : scoring.observations?.attentionAreas || []);
  renderList(
    suggestionList,
    isBaronInvalid
      ? ["Revisar condiciones de aplicacion, estilo de respuesta y contexto del evaluado antes de interpretar puntajes."]
      : scoring.observations?.suggestions || []
  );
  switchScreen(resultScreen);
}

participantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const participant = collectParticipantData();
  const validationError = validateParticipantLocally(participant);
  if (validationError) {
    showAlert(validationError);
    return;
  }
  state.participant = participant;
  renderInstrumentCards();
  switchScreen(instrumentScreen);
});

continueToInstrumentButton.addEventListener("click", () => {
  startSelectedInstrument().catch((error) => showAlert(error.message));
});

idNumberInput.addEventListener("blur", () => {
  const participant = collectParticipantData();
  const validationError = validateParticipantLocally({ ...participant, fullName: "tmp", career: "tmp", age: "1", gender: "tmp" });
  setIdNumberFeedback(validationError ? "Ingresa una cedula valida de 8 a 15 digitos." : "", validationError ? "error" : "");
});

idNumberInput.addEventListener("input", () => {
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

moduleActionButton.addEventListener("click", () => {
  if (state.currentApplication.status === "completed" || state.currentApplication.status === "invalid") {
    renderResult(state.currentApplication);
    return;
  }
  enterModule(state.activeModuleKey);
});

backButton.addEventListener("click", () => {
  if (state.activeQuestionIndex > 0) {
    state.activeQuestionIndex -= 1;
    renderQuestion();
    return;
  }
  renderModuleScreen();
});

nextButton.addEventListener("click", async () => {
  try {
    nextButton.disabled = true;
    const saved = await persistCurrentAnswer();
    const moduleProgress = (saved.scoring?.modules || []).find((module) => module.key === state.activeModuleKey);

    if (state.activeQuestionIndex < state.activeQuestionIds.length - 1) {
      state.activeQuestionIndex += 1;
      renderQuestion();
      return;
    }

    if (saved.instrumentCode === "ema" || saved.status === "completed" || saved.status === "invalid") {
      renderResult(saved);
      return;
    }

    const nextIncomplete = (saved.scoring?.modules || []).find((module) => !module.isComplete);
    state.activeModuleKey = nextIncomplete?.key || state.activeModuleKey;
    showAlert(
      moduleProgress?.isComplete
        ? `Modulo ${moduleProgress.label} guardado. Puedes continuar cuando quieras.`
        : "Avance guardado correctamente.",
      false
    );
    renderModuleScreen();
  } catch (error) {
    showAlert(error.message);
  } finally {
    nextButton.disabled = false;
  }
});

newAssessmentButton.addEventListener("click", () => {
  participantForm.reset();
  setIdNumberFeedback("");
  state.participant = { googleId: "", picture: "" };
  state.selectedInstrumentCode = "";
  state.currentApplication = null;
  state.activeQuestionIds = [];
  state.activeQuestionIndex = 0;
  state.activeModuleKey = "";
  state.draftAnswers = {};
  state.introSlideIndex = 0;
  renderIntroSlide();
  switchScreen(welcomeScreen);
});

async function initialize() {
  await loadConfig();
  await loadInstruments();
  renderIntroSlide();
  switchScreen(welcomeScreen);
}

initialize().catch((error) => showAlert(error.message || "No se pudo iniciar la aplicacion."));
