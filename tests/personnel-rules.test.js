const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeCedula,
  classifyRank,
  buildInstrumentCodes,
} = require("../lib/personnel/rules");

test("normalizeCedula preserves valid 10 digit IDs", () => {
  assert.equal(normalizeCedula("1712345678"), "1712345678");
});

test("normalizeCedula pads Ecuadorian 9 digit imports", () => {
  assert.equal(normalizeCedula("400825097"), "0400825097");
});

test("senior officers only receive DISC in promotions 48-59", () => {
  assert.deepEqual(buildInstrumentCodes(classifyRank("MAYO", 48)), ["ema", "baron", "disc"]);
  assert.deepEqual(buildInstrumentCodes(classifyRank("MAYO", 60)), ["ema", "baron"]);
  assert.deepEqual(buildInstrumentCodes(classifyRank("CAPT", 50)), ["ema", "baron"]);
});

test("SGOP through SUBM receive DISC", () => {
  for (const rank of ["SGOP", "SUBS", "SUBP", "SUBM"]) {
    assert.deepEqual(buildInstrumentCodes(classifyRank(rank, null)), ["ema", "baron", "disc"]);
  }
});
