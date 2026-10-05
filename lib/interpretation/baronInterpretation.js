const CATEGORY_LABELS = {
  very_low: "Muy bajo",
  low: "Bajo",
  average: "Promedio",
  high: "Alto",
  very_high: "Muy alto",
};

const CATEGORY_SUMMARIES = {
  very_low:
    "La lectura actual sugiere recursos emocionales claramente disminuidos en esta area y requiere una revision cuidadosa del contexto.",
  low:
    "La lectura actual muestra senales de atencion en esta area y conviene observarla con mas detalle.",
  average:
    "La lectura actual se ubica dentro de un rango promedio y funcional para esta area.",
  high:
    "La lectura actual sugiere un recurso fortalecido y consistente en esta area.",
  very_high:
    "La lectura actual es inusualmente alta: puede reflejar un recurso muy desarrollado o una sobreestimacion de las propias capacidades, por lo que conviene confirmarla en entrevista.",
};

// Un puntaje muy alto (CE >= 130) no se interpreta automaticamente como fortaleza:
// se marca para revision con una lectura especifica por componente.
const VERY_HIGH_NOTES = {
  intrapersonal: "posible autosuficiencia excesiva o dificultad para pedir ayuda",
  interpersonal: "posible necesidad de aprobacion o tendencia a complacer a los demas",
  adaptabilidad: "posible exceso de confianza al evaluar situaciones y tomar decisiones",
  manejo_estres: "posible minimizacion de la tension o del cansancio acumulado",
  estado_animo: "posible optimismo poco realista frente a las dificultades",
};

const VERY_HIGH_SUGGESTIONS = {
  intrapersonal:
    "Conviene explorar en entrevista la disposicion a reconocer limites propios y a solicitar apoyo cuando la situacion lo requiere.",
  interpersonal:
    "Conviene explorar si la busqueda de armonia con los demas limita la expresion de desacuerdos o necesidades personales.",
  adaptabilidad:
    "Conviene contrastar la autoevaluacion con desempeno observado en situaciones que exigen analisis y cambios de plan.",
  manejo_estres:
    "Conviene verificar senales de fatiga o tension que la persona podria no estar reconociendo en su autoevaluacion.",
  estado_animo:
    "Conviene explorar como la persona afronta frustraciones concretas para distinguir optimismo realista de negacion de dificultades.",
};

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "Sin clasificar";
}

function describeResult(result, toneLabel) {
  return `${toneLabel}: ${CATEGORY_SUMMARIES[result.category] || "Sin interpretacion disponible."}`;
}

function buildStrengths(components, subcomponents) {
  const highlightedComponents = components
    .filter((item) => item.category === "high")
    .slice(0, 3)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const highlightedSubs = subcomponents
    .filter((item) => item.category === "high" && !isValidityScale(item))
    .slice(0, 4)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const merged = [...highlightedComponents, ...highlightedSubs];
  return merged.length
    ? merged
    : ["No se observaron fortalezas dominantes unicas; la lectura luce relativamente equilibrada."];
}

function isValidityScale(item) {
  return ["IMP", "IMN", "impresion_positiva", "impresion_negativa"].includes(item.key) || /impresion/i.test(item.label || "");
}

function buildAttentionAreas(components, subcomponents, positiveImpressionHigh) {
  const highlightedComponents = components
    .filter((item) => item.category === "very_low" || item.category === "low")
    .slice(0, 3)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const reviewComponents = components
    .filter((item) => item.category === "very_high")
    .map((item) => {
      const note = VERY_HIGH_NOTES[item.key] || "posible sobreestimacion de las propias capacidades";
      return `${item.label} (Muy alto, revisar): ${note}.`;
    });
  if (reviewComponents.length && positiveImpressionHigh) {
    reviewComponents.unshift("Impresion positiva elevada: los puntajes muy altos deben interpretarse con cautela y confirmarse en entrevista.");
  }

  const highlightedSubs = subcomponents
    .filter((item) => (item.category === "very_low" || item.category === "low") && !isValidityScale(item))
    .slice(0, 4)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const reviewSubs = subcomponents
    .filter((item) => item.category === "very_high" && !isValidityScale(item))
    .slice(0, 4)
    .map((item) => `${item.label} (Muy alto, revisar)`);

  const merged = [...highlightedComponents, ...reviewComponents, ...highlightedSubs, ...reviewSubs];
  return merged.length
    ? merged
    : ["No se observan areas criticas dominantes con la informacion actualmente disponible."];
}

function buildSuggestions(components) {
  const suggestions = [];

  const intrapersonal = components.find((item) => item.key === "intrapersonal");
  if (intrapersonal && (intrapersonal.category === "very_low" || intrapersonal.category === "low")) {
    suggestions.push(
      "Puede ser util incorporar espacios breves de autoobservacion emocional, identificacion de estados internos y expresion de necesidades personales."
    );
  }

  const interpersonal = components.find((item) => item.key === "interpersonal");
  if (interpersonal && (interpersonal.category === "very_low" || interpersonal.category === "low")) {
    suggestions.push(
      "Conviene fortalecer interacciones de apoyo, escucha reciproca y expresion respetuosa en situaciones cotidianas."
    );
  }

  const adaptabilidad = components.find((item) => item.key === "adaptabilidad");
  if (adaptabilidad && (adaptabilidad.category === "very_low" || adaptabilidad.category === "low")) {
    suggestions.push(
      "Una ayuda practica puede ser desglosar problemas en pasos cortos, comparar opciones y verificar hechos antes de decidir."
    );
  }

  const manejoEstres = components.find((item) => item.key === "manejo_estres");
  if (manejoEstres && (manejoEstres.category === "very_low" || manejoEstres.category === "low")) {
    suggestions.push(
      "Se recomienda ensayar pausas breves, respiracion consciente y estrategias de regulacion antes de actuar bajo tension."
    );
  }

  const estadoAnimo = components.find((item) => item.key === "estado_animo");
  if (estadoAnimo && (estadoAnimo.category === "very_low" || estadoAnimo.category === "low")) {
    suggestions.push(
      "Puede ayudar recuperar actividades gratificantes, rutinas sostenibles y apoyos cotidianos que favorezcan una disposicion mas positiva."
    );
  }

  for (const item of components.filter((component) => component.category === "very_high")) {
    if (VERY_HIGH_SUGGESTIONS[item.key]) suggestions.push(VERY_HIGH_SUGGESTIONS[item.key]);
  }

  return suggestions.length
    ? suggestions
    : ["Mantener habitos de autoobservacion, relaciones de apoyo y estrategias de afrontamiento puede ayudar a sostener los recursos actuales."];
}

function buildBaronInterpretation(scoring) {
  const profileLabel = `Perfil ${getCategoryLabel(scoring.total.category).toLowerCase()} del CE total`;
  const profileSummary = describeResult(scoring.total, "CE total");
  const positiveImpressionHigh = Number(scoring.validity?.impressionPositive?.ceScore) >= 130;
  const components = scoring.components || [];
  const subcomponents = scoring.subcomponents || [];

  return {
    globalProfile: profileLabel,
    globalSummary: profileSummary,
    strengths: buildStrengths(components, subcomponents),
    attentionAreas: buildAttentionAreas(components, subcomponents, positiveImpressionHigh),
    suggestions: buildSuggestions(components),
  };
}

/**
 * Vuelve a generar la lectura de un resultado BarOn ya guardado (sin cambiar
 * puntajes), para que los resultados anteriores usen los criterios vigentes.
 */
function refreshBaronSnapshot(snapshot) {
  if (!snapshot || !snapshot.total || !Array.isArray(snapshot.components)) return snapshot;
  const interpretation = buildBaronInterpretation(snapshot);
  return {
    ...snapshot,
    profile: interpretation.globalProfile,
    summary: interpretation.globalSummary,
    observations: {
      strengths: interpretation.strengths,
      attentionAreas: interpretation.attentionAreas,
      suggestions: interpretation.suggestions,
    },
  };
}

module.exports = {
  getCategoryLabel,
  buildBaronInterpretation,
  refreshBaronSnapshot,
};
