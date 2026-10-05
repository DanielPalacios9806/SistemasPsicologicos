const { refreshBaronSnapshot } = require("./baronInterpretation");

// Escalas EMA donde un puntaje favorable significa POCO del rasgo medido
// (se puntuan invertidas para el indice global).
const EMA_RISK_DIMENSIONS = new Set(["no_asertividad", "asertividad_indirecta"]);

function emaLevelText(dimension) {
  const band = dimension.band;
  if (EMA_RISK_DIMENSIONS.has(dimension.key)) {
    if (band === "high") return "Presencia baja (favorable)";
    if (band === "medium") return "Presencia moderada";
    return "Presencia elevada (requiere atencion)";
  }
  if (band === "high") return "Nivel favorable";
  if (band === "medium") return "Nivel intermedio";
  return "Nivel que requiere atencion";
}

function refreshEmaSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.dimensions)) return snapshot;
  return {
    ...snapshot,
    dimensions: snapshot.dimensions.map((dimension) => ({ ...dimension, interpretiveLevel: emaLevelText(dimension) })),
  };
}

/** Aplica los criterios de interpretacion vigentes a un resultado guardado. No modifica puntajes. */
function refreshScoringSnapshot(instrumentCode, snapshot) {
  try {
    if (instrumentCode === "baron") return refreshBaronSnapshot(snapshot);
    if (instrumentCode === "ema") return refreshEmaSnapshot(snapshot);
  } catch (error) {
    console.warn(`No se pudo actualizar la lectura del resultado (${instrumentCode}): ${error.message}`);
  }
  return snapshot;
}

function refreshApplicationInterpretation(application) {
  if (!application || !application.scoringSnapshot) return application;
  const scoringSnapshot = refreshScoringSnapshot(application.instrumentCode, application.scoringSnapshot);
  if (scoringSnapshot === application.scoringSnapshot) return application;
  const finalResult = application.finalResult
    ? {
        ...application.finalResult,
        profileGlobal: scoringSnapshot.profile ?? application.finalResult.profileGlobal,
        interpretationJson: {
          ...(application.finalResult.interpretationJson || {}),
          summary: scoringSnapshot.summary,
          observations: scoringSnapshot.observations,
        },
        detailJson: scoringSnapshot,
      }
    : application.finalResult;
  return { ...application, scoringSnapshot, finalResult };
}

module.exports = { EMA_RISK_DIMENSIONS, emaLevelText, refreshScoringSnapshot, refreshApplicationInterpretation };
