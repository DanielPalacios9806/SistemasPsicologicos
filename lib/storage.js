const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const LEGACY_DATA_FILE = path.join(DATA_DIR, "ema_submissions.json");
const LOCAL_STORE_FILE = path.join(DATA_DIR, "instrument_store.json");

const STORAGE_DRIVER = (process.env.STORAGE_DRIVER || "auto").toLowerCase();
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const LEGACY_SUPABASE_TABLE = process.env.SUPABASE_TABLE || "survey_submissions";

const TABLES = {
  people: process.env.SUPABASE_PEOPLE_TABLE || "people",
  applications: process.env.SUPABASE_APPLICATIONS_TABLE || "applications",
  responses: process.env.SUPABASE_RESPONSES_TABLE || "responses",
  partialResults: process.env.SUPABASE_PARTIAL_RESULTS_TABLE || "partial_results",
  finalResults: process.env.SUPABASE_FINAL_RESULTS_TABLE || "final_results",
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY));
}

function shouldUseSupabase() {
  if (STORAGE_DRIVER === "supabase") return true;
  if (STORAGE_DRIVER === "local") return false;
  return hasSupabaseConfig();
}

function getSupabaseHeaders() {
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !apiKey) {
    throw new Error("Faltan variables de entorno de Supabase para usar almacenamiento remoto.");
  }

  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase respondio con error (${response.status}): ${message}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEGACY_DATA_FILE)) fs.writeFileSync(LEGACY_DATA_FILE, "[]", "utf8");
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    fs.writeFileSync(
      LOCAL_STORE_FILE,
      JSON.stringify(
        { people: [], applications: [], responses: [], partialResults: [], finalResults: [] },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readLegacyLocalSubmissions() {
  ensureDataStore();
  return JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, "utf8"));
}

function readLocalStore() {
  ensureDataStore();
  return JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, "utf8"));
}

function writeLocalStore(store) {
  ensureDataStore();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function normalizeLegacyRemoteRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    participant: {
      googleId: row.google_id || "",
      email: row.email || "",
      picture: row.picture || "",
      fullName: row.full_name || "",
      idNumber: row.id_number || "",
      career: row.career || "",
      age: row.age || "",
      gender: row.gender || "",
      ...(row.participant || {}),
    },
    answers: Array.isArray(row.answers) ? row.answers : [],
    scoring: row.scoring || {},
  };
}

async function readLegacyRemoteSubmissions() {
  const rows = await supabaseRequest(`/rest/v1/${LEGACY_SUPABASE_TABLE}?select=*&order=created_at.desc`);
  return rows.map(normalizeLegacyRemoteRow);
}

async function findLegacyRemoteByIdNumber(idNumber) {
  const rows = await supabaseRequest(
    `/rest/v1/${LEGACY_SUPABASE_TABLE}?select=*&id_number=eq.${encodeURIComponent(idNumber)}&limit=1`
  );
  return normalizeLegacyRemoteRow(rows[0] || null);
}

async function readLegacySubmissions() {
  return shouldUseSupabase() ? readLegacyRemoteSubmissions() : readLegacyLocalSubmissions();
}

async function findLegacyEmaByIdNumber(idNumber) {
  if (shouldUseSupabase()) {
    return findLegacyRemoteByIdNumber(idNumber);
  }
  return readLegacyLocalSubmissions().find((item) => item.participant.idNumber === idNumber) || null;
}

function normalizeParticipant(participant = {}) {
  return {
    fullName: String(participant.fullName || "").trim(),
    idNumber: String(participant.idNumber || "").trim(),
    career: String(participant.career || "").trim(),
    age: String(participant.age || "").trim(),
    gender: String(participant.gender || "").trim(),
    email: String(participant.email || "").trim(),
    googleId: String(participant.googleId || "").trim(),
    picture: String(participant.picture || "").trim(),
  };
}

function applicationFromLegacySubmission(submission) {
  if (!submission) return null;
  return {
    id: `legacy-${submission.id}`,
    personId: `legacy-person-${submission.participant.idNumber}`,
    participant: normalizeParticipant(submission.participant),
    instrumentCode: "ema",
    instrumentName: "EMA",
    instrumentVersion: "EMA 45 reactivos",
    status: "completed",
    currentModuleKey: "ema",
    percentageComplete: 100,
    valid: true,
    startedAt: submission.createdAt,
    completedAt: submission.createdAt,
    scoringSnapshot: submission.scoring,
    answers: (submission.answers || []).map((answer) => ({
      itemId: answer.itemId || answer.questionId,
      value: answer.value,
      adjustedValue: answer.adjustedValue ?? null,
      moduleKey: "ema",
      componentKey: answer.dimension || "",
      subcomponentKeys: [],
    })),
    partialResults: (submission.scoring?.dimensions || []).map((dimension) => ({
      scopeType: "dimension",
      scopeKey: dimension.key,
      scopeLabel: dimension.label,
      rawScore: dimension.rawTotal,
      normalizedScore: dimension.favorablePercentage,
      category: dimension.band,
      completionRatio: 100,
      detailJson: dimension,
    })),
    finalResult: {
      totalRaw: submission.scoring?.totalRaw,
      totalNormalized: submission.scoring?.overallPercentage,
      profileGlobal: submission.scoring?.profile,
      valid: true,
      interpretationJson: {
        summary: submission.scoring?.summary,
        observations: submission.scoring?.observations,
      },
      detailJson: submission.scoring,
    },
    legacy: true,
  };
}

function listLocalApplications() {
  const store = readLocalStore();
  return store.applications.map((application) => hydrateLocalApplication(application.id, store));
}

function hydrateLocalApplication(applicationId, store = readLocalStore()) {
  const application = store.applications.find((item) => item.id === applicationId);
  if (!application) return null;
  const person = store.people.find((item) => item.id === application.personId) || {};
  const responses = store.responses
    .filter((item) => item.applicationId === applicationId)
    .sort((a, b) => a.itemId - b.itemId);
  const partialResults = store.partialResults.filter((item) => item.applicationId === applicationId);
  const finalResult = store.finalResults.find((item) => item.applicationId === applicationId) || null;

  return {
    ...application,
    participant: {
      ...normalizeParticipant(application.participantSnapshot || {}),
      ...normalizeParticipant(person),
    },
    answers: responses,
    partialResults,
    finalResult,
  };
}

function upsertLocalPerson(participant) {
  const store = readLocalStore();
  const normalized = normalizeParticipant(participant);
  let person = store.people.find((item) => item.idNumber === normalized.idNumber);
  if (person) {
    Object.assign(person, normalized);
  } else {
    person = {
      id: createId("person"),
      ...normalized,
      createdAt: new Date().toISOString(),
    };
    store.people.push(person);
  }
  writeLocalStore(store);
  return person;
}

function saveLocalApplicationAggregate(aggregate) {
  const store = readLocalStore();

  const existingApplicationIndex = store.applications.findIndex((item) => item.id === aggregate.id);
  const applicationRow = {
    id: aggregate.id,
    personId: aggregate.personId,
    instrumentCode: aggregate.instrumentCode,
    instrumentName: aggregate.instrumentName,
    instrumentVersion: aggregate.instrumentVersion,
    status: aggregate.status,
    currentModuleKey: aggregate.currentModuleKey,
    percentageComplete: aggregate.percentageComplete,
    valid: aggregate.valid,
    startedAt: aggregate.startedAt,
    completedAt: aggregate.completedAt || null,
    participantSnapshot: normalizeParticipant(aggregate.participant),
    scoringSnapshot: aggregate.scoringSnapshot || null,
  };

  if (existingApplicationIndex >= 0) {
    store.applications[existingApplicationIndex] = applicationRow;
  } else {
    store.applications.push(applicationRow);
  }

  store.responses = store.responses.filter((item) => item.applicationId !== aggregate.id);
  for (const answer of aggregate.answers || []) {
    store.responses.push({
      id: createId("response"),
      applicationId: aggregate.id,
      itemId: answer.itemId,
      response: answer.value,
      adjustedResponse: answer.adjustedValue ?? null,
      moduleKey: answer.moduleKey || "",
      componentKey: answer.componentKey || "",
      subcomponentKeys: answer.subcomponentKeys || [],
    });
  }

  store.partialResults = store.partialResults.filter((item) => item.applicationId !== aggregate.id);
  for (const partial of aggregate.partialResults || []) {
    store.partialResults.push({
      id: createId("partial"),
      applicationId: aggregate.id,
      scopeType: partial.scopeType,
      scopeKey: partial.scopeKey,
      scopeLabel: partial.scopeLabel,
      rawScore: partial.rawScore,
      normalizedScore: partial.normalizedScore,
      category: partial.category,
      completionRatio: partial.completionRatio,
      detailJson: partial.detailJson,
    });
  }

  store.finalResults = store.finalResults.filter((item) => item.applicationId !== aggregate.id);
  if (aggregate.finalResult) {
    store.finalResults.push({
      id: createId("final"),
      applicationId: aggregate.id,
      totalRaw: aggregate.finalResult.totalRaw,
      totalNormalized: aggregate.finalResult.totalNormalized,
      profileGlobal: aggregate.finalResult.profileGlobal,
      valid: aggregate.finalResult.valid,
      interpretationJson: aggregate.finalResult.interpretationJson,
      detailJson: aggregate.finalResult.detailJson,
    });
  }

  writeLocalStore(store);
}

async function findRemotePersonByIdNumber(idNumber) {
  const rows = await supabaseRequest(
    `/rest/v1/${TABLES.people}?select=*&id_number=eq.${encodeURIComponent(idNumber)}&limit=1`
  );
  return rows[0] || null;
}

async function upsertRemotePerson(participant) {
  const normalized = normalizeParticipant(participant);
  await supabaseRequest(`/rest/v1/${TABLES.people}?on_conflict=id_number`, {
    method: "POST",
    headers: {
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id_number: normalized.idNumber,
      full_name: normalized.fullName,
      age: normalized.age,
      gender: normalized.gender,
      career: normalized.career,
      email: normalized.email,
      google_id: normalized.googleId,
      picture: normalized.picture,
    }),
  });

  return findRemotePersonByIdNumber(normalized.idNumber);
}

async function findRemoteApplications(filter = {}) {
  const params = ["select=*"];
  if (filter.personId) params.push(`person_id=eq.${encodeURIComponent(filter.personId)}`);
  if (filter.instrumentCode) params.push(`instrument_code=eq.${encodeURIComponent(filter.instrumentCode)}`);
  if (filter.status) params.push(`status=eq.${encodeURIComponent(filter.status)}`);
  if (filter.id) params.push(`id=eq.${encodeURIComponent(filter.id)}`);
  params.push("order=started_at.desc");
  const endpoint = `/rest/v1/${TABLES.applications}?${params.join("&")}`;
  return supabaseRequest(endpoint);
}

async function readRemoteRowsByApplication(table, applicationId) {
  return supabaseRequest(
    `/rest/v1/${table}?select=*&application_id=eq.${encodeURIComponent(applicationId)}`
  );
}

async function hydrateRemoteApplication(applicationRow) {
  if (!applicationRow) return null;
  const [personRows, responses, partialResults, finalResults] = await Promise.all([
    supabaseRequest(`/rest/v1/${TABLES.people}?select=*&id=eq.${encodeURIComponent(applicationRow.person_id)}&limit=1`),
    readRemoteRowsByApplication(TABLES.responses, applicationRow.id),
    readRemoteRowsByApplication(TABLES.partialResults, applicationRow.id),
    readRemoteRowsByApplication(TABLES.finalResults, applicationRow.id),
  ]);

  const person = personRows[0] || {};
  return {
    id: applicationRow.id,
    personId: applicationRow.person_id,
    participant: {
      ...normalizeParticipant(applicationRow.participant_snapshot || {}),
      ...normalizeParticipant({
        fullName: person.full_name,
        idNumber: person.id_number,
        career: person.career,
        age: person.age,
        gender: person.gender,
        email: person.email,
        googleId: person.google_id,
        picture: person.picture,
      }),
    },
    instrumentCode: applicationRow.instrument_code,
    instrumentName: applicationRow.instrument_name,
    instrumentVersion: applicationRow.instrument_version,
    status: applicationRow.status,
    currentModuleKey: applicationRow.current_module_key,
    percentageComplete: Number(applicationRow.percentage_complete || 0),
    valid: applicationRow.valid,
    startedAt: applicationRow.started_at,
    completedAt: applicationRow.completed_at,
    scoringSnapshot: applicationRow.scoring_snapshot || null,
    answers: responses
      .map((item) => ({
        itemId: item.item_id,
        value: item.response,
        adjustedValue: item.adjusted_response,
        moduleKey: item.module_key,
        componentKey: item.component_key,
        subcomponentKeys: item.subcomponent_keys || [],
      }))
      .sort((a, b) => a.itemId - b.itemId),
    partialResults: partialResults.map((item) => ({
      scopeType: item.scope_type,
      scopeKey: item.scope_key,
      scopeLabel: item.scope_label,
      rawScore: item.raw_score,
      normalizedScore: item.normalized_score,
      category: item.category,
      completionRatio: item.completion_ratio,
      detailJson: item.detail_json,
    })),
    finalResult: finalResults[0]
      ? {
          totalRaw: finalResults[0].total_raw,
          totalNormalized: finalResults[0].total_normalized,
          profileGlobal: finalResults[0].profile_global,
          valid: finalResults[0].valid,
          interpretationJson: finalResults[0].interpretation_json,
          detailJson: finalResults[0].detail_json,
        }
      : null,
  };
}

async function saveRemoteApplicationAggregate(aggregate) {
  await supabaseRequest(`/rest/v1/${TABLES.applications}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: aggregate.id,
      person_id: aggregate.personId,
      instrument_code: aggregate.instrumentCode,
      instrument_name: aggregate.instrumentName,
      instrument_version: aggregate.instrumentVersion,
      status: aggregate.status,
      current_module_key: aggregate.currentModuleKey,
      percentage_complete: aggregate.percentageComplete,
      valid: aggregate.valid,
      started_at: aggregate.startedAt,
      completed_at: aggregate.completedAt || null,
      participant_snapshot: normalizeParticipant(aggregate.participant),
      scoring_snapshot: aggregate.scoringSnapshot || null,
    }),
  });

  await supabaseRequest(`/rest/v1/${TABLES.responses}?application_id=eq.${encodeURIComponent(aggregate.id)}`, {
    method: "DELETE",
  });
  if ((aggregate.answers || []).length) {
    await supabaseRequest(`/rest/v1/${TABLES.responses}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        aggregate.answers.map((answer) => ({
          id: createId("response"),
          application_id: aggregate.id,
          item_id: answer.itemId,
          response: answer.value,
          adjusted_response: answer.adjustedValue ?? null,
          module_key: answer.moduleKey || "",
          component_key: answer.componentKey || "",
          subcomponent_keys: answer.subcomponentKeys || [],
        }))
      ),
    });
  }

  await supabaseRequest(`/rest/v1/${TABLES.partialResults}?application_id=eq.${encodeURIComponent(aggregate.id)}`, {
    method: "DELETE",
  });
  if ((aggregate.partialResults || []).length) {
    await supabaseRequest(`/rest/v1/${TABLES.partialResults}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        aggregate.partialResults.map((partial) => ({
          id: createId("partial"),
          application_id: aggregate.id,
          scope_type: partial.scopeType,
          scope_key: partial.scopeKey,
          scope_label: partial.scopeLabel,
          raw_score: partial.rawScore,
          normalized_score: partial.normalizedScore,
          category: partial.category,
          completion_ratio: partial.completionRatio,
          detail_json: partial.detailJson,
        }))
      ),
    });
  }

  await supabaseRequest(`/rest/v1/${TABLES.finalResults}?application_id=eq.${encodeURIComponent(aggregate.id)}`, {
    method: "DELETE",
  });
  if (aggregate.finalResult) {
    await supabaseRequest(`/rest/v1/${TABLES.finalResults}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: createId("final"),
        application_id: aggregate.id,
        total_raw: aggregate.finalResult.totalRaw,
        total_normalized: aggregate.finalResult.totalNormalized,
        profile_global: aggregate.finalResult.profileGlobal,
        valid: aggregate.finalResult.valid,
        interpretation_json: aggregate.finalResult.interpretationJson,
        detail_json: aggregate.finalResult.detailJson,
      }),
    });
  }
}

async function initializeStorage() {
  if (!shouldUseSupabase()) {
    ensureDataStore();
    return { driver: "local" };
  }

  return { driver: "supabase" };
}

async function listApplications(filter = {}) {
  const instrumentCode = filter.instrumentCode ? String(filter.instrumentCode).toLowerCase() : "";
  const idNumber = filter.idNumber ? String(filter.idNumber).trim() : "";
  const status = filter.status ? String(filter.status).trim().toLowerCase() : "";

  const modernApplications = shouldUseSupabase()
    ? await (async () => {
        if (idNumber) {
          const person = await findRemotePersonByIdNumber(idNumber);
          if (!person) return [];
          const rows = await findRemoteApplications({
            personId: person.id,
            instrumentCode: instrumentCode || undefined,
            status: status || undefined,
          });
          return Promise.all(rows.map(hydrateRemoteApplication));
        }

        const rows = await findRemoteApplications({
          instrumentCode: instrumentCode || undefined,
          status: status || undefined,
        });
        return Promise.all(rows.map(hydrateRemoteApplication));
      })()
    : listLocalApplications().filter((application) => {
        if (instrumentCode && application.instrumentCode !== instrumentCode) return false;
        if (status && application.status !== status) return false;
        if (idNumber && application.participant.idNumber !== idNumber) return false;
        return true;
      });

  const legacyApplications = [];
  if (!instrumentCode || instrumentCode === "ema") {
    const legacy = await readLegacySubmissions();
    for (const submission of legacy) {
      if (idNumber && submission.participant.idNumber !== idNumber) continue;
      legacyApplications.push(applicationFromLegacySubmission(submission));
    }
  }

  return [...legacyApplications, ...modernApplications].sort((a, b) => {
    const aDate = new Date(a.completedAt || a.startedAt || 0).getTime();
    const bDate = new Date(b.completedAt || b.startedAt || 0).getTime();
    return bDate - aDate;
  });
}

async function getApplicationById(applicationId) {
  if (String(applicationId || "").startsWith("legacy-")) {
    const legacyId = String(applicationId).replace(/^legacy-/, "");
    const legacy = (await readLegacySubmissions()).find((item) => String(item.id) === legacyId);
    return applicationFromLegacySubmission(legacy);
  }

  if (shouldUseSupabase()) {
    const rows = await findRemoteApplications({ id: applicationId });
    return rows[0] ? hydrateRemoteApplication(rows[0]) : null;
  }
  return hydrateLocalApplication(applicationId);
}

async function findCurrentApplication(idNumber, instrumentCode) {
  const applications = await listApplications({ idNumber, instrumentCode });
  return (
    applications.find((item) => item.status === "in_progress") ||
    applications.find((item) => item.status === "completed") ||
    null
  );
}

async function startApplication({ participant, instrumentDefinition }) {
  const normalizedParticipant = normalizeParticipant(participant);
  const instrumentCode = instrumentDefinition.code;

  if (instrumentCode === "ema" && (await findLegacyEmaByIdNumber(normalizedParticipant.idNumber))) {
    throw new Error("Esta cedula ya tiene una aplicacion EMA previa en el sistema legado.");
  }

  const currentApplication = await findCurrentApplication(normalizedParticipant.idNumber, instrumentCode);
  if (currentApplication?.status === "in_progress") {
    return currentApplication;
  }
  if (instrumentCode === "ema" && currentApplication?.status === "completed") {
    throw new Error("Esta persona ya completo EMA y no puede registrar una segunda aplicacion EMA.");
  }
  if (instrumentCode === "baron" && currentApplication?.status === "completed") {
    return currentApplication;
  }

  const person = shouldUseSupabase()
    ? await upsertRemotePerson(normalizedParticipant)
    : upsertLocalPerson(normalizedParticipant);

  const aggregate = {
    id: createId("application"),
    personId: person.id,
    participant: normalizedParticipant,
    instrumentCode,
    instrumentName: instrumentDefinition.name,
    instrumentVersion: instrumentDefinition.version,
    status: "in_progress",
    currentModuleKey: instrumentDefinition.modules[0]?.key || instrumentCode,
    percentageComplete: 0,
    valid: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    scoringSnapshot: null,
    answers: [],
    partialResults: [],
    finalResult: null,
  };

  if (shouldUseSupabase()) {
    await saveRemoteApplicationAggregate(aggregate);
  } else {
    saveLocalApplicationAggregate(aggregate);
  }

  return getApplicationById(aggregate.id);
}

async function saveApplicationProgress(aggregate) {
  if (aggregate.legacy) {
    throw new Error("No es posible modificar aplicaciones legadas.");
  }

  const person = shouldUseSupabase()
    ? await upsertRemotePerson(aggregate.participant)
    : upsertLocalPerson(aggregate.participant);

  const payload = {
    ...aggregate,
    personId: person.id,
  };

  if (shouldUseSupabase()) {
    await saveRemoteApplicationAggregate(payload);
  } else {
    saveLocalApplicationAggregate(payload);
  }

  return getApplicationById(payload.id);
}

async function exportApplications(filter = {}) {
  return listApplications(filter);
}

module.exports = {
  DATA_DIR,
  LEGACY_DATA_FILE,
  LOCAL_STORE_FILE,
  TABLES,
  ensureDataStore,
  hasSupabaseConfig,
  shouldUseSupabase,
  initializeStorage,
  findLegacyEmaByIdNumber,
  listApplications,
  getApplicationById,
  findCurrentApplication,
  startApplication,
  saveApplicationProgress,
  exportApplications,
};
