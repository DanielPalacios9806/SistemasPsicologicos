const { scoreSubmission: scoreEmaSubmission, normalizeAnswer: normalizeEmaAnswer } = require("../scoring");
const { scoreBaronApplication, normalizeAnswer: normalizeBaronAnswer } = require("./baronScoring");
const { getInstrumentDefinition: getEmaDefinition } = require("../instruments/ema");

function toOrderedEmaAnswers(answers) {
  if (Array.isArray(answers)) return answers;
  const instrument = getEmaDefinition();
  return instrument.items.map((item) => answers?.[item.id] ?? answers?.[String(item.id)] ?? null);
}

function scoreInstrumentApplication(instrumentCode, answers) {
  const code = String(instrumentCode || "").trim().toLowerCase();
  if (code === "ema") {
    return scoreEmaSubmission(toOrderedEmaAnswers(answers));
  }
  if (code === "baron") {
    return scoreBaronApplication(answers);
  }
  throw new Error("Instrumento no soportado para scoring.");
}

function normalizeInstrumentAnswer(instrumentCode, value) {
  return String(instrumentCode || "").trim().toLowerCase() === "baron"
    ? normalizeBaronAnswer(value)
    : normalizeEmaAnswer(value);
}

module.exports = {
  scoreInstrumentApplication,
  normalizeInstrumentAnswer,
};
