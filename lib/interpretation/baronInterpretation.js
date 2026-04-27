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
    "La lectura actual sugiere un recurso muy consolidado en esta area, con desempeno especialmente favorable.",
};

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "Sin clasificar";
}

function describeResult(result, toneLabel) {
  return `${toneLabel}: ${CATEGORY_SUMMARIES[result.category] || "Sin interpretacion disponible."}`;
}

function buildStrengths(components, subcomponents) {
  const highlightedComponents = components
    .filter((item) => item.category === "high" || item.category === "very_high")
    .slice(0, 3)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const highlightedSubs = subcomponents
    .filter((item) => item.category === "high" || item.category === "very_high")
    .slice(0, 4)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const merged = [...highlightedComponents, ...highlightedSubs];
  return merged.length
    ? merged
    : ["No se observaron fortalezas dominantes unicas; la lectura luce relativamente equilibrada."];
}

function buildAttentionAreas(components, subcomponents) {
  const highlightedComponents = components
    .filter((item) => item.category === "very_low" || item.category === "low")
    .slice(0, 3)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const highlightedSubs = subcomponents
    .filter((item) => item.category === "very_low" || item.category === "low")
    .slice(0, 4)
    .map((item) => `${item.label} (${getCategoryLabel(item.category)})`);

  const merged = [...highlightedComponents, ...highlightedSubs];
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

  return suggestions.length
    ? suggestions
    : ["Mantener habitos de autoobservacion, relaciones de apoyo y estrategias de afrontamiento puede ayudar a sostener los recursos actuales."];
}

function buildBaronInterpretation(scoring) {
  const profileLabel = `Perfil ${getCategoryLabel(scoring.total.category).toLowerCase()} del CE total`;
  const profileSummary = describeResult(scoring.total, "CE total");

  return {
    globalProfile: profileLabel,
    globalSummary: profileSummary,
    strengths: buildStrengths(scoring.components, scoring.subcomponents),
    attentionAreas: buildAttentionAreas(scoring.components, scoring.subcomponents),
    suggestions: buildSuggestions(scoring.components),
  };
}

module.exports = {
  getCategoryLabel,
  buildBaronInterpretation,
};
