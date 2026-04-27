const { COMPONENTS, SUBCOMPONENTS, ITEMS, MODULES } = require("../instruments/baron");
const { buildBaronInterpretation } = require("../interpretation/baronInterpretation");

const SCALE_MAX = 5;

const SCORE_STATS = {
  CM: { mean: 30.16, sd: 4.84 },
  AS: { mean: 26.77, sd: 4.21 },
  AC: { mean: 37.03, sd: 5.7 },
  AR: { mean: 38.26, sd: 4.8 },
  IN: { mean: 25.88, sd: 3.55 },
  RI: { mean: 44.08, sd: 5.56 },
  RS: { mean: 42.0, sd: 5.03 },
  EM: { mean: 32.6, sd: 4.41 },
  SP: { mean: 29.5, sd: 3.84 },
  PR: { mean: 39.0, sd: 5.53 },
  FL: { mean: 27.59, sd: 3.86 },
  TE: { mean: 33.23, sd: 5.37 },
  CI: { mean: 32.06, sd: 7.03 },
  FE: { mean: 36.51, sd: 5.13 },
  OP: { mean: 32.39, sd: 4.54 },
  IMP: { mean: 24.5, sd: 4.09 },
  IMN: { mean: 11.15, sd: 3.85 },
  intrapersonal: { mean: 158.09, sd: 18.05 },
  interpersonal: { mean: 98.6, sd: 10.05 },
  adaptabilidad: { mean: 96.1, sd: 10.24 },
  manejo_estres: { mean: 65.3, sd: 10.58 },
  estado_animo: { mean: 68.91, sd: 8.71 },
  total: { mean: 452.22, sd: 44.2 },
};

const INCONSISTENCY_PAIRS = [
  [23, 52],
  [27, 42],
  [31, 47],
  [39, 55],
  [62, 96],
  [72, 98],
  [73, 87],
  [88, 112],
  [103, 131],
  [41, 101],
];

const TOTAL_OVERLAP_ITEM_IDS = [11, 20, 23, 31, 35, 62, 88, 108];

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
  if (ceScore <= 69) return "very_low";
  if (ceScore <= 85) return "low";
  if (ceScore <= 114) return "average";
  if (ceScore <= 129) return "high";
  return "very_high";
}

function getAnswerMap(answers) {
  const map = new Map();
  for (const item of ITEMS) {
    map.set(item.id, normalizeAnswer(answers?.[item.id] ?? answers?.[String(item.id)]));
  }
  return map;
}

function getItemById(itemId) {
  return ITEMS.find((item) => item.id === itemId);
}

function scoreInconsistencyIndex(answerMap) {
  let total = 0;
  let completePairCount = 0;
  const pairs = INCONSISTENCY_PAIRS.map(([firstItemId, secondItemId]) => {
    const firstItem = getItemById(firstItemId);
    const secondItem = getItemById(secondItemId);
    const firstAnswer = answerMap.get(firstItemId);
    const secondAnswer = answerMap.get(secondItemId);
    const firstAdjusted = adjustedValue(firstItem, firstAnswer);
    const secondAdjusted = adjustedValue(secondItem, secondAnswer);
    const difference =
      firstAdjusted == null || secondAdjusted == null ? null : Math.abs(firstAdjusted - secondAdjusted);

    if (difference != null) {
      total += difference;
      completePairCount += 1;
    }

    return {
      itemIds: [firstItemId, secondItemId],
      adjustedResponses: [firstAdjusted, secondAdjusted],
      difference,
    };
  });

  return {
    score: completePairCount === INCONSISTENCY_PAIRS.length ? total : null,
    completePairCount,
    expectedPairCount: INCONSISTENCY_PAIRS.length,
    pairs,
  };
}

function summarizeResponseDistribution(answerMap) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  for (const item of ITEMS) {
    const answer = answerMap.get(item.id);
    if (answer == null) continue;
    counts[answer] += 1;
    total += 1;
  }

  const entries = Object.entries(counts).map(([value, count]) => ({
    value: Number(value),
    count,
    percentage: total ? round((count / total) * 100) : 0,
  }));
  const dominant = entries.reduce((max, item) => (item.count > max.count ? item : max), entries[0]);
  const extremeCount = counts[1] + counts[5];

  return {
    total,
    counts,
    dominant,
    extremePercentage: total ? round((extremeCount / total) * 100) : 0,
  };
}

function scoreSubcomponent(itemIds, answerMap, key, label, description) {
  const items = itemIds.map(getItemById).filter(Boolean);
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
        const item = getItemById(itemId);
        return sum + adjustedValue(item, item.answerValue);
      }, 0)
    : uniqueItemIds.reduce((sum, itemId) => {
        const item = getItemById(itemId);
        if (!item || item.answerValue == null) return sum;
        return sum + adjustedValue(item, item.answerValue);
      }, 0);

  const answeredCount = uniqueItemIds.filter((itemId) => {
    const item = getItemById(itemId);
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
  const inconsistency = scoreInconsistencyIndex(answerMap);
  const responseDistribution = summarizeResponseDistribution(answerMap);

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
  if (inconsistency.score != null && inconsistency.score > 12) {
    warnings.push("El indice de inconsistencia es mayor a 12 y vuelve el protocolo no confiable.");
  }
  if (responseDistribution.dominant?.percentage >= 80) {
    warnings.push(
      `El ${responseDistribution.dominant.percentage}% de respuestas usa la opcion ${responseDistribution.dominant.value}; conviene revisar posible respuesta uniforme.`
    );
  } else if (responseDistribution.extremePercentage >= 80) {
    warnings.push("Predominan respuestas extremas 1/5; conviene revisar estilo de respuesta antes de interpretar.");
  }

  const valid =
    honestyAnswer != null &&
    honestyAnswer >= 4 &&
    omissionCount < 8 &&
    (inconsistency.score == null || inconsistency.score <= 12) &&
    (impressionPositive.ceScore == null || impressionPositive.ceScore < 130) &&
    (impressionNegative.ceScore == null || impressionNegative.ceScore < 130);

  return {
    valid,
    honestyAnswer,
    omissionCount,
    inconsistency,
    responseDistribution,
    impressionPositive,
    impressionNegative,
    pendingChecks: [],
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
    const relevantSubs = subcomponentResults.filter((item) => item.componentKey === componentKey);
    const itemIds = relevantSubs.flatMap((item) => item.itemIds);
    const answeredCount = relevantSubs.reduce((sum, item) => sum + item.answeredCount, 0);
    const expectedCount = relevantSubs.reduce((sum, item) => sum + item.expectedCount, 0);
    const rawScore = relevantSubs.reduce((sum, item) => sum + item.rawScore, 0);
    const maxScore = expectedCount * SCALE_MAX;
    const isComplete = relevantSubs.every((item) => item.isComplete);
    const ceScore = isComplete ? convertToCe(rawScore, SCORE_STATS[componentKey]) : null;

    return {
      key: componentKey,
      label: COMPONENTS[componentKey].label,
      description: COMPONENTS[componentKey].summary,
      subcomponents: relevantSubs.map((item) => item.key),
      itemIds,
      answeredCount,
      expectedCount,
      rawScore,
      maxScore,
      percentage: answeredCount ? round((rawScore / maxScore) * 100) : 0,
      ceScore,
      category: getCategory(ceScore),
      isComplete,
    };
  });

  const totalAnsweredCount =
    subcomponentResults.reduce((sum, item) => sum + item.answeredCount, 0) -
    TOTAL_OVERLAP_ITEM_IDS.filter((itemId) => answerMap.get(itemId) != null).length;
  const totalExpectedCount =
    subcomponentResults.reduce((sum, item) => sum + item.expectedCount, 0) - TOTAL_OVERLAP_ITEM_IDS.length;
  const totalOverlapRawScore = TOTAL_OVERLAP_ITEM_IDS.reduce((sum, itemId) => {
    const item = getItemById(itemId);
    return sum + (adjustedValue(item, answerMap.get(itemId)) || 0);
  }, 0);
  const totalRawScore = subcomponentResults.reduce((sum, item) => sum + item.rawScore, 0) - totalOverlapRawScore;
  const totalMaxScore = totalExpectedCount * SCALE_MAX;
  const totalIsComplete = totalAnsweredCount === totalExpectedCount;
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
      percentage: totalAnsweredCount ? round((totalRawScore / totalMaxScore) * 100) : 0,
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
      "La conversion CE usa la formula CE = ((puntaje bruto - media normativa) / desviacion estandar normativa) * 15 + 100.",
      "Las reglas de validez aplicadas revisan item 133, omisiones, impresion positiva, impresion negativa e indice de inconsistencia.",
    ],
  };
}

module.exports = {
  normalizeAnswer,
  scoreBaronApplication,
  convertToCe,
  getCategory,
};
