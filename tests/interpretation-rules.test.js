const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBaronInterpretation, refreshBaronSnapshot } = require("../lib/interpretation/baronInterpretation");
const { refreshApplicationInterpretation, refreshScoringSnapshot } = require("../lib/interpretation/refresh");

function component(key, label, category) {
  return { key, label, category, ceScore: category === "very_high" ? 135 : 100 };
}

test("Bar-On: un componente muy alto se marca para revisión y no como fortaleza", () => {
  const result = buildBaronInterpretation({
    total: { category: "average" },
    components: [component("intrapersonal", "Intrapersonal", "very_high"), component("interpersonal", "Interpersonal", "high")],
    subcomponents: [],
    validity: { impressionPositive: { ceScore: 100 } },
  });
  assert.ok(!result.strengths.some((text) => text.startsWith("Intrapersonal")));
  assert.ok(result.strengths.some((text) => text.startsWith("Interpersonal")));
  assert.ok(result.attentionAreas.some((text) => /Intrapersonal \(Muy alto, revisar\)/.test(text)));
  assert.ok(result.suggestions.some((text) => /limites propios/.test(text)));
});

test("Bar-On: impresión positiva elevada añade cautela a los puntajes muy altos", () => {
  const result = buildBaronInterpretation({
    total: { category: "high" },
    components: [component("estado_animo", "Estado de animo general", "very_high")],
    subcomponents: [],
    validity: { impressionPositive: { ceScore: 132 } },
  });
  assert.ok(result.attentionAreas.some((text) => /cautela/.test(text)));
});

test("Bar-On: las escalas de validez no aparecen como fortalezas ni áreas", () => {
  const result = buildBaronInterpretation({
    total: { category: "average" },
    components: [],
    subcomponents: [{ key: "IMP", label: "Impresion positiva", category: "very_high" }],
  });
  assert.ok(!result.attentionAreas.some((text) => /Impresion/.test(text)));
  assert.ok(!result.strengths.some((text) => /Impresion/.test(text)));
});

test("Resultados guardados se releen con los criterios vigentes sin cambiar puntajes", () => {
  const stored = {
    total: { category: "average", ceScore: 110 },
    components: [component("manejo_estres", "Manejo del estres", "very_high")],
    subcomponents: [],
    observations: { strengths: ["Manejo del estres (Muy alto)"], attentionAreas: [], suggestions: [] },
  };
  const refreshed = refreshBaronSnapshot(stored);
  assert.equal(refreshed.total.ceScore, 110);
  assert.ok(!refreshed.observations.strengths.some((text) => /Manejo/.test(text)));
  assert.ok(refreshed.observations.attentionAreas.some((text) => /Manejo del estres \(Muy alto, revisar\)/.test(text)));
});

test("EMA: las escalas de riesgo usan lenguaje de presencia del rasgo", () => {
  const refreshed = refreshScoringSnapshot("ema", {
    dimensions: [
      { key: "no_asertividad", band: "high", interpretiveLevel: "Nivel favorable" },
      { key: "asertividad_directa", band: "high", interpretiveLevel: "Nivel favorable" },
    ],
  });
  assert.equal(refreshed.dimensions[0].interpretiveLevel, "Presencia baja (favorable)");
  assert.equal(refreshed.dimensions[1].interpretiveLevel, "Nivel favorable");
});

test("La relectura actualiza el resultado final sin modificar sus puntajes", () => {
  const application = {
    instrumentCode: "baron",
    scoringSnapshot: {
      total: { category: "average", ceScore: 108, rawScore: 470 },
      components: [component("estado_animo", "Estado de animo general", "very_high")],
      subcomponents: [],
      observations: { strengths: ["Estado de animo general (Muy alto)"] },
    },
    finalResult: {
      totalRaw: 470,
      totalNormalized: 108,
      profileGlobal: "Perfil promedio del CE total",
      interpretationJson: {},
      detailJson: {},
    },
  };

  const refreshed = refreshApplicationInterpretation(application);
  assert.equal(refreshed.finalResult.totalRaw, 470);
  assert.equal(refreshed.finalResult.totalNormalized, 108);
  assert.equal(refreshed.finalResult.detailJson.total.ceScore, 108);
  assert.ok(refreshed.finalResult.interpretationJson.observations.attentionAreas.some((text) => /Muy alto, revisar/.test(text)));
});
