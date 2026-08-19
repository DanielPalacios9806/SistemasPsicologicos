const test = require("node:test");
const assert = require("node:assert/strict");

const { getInstrumentDefinition } = require("../lib/instruments/disc");
const { normalizeAnswer, scoreDiscApplication } = require("../lib/scoring/discScoring");

test("DISC definition exposes 28 forced-choice groups", () => {
  const disc = getInstrumentDefinition();
  assert.equal(disc.code, "disc");
  assert.equal(disc.items.length, 28);
  assert.equal(disc.items.every((item) => item.choices.length === 4), true);
});

test("DISC answer requires different MAS and MENOS choices", () => {
  assert.equal(normalizeAnswer({ most: 1, least: 2 }), 12);
  assert.equal(normalizeAnswer({ most: 1, least: 1 }), null);
  assert.equal(normalizeAnswer(44), null);
});

test("DISC scoring produces MAS, MENOS and difference totals", () => {
  const answers = Object.fromEntries(Array.from({ length: 28 }, (_, index) => [index + 1, 12]));
  const scoring = scoreDiscApplication(answers);
  assert.equal(scoring.modules[0].answeredCount, 28);
  assert.equal(scoring.overallPercentage, 100);
  assert.equal(Object.keys(scoring.most).sort().join(","), "C,D,I,S");
  assert.equal(Object.keys(scoring.least).sort().join(","), "C,D,I,S");
  assert.equal(Object.keys(scoring.difference).sort().join(","), "C,D,I,S");
});
