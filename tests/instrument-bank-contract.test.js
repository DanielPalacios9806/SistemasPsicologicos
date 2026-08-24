const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { getInstrumentDefinition } = require("../lib/instruments");

const EXPECTED_COUNTS = {
  ema: 45,
  baron: 133,
  disc: 28,
};

for (const [code, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
  test(`${code.toUpperCase()} exposes a complete and ordered question bank`, () => {
    const instrument = getInstrumentDefinition(code);
    const itemIds = instrument.items.map((item) => item.id);
    const moduleItemIds = instrument.modules.flatMap((module) => module.itemIds);

    assert.equal(instrument.items.length, expectedCount);
    assert.equal(new Set(itemIds).size, expectedCount);
    assert.deepEqual([...itemIds].sort((a, b) => a - b), Array.from({ length: expectedCount }, (_, index) => index + 1));
    assert.deepEqual([...moduleItemIds].sort((a, b) => a - b), [...itemIds].sort((a, b) => a - b));
    assert.ok(instrument.items.every((item) => typeof item.text === "string" && item.text.trim()));

    if (code === "disc") {
      assert.ok(instrument.items.every((item) => item.choices.length === 4));
      assert.ok(instrument.items.every((item) => new Set(item.choices.map((choice) => choice.dimension)).size === 4));
    } else {
      assert.equal(instrument.responseScale.length, 5);
    }
  });
}

test("assessment script only references elements present in its HTML", () => {
  const publicDir = path.join(__dirname, "..", "public");
  const script = fs.readFileSync(path.join(publicDir, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
  const referencedIds = [...script.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map((match) => match[1]);
  const htmlIds = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map((match) => match[1]));
  const missingIds = [...new Set(referencedIds)].filter((id) => !htmlIds.has(id));

  assert.deepEqual(missingIds, []);
});
