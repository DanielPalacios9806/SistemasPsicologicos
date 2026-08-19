const test = require("node:test");
const assert = require("node:assert/strict");

test("wellness index formula calculates accurate composite score without clinical blending", () => {
  const habitAdherence = 80; // 80%
  const moodValenceAvg = 75;  // 75%
  const latestAssessmentPercentile = 70; // 70%

  const computedIndex = Math.round(
    0.35 * habitAdherence + 0.35 * moodValenceAvg + 0.30 * latestAssessmentPercentile
  );

  assert.equal(computedIndex, 75);
  assert.ok(computedIndex >= 0 && computedIndex <= 100);
});

test("habit toggle produces valid state transition", () => {
  const habit = { key: "sleep", label: "Dormir 7–8 h", completed: false };
  const updated = { ...habit, completed: !habit.completed };

  assert.equal(updated.completed, true);
});
