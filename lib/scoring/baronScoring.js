const { COMPONENTS, SUBCOMPONENTS, ITEMS, MODULES } = require("../instruments/baron");
const { buildBaronInterpretation } = require("../interpretation/baronInterpretation");

const SCALE_MAX = 5;

const SCORE_STATS = {
  CM: { mean: 30.2, sd: 4.8 },
  AS: { mean: 26.8, sd: 4.2 },
  AC: { mean: 37.0, sd: 5.7 },
  AR: { mean: 38.3, sd: 4.8 },
  IN: { mean: 32.6, sd: 4.4 },
  RI: { mean: 44.1, sd: 5.6 },
  RS: { mean: 25.9, sd: 3.6 },
  EM: { mean: 42.0, sd: 5.0 },
  SP: { mean: 29.5, sd: 3.8 },
  PR: { mean: 39.0, sd: 5.5 },
  FL: { mean: 27.6, sd: 3.9 },
  TE: { mean: 33.2, sd: 5.4 },
  CI: { mean: 32.1, sd: 7.0 },
  FE: { mean: 36.5, sd: 5.1 },
  OP: { mean: 32.4, sd: 4.5 },
  IMP: { mean: 24.5, sd: 4.09 },
  IMN: { mean: 11.15, sd: 3.85 },
  intrapersonal: { mean: 158.1, sd: 18.0 },
  interpersonal: { mean: 98.6, sd: 10.1 },
  adaptabilidad: { mean: 96.1, sd: 10.2 },
  manejo_estres: { mean: 65.3, sd: 10.6 },
  estado_animo: { mean: 68.9, sd: 8.7 },
  total: { mean: 453.2, sd: 45.5 },
};

function normalizeAnswer(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function adjustedValue(item, answer) {
  if (answer == null) return null;
  return item.reverse ? SCALE_MAX + 1 - answer : answer;
}

function round(value) {
  return Number(value.toFixed(2));
}

function convertToCe(rawScore, stats) {
  if (!stats || !stats.sd) return null;
  return Math.round(((rawScore - stats.mean) / stats.sd) * 15 + 100);
}

function getCategory(ceScore) {
  if (ceScore == null) return "pending";
  if (ceScore <= 79) return "very_low";
  if (ceScore <= 90) return "low";
  if (ceScore <= 109) return "average";
  if (ceScore <= 120) return "high";
  return "very_high";
}

function getAnswerMap(answers) {
  const map = new Map();
  for (const item of ITEMS) {
    map.set(item.id, normalizeAnswer(answers?.[item.id] ?? answers?.[String(item.id)]));
  }
  return map;
}

function scoreSubcomponent(itemIds, answerMap, key, label, description) {
  const items = itemIds.map((itemId) => ITEMS.find((item) => item.id === itemId)).filter(Boolean);
  const answeredItems = items.filter((item) => answerMap.get(item.id) != null);
  const answeredCount = answeredItems.length;
  const rawScore = answeredItems.reduce((sum, item) => sum + adjustedValue(item, answerMap.get(item.id)), 0);
  const maxScore = itemIds.length * SCALE_MAX;
  const completionRatio = itemIds.length ? answeredCount / itemIds.length : 0;
  const isComplete = answeredCount === itemIds.length;
  const ceScore = isComplete ? convertToCe(rawScore, SCORE_STATS[key]) : null;
  const percentage = answeredCount ? round((rawScore / maxScore) * 100) : 0;

  return {
    key,
    label,
    description,
    itemIds,
    answeredCount,
    expectedCount: itemIds.length,
    completionRatio: round(completionRatio * 100),
    rawScore,
    maxScore,
    percentage,
    ceScore,
    category: getCategory(ceScore),
    isComplete,
  };
}

function buildComponentResult(componentKey, subcomponentResults) {
  const component = COMPONENTS[componentKey];
  const relevantSubs = subcomponentResults.filter((item) => item.componentKey === componentKey);
  const uniqueItemIds = [...new Set(relevantSubs.flatMap((item) => item.itemIds))];
  const rawScore = relevantSubs.every((item) => item.isComplete)
    ? uniqueItemIds.reduce((sum, itemId) => {
        const item = ITEMS.find((candidate) => candidate.id === itemId);
        return sum + adjustedValue(item, item.answerValue);
      }, 0)
    : uniqueItemIds.reduce((sum, itemId) => {
        const item = ITEMS.find((candidate) => candidate.id === itemId);
        if (!item || item.answerValue == null) return sum;
        return sum + adjustedValue(item, item.answerValue);
      }, 0);

  const answeredCount = uniqueItemIds.filter((itemId) => {
    const item = ITEMS.find((candidate) => candidate.id === itemId);
    return item && item.answerValue != null;
  }).length;

  const maxScore = uniqueItemIds.length * SCALE_MAX;
  const isComplete = answeredCount === uniqueItemIds.length;
  const ceScore = isComplete ? convertToCe(rawScore, SCORE_STATS[componentKey]) : null;

  return {
    key: componentKey,
    label: component.label,
    description: component.summary,
    subcomponents: relevantSubs.map((item) => item.key),
    itemIds: uniqueItemIds,
    answeredCount,
    expectedCount: uniqueItemIds.length,
    rawScore,
    maxScore,
    percentage: answeredCount ? round((rawScore / maxScore) * 100) : 0,
    ceScore,
    category: getCategory(ceScore),
    isComplete,
  };
}

function buildValidity(answerMap) {
  const honestyAnswer = answerMap.get(133);
  const omissionCount = ITEMS.filter((item) => item.id !== 133).filter((item) => answerMap.get(item.id) == null).length;

  const impressionPositive = scoreSubcomponent(
    SUBCOMPONENTS.IMP.itemIds,
    answerMap,
    "IMP",
    SUBCOMPONENTS.IMP.label,
    SUBCOMPONENTS.IMP.description
  );
  const impressionNegative = scoreSubcomponent(
    SUBCOMPONENTS.IMN.itemIds,
    answerMap,
    "IMN",
    SUBCOMPONENTS.IMN.label,
    SUBCOMPONENTS.IMN.description
  );

  const warnings = [];
  if (honestyAnswer != null && honestyAnswer <= 3) {
    warnings.push("El item 133 sugiere revisar sinceridad/autorreporte del protocolo.");
  }
  if (omissionCount >= 8) {
    warnings.push("Se detectaron 8 o mas omisiones en los 132 items sustantivos.");
  }
  if (impressionPositive.ceScore != null && impressionPositive.ceScore >= 130) {
    warnings.push("La escala de impresion positiva aparece elevada y requiere cautela interpretativa.");
  }
  if (impressionNegative.ceScore != null && impressionNegative.ceScore >= 130) {
    warnings.push("La escala de impresion negativa aparece elevada y requiere cautela interpretativa.");
  }
  warnings.push("El indice de inconsistencia del material original sigue pendiente de cierre metodologico en esta version.");

  const valid =
    honestyAnswer != null &&
    honestyAnswer >= 4 &&
    omissionCount < 8 &&
    (impressionPositive.ceScore == null || impressionPositive.ceScore < 130) &&
    (impressionNegative.ceScore == null || impressionNegative.ceScore < 130);

  return {
    valid,
    honestyAnswer,
    omissionCount,
    impressionPositive,
    impressionNegative,
    pendingChecks: ["indice_inconsistencia"],
    warnings,
  };
}

function attachAnswerValuesToItems(answerMap) {
  return ITEMS.map((item) => ({
    ...item,
    answerValue: answerMap.get(item.id),
  }));
}

function scoreBaronApplication(answers) {
  const answerMap = getAnswerMap(answers);
  const itemsWithAnswers = attachAnswerValuesToItems(answerMap);

  const subcomponentResults = Object.values(SUBCOMPONENTS)
    .filter((subcomponent) => subcomponent.component !== "validacion")
    .map((subcomponent) => ({
      ...scoreSubcomponent(
        subcomponent.itemIds,
        answerMap,
        subcomponent.key,
        subcomponent.label,
        subcomponent.description
      ),
      componentKey: subcomponent.component,
    }));

  const componentResults = Object.keys(COMPONENTS).map((componentKey) => {
    const enrichedItems = itemsWithAnswers.map((item) => ({
      ...item,
      answerValue: answerMap.get(item.id),
    }));
    const relevantSubs = subcomponentResults.filter((item) => item.componentKey === componentKey);
    const uniqueItemIds = [...new Set(relevantSubs.flatMap((item) => item.itemIds))];
    const rawScore = uniqueItemIds.reduce((sum, itemId) => {
      const item = enrichedItems.find((candidate) => candidate.id === itemId);
      if (!item || item.answerValue == null) return sum;
      return sum + adjustedValue(item, item.answerValue);
    }, 0);
    const answeredCount = uniqueItemIds.filter((itemId) => {
      const item = enrichedItems.find((candidate) => candidate.id === itemId);
      return item && item.answerValue != null;
    }).length;
    const maxScore = uniqueItemIds.length * SCALE_MAX;
    const isComplete = answeredCount === uniqueItemIds.length;
    const ceScore = isComplete ? convertToCe(rawScore, SCORE_STATS[componentKey]) : null;

    return {
      key: componentKey,
      label: COMPONENTS[componentKey].label,
      description: COMPONENTS[componentKey].summary,
      subcomponents: relevantSubs.map((item) => item.key),
      itemIds: uniqueItemIds,
      answeredCount,
      expectedCount: uniqueItemIds.length,
      rawScore,
      maxScore,
      percentage: answeredCount ? round((rawScore / maxScore) * 100) : 0,
      ceScore,
      category: getCategory(ceScore),
      isComplete,
    };
  });

  const totalItemIds = [...new Set(subcomponentResults.flatMap((item) => item.itemIds))];
  const answeredCoreCount = totalItemIds.filter((itemId) => answerMap.get(itemId) != null).length;
  const totalRawScore = totalItemIds.reduce((sum, itemId) => {
    const item = itemsWithAnswers.find((candidate) => candidate.id === itemId);
    if (!item || item.answerValue == null) return sum;
    return sum + adjustedValue(item, item.answerValue);
  }, 0);
  const totalMaxScore = totalItemIds.length * SCALE_MAX;
  const totalIsComplete = answeredCoreCount === totalItemIds.length;
  const totalCeScore = totalIsComplete ? convertToCe(totalRawScore, SCORE_STATS.total) : null;

  const moduleResults = MODULES.map((module) => {
    const componentResult = componentResults.find((item) => item.key === module.key);
    const answeredCount = module.itemIds.filter((itemId) => answerMap.get(itemId) != null).length;
    const completionRatio = module.itemIds.length ? round((answeredCount / module.itemIds.length) * 100) : 0;
    return {
      key: module.key,
      label: module.label,
      intro: module.intro,
      answeredCount,
      expectedCount: module.itemIds.length,
      completionRatio,
      isComplete: answeredCount === module.itemIds.length,
      component: componentResult,
      subcomponents: subcomponentResults.filter((item) => item.componentKey === module.key),
    };
  });

  const validity = buildValidity(answerMap);
  const interpretation = buildBaronInterpretation({
    total: {
      key: "total",
      label: "CE total",
      rawScore: totalRawScore,
      ceScore: totalCeScore,
      category: getCategory(totalCeScore),
    },
    components: componentResults,
    subcomponents: subcomponentResults,
  });

  return {
    instrumentCode: "baron",
    answerCount: ITEMS.length,
    answeredCount: itemsWithAnswers.filter((item) => item.answerValue != null).length,
    itemsWithAnswers,
    modules: moduleResults,
    subcomponents: subcomponentResults,
    components: componentResults,
    total: {
      rawScore: totalRawScore,
      maxScore: totalMaxScore,
      ceScore: totalCeScore,
      category: getCategory(totalCeScore),
      isComplete: totalIsComplete,
      percentage: answeredCoreCount ? round((totalRawScore / totalMaxScore) * 100) : 0,
    },
    validity,
    profile: interpretation.globalProfile,
    summary: interpretation.globalSummary,
    observations: {
      strengths: interpretation.strengths,
      attentionAreas: interpretation.attentionAreas,
      suggestions: interpretation.suggestions,
    },
    methodologyWarnings: [
      "La conversion CE se implementa a partir de medias y desviaciones observadas en la plantilla Excel original.",
      "El indice de inconsistencia del material original sigue documentado como pendiente de cierre en esta version.",
    ],
  };
}

module.exports = {
  normalizeAnswer,
  scoreBaronApplication,
  convertToCe,
  getCategory,
};
