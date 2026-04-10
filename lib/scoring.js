const { DIMENSIONS, QUESTIONS } = require("./instrument");
const { buildInterpretation, DIMENSION_NOTES, getBand } = require("./interpretation");

function normalizeAnswer(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function adjustedScore(question, value) {
  return question.reverseForGlobal ? 6 - value : value;
}

function round(value) {
  return Number(value.toFixed(2));
}

function scoreSubmission(rawAnswers) {
  const answers = QUESTIONS.map((question, index) => {
    const value = normalizeAnswer(rawAnswers[index]);
    return {
      questionId: question.id,
      value,
      adjustedValue: adjustedScore(question, value),
      dimension: question.dimension,
    };
  });

  const dimensionResults = Object.values(DIMENSIONS).map((dimension) => {
    const items = QUESTIONS.filter((question) => question.dimension === dimension.key);
    const rawTotal = items.reduce((sum, question) => sum + answers[question.id - 1].value, 0);
    const adjustedTotal = items.reduce((sum, question) => sum + answers[question.id - 1].adjustedValue, 0);
    const itemCount = items.length;
    const rawAverage = rawTotal / itemCount;
    const adjustedAverage = adjustedTotal / itemCount;
    const favorablePercentage = (adjustedTotal / (itemCount * 5)) * 100;
    const band = getBand(favorablePercentage);

    return {
      key: dimension.key,
      label: dimension.label,
      rationale: dimension.rationale,
      itemCount,
      questionIds: items.map((item) => item.id),
      rawTotal,
      rawAverage: round(rawAverage),
      adjustedTotal,
      adjustedAverage: round(adjustedAverage),
      favorablePercentage: round(favorablePercentage),
      band,
      interpretiveLevel:
        band === "high"
          ? "Nivel favorable"
          : band === "medium"
            ? "Nivel intermedio"
            : "Nivel que requiere atencion",
      interpretiveNote: DIMENSION_NOTES[dimension.key][band],
    };
  });

  const totalRaw = answers.reduce((sum, answer) => sum + answer.value, 0);
  const totalAdjusted = answers.reduce((sum, answer) => sum + answer.adjustedValue, 0);
  const overallAverage = totalAdjusted / QUESTIONS.length;
  const overallPercentage = (totalAdjusted / (QUESTIONS.length * 5)) * 100;
  const strongest = [...dimensionResults].sort((a, b) => b.favorablePercentage - a.favorablePercentage)[0];
  const weakest = [...dimensionResults].sort((a, b) => a.favorablePercentage - b.favorablePercentage)[0];
  const interpretation = buildInterpretation(overallPercentage, dimensionResults);

  return {
    answerCount: QUESTIONS.length,
    totalRaw,
    totalAdjusted,
    overallAverage: round(overallAverage),
    overallPercentage: round(overallPercentage),
    strongestDimension: strongest,
    weakestDimension: weakest,
    dimensions: dimensionResults,
    profile: interpretation.globalProfile,
    summary: interpretation.globalSummary,
    observations: interpretation.observations,
  };
}

module.exports = {
  normalizeAnswer,
  scoreSubmission,
};
