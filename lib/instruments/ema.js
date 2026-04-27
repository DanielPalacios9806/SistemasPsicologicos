const { getInstrumentDefinition, QUESTIONS, DIMENSIONS, RESPONSE_SCALE } = require("../instrument");

function getEmaDefinition() {
  const instrument = getInstrumentDefinition();
  return {
    code: "ema",
    name: instrument.title,
    version: "EMA 45 reactivos",
    description: instrument.description,
    responseScale: RESPONSE_SCALE,
    modules: [
      {
        key: "ema",
        label: "Aplicacion EMA",
        summary: "Los 45 reactivos se responden en una sola secuencia.",
        intro:
          "La Escala Multidimensional de Asertividad se mantiene en el formato actual de una pregunta por pantalla.",
        order: 1,
        itemIds: QUESTIONS.map((question) => question.id),
      },
    ],
    items: QUESTIONS.map((question) => ({
      id: question.id,
      text: question.text,
      moduleKey: "ema",
      reverse: question.reverseForGlobal,
      dimension: question.dimension,
      rationale: question.rationale,
    })),
    dimensions: Object.values(DIMENSIONS),
  };
}

module.exports = {
  getInstrumentDefinition: getEmaDefinition,
};
