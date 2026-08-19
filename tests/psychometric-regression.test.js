const test = require("node:test");
const assert = require("node:assert/strict");

const { scoreSubmission: scoreEma } = require("../lib/scoring");
const { scoreBaronApplication } = require("../lib/scoring/baronScoring");
const { scoreDiscApplication } = require("../lib/scoring/discScoring");
const { ITEMS } = require("../lib/instruments/baron");

// ============================================================================
// 1. EMA REGRESSION FIXTURES
// ============================================================================

test("EMA Regression Fixture 01 — Neutral baseline (all 3s)", () => {
  // Input: 45 answers of value 3
  const fixtureEma01 = Array(45).fill(3);

  const result = scoreEma(fixtureEma01);

  assert.equal(result.answerCount, 45);
  assert.equal(result.totalRaw, 135);
  assert.equal(result.totalAdjusted, 135);
  assert.equal(result.overallAverage, 3.0);
  assert.equal(result.overallPercentage, 60.0);

  // Dimensions
  const direct = result.dimensions.find((d) => d.key === "asertividad_directa");
  const noAsert = result.dimensions.find((d) => d.key === "no_asertividad");
  const indirect = result.dimensions.find((d) => d.key === "asertividad_indirecta");

  assert.equal(direct.itemCount, 12);
  assert.equal(direct.rawTotal, 36);
  assert.equal(direct.adjustedTotal, 36);
  assert.equal(direct.favorablePercentage, 60.0);
  assert.equal(direct.band, "medium");

  assert.equal(noAsert.itemCount, 18);
  assert.equal(noAsert.rawTotal, 54);
  assert.equal(noAsert.adjustedTotal, 54);
  assert.equal(noAsert.favorablePercentage, 60.0);
  assert.equal(noAsert.band, "medium");

  assert.equal(indirect.itemCount, 15);
  assert.equal(indirect.rawTotal, 45);
  assert.equal(indirect.adjustedTotal, 45);
  assert.equal(indirect.favorablePercentage, 60.0);
  assert.equal(indirect.band, "medium");

  assert.ok(result.profile);
  assert.ok(result.summary);
});

test("EMA Regression Fixture 02 — High Assertiveness (Direct=5, Inverted items=1)", () => {
  const { QUESTIONS } = require("../lib/instrument");
  const fixtureEma02 = QUESTIONS.map((q) => (q.reverseForGlobal ? 1 : 5));

  const result = scoreEma(fixtureEma02);

  assert.equal(result.totalAdjusted, 225); // 45 * 5
  assert.equal(result.overallAverage, 5.0);
  assert.equal(result.overallPercentage, 100.0);

  const direct = result.dimensions.find((d) => d.key === "asertividad_directa");
  assert.equal(direct.favorablePercentage, 100.0);
  assert.equal(direct.band, "high");

  const noAsert = result.dimensions.find((d) => d.key === "no_asertividad");
  assert.equal(noAsert.favorablePercentage, 100.0);
  assert.equal(noAsert.band, "high");
});

// ============================================================================
// 2. BAR-ON ICE REGRESSION FIXTURES
// ============================================================================

test("Bar-On ICE Regression Fixture 01 — Neutral baseline (all 3s, item 133 honesty=5)", () => {
  // Input: 133 items of value 3, item 133 (honesty validation) = 5
  const fixtureBaron01 = {};
  for (let i = 1; i <= 133; i++) {
    fixtureBaron01[i] = 3;
  }
  fixtureBaron01[133] = 5;

  const result = scoreBaronApplication(fixtureBaron01);

  assert.equal(result.answeredCount, 133);
  assert.equal(result.answerCount, 133);

  // Components count
  assert.equal(result.components.length, 5);
  assert.equal(result.subcomponents.length, 15);

  // Inconsistency index must be 0 for identical answers
  assert.equal(result.validity.inconsistency.score, 0);

  // Uniform response check correctly identified
  assert.ok(result.validity.warnings.some((w) => w.includes("respuesta uniforme")));

  // Total CE score
  assert.ok(result.total.rawScore > 0);
  assert.ok(result.total.ceScore > 0);
  assert.ok(result.profile);
});

test("Bar-On ICE Regression Fixture 02 — High inconsistency detection (>12)", () => {
  const fixtureBaron02 = {};
  for (let i = 1; i <= 133; i++) {
    fixtureBaron02[i] = 3;
  }
  fixtureBaron02[133] = 5;

  // Inconsistency pairs in Bar-On:
  const pairs = [
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

  pairs.forEach(([firstId, secondId]) => {
    const item1 = ITEMS.find((i) => i.id === firstId);
    const item2 = ITEMS.find((i) => i.id === secondId);

    fixtureBaron02[firstId] = item1?.reverse ? 5 : 1;
    fixtureBaron02[secondId] = item2?.reverse ? 1 : 5;
  });

  const result = scoreBaronApplication(fixtureBaron02);

  assert.ok(result.validity.inconsistency.score > 12);
  assert.equal(result.validity.valid, false);
  assert.ok(result.validity.warnings.some((w) => w.includes("inconsistencia") || w.includes("inconsistente")));
});

// ============================================================================
// 3. DISC REGRESSION FIXTURES
// ============================================================================

test("DISC Regression Fixture 01 — Full 28-group deterministic calculation", () => {
  // 28 groups encoded as (most * 10 + least) -> (1 * 10 + 4) = 14
  const fixtureDisc01 = {};
  for (let i = 1; i <= 28; i++) {
    fixtureDisc01[i] = 14; // choice 1 as MOST, choice 4 as LEAST
  }

  const result = scoreDiscApplication(fixtureDisc01);

  assert.equal(result.totalRaw, 28);
  assert.equal(result.overallPercentage, 100);

  // Verify that all 4 dimensions are populated and sum of most is 28, sum of least is 28
  const totalMost = Object.values(result.most).reduce((a, b) => a + b, 0);
  const totalLeast = Object.values(result.least).reduce((a, b) => a + b, 0);

  assert.equal(totalMost, 28);
  assert.equal(totalLeast, 28);

  // Each dimension difference must equal most - least
  ["D", "I", "S", "C"].forEach((k) => {
    assert.equal(result.difference[k], result.most[k] - result.least[k]);
  });

  assert.ok(result.profile);
  assert.ok(result.summary);
});
