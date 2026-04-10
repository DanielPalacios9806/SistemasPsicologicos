const GLOBAL_THRESHOLDS = [
  {
    min: 75,
    key: "favorable",
    label: "Perfil de asertividad favorable",
    summary:
      "El perfil global sugiere una expresion interpersonal generalmente clara, directa y funcional en la mayoria de las situaciones evaluadas.",
  },
  {
    min: 55,
    key: "estable",
    label: "Perfil funcional con areas de atencion",
    summary:
      "El perfil global muestra recursos de asertividad disponibles, junto con patrones que conviene revisar para fortalecer la comunicacion directa.",
  },
  {
    min: 35,
    key: "moderado",
    label: "Perfil con indicadores de vulnerabilidad interpersonal",
    summary:
      "El perfil global refleja varias situaciones en las que la autoexpresion podria verse limitada o desplazada hacia formas menos directas.",
  },
  {
    min: 0,
    key: "alto",
    label: "Perfil con necesidad alta de fortalecimiento asertivo",
    summary:
      "El perfil global muestra un predominio de respuestas asociado a dificultad para expresar necesidades, desacuerdos o afectos de manera directa.",
  },
];

const DIMENSION_NOTES = {
  asertividad_directa: {
    high: "Se observan recursos consistentes para expresar opiniones, afectos, dudas y necesidades de manera directa.",
    medium: "La expresion directa aparece en varias situaciones, aunque no de forma estable en todos los contextos.",
    low: "La expresion directa parece limitada en varias situaciones evaluadas.",
    strength: "Capacidad de expresion directa",
    attention: "Expresion directa y autoafirmacion",
    suggestion:
      "Practicar peticiones concretas, expresar preferencias cotidianas y formular desacuerdos con un lenguaje claro puede fortalecer esta area.",
  },
  no_asertividad: {
    high: "La inhibicion interpersonal parece baja y el temor a la critica no domina la mayoria de las respuestas.",
    medium: "Se observan algunas dudas o reservas al expresar necesidades, especialmente en situaciones sensibles.",
    low: "Se aprecian indicadores de inhibicion, evitacion o temor a la evaluacion en varias situaciones.",
    strength: "Baja inhibicion interpersonal",
    attention: "Inhibicion y temor a la evaluacion social",
    suggestion:
      "Puede ser util comenzar con intervenciones pequenas: pedir aclaraciones, expresar una molestia concreta o iniciar conversaciones breves en contextos seguros.",
  },
  asertividad_indirecta: {
    high: "La comunicacion presencial parece predominar sobre medios indirectos al expresar necesidades, afectos o desacuerdos.",
    medium: "En algunas situaciones aparece preferencia por medios indirectos, aunque no de manera marcada.",
    low: "Se observa tendencia a elegir telefono, cartas o formas escritas para comunicar asuntos que podrian trabajarse tambien cara a cara.",
    strength: "Predominio de expresion presencial",
    attention: "Preferencia por comunicacion indirecta",
    suggestion:
      "Una meta gradual seria trasladar primero a la conversacion presencial aquello que ya logras expresar por escrito o por telefono.",
  },
};

function getBand(percentage) {
  if (percentage >= 70) return "high";
  if (percentage >= 45) return "medium";
  return "low";
}

function getGlobalProfile(globalPercentage) {
  return GLOBAL_THRESHOLDS.find((item) => globalPercentage >= item.min) || GLOBAL_THRESHOLDS[GLOBAL_THRESHOLDS.length - 1];
}

function buildObservations(dimensionResults) {
  const strengths = dimensionResults
    .filter((item) => item.band === "high")
    .map((item) => DIMENSION_NOTES[item.key].strength);
  const attentionAreas = dimensionResults
    .filter((item) => item.band === "low")
    .map((item) => DIMENSION_NOTES[item.key].attention);
  const suggestions = dimensionResults
    .filter((item) => item.band !== "high")
    .map((item) => DIMENSION_NOTES[item.key].suggestion);

  return {
    strengths: strengths.length ? strengths : ["No se observan fortalezas dominantes unicas; el perfil luce relativamente equilibrado."],
    attentionAreas: attentionAreas.length
      ? attentionAreas
      : ["No se identifican areas criticas dominantes; conviene mantener seguimiento y practica de habilidades asertivas."],
    suggestions: suggestions.length ? suggestions.slice(0, 3) : ["Mantener espacios de autoobservacion y practica comunicativa puede ayudar a consolidar los recursos ya disponibles."],
  };
}

function buildInterpretation(globalPercentage, dimensionResults) {
  const profile = getGlobalProfile(globalPercentage);
  const observations = buildObservations(dimensionResults);

  return {
    globalProfile: profile.label,
    globalSummary: profile.summary,
    observations,
  };
}

module.exports = {
  buildInterpretation,
  DIMENSION_NOTES,
  getBand,
};
