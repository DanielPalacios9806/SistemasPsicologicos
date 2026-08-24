const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");

process.env.STORAGE_DRIVER = "local";
process.env.APP_DATA_DIR = path.join(os.tmpdir(), `mente-de-acero-flow-tests-${process.pid}`);

const { startApplication, saveApplicationProgress, getApplicationById } = require("../lib/storage");
const { getInstrumentDefinition } = require("../lib/instruments");
const { scoreSubmission } = require("../lib/scoring");
const { scoreBaronApplication } = require("../lib/scoring/baronScoring");
const { scoreDiscApplication } = require("../lib/scoring/discScoring");

function randomCedula() {
  return "09" + Math.floor(10000000 + Math.random() * 89999999).toString();
}

test("Full User Flow: EMA assessment lifecycle (Start -> Autosave -> Resume -> Complete -> Score)", async () => {
  const participant = {
    fullName: "Juan Perez Prueba",
    idNumber: randomCedula(),
    email: "juan.test@mentedeacero.com",
    institution: "Mente de Acero",
  };

  const instrumentDefinition = getInstrumentDefinition("ema");

  // 1. START
  const app = await startApplication({
    participant,
    instrumentDefinition,
  });

  assert.ok(app.id);
  assert.equal(app.instrumentCode, "ema");
  assert.equal(app.status, "in_progress");
  assert.equal(app.percentageComplete, 0);

  // 2. AUTOSAVE (simulate answering first 20 questions)
  const answersStep1 = [];
  for (let i = 1; i <= 20; i++) {
    answersStep1.push({ itemId: i, value: 4 });
  }

  const updatedStep1 = await saveApplicationProgress({
    ...app,
    answers: answersStep1,
    percentageComplete: 44,
  });

  assert.equal(updatedStep1.percentageComplete, 44);
  assert.equal(updatedStep1.answers.length, 20);

  // 3. LEAVE PAGE & RESUME (reload from storage)
  const resumed = await getApplicationById(app.id);
  assert.equal(resumed.answers.length, 20);
  assert.equal(resumed.percentageComplete, 44);

  // 4. COMPLETE (answer remaining questions and compute score)
  const allAnswers = [];
  for (let i = 1; i <= 45; i++) {
    allAnswers.push({ itemId: i, value: 4 });
  }

  const rawValues = allAnswers.map((a) => a.value);
  const scoringSnapshot = scoreSubmission(rawValues);

  const completed = await saveApplicationProgress({
    ...resumed,
    answers: allAnswers,
    percentageComplete: 100,
    status: "completed",
    completedAt: new Date().toISOString(),
    scoringSnapshot,
    finalResult: {
      totalRaw: scoringSnapshot.totalRaw,
      totalNormalized: scoringSnapshot.overallPercentage,
      profileGlobal: scoringSnapshot.profile,
      valid: true,
      interpretationJson: {
        summary: scoringSnapshot.summary,
        observations: scoringSnapshot.observations,
      },
      detailJson: scoringSnapshot,
    },
  });

  assert.equal(completed.status, "completed");
  assert.equal(completed.percentageComplete, 100);
  assert.ok(completed.finalResult);
  assert.equal(completed.finalResult.totalNormalized, 50.67);
  assert.equal(completed.finalResult.detailJson.dimensions.length, 3);
});

test("Full User Flow: Bar-On ICE assessment lifecycle (Start -> Autosave -> Complete -> Validated CE)", async () => {
  const participant = {
    fullName: "Maria Gomez Prueba",
    idNumber: randomCedula(),
    email: "maria.test@mentedeacero.com",
  };

  const instrumentDefinition = getInstrumentDefinition("baron");

  const app = await startApplication({
    participant,
    instrumentDefinition,
  });

  assert.ok(app.id);
  assert.equal(app.instrumentCode, "baron");

  // Answers map
  const baronAnswers = {};
  for (let i = 1; i <= 133; i++) {
    baronAnswers[i] = 4;
  }
  baronAnswers[133] = 5; // Honesty

  const scoringSnapshot = scoreBaronApplication(baronAnswers);

  const completed = await saveApplicationProgress({
    ...app,
    answers: Object.entries(baronAnswers).map(([k, v]) => ({ itemId: Number(k), value: v })),
    percentageComplete: 100,
    status: "completed",
    completedAt: new Date().toISOString(),
    scoringSnapshot,
    finalResult: {
      totalRaw: scoringSnapshot.total.rawScore,
      totalNormalized: scoringSnapshot.total.ceScore,
      profileGlobal: scoringSnapshot.profile,
      valid: scoringSnapshot.validity.valid,
      interpretationJson: {
        summary: scoringSnapshot.summary,
        observations: scoringSnapshot.observations,
      },
      detailJson: scoringSnapshot,
    },
  });

  assert.equal(completed.status, "completed");
  assert.equal(completed.finalResult.detailJson.components.length, 5);
  assert.equal(completed.finalResult.detailJson.subcomponents.length, 15);
  assert.ok(completed.finalResult.totalNormalized > 0);
});

test("Full User Flow: DISC assessment lifecycle (Start -> Autosave -> Complete -> Pattern Profile)", async () => {
  const participant = {
    fullName: "Carlos Ruiz Prueba",
    idNumber: randomCedula(),
  };

  const instrumentDefinition = getInstrumentDefinition("disc");

  const app = await startApplication({
    participant,
    instrumentDefinition,
  });

  assert.ok(app.id);
  assert.equal(app.instrumentCode, "disc");

  const discAnswers = {};
  for (let i = 1; i <= 28; i++) {
    discAnswers[i] = 14;
  }

  const scoringSnapshot = scoreDiscApplication(discAnswers);

  const completed = await saveApplicationProgress({
    ...app,
    percentageComplete: 100,
    status: "completed",
    completedAt: new Date().toISOString(),
    scoringSnapshot,
    finalResult: {
      totalRaw: scoringSnapshot.totalRaw,
      totalNormalized: scoringSnapshot.overallPercentage,
      profileGlobal: scoringSnapshot.profile,
      valid: true,
      interpretationJson: {
        summary: scoringSnapshot.summary,
        observations: scoringSnapshot.observations,
      },
      detailJson: scoringSnapshot,
    },
  });

  assert.equal(completed.status, "completed");
  assert.ok(completed.finalResult.profileGlobal);
  assert.equal(
    completed.finalResult.detailJson.most.D +
      completed.finalResult.detailJson.most.I +
      completed.finalResult.detailJson.most.S +
      completed.finalResult.detailJson.most.C,
    28
  );
});
