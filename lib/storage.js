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
  personnelProfiles: process.env.SUPABASE_PERSONNEL_PROFILES_TABLE || "personnel_profiles",
  userAccounts: process.env.SUPABASE_USER_ACCOUNTS_TABLE || "user_accounts",
  assessmentCampaigns: process.env.SUPABASE_ASSESSMENT_CAMPAIGNS_TABLE || "assessment_campaigns",
  assessmentAssignments: process.env.SUPABASE_ASSESSMENT_ASSIGNMENTS_TABLE || "assessment_assignments",
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
  if (!SUPABASE_URL) {
    throw new Error("Falta SUPABASE_URL para usar almacenamiento remoto.");
  }
  if (STORAGE_DRIVER === "supabase" && !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("STORAGE_DRIVER=supabase requiere SUPABASE_SERVICE_ROLE_KEY valida en backend.");
  }
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!apiKey) {
    throw new Error("Falta una credencial Supabase para usar almacenamiento remoto.");
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

async function supabaseRequestAll(endpoint, pageSize = 1000) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const page = await supabaseRequest(`${endpoint}${separator}limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(page)) return page;

    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function getSupabaseUrl() {
  return SUPABASE_URL;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function uniqueValues(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function formatPostgrestIn(values) {
  return values.map((value) => encodeURIComponent(value)).join(",");
}

function groupRowsBy(rows, fieldName) {
  const grouped = new Map();
  for (const row of rows || []) {
    const key = row?.[fieldName];
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
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
  const rows = await supabaseRequestAll(`/rest/v1/${LEGACY_SUPABASE_TABLE}?select=*&order=created_at.desc`);
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

async function findRemotePersonById(personId) {
  const rows = await supabaseRequest(
    `/rest/v1/${TABLES.people}?select=*&id=eq.${encodeURIComponent(personId)}&limit=1`
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

async function findAccountByUsername(username) {
  const rows = await supabaseRequest(
    `/rest/v1/${TABLES.userAccounts}?select=*&username=eq.${encodeURIComponent(username)}&limit=1`
  );
  return rows[0] || null;
}

async function findAccountById(accountId) {
  const rows = await supabaseRequest(
    `/rest/v1/${TABLES.userAccounts}?select=*&id=eq.${encodeURIComponent(accountId)}&limit=1`
  );
  return rows[0] || null;
}

async function updateAccountLoginState(accountId, patch) {
  await supabaseRequest(`/rest/v1/${TABLES.userAccounts}?id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      ...patch,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function updateAccountPassword(accountId, password) {
  await updateAccountLoginState(accountId, {
    password_hash: password.hash,
    password_salt: password.salt,
    password_algorithm: password.algorithm,
    must_change_password: false,
    failed_login_attempts: 0,
    locked_until: null,
    password_changed_at: new Date().toISOString(),
    token_version: 1,
  });
}

async function getPersonByAccount(account) {
  if (!account?.person_id) return null;
  const person = await findRemotePersonById(account.person_id);
  if (!person) return null;
  return normalizeParticipant({
    fullName: person.full_name,
    idNumber: person.id_number,
    career: person.career,
    age: person.age,
    gender: person.gender,
    email: person.email,
    googleId: person.google_id,
    picture: person.picture,
  });
}

async function getActiveCampaign() {
  const rows = await supabaseRequestAll(
    `/rest/v1/${TABLES.assessmentCampaigns}?select=*&active=eq.true&order=starts_at.desc&limit=1`
  );
  return rows[0] || null;
}

async function upsertPersonnelRecord(record) {
  const participant = {
    fullName: record.fullName,
    idNumber: record.idNumber,
    career: record.unitCode || "PERSONAL MILITAR",
    age: "",
    gender: record.sex || "",
    email: "",
    googleId: "",
    picture: "",
  };
  const existingPerson = await findRemotePersonByIdNumber(record.idNumber);
  const person = await upsertRemotePerson(participant);

  await supabaseRequest(`/rest/v1/${TABLES.personnelProfiles}?on_conflict=person_id`, {
    method: "POST",
    headers: { Prefer: "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify({
      person_id: person.id,
      unit_code: record.unitCode || null,
      rank_code: record.rankCode,
      promotion: record.promotion,
      specialty_code: record.specialtyCode || null,
      description: record.description || null,
      sex: record.sex || null,
      classification: record.classification || null,
      source: "ESCALAFON_2026",
      source_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  const existingAccount = await findAccountByUsername(record.idNumber);
  let accountCreated = false;
  if (!existingAccount) {
    accountCreated = true;
    await supabaseRequest(`/rest/v1/${TABLES.userAccounts}`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        person_id: person.id,
        username: record.idNumber,
        password_hash: record.passwordHash,
        password_salt: record.passwordSalt,
        password_algorithm: "scrypt-v1",
        role: "participant",
        active: true,
        must_change_password: true,
      }),
    });
  } else if (record.resetAccount) {
    await supabaseRequest(`/rest/v1/${TABLES.userAccounts}?id=eq.${encodeURIComponent(existingAccount.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        password_hash: record.passwordHash,
        password_salt: record.passwordSalt,
        password_algorithm: "scrypt-v1",
        must_change_password: true,
        failed_login_attempts: 0,
        locked_until: null,
        token_version: Number(existingAccount.token_version || 0) + 1,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  return {
    person,
    personCreated: !existingPerson,
    accountCreated,
  };
}

async function createAssignmentsForPerson(personId, campaignId, instrumentCodes) {
  const createdOrKept = [];
  for (const code of instrumentCodes) {
    await supabaseRequest(`/rest/v1/${TABLES.assessmentAssignments}?on_conflict=campaign_id,person_id,instrument_code`, {
      method: "POST",
      headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify({
        campaign_id: campaignId,
        person_id: personId,
        instrument_code: code,
        required: true,
        status: "pending",
      }),
    });
    createdOrKept.push(code);
  }
  return { createdOrKept };
}

async function listAssignmentsForPerson(personId) {
  const campaign = await getActiveCampaign();
  if (!campaign) return [];
  const rows = await supabaseRequestAll(
    `/rest/v1/${TABLES.assessmentAssignments}?select=*&campaign_id=eq.${encodeURIComponent(campaign.id)}&person_id=eq.${encodeURIComponent(personId)}&order=instrument_code.asc`
  );
  const applications = await hydrateRemoteApplications(await findRemoteApplications({ personId }));
  return rows.map((row) => {
    const app = applications.find((item) => item.instrumentCode === row.instrument_code);
    const status = app?.status === "completed" || app?.status === "invalid" ? "completed" : app?.status === "in_progress" ? "in_progress" : row.status;
    return {
      id: row.id,
      campaignId: row.campaign_id,
      personId: row.person_id,
      instrumentCode: row.instrument_code,
      required: row.required,
      status,
      assignedAt: row.assigned_at,
      completedAt: app?.completedAt || row.completed_at,
      applicationId: app?.id || null,
    };
  });
}

async function hasAssignmentForInstrument(personId, instrumentCode) {
  const assignments = await listAssignmentsForPerson(personId);
  return assignments.some((item) => item.instrumentCode === String(instrumentCode || "").toLowerCase());
}

async function findRemoteApplications(filter = {}) {
  const params = ["select=*"];
  if (filter.personId) params.push(`person_id=eq.${encodeURIComponent(filter.personId)}`);
  if (filter.instrumentCode) params.push(`instrument_code=eq.${encodeURIComponent(filter.instrumentCode)}`);
  if (filter.status) params.push(`status=eq.${encodeURIComponent(filter.status)}`);
  if (filter.id) params.push(`id=eq.${encodeURIComponent(filter.id)}`);
  params.push("order=started_at.desc");
  const endpoint = `/rest/v1/${TABLES.applications}?${params.join("&")}`;
  return supabaseRequestAll(endpoint);
}

async function readRemoteRowsByIds(table, columnName, ids, chunkSize = 75, extraParams = "") {
  const uniqueIds = uniqueValues(ids);
  if (!uniqueIds.length) return [];

  const rows = [];
  for (const chunk of chunkArray(uniqueIds, chunkSize)) {
    const endpoint = `/rest/v1/${table}?select=*&${columnName}=in.(${formatPostgrestIn(chunk)})${extraParams}`;
    rows.push(...(await supabaseRequestAll(endpoint)));
  }
  return rows;
}

async function readRemoteRowsByApplications(table, applicationIds, options = {}) {
  return readRemoteRowsByIds(
    table,
    "application_id",
    applicationIds,
    options.chunkSize || 50,
    options.order ? `&order=${options.order}` : ""
  );
}

function hydrateRemoteApplicationFromRows(applicationRow, relatedRows) {
  if (!applicationRow) return null;

  const person = relatedRows.peopleById.get(applicationRow.person_id) || {};
  const personParticipant = person.id
    ? normalizeParticipant({
        fullName: person.full_name,
        idNumber: person.id_number,
        career: person.career,
        age: person.age,
        gender: person.gender,
        email: person.email,
        googleId: person.google_id,
        picture: person.picture,
      })
    : {};
  const responses = relatedRows.responsesByApplication.get(applicationRow.id) || [];
  const partialResults = relatedRows.partialResultsByApplication.get(applicationRow.id) || [];
  const finalResults = relatedRows.finalResultsByApplication.get(applicationRow.id) || [];

  return {
    id: applicationRow.id,
    personId: applicationRow.person_id,
    participant: {
      ...normalizeParticipant(applicationRow.participant_snapshot || {}),
      ...personParticipant,
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

async function hydrateRemoteApplications(applicationRows) {
  const rows = (applicationRows || []).filter(Boolean);
  if (!rows.length) return [];

  const applicationIds = rows.map((application) => application.id);
  const [people, responses, partialResults, finalResults] = await Promise.all([
    readRemoteRowsByIds(TABLES.people, "id", rows.map((application) => application.person_id)),
    readRemoteRowsByApplications(TABLES.responses, applicationIds, {
      chunkSize: 5,
      order: "item_id.asc",
    }),
    readRemoteRowsByApplications(TABLES.partialResults, applicationIds),
    readRemoteRowsByApplications(TABLES.finalResults, applicationIds),
  ]);

  const relatedRows = {
    peopleById: new Map(people.map((person) => [person.id, person])),
    responsesByApplication: groupRowsBy(responses, "application_id"),
    partialResultsByApplication: groupRowsBy(partialResults, "application_id"),
    finalResultsByApplication: groupRowsBy(finalResults, "application_id"),
  };

  return rows.map((application) => hydrateRemoteApplicationFromRows(application, relatedRows));
}

async function hydrateRemoteApplication(applicationRow) {
  const hydrated = await hydrateRemoteApplications(applicationRow ? [applicationRow] : []);
  return hydrated[0] || null;
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
          return hydrateRemoteApplications(rows);
        }

        const rows = await findRemoteApplications({
          instrumentCode: instrumentCode || undefined,
          status: status || undefined,
        });
        return hydrateRemoteApplications(rows);
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
  if (participant.personId) {
    const assigned = await hasAssignmentForInstrument(participant.personId, instrumentCode);
    if (!assigned) throw new Error("No tienes asignado este instrumento.");
  }

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
  getSupabaseUrl,
  supabaseRequest,
  supabaseRequestAll,
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
  findAccountByUsername,
  findAccountById,
  updateAccountLoginState,
  updateAccountPassword,
  getPersonByAccount,
  getActiveCampaign,
  upsertPersonnelRecord,
  createAssignmentsForPerson,
  listAssignmentsForPerson,
  hasAssignmentForInstrument,
};
