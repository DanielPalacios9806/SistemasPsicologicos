const { getInstrumentDefinition: getEmaDefinition } = require("./ema");
const { getInstrumentDefinition: getBaronDefinition } = require("./baron");

const INSTRUMENT_LOADERS = {
  ema: getEmaDefinition,
  baron: getBaronDefinition,
};

function listInstruments() {
  return Object.entries(INSTRUMENT_LOADERS).map(([code, loader]) => {
    const definition = loader();
    return {
      code,
      name: definition.name,
      version: definition.version,
      description: definition.description,
      moduleCount: definition.modules.length,
      itemCount: definition.items.length,
    };
  });
}

function getInstrumentDefinition(code) {
  const key = String(code || "ema").trim().toLowerCase();
  const loader = INSTRUMENT_LOADERS[key];
  if (!loader) {
    throw new Error("Instrumento no soportado.");
  }
  return loader();
}

module.exports = {
  listInstruments,
  getInstrumentDefinition,
};
