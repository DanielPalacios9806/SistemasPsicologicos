const { getInstrumentDefinition } = require("../instruments/disc");

const DIMENSION_ORDER = ["D", "I", "S", "C"];
const PATTERN_BY_PRIMARY = {
  D: "Orientado a Resultados",
  I: "Promotor",
  S: "Especialista",
  C: "Perfeccionista",
};

function decodeAnswer(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return null;
  const most = Math.floor(numeric / 10);
  const least = numeric % 10;
  if (most < 1 || most > 4 || least < 1 || least > 4 || most === least) return null;
  return { most, least };
}

function normalizeAnswer(value) {
  if (typeof value === "object" && value) {
    const most = Number(value.most);
    const least = Number(value.least);
    if (!Number.isInteger(most) || !Number.isInteger(least) || most < 1 || most > 4 || least < 1 || least > 4) {
      return null;
    }
    if (most === least) return null;
    return most * 10 + least;
  }
  return decodeAnswer(value) ? Number(value) : null;
}

function emptyScores() {
  return Object.fromEntries(DIMENSION_ORDER.map((key) => [key, 0]));
}

function sortScores(scores) {
  return DIMENSION_ORDER.map((key) => ({ key, score: scores[key] || 0 })).sort((a, b) => b.score - a.score);
}

function resolvePattern(differenceScores, answeredCount) {
  if (!answeredCount) return "Pendiente";
  const ordered = sortScores(differenceScores);
  const [first, second] = ordered;
  if (ordered.every((item) => item.score >= 4)) return "Superactivo";
  if (ordered.every((item) => item.score <= -4)) return "Subactivo";
  if (Math.abs(first.score - ordered[ordered.length - 1].score) <= 1) return "Desconcertante";
  if (first.score === second.score) return `${PATTERN_BY_PRIMARY[first.key]} / ${PATTERN_BY_PRIMARY[second.key]}`;
  return PATTERN_BY_PRIMARY[first.key] || first.key;
}

function scoreDiscApplication(answers = {}) {
  const instrument = getInstrumentDefinition();
  const most = emptyScores();
  const least = emptyScores();
  const answeredItems = [];

  for (const item of instrument.items) {
    const encoded = normalizeAnswer(answers[item.id] ?? answers[String(item.id)]);
    if (!encoded) continue;
    const decoded = decodeAnswer(encoded);
    const mostChoice = item.choices[decoded.most - 1];
    const leastChoice = item.choices[decoded.least - 1];
    most[mostChoice.dimension] += 1;
    least[leastChoice.dimension] += 1;
    answeredItems.push({
      id: item.id,
      most: mostChoice,
      least: leastChoice,
      value: encoded,
    });
  }

  const difference = emptyScores();
  for (const key of DIMENSION_ORDER) {
    difference[key] = most[key] - least[key];
  }

  const answeredCount = answeredItems.length;
  const expectedCount = instrument.items.length;
  const completionRatio = expectedCount ? Math.round((answeredCount / expectedCount) * 100) : 0;
  const profile = resolvePattern(difference, answeredCount);
  const strongest = sortScores(difference)[0];
  const weakest = sortScores(difference).slice(-1)[0];

  return {
    profile,
    summary:
      answeredCount === expectedCount
        ? `Perfil DISC calculado por conteo MAS, MENOS y diferencia. Predomina ${strongest.key}; conviene observar ${weakest.key}.`
        : "Perfil DISC parcial. Completa los 28 grupos para cerrar la lectura.",
    totalRaw: answeredCount,
    overallPercentage: completionRatio,
    most,
    least,
    difference,
    dimensions: DIMENSION_ORDER.map((key) => ({
      key,
      label: instrument.dimensions.find((dimension) => dimension.key === key)?.label || key,
      rawTotal: difference[key],
      favorablePercentage: most[key],
      band: key === strongest.key ? "Predominante" : key === weakest.key ? "Menor presencia" : "Intermedio",
      interpretiveLevel: `MAS ${most[key]} / MENOS ${least[key]} / DIF ${difference[key]}`,
      interpretiveNote: "Lectura estructural basada en la hoja DISC suministrada.",
    })),
    modules: [
      {
        key: "disc",
        label: "Hoja DISC",
        answeredCount,
        expectedCount,
        completionRatio,
        isComplete: answeredCount === expectedCount,
      },
    ],
    observations: {
      strengths: [`Estilo predominante: ${profile}.`],
      attentionAreas: [`Dimension menor o tension observada: ${weakest.key}.`],
      suggestions: ["Revisar el perfil junto a las graficas y entrevista profesional antes de tomar decisiones."],
    },
    itemsWithAnswers: answeredItems,
  };
}

module.exports = {
  normalizeAnswer,
  scoreDiscApplication,
};
