const RESPONSE_UI = {
  1: { icon: "chevrons-down" },
  2: { icon: "chevron-down" },
  3: { icon: "minus" },
  4: { icon: "chevron-up" },
  5: { icon: "chevrons-up" },
};

const INSTRUMENT_UI = {
  ema: {
    title: "Asertividad",
    eyebrow: "Escala EMA",
    icon: "messages-square",
    intro: "Explora como expresas ideas, necesidades y limites en situaciones cotidianas.",
  },
  baron: {
    title: "Inteligencia emocional",
    eyebrow: "Bar-On ICE",
    icon: "heart-pulse",
    intro: "Observa tus recursos emocionales, tu adaptabilidad y la forma en que manejas la presion.",
  },
  disc: {
    title: "Estilo conductual",
    eyebrow: "Perfil DISC",
    icon: "compass",
    intro: "Identifica tendencias de comportamiento mediante elecciones simples entre palabras.",
  },
};

const DIMENSION_ICONS = {
  D: "zap",
  I: "message-circle",
  S: "hand-heart",
  C: "scan-line",
  intrapersonal: "user-round",
  interpersonal: "users-round",
  adaptabilidad: "shuffle",
  manejo_estres: "wind",
  estado_animo: "sun",
  asertividad_directa: "message-square-more",
  no_asertividad: "message-square-off",
  asertividad_indirecta: "messages-square",
};

const state = {
  config: null,
  instruments: [],
  assignments: [],
  currentUser: null,
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
const instrumentHeroIcon = document.getElementById("instrumentHeroIcon");
const moduleSummaryCard = document.getElementById("moduleSummaryCard");
const moduleList = document.getElementById("moduleList");
const moduleActionButton = document.getElementById("moduleActionButton");
const questionHeading = document.getElementById("questionHeading");
const questionHint = document.getElementById("questionHint");
const questionText = document.getElementById("questionText");
const questionMicrocopy = document.getElementById("questionMicrocopy");
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
const assessmentContextBar = document.getElementById("assessmentContextBar");
const contextInstrument = document.getElementById("contextInstrument");
const contextParticipant = document.getElementById("contextParticipant");
const contextProgress = document.getElementById("contextProgress");

const CATEGORY_LABELS = {
  very_low: "Muy bajo",
  low: "Bajo",
  average: "Promedio",
  high: "Alto",
  very_high: "Muy alto",
  pending: "Pendiente",
};

function getInstrumentPresentation(code) {
  return INSTRUMENT_UI[code] || {
    title: "Evaluacion psicologica",
    eyebrow: "Instrumento",
    icon: "clipboard-heart",
    intro: "Responde con calma y elige la opcion que mejor represente tu experiencia.",
  };
}

function renderIcons(root = document) {
  window.renderParticipantIcons?.(root);
}

function setButtonContent(button, label, icon = "arrow-right", iconFirst = false) {
  button.innerHTML = iconFirst
    ? `<i data-lucide="${icon}"></i><span>${label}</span>`
    : `<span>${label}</span><i data-lucide="${icon}"></i>`;
  renderIcons(button);
}

function getEstimatedMinutes(itemCount) {
  return Math.max(5, Math.ceil(Number(itemCount || 0) * 0.18));
}

function getDimensionIcon(key, index = 0) {
  const fallback = ["circle-user-round", "heart-handshake", "route", "shield", "sun"][index % 5];
  return DIMENSION_ICONS[key] || fallback;
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
  [welcomeScreen, instrumentScreen, moduleScreen, questionScreen, resultScreen].forEach((section) =>
    section.classList.add("hidden")
  );
  target.classList.remove("hidden");
  publicFooter.classList.toggle("hidden", target !== welcomeScreen);
  renderIcons(target);
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
  const instruments = payload.instruments || [];
  const assignedCodes = new Set(state.assignments.map((item) => item.instrumentCode));
  state.instruments = state.currentUser
    ? instruments.filter((instrument) => assignedCodes.has(instrument.code))
    : instruments;
  instrumentDescription.textContent =
    "Una lectura privada para reconocer como respondes, decides y sostienes presion en situaciones reales.";
}

function updateAssessmentContext() {
  const application = state.currentApplication;
  assessmentContextBar?.classList.toggle("hidden", !application);
  if (!application) return;
  const participant = application.participant || state.currentUser?.person || {};
  const presentation = getInstrumentPresentation(application.instrumentCode);
  contextInstrument.textContent = presentation.title;
  contextParticipant.textContent = [participant.rankCode, participant.fullName].filter(Boolean).join(". ") || "Participante autenticado";
  contextProgress.textContent = `${application.percentageComplete || 0}%`;
}

async function loadSession() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    window.location.href = "/login.html";
    return false;
  }
  const payload = await response.json();
  if (payload.user?.mustChangePassword) {
    window.location.href = "/login.html?change=1";
    return false;
  }
  state.currentUser = payload.user;
  state.assignments = payload.assignments || [];
  state.participant = {
    ...(payload.user?.person || {}),
    googleId: "",
    picture: "",
  };
  return true;
}

function collectParticipantData() {
  if (state.currentUser?.person) return state.participant;
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
  if (!state.instruments.length) {
    instrumentList.innerHTML = `<article class="instrument-card"><h3>No tienes evaluaciones asignadas actualmente.</h3><p>Si crees que esto es un error, contacta al administrador.</p></article>`;
    if (continueToInstrumentButton) continueToInstrumentButton.disabled = true;
    return;
  }
  if (continueToInstrumentButton) continueToInstrumentButton.disabled = false;
  state.instruments.forEach((instrument) => {
    const presentation = getInstrumentPresentation(instrument.code);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `instrument-card${state.selectedInstrumentCode === instrument.code ? " selected" : ""}`;
    card.innerHTML = `
      <span class="assignment-icon" aria-hidden="true"><i data-lucide="${presentation.icon}"></i></span>
      <span class="question-category">${presentation.eyebrow}</span>
      <h3>${presentation.title}</h3>
      <p>${presentation.intro}</p>
      <small>${instrument.itemCount} preguntas · ${getEstimatedMinutes(instrument.itemCount)} min aprox.</small>
    `;
    card.addEventListener("click", () => {
      state.selectedInstrumentCode = instrument.code;
      renderInstrumentCards();
    });
    instrumentList.appendChild(card);
  });
  renderIcons(instrumentList);
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

function decodeDiscAnswer(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return { most: null, least: null };
  return { most: Math.floor(numeric / 10), least: numeric % 10 };
}

async function startSelectedInstrument() {
  if (!state.selectedInstrumentCode) {
    showAlert("Selecciona un instrumento antes de continuar.");
    return;
  }

  const participant = collectParticipantData();
  if (!state.currentUser?.person) {
    const validationError = validateParticipantLocally(participant);
    if (validationError) {
      showAlert(validationError);
      return;
    }
  } else if (!state.assignments.some((assignment) => assignment.instrumentCode === state.selectedInstrumentCode)) {
    showAlert("Esta evaluacion no esta asignada a tu cuenta.");
    setTimeout(() => {
      window.location.href = "/portal.html";
    }, 1200);
    return;
  }

  const response = await fetch("/api/applications/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instrumentCode: state.selectedInstrumentCode,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo iniciar el instrumento.");

  state.currentApplication = payload;
  state.draftAnswers = {};
  updateAssessmentContext();

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
  const presentation = getInstrumentPresentation(instrument.code);
  const percentage = Number(application.percentageComplete || 0);

  moduleEyebrow.textContent = presentation.eyebrow;
  moduleHeading.textContent = presentation.title;
  moduleDescription.textContent = presentation.intro;
  instrumentHeroIcon?.setAttribute("data-lucide", presentation.icon);

  moduleSummaryCard.innerHTML = `
    <div class="assessment-fact">
      <i data-lucide="list-checks"></i>
      <div><span>Recorrido</span><strong>${instrument.items.length} preguntas</strong></div>
    </div>
    <div class="assessment-fact">
      <i data-lucide="clock-3"></i>
      <div><span>Tiempo estimado</span><strong>${getEstimatedMinutes(instrument.items.length)} minutos</strong></div>
    </div>
    <div class="assessment-fact">
      <i data-lucide="${percentage ? "history" : "play"}"></i>
      <div><span>Estado</span><strong>${percentage ? `${percentage}% completado` : "Listo para comenzar"}</strong></div>
    </div>
  `;
  renderIcons(moduleScreen);
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
  moduleList.classList.toggle("hidden", instrument.modules.length <= 1);

  instrument.modules.forEach((module) => {
    const progress = moduleProgress.get(module.key) || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = `module-card${state.activeModuleKey === module.key ? " selected" : ""}`;
    card.innerHTML = `
      <span class="module-state-icon"><i data-lucide="${progress.isComplete ? "circle-check-big" : "circle"}"></i></span>
      <div>
        <h3>${module.label}</h3>
        <p>${progress.answeredCount || 0} de ${progress.expectedCount || module.itemIds.length} respuestas</p>
      </div>
      <small>${progress.completionRatio || 0}% completado</small>
    `;
    card.addEventListener("click", () => {
      state.activeModuleKey = module.key;
      renderModuleCards();
    });
    moduleList.appendChild(card);
  });

  const percentage = Number(state.currentApplication.percentageComplete || 0);
  const actionLabel =
    state.currentApplication.status === "completed" || state.currentApplication.status === "invalid"
      ? "Ver resultado"
      : percentage
        ? "Continuar evaluacion"
        : "Comenzar evaluacion";
  setButtonContent(moduleActionButton, actionLabel);
  renderIcons(moduleList);
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
  const answerMap = getCurrentAnswerMap();
  const currentValue = answerMap[itemId];
  const module = instrument.modules.find((candidate) => candidate.key === state.activeModuleKey) || {};
  const questionNumber = Math.max(1, (module.itemIds || []).indexOf(itemId) + 1);
  const answeredCount = (module.itemIds || []).filter((moduleItemId) => answerMap[moduleItemId] != null).length;
  const percent = module.itemIds?.length ? Math.round((answeredCount / module.itemIds.length) * 100) : 0;

  questionHeading.textContent = `Pregunta ${questionNumber} de ${module.itemIds?.length || state.activeQuestionIds.length}`;
  questionText.textContent = question.text;
  questionHint.textContent =
    instrument.code === "disc"
      ? "Elige una palabra en MAS y otra distinta en MENOS."
      : "Elige la opcion que mejor describa tu experiencia habitual.";
  questionMicrocopy.textContent =
    instrument.code === "disc"
      ? "MAS representa lo que mas se parece a ti; MENOS, lo que menos se parece."
      : "No hay respuestas correctas o incorrectas. Responde con naturalidad.";
  progressLabel.textContent = `${percent}% completado`;
  progressMessage.textContent = "Se guarda al continuar";
  progressFill.style.width = `${percent}%`;
  backButton.disabled = state.activeQuestionIndex === 0;
  setButtonContent(
    nextButton,
    state.activeQuestionIndex === state.activeQuestionIds.length - 1 ? "Finalizar seccion" : "Siguiente"
  );

  ratingGroup.innerHTML = "";
  if (instrument.code === "disc") {
    const current = decodeDiscAnswer(currentValue);
    ratingGroup.classList.add("disc-choice-group");
    question.choices.forEach((choice, index) => {
      const value = index + 1;
      const row = document.createElement("div");
      row.className = "disc-choice-row";
      row.innerHTML = `
        <strong>${choice.label}</strong>
        <button class="secondary-button${current.most === value ? " selected" : ""}" type="button"><i data-lucide="arrow-up"></i><span>MAS</span></button>
        <button class="secondary-button${current.least === value ? " selected" : ""}" type="button"><i data-lucide="arrow-down"></i><span>MENOS</span></button>
      `;
      const [mostButton, leastButton] = row.querySelectorAll("button");
      mostButton.addEventListener("click", () => {
        const nextLeast = current.least === value ? null : current.least;
        state.draftAnswers[itemId] = value && nextLeast ? value * 10 + nextLeast : null;
        if (!nextLeast) showAlert("Ahora elige una palabra distinta en MENOS.", false);
        renderQuestion();
      });
      leastButton.addEventListener("click", () => {
        const nextMost = current.most === value ? null : current.most;
        state.draftAnswers[itemId] = nextMost && value ? nextMost * 10 + value : null;
        if (!nextMost) showAlert("Ahora elige una palabra distinta en MAS.", false);
        renderQuestion();
      });
      ratingGroup.appendChild(row);
    });
    renderIcons(ratingGroup);
    return;
  }

  ratingGroup.classList.remove("disc-choice-group");
  instrument.responseScale.forEach((option) => {
    const ui = RESPONSE_UI[option.value];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rating-button${currentValue === option.value ? " selected" : ""}`;
    button.setAttribute("aria-pressed", currentValue === option.value ? "true" : "false");
    button.innerHTML = `
      <span class="rating-emoji" aria-hidden="true"><i data-lucide="${ui.icon}"></i></span>
      <span class="rating-title">${option.shortLabel || option.label}</span>
    `;
    button.addEventListener("click", () => {
      state.draftAnswers[itemId] = option.value;
      renderQuestion();
    });
    ratingGroup.appendChild(button);
  });
  renderIcons(ratingGroup);
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
  updateAssessmentContext();
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
    ["Cedula", participant.idNumber, "badge-user"],
    ["Nombre", participant.fullName, "user-round"],
    ["Grado", [participant.rankCode, participant.rankName].filter(Boolean).join(" - "), "badge-check"],
    ["Unidad", participant.unit || participant.unitName || participant.unitCode || participant.career, "building-2"],
    ["Promocion", participant.promotion, "calendar-days"],
    ["Genero", participant.gender, "users-round"],
    ["Fecha", normalizeSummaryDate(date), "calendar-check"],
  ];

  fields.forEach(([label, value, icon]) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<span><i data-lucide="${icon}"></i>${label}</span><strong>${value || "-"}</strong>`;
    participantSummary.appendChild(card);
  });
  renderIcons(participantSummary);
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
  (scoring.components || []).forEach((component, index) => {
    const card = document.createElement("article");
    card.className = "dimension-card";
    card.innerHTML = `
      <div class="dimension-card-head">
        <span class="dimension-icon"><i data-lucide="${getDimensionIcon(component.key, index)}"></i></span>
        <div><p class="question-category">Area evaluada</p><h3>${component.label}</h3></div>
      </div>
      <p>${component.description}</p>
      <span class="dimension-tag">${formatCategory(component.category)} · CE ${formatCeScore(component.ceScore)}</span>
    `;
    dimensionGrid.appendChild(card);
  });
  renderIcons(dimensionGrid);
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
  const warnings = scoring.validity?.warnings || [];
  const shouldShow = Boolean(scoring.validity && (!scoring.validity.valid || warnings.length));
  validitySection.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    validityGrid.innerHTML = "";
    return;
  }

  validityGrid.innerHTML = `
    <article class="dimension-card">
      <div class="dimension-card-head">
        <span class="dimension-icon"><i data-lucide="shield-alert"></i></span>
        <div><p class="question-category">Estado</p><h3>${scoring.validity.valid ? "Revisar observaciones" : "Revision profesional necesaria"}</h3></div>
      </div>
      <p>El resultado debe interpretarse considerando las observaciones de validez de esta aplicacion.</p>
      <ul class="clean-list"></ul>
    </article>
  `;
  const list = validityGrid.querySelector("ul");
  (warnings.length ? warnings : ["Revisar el protocolo antes de usar el perfil para tomar decisiones."]).forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning;
    list.appendChild(item);
  });
  renderIcons(validityGrid);
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
  const presentation = getInstrumentPresentation(application.instrumentCode);

  resultHeading.textContent = isBaronInvalid
    ? "Resultado completado con observaciones"
    : `Tu perfil de ${presentation.title.toLowerCase()} esta listo`;
  resultSubheading.textContent = isBaronInvalid
    ? "La evaluacion finalizo, pero necesita revision profesional antes de interpretar el perfil."
    : "Esta lectura resume tendencias actuales y sirve como orientacion; no representa una etiqueta fija ni un diagnostico.";

  globalProfile.textContent = isBaronInvalid
    ? "Requiere revision profesional"
    : scoring.profile || application.finalResult?.profileGlobal || "Lectura disponible";
  globalSummary.textContent = isBaronInvalid
    ? "Algunos patrones de respuesta requieren una mirada profesional antes de presentar conclusiones."
    : scoring.summary || application.finalResult?.interpretationJson?.summary || "";

  if (isBaron) {
    overallAverage.textContent = isBaronInvalid
      ? "Lectura condicionada"
      : `Nivel general: ${formatCategory(scoring.total?.category)}`;
    overallPercentage.textContent = scoring.validity?.valid
      ? "Las respuestas permiten una lectura orientativa del perfil emocional."
      : "Consulta las observaciones de validez antes de usar este resultado.";
    renderDimensionCardsFromBaron(scoring);
    renderBaronFullDiagnostics(scoring);
    renderValidity(scoring);
    methodologySection.classList.add("hidden");
    methodologyGrid.innerHTML = "";
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
    (scoring.dimensions || []).forEach((dimension, index) => {
      const card = document.createElement("article");
      card.className = "dimension-card";
      card.innerHTML = `
        <div class="dimension-card-head">
          <span class="dimension-icon"><i data-lucide="${getDimensionIcon(dimension.key, index)}"></i></span>
          <div><p class="question-category">Area evaluada</p><h3>${dimension.label}</h3></div>
        </div>
        <p>${dimension.interpretiveNote || ""}</p>
        <span class="dimension-tag">${dimension.interpretiveLevel || dimension.band || "Lectura disponible"}</span>
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
  updateAssessmentContext();
  renderIcons(resultScreen);
}

participantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.currentUser?.person) {
    renderInstrumentCards();
    switchScreen(instrumentScreen);
    return;
  }
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
  if (state.currentUser?.person) return;
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
  window.location.href = "/portal.html";
});

async function initializeAuthenticatedAssessment() {
  const person = state.currentUser?.person || {};
  const heading = document.querySelector("#welcomeScreen h1");
  const copy = document.querySelector("#welcomeScreen .intro-slide-form p");
  if (heading) heading.textContent = `Bienvenido, ${person.fullName || "participante"}`;
  if (copy) copy.textContent = "Selecciona uno de tus instrumentos asignados para continuar.";
  if (participantForm) participantForm.classList.add("hidden");
  renderInstrumentCards();
  switchScreen(instrumentScreen);
}

async function resetLocalAssessmentState() {
  setIdNumberFeedback("");
  state.selectedInstrumentCode = "";
  state.currentApplication = null;
  state.activeQuestionIds = [];
  state.activeQuestionIndex = 0;
  state.activeModuleKey = "";
  state.draftAnswers = {};
  state.introSlideIndex = 0;
  renderIntroSlide();
  updateAssessmentContext();
  switchScreen(welcomeScreen);
}

async function initialize() {
  await loadConfig();
  const hasSession = await loadSession();
  if (!hasSession) return;
  await loadInstruments();
  const requestedInstrument = new URLSearchParams(window.location.search).get("instrument");
  if (requestedInstrument) {
    if (!state.instruments.some((instrument) => instrument.code === requestedInstrument)) {
      showAlert("Esta evaluacion no esta asignada a tu cuenta.");
      setTimeout(() => {
        window.location.href = "/portal.html";
      }, 1200);
      return;
    }
    state.selectedInstrumentCode = requestedInstrument;
    renderIntroSlide();
    await startSelectedInstrument();
    return;
  }
  renderIntroSlide();
  await initializeAuthenticatedAssessment();
}

initialize().catch((error) => showAlert(error.message || "No se pudo iniciar la aplicacion."));
