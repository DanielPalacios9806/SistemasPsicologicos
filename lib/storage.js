const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "ema_submissions.json");

const STORAGE_DRIVER = (process.env.STORAGE_DRIVER || "auto").toLowerCase();
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "survey_submissions";

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readLocalSubmissions() {
  ensureDataStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeLocalSubmissions(submissions) {
  ensureDataStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
}

function saveLocalSubmission(submission) {
  const current = readLocalSubmissions();
  current.push(submission);
  writeLocalSubmissions(current);
}

function findLocalByIdNumber(idNumber) {
  const current = readLocalSubmissions();
  return current.find((item) => item.participant.idNumber === idNumber) || null;
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

function normalizeRemoteRow(row) {
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

function toRemoteRow(submission) {
  const participant = submission.participant || {};

  return {
    id: submission.id,
    created_at: submission.createdAt,
    id_number: participant.idNumber,
    full_name: participant.fullName,
    career: participant.career,
    age: participant.age,
    gender: participant.gender,
    email: participant.email || "",
    google_id: participant.googleId || "",
    picture: participant.picture || "",
    participant,
    answers: submission.answers,
    scoring: submission.scoring,
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

async function readRemoteSubmissions() {
  const rows = await supabaseRequest(
    `/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc`
  );
  return rows.map(normalizeRemoteRow);
}

async function saveRemoteSubmission(submission) {
  const payload = toRemoteRow(submission);
  await supabaseRequest(`/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });
}

async function findRemoteByIdNumber(idNumber) {
  const rows = await supabaseRequest(
    `/rest/v1/${SUPABASE_TABLE}?select=*&id_number=eq.${encodeURIComponent(idNumber)}&limit=1`
  );
  return normalizeRemoteRow(rows[0] || null);
}

async function initializeStorage() {
  if (!shouldUseSupabase()) {
    ensureDataStore();
    return { driver: "local" };
  }

  return { driver: "supabase" };
}

async function readSubmissions() {
  return shouldUseSupabase() ? readRemoteSubmissions() : readLocalSubmissions();
}

async function saveSubmission(submission) {
  if (shouldUseSupabase()) {
    await saveRemoteSubmission(submission);
    return submission;
  }

  saveLocalSubmission(submission);
  return submission;
}

async function findByIdNumber(idNumber) {
  return shouldUseSupabase() ? findRemoteByIdNumber(idNumber) : findLocalByIdNumber(idNumber);
}

module.exports = {
  DATA_DIR,
  DATA_FILE,
  SUPABASE_TABLE,
  ensureDataStore,
  hasSupabaseConfig,
  initializeStorage,
  readSubmissions,
  saveSubmission,
  findByIdNumber,
  shouldUseSupabase,
};
