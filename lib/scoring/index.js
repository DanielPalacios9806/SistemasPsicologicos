const { scoreSubmission: scoreEmaSubmission, normalizeAnswer: normalizeEmaAnswer } = require("../scoring");
const { scoreBaronApplication, normalizeAnswer: normalizeBaronAnswer } = require("./baronScoring");
const { scoreDiscApplication, normalizeAnswer: normalizeDiscAnswer } = require("./discScoring");
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
  if (code === "disc") {
    return scoreDiscApplication(answers);
  }
  throw new Error("Instrumento no soportado para scoring.");
}

function normalizeInstrumentAnswer(instrumentCode, value) {
  const code = String(instrumentCode || "").trim().toLowerCase();
  if (code === "baron") return normalizeBaronAnswer(value);
  if (code === "disc") return normalizeDiscAnswer(value);
  return normalizeEmaAnswer(value);
}

module.exports = {
  scoreInstrumentApplication,
  normalizeInstrumentAnswer,
};
