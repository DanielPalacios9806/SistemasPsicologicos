const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { getServerConfig } = require("./lib/env");
const { listInstruments, getInstrumentDefinition } = require("./lib/instruments");
const { buildExcelWorkbook } = require("./lib/exportExcel");
const { scoreInstrumentApplication, normalizeInstrumentAnswer } = require("./lib/scoring/index");
const { verifyPassword, hashPassword, validateNewPassword } = require("./lib/auth/password");
const {
  createSessionToken,
  getSessionFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
} = require("./lib/auth/session");
const {
  initializeStorage,
  shouldUseSupabase,
  startApplication,
  getApplicationById,
  findCurrentApplication,
  saveApplicationProgress,
  listApplications,
  listApplicationSummaries,
  findAccountByUsername,
  findAccountById,
  updateAccountLoginState,
  updateAccountPassword,
  getPersonByAccount,
  listAssignmentsForPerson,
  createStaffAccount,
  listStaffAccounts,
  updateStaffAccount,
  listCampaigns,
  createCampaign,
  updateCampaign,
  createAssignmentsForPerson,
  listStaffCampaignAccess,
  replaceStaffCampaignAccess,
  listPersonIdsForCampaigns,
  recordAuditEvent,
  listDirectory,
  supabaseRequestAll,
  TABLES,
} = require("./lib/storage");

const config = getServerConfig();
const PORT = config.port;
const GOOGLE_CLIENT_ID = config.googleClientId;
const PUBLIC_DIR = path.join(__dirname, "public");
const VENDOR_FILES = {
  "/vendor/lucide.js": path.join(__dirname, "node_modules", "lucide", "dist", "umd", "lucide.min.js"),
};
const APP_VERSION = process.env.RENDER_GIT_COMMIT || "local";
const loginAttempts = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "same-origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

async function getAuthenticatedContext(req) {
  const session = getSessionFromRequest(req);
  if (!session?.sub) return null;
  const account = await findAccountById(session.sub);
  if (!account || !account.active || Number(account.token_version || 0) !== Number(session.tokenVersion || 0)) return null;
  const person = account.person_id ? await getPersonByAccount(account) : null;
  return { session, account, person };
}

async function requireStaff(req, res, roles = ["admin", "psychologist"]) {
  const context = await getAuthenticatedContext(req);
  if (context && roles.includes(context.account.role)) {
    if (context.account.must_change_password) {
      sendJson(res, 403, { error: "Debes cambiar tu contrasena antes de continuar.", mustChangePassword: true });
      return null;
    }
    return context;
  }
  sendJson(res, 401, { error: "Acceso de personal no autorizado." });
  return null;
}

async function requireAdmin(req, res) {
  return requireStaff(req, res, ["admin"]);
}

function isProductionRequest(req) {
  return config.nodeEnv === "production" || String(req.headers["x-forwarded-proto"] || "").includes("https");
}

function getClientKey(req, username = "") {
  return `${req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local"}:${username}`;
}

function checkLoginRateLimit(req, username) {
  const key = getClientKey(req, username);
  const entry = loginAttempts.get(key);
  if (!entry) return null;
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) return entry.lockedUntil;
  return null;
}

function recordLoginFailure(req, username) {
  const key = getClientKey(req, username);
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = Date.now() + 15 * 60 * 1000;
    entry.count = 0;
  }
  loginAttempts.set(key, entry);
}

function clearLoginFailures(req, username) {
  loginAttempts.delete(getClientKey(req, username));
}

async function getParticipantContext(req) {
  const context = await getAuthenticatedContext(req);
  if (!context || context.account.role !== "participant" || !context.person) return null;
  return context;
}

async function requireParticipant(req, res, { allowPasswordChange = false } = {}) {
  const context = await getParticipantContext(req);
  if (!context) {
    sendJson(res, 401, { error: "Sesion requerida." });
    return null;
  }
  if (context.account.must_change_password && !allowPasswordChange) {
    sendJson(res, 403, { error: "Debes cambiar tu contrasena antes de continuar.", mustChangePassword: true });
    return null;
  }
  return context;
}

async function getStaffPersonScope(context) {
  if (!context || context.account?.role === "admin") return null;
  const campaignIds = await listStaffCampaignAccess(context.account.id);
  return new Set(await listPersonIdsForCampaigns(campaignIds));
}

async function listApplicationsForStaff(context, filter = {}, { summaries = false } = {}) {
  const applications = summaries ? await listApplicationSummaries(filter) : await listApplications(filter);
  const personScope = await getStaffPersonScope(context);
  return personScope ? applications.filter((application) => personScope.has(application.personId)) : applications;
}

async function staffCanAccessApplication(context, application) {
  const personScope = await getStaffPersonScope(context);
  return !personScope || personScope.has(application.personId);
}

async function auditSafely(event) {
  if (!shouldUseSupabase()) return;
  try {
    await recordAuditEvent(event);
  } catch (error) {
    console.warn("No se pudo registrar el evento de auditoria:", error.message);
  }
}

function buildUserPayload(context) {
  return {
    username: context.account.username,
    role: context.account.role,
    mustChangePassword: context.account.must_change_password,
    person: context.person,
  };
}

function requireSupabaseManagement(res) {
  if (shouldUseSupabase()) return true;
  sendJson(res, 503, { error: "La gestion institucional requiere la base de datos configurada." });
  return false;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  return String(value).toLowerCase() === "true";
}

function validateCampaignInput({ name, startsAt, endsAt }) {
  const normalizedName = String(name || "").trim();
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (normalizedName.length < 4) throw new Error("El nombre de la campana debe tener al menos 4 caracteres.");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Las fechas de la campana no son validas.");
  if (end <= start) throw new Error("La fecha de cierre debe ser posterior a la fecha de inicio.");
  return { name: normalizedName, startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function validateInstrumentCodes(codes) {
  const instruments = [...new Set((Array.isArray(codes) ? codes : []).map((code) => String(code).toLowerCase()))];
  if (!instruments.length || instruments.some((code) => !["ema", "baron", "disc"].includes(code))) {
    throw new Error("Selecciona al menos un instrumento valido.");
  }
  return instruments;
}

async function buildAdminOverview(context) {
  const [campaigns, applications, staff, peopleRows, assignmentRows] = await Promise.all([
    listCampaigns(),
    listApplicationsForStaff(context, {}, { summaries: true }),
    listStaffAccounts(),
    supabaseRequestAll(`/rest/v1/${TABLES.people}?select=id`),
    supabaseRequestAll(`/rest/v1/${TABLES.assessmentAssignments}?select=person_id,campaign_id,instrument_code,status`),
  ]);
  const personScope = await getStaffPersonScope(context);
  const scopedAssignments = personScope
    ? assignmentRows.filter((assignment) => personScope.has(assignment.person_id))
    : assignmentRows;
  const statuses = { pending: 0, in_progress: 0, completed: 0 };
  for (const assignment of scopedAssignments) statuses[assignment.status] = (statuses[assignment.status] || 0) + 1;
  const instruments = { ema: 0, baron: 0, disc: 0 };
  for (const application of applications) instruments[application.instrumentCode] = (instruments[application.instrumentCode] || 0) + 1;
  return {
    totals: {
      participants: personScope ? personScope.size : peopleRows.length,
      assignments: scopedAssignments.length,
      applications: applications.length,
      completed: applications.filter((application) => ["completed", "invalid"].includes(application.status)).length,
      staff: context.account.role === "admin" ? staff.length : null,
    },
    statuses,
    instruments,
    campaigns,
    recentApplications: applications
      .slice()
      .sort((left, right) => new Date(right.completedAt || right.startedAt || 0) - new Date(left.completedAt || left.startedAt || 0))
      .slice(0, 8),
  };
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 500, { error: "No se pudo cargar el recurso." });
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, max-age=0",
    });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 3_000_000) {
        reject(new Error("El cuerpo de la solicitud es demasiado grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

async function verifyGoogleCredential(credential) {
  if (!credential) throw new Error("No se recibio la credencial de Google.");
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("No fue posible validar la sesion de Google.");
  const payload = await response.json();

  if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("La credencial no coincide con el cliente configurado.");
  }

  return {
    googleId: payload.sub || "",
    fullName: payload.name || "",
    email: payload.email || "",
    picture: payload.picture || "",
    emailVerified: payload.email_verified === "true" || payload.email_verified === true,
  };
}

function isValidIdNumber(idNumber) {
  return /^\d{8,15}$/.test(String(idNumber || "").trim());
}

function sanitizeParticipant(body) {
  return {
    googleId: body.googleId || "",
    email: (body.email || "").trim(),
    picture: body.picture || "",
    fullName: String(body.fullName || "").trim(),
    idNumber: String(body.idNumber || "").trim(),
    career: String(body.career || "").trim(),
    age: String(body.age || "").trim(),
    gender: String(body.gender || "").trim(),
  };
}

function validateParticipant(participant) {
  const requiredFields = ["fullName", "idNumber", "career", "age", "gender"];
  for (const field of requiredFields) {
    if (!participant[field]) return `El campo ${field} es obligatorio.`;
  }

  if (!isValidIdNumber(participant.idNumber)) {
    return "La cedula debe contener solo numeros y entre 8 y 15 digitos.";
  }

  return null;
}

function getInstrumentOrThrow(instrumentCode) {
  try {
    return getInstrumentDefinition(instrumentCode);
  } catch {
    throw new Error("Instrumento no soportado.");
  }
}

function buildAnswerPayloadMap(answers = []) {
  const map = {};
  for (const answer of answers) {
    map[answer.itemId] = answer.value;
  }
  return map;
}

function computeApplicationProgress(instrumentDefinition, answers) {
  const totalItems = instrumentDefinition.items.length;
  const answeredCount = answers.filter((answer) => answer.value != null).length;
  const percentage = totalItems ? Math.round((answeredCount / totalItems) * 100) : 0;
  return { answeredCount, totalItems, percentage };
}

function serializeAnswersForStorage(instrumentDefinition, scoringSnapshot, answerMap) {
  const itemLookup = new Map(instrumentDefinition.items.map((item) => [item.id, item]));
  const baronLookup = new Map((scoringSnapshot.itemsWithAnswers || []).map((item) => [item.id, item]));

  return Object.entries(answerMap)
    .filter(([, value]) => value != null)
    .map(([itemId, value]) => {
      const numericItemId = Number(itemId);
      const instrumentItem = itemLookup.get(numericItemId) || {};
      const scoredItem = baronLookup.get(numericItemId) || {};
      return {
        itemId: numericItemId,
        value,
        adjustedValue:
          scoredItem.answerValue != null
            ? scoredItem.reverse
              ? 6 - scoredItem.answerValue
              : scoredItem.answerValue
            : instrumentItem.reverse
              ? 6 - value
              : value,
        moduleKey: scoredItem.moduleKey || instrumentItem.moduleKey || "ema",
        componentKey:
          scoredItem.memberships?.[0]?.componentKey ||
          instrumentItem.dimension ||
          scoredItem.moduleKey ||
          instrumentItem.moduleKey ||
          "",
        subcomponentKeys:
          scoredItem.memberships?.map((membership) => membership.subcomponentKey) ||
          (instrumentItem.memberships || []).map((membership) => membership.subcomponentKey) ||
          [],
      };
    })
    .sort((a, b) => a.itemId - b.itemId);
}

function buildPartialResults(instrumentCode, scoringSnapshot) {
  if (instrumentCode === "ema") {
    return (scoringSnapshot.dimensions || []).map((dimension) => ({
      scopeType: "dimension",
      scopeKey: dimension.key,
      scopeLabel: dimension.label,
      rawScore: dimension.rawTotal,
      normalizedScore: dimension.favorablePercentage,
      category: dimension.band,
      completionRatio: 100,
      detailJson: dimension,
    }));
  }

  if (instrumentCode === "disc") {
    return (scoringSnapshot.dimensions || []).map((dimension) => ({
      scopeType: "dimension",
      scopeKey: dimension.key,
      scopeLabel: dimension.label,
      rawScore: dimension.rawTotal,
      normalizedScore: dimension.favorablePercentage,
      category: dimension.band,
      completionRatio: scoringSnapshot.overallPercentage,
      detailJson: dimension,
    }));
  }

  const moduleRows = (scoringSnapshot.modules || []).map((module) => ({
    scopeType: "module",
    scopeKey: module.key,
    scopeLabel: module.label,
    rawScore: module.component?.rawScore ?? 0,
    normalizedScore: module.component?.ceScore ?? null,
    category: module.component?.category ?? "pending",
    completionRatio: module.completionRatio,
    detailJson: module,
  }));

  const componentRows = (scoringSnapshot.components || []).map((component) => ({
    scopeType: "component",
    scopeKey: component.key,
    scopeLabel: component.label,
    rawScore: component.rawScore,
    normalizedScore: component.ceScore,
    category: component.category,
    completionRatio: component.isComplete ? 100 : Math.round((component.answeredCount / component.expectedCount) * 100),
    detailJson: component,
  }));

  const subcomponentRows = (scoringSnapshot.subcomponents || []).map((subcomponent) => ({
    scopeType: "subcomponent",
    scopeKey: subcomponent.key,
    scopeLabel: subcomponent.label,
    rawScore: subcomponent.rawScore,
    normalizedScore: subcomponent.ceScore,
    category: subcomponent.category,
    completionRatio: subcomponent.completionRatio,
    detailJson: subcomponent,
  }));

  return [...moduleRows, ...componentRows, ...subcomponentRows];
}

function buildFinalResult(instrumentCode, scoringSnapshot, isValid, isComplete) {
  if (!isComplete) return null;

  if (instrumentCode === "ema") {
    return {
      totalRaw: scoringSnapshot.totalRaw,
      totalNormalized: scoringSnapshot.overallPercentage,
      profileGlobal: scoringSnapshot.profile,
      valid: true,
      interpretationJson: {
        summary: scoringSnapshot.summary,
        observations: scoringSnapshot.observations,
      },
      detailJson: scoringSnapshot,
    };
  }

  if (instrumentCode === "disc") {
    return {
      totalRaw: scoringSnapshot.totalRaw,
      totalNormalized: scoringSnapshot.overallPercentage,
      profileGlobal: scoringSnapshot.profile,
      valid: true,
      interpretationJson: {
        summary: scoringSnapshot.summary,
        observations: scoringSnapshot.observations,
      },
      detailJson: scoringSnapshot,
    };
  }

  return {
    totalRaw: scoringSnapshot.total.rawScore,
    totalNormalized: scoringSnapshot.total.ceScore,
    profileGlobal: scoringSnapshot.profile,
    valid: isValid,
    interpretationJson: {
      summary: scoringSnapshot.summary,
      observations: scoringSnapshot.observations,
      validity: scoringSnapshot.validity,
    },
    detailJson: scoringSnapshot,
  };
}

function getNextModuleKey(instrumentDefinition, scoringSnapshot) {
  if (instrumentDefinition.code === "ema") return "ema";
  const nextModule = (scoringSnapshot.modules || []).find((module) => !module.isComplete);
  return nextModule?.key || instrumentDefinition.modules[instrumentDefinition.modules.length - 1]?.key || "baron";
}

function buildAggregate(application, instrumentDefinition, scoringSnapshot) {
  const answerMap = buildAnswerPayloadMap(application.answers || []);

  const answers = serializeAnswersForStorage(instrumentDefinition, scoringSnapshot, answerMap);
  const progress = computeApplicationProgress(instrumentDefinition, answers);
  const isComplete = progress.answeredCount === progress.totalItems;
  const isValid = instrumentDefinition.code === "baron" ? Boolean(scoringSnapshot.validity?.valid) : true;
  const status = !isComplete ? "in_progress" : isValid ? "completed" : "invalid";

  return {
    id: application.id,
    personId: application.personId,
    participant: application.participant,
    instrumentCode: instrumentDefinition.code,
    instrumentName: instrumentDefinition.name,
    instrumentVersion: instrumentDefinition.version,
    status,
    currentModuleKey: getNextModuleKey(instrumentDefinition, scoringSnapshot),
    percentageComplete: progress.percentage,
    valid: isComplete ? isValid : null,
    startedAt: application.startedAt,
    completedAt: isComplete ? new Date().toISOString() : null,
    scoringSnapshot,
    answers,
    partialResults: buildPartialResults(instrumentDefinition.code, scoringSnapshot),
    finalResult: buildFinalResult(instrumentDefinition.code, scoringSnapshot, isValid, isComplete),
  };
}

function buildPublicApplicationPayload(application, instrumentDefinition) {
  return {
    id: application.id,
    participant: application.participant,
    instrumentCode: application.instrumentCode,
    instrumentName: application.instrumentName,
    instrumentVersion: application.instrumentVersion,
    status: application.status,
    currentModuleKey: application.currentModuleKey,
    percentageComplete: application.percentageComplete,
    valid: application.valid,
    startedAt: application.startedAt,
    completedAt: application.completedAt,
    answers: application.answers,
    partialResults: application.partialResults,
    finalResult: application.finalResult,
    scoring: application.scoringSnapshot,
    instrument: instrumentDefinition,
  };
}

function buildParticipantApplicationSummary(application) {
  return {
    id: application.id,
    instrumentCode: application.instrumentCode,
    instrumentName: application.instrumentName,
    instrumentVersion: application.instrumentVersion,
    status: application.status,
    currentModuleKey: application.currentModuleKey,
    percentageComplete: application.percentageComplete,
    valid: application.valid,
    startedAt: application.startedAt,
    completedAt: application.completedAt,
    partialResults: application.partialResults,
    finalResult: application.finalResult,
    scoring: application.scoringSnapshot,
  };
}

function sendExcel(res, applications, instrumentCode = "") {
  const workbook = buildExcelWorkbook(applications);
  const date = new Date().toISOString().slice(0, 10);
  const suffix = instrumentCode ? `_${instrumentCode.toUpperCase()}` : "_Consolidado";
  res.writeHead(200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="MENTE_DE_ACERO_Resultados${suffix}_${date}.xlsx"`,
    "Cache-Control": "no-store",
  });
  res.end(workbook);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "same-origin",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (requestUrl.pathname === "/api/config" && req.method === "GET") {
    sendJson(res, 200, {
      googleClientId: GOOGLE_CLIENT_ID,
      storageDriver: shouldUseSupabase() ? "supabase" : "local",
    });
    return;
  }

  if ((requestUrl.pathname === "/api/health" || requestUrl.pathname === "/health") && req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      version: APP_VERSION,
      commit: APP_VERSION,
      storage: shouldUseSupabase() ? "supabase" : "local",
    });
    return;
  }

  if (requestUrl.pathname === "/api/instruments" && req.method === "GET") {
    sendJson(res, 200, { instruments: listInstruments() });
    return;
  }

  if (requestUrl.pathname.startsWith("/api/instruments/") && req.method === "GET") {
    const code = decodeURIComponent(requestUrl.pathname.replace("/api/instruments/", ""));
    try {
      sendJson(res, 200, getInstrumentDefinition(code));
    } catch (error) {
      sendJson(res, 404, { error: error.message });
    }
    return;
  }

  if (requestUrl.pathname === "/api/instrument" && req.method === "GET") {
    sendJson(res, 200, getInstrumentDefinition("ema"));
    return;
  }

  if (requestUrl.pathname.startsWith("/api/check-id/") && req.method === "GET") {
    if (!(await requireAdmin(req, res))) return;
    const idNumber = decodeURIComponent(requestUrl.pathname.replace("/api/check-id/", ""));
    const instrumentCode = (requestUrl.searchParams.get("instrument") || "ema").toLowerCase();
    if (!isValidIdNumber(idNumber)) {
      sendJson(res, 400, { error: "La cedula consultada no tiene un formato valido." });
      return;
    }
    const application = await findCurrentApplication(idNumber, instrumentCode);
    sendJson(res, 200, {
      exists: Boolean(application),
      status: application?.status || null,
      instrumentCode,
    });
    return;
  }

  if (requestUrl.pathname === "/api/auth/login" && req.method === "POST") {
    let username = "";
    try {
      const body = await readBody(req);
      username = String(body.username || "").trim();
      const password = String(body.password || "");
      const lockedUntil = checkLoginRateLimit(req, username);
      if (lockedUntil) {
        sendJson(res, 429, { error: "Usuario o contrasena incorrectos." });
        return;
      }

      const account = await findAccountByUsername(username);
      const passwordOk = account ? await verifyPassword(password, account.password_salt, account.password_hash) : false;
      const dbLocked = account?.locked_until && new Date(account.locked_until).getTime() > Date.now();
      if (!account || !account.active || dbLocked || !passwordOk) {
        recordLoginFailure(req, username);
        if (account) {
          const failed = Number(account.failed_login_attempts || 0) + 1;
          await updateAccountLoginState(account.id, {
            failed_login_attempts: failed >= 5 ? 0 : failed,
            locked_until: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : account.locked_until,
          });
        }
        sendJson(res, 401, { error: "Usuario o contrasena incorrectos." });
        return;
      }

      clearLoginFailures(req, username);
      await updateAccountLoginState(account.id, {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      });
      const person = account.person_id ? await getPersonByAccount(account) : null;
      if (account.role === "participant" && !person) {
        sendJson(res, 403, { error: "La cuenta no esta vinculada a un perfil institucional. Contacta al administrador." });
        return;
      }
      const token = createSessionToken({
        accountId: account.id,
        personId: account.person_id,
        role: account.role,
        username: account.username,
        mustChangePassword: account.must_change_password,
        tokenVersion: account.token_version,
      });
      sendJson(
        res,
        200,
        {
          user: buildUserPayload({ account, person }),
        },
        { "Set-Cookie": buildSessionCookie(token, { secure: isProductionRequest(req) }) }
      );
      await auditSafely({ accountId: account.id, eventType: "auth.login", targetType: "account", targetId: account.id });
    } catch (error) {
      sendJson(res, 400, { error: "Usuario o contrasena incorrectos." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/me" && req.method === "GET") {
    const context = await getAuthenticatedContext(req);
    if (!context) {
      sendJson(res, 401, { error: "Sesion requerida." });
      return;
    }
    if (context.account.role === "participant") {
      if (!context.person) {
        sendJson(res, 403, { error: "La cuenta no esta vinculada a un perfil institucional." });
        return;
      }
      const assignments = context.account.must_change_password
        ? []
        : await listAssignmentsForPerson(context.account.person_id);
      sendJson(res, 200, {
        user: buildUserPayload(context),
        assignments,
      });
      return;
    }
    if (["admin", "psychologist"].includes(context.account.role)) {
      const campaignIds = context.account.role === "admin"
        ? (await listCampaigns()).map((campaign) => campaign.id)
        : await listStaffCampaignAccess(context.account.id);
      sendJson(res, 200, { user: buildUserPayload(context), assignments: [], campaignIds });
      return;
    }
    sendJson(res, 403, { error: "Rol de cuenta no permitido." });
    return;
  }

  if (requestUrl.pathname === "/api/auth/change-password" && req.method === "POST") {
    const context = await getAuthenticatedContext(req);
    if (!context) {
      sendJson(res, 401, { error: "Sesion requerida." });
      return;
    }
    try {
      const body = await readBody(req);
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");
      const confirmPassword = String(body.confirmPassword || "");
      const currentOk = await verifyPassword(currentPassword, context.account.password_salt, context.account.password_hash);
      if (!currentOk) {
        sendJson(res, 400, { error: "No se pudo cambiar la contrasena." });
        return;
      }
      const policyError = await validateNewPassword({
        username: context.account.username,
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (policyError) {
        sendJson(res, 400, { error: policyError });
        return;
      }
      const password = await hashPassword(newPassword);
      await updateAccountPassword(context.account.id, password);
      const updated = await findAccountById(context.account.id);
      const token = createSessionToken({
        accountId: updated.id,
        personId: updated.person_id,
        role: updated.role,
        username: updated.username,
        mustChangePassword: updated.must_change_password,
        tokenVersion: updated.token_version,
      });
      sendJson(
        res,
        200,
        { ok: true },
        { "Set-Cookie": buildSessionCookie(token, { secure: isProductionRequest(req) }) }
      );
      await auditSafely({ accountId: updated.id, eventType: "auth.password_changed", targetType: "account", targetId: updated.id });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo cambiar la contrasena." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/logout" && req.method === "POST") {
    try {
      const context = await getAuthenticatedContext(req);
      if (context) {
        await updateAccountLoginState(context.account.id, {
          token_version: Number(context.account.token_version || 0) + 1,
        });
        await auditSafely({ accountId: context.account.id, eventType: "auth.logout", targetType: "account", targetId: context.account.id });
      }
    } catch (error) {
      console.warn("No se pudo invalidar la sesion en el servidor:", error.message);
    }
    sendJson(res, 200, { ok: true }, { "Set-Cookie": buildClearSessionCookie() });
    return;
  }

  if (requestUrl.pathname === "/api/auth/google" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const user = await verifyGoogleCredential(body.credential);
      sendJson(res, 200, user);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (requestUrl.pathname === "/api/applications/start" && req.method === "POST") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      const body = await readBody(req);
      const participant = { ...context.person, personId: context.account.person_id };

      const instrument = getInstrumentOrThrow(body.instrumentCode);
      const application = await startApplication({ participant, instrumentDefinition: instrument });
      sendJson(res, 200, buildPublicApplicationPayload(application, instrument));
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || "No se pudo iniciar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/me/applications" && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      const applications = await listApplications({ idNumber: context.person.idNumber });
      sendJson(res, 200, {
        applications: applications.map(buildParticipantApplicationSummary),
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message || "No se pudieron cargar tus evaluaciones." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/applications/resume" && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      const application = await findCurrentApplication(context.person.idNumber, instrumentCode);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro una aplicacion para esa cedula e instrumento." });
        return;
      }
      sendJson(res, 200, buildPublicApplicationPayload(application, getInstrumentDefinition(instrumentCode)));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo reanudar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/applications/") && requestUrl.pathname.endsWith("/answers") && req.method === "POST") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      const applicationId = requestUrl.pathname.split("/")[3];
      const body = await readBody(req);
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion." });
        return;
      }
      if (application.personId !== context.account.person_id) {
        sendJson(res, 403, { error: "No tienes acceso a esta aplicacion." });
        return;
      }

      const instrument = getInstrumentOrThrow(application.instrumentCode);
      const answerMap = buildAnswerPayloadMap(application.answers || []);
      for (const answer of body.answers || []) {
        const normalized = normalizeInstrumentAnswer(instrument.code, answer.value);
        if (normalized == null) {
          sendJson(res, 400, {
            error:
              instrument.code === "disc"
                ? "Cada grupo DISC debe tener una opcion MAS y una opcion MENOS distintas."
                : "Cada respuesta debe estar entre 1 y 5.",
          });
          return;
        }
        answerMap[answer.itemId] = normalized;
      }

      const scoringSnapshot = scoreInstrumentApplication(instrument.code, answerMap);
      const aggregate = buildAggregate(
        {
          ...application,
          answers: Object.entries(answerMap).map(([itemId, value]) => ({ itemId: Number(itemId), value })),
        },
        instrument,
        scoringSnapshot
      );

      const saved = await saveApplicationProgress(aggregate);
      sendJson(res, 200, buildPublicApplicationPayload(saved, instrument));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo guardar el avance." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/applications/") && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      const applicationId = requestUrl.pathname.split("/")[3];
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion." });
        return;
      }
      if (application.personId !== context.account.person_id) {
        sendJson(res, 403, { error: "No tienes acceso a esta aplicacion." });
        return;
      }
      sendJson(res, 200, buildPublicApplicationPayload(application, getInstrumentDefinition(application.instrumentCode)));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/results" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const idNumber = String(requestUrl.searchParams.get("cedula") || "").trim();
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      const application = await findCurrentApplication(idNumber, instrumentCode);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro ningun resultado para esa cedula e instrumento." });
        return;
      }
      if (!(await staffCanAccessApplication(staff, application))) {
        sendJson(res, 403, { error: "No tienes acceso a esta campana." });
        return;
      }
      sendJson(res, 200, buildPublicApplicationPayload(application, getInstrumentDefinition(instrumentCode)));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el resultado." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/overview" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff || !requireSupabaseManagement(res)) return;
    try {
      sendJson(res, 200, await buildAdminOverview(staff));
    } catch (error) {
      sendJson(res, 500, { error: error.message || "No se pudo cargar el resumen institucional." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/directory" && req.method === "GET") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const people = await listDirectory({
        search: requestUrl.searchParams.get("search") || "",
        limit: requestUrl.searchParams.get("limit") || 50,
      });
      sendJson(res, 200, { people });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el personal." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/campaigns" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff || !requireSupabaseManagement(res)) return;
    try {
      const campaigns = await listCampaigns();
      const campaignIds = staff.account.role === "admin"
        ? null
        : new Set(await listStaffCampaignAccess(staff.account.id));
      sendJson(res, 200, { campaigns: campaignIds ? campaigns.filter((campaign) => campaignIds.has(campaign.id)) : campaigns });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudieron consultar las campanas." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/campaigns" && req.method === "POST") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const body = await readBody(req);
      const campaignInput = validateCampaignInput(body);
      const campaign = await createCampaign({ ...campaignInput, active: parseBoolean(body.active, true) });
      await auditSafely({ accountId: admin.account.id, eventType: "campaign.created", targetType: "campaign", targetId: campaign.id });
      sendJson(res, 201, { campaign });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo crear la campana." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/admin/campaigns/") && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const campaignId = decodeURIComponent(requestUrl.pathname.replace("/api/admin/campaigns/", ""));
      const body = await readBody(req);
      const current = (await listCampaigns()).find((campaign) => campaign.id === campaignId);
      if (!current) {
        sendJson(res, 404, { error: "No se encontro la campana." });
        return;
      }
      const campaignInput = validateCampaignInput({
        name: body.name ?? current.name,
        startsAt: body.startsAt ?? current.startsAt,
        endsAt: body.endsAt ?? current.endsAt,
      });
      const campaign = await updateCampaign(campaignId, {
        ...campaignInput,
        ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      });
      await auditSafely({ accountId: admin.account.id, eventType: "campaign.updated", targetType: "campaign", targetId: campaignId });
      sendJson(res, 200, { campaign });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo actualizar la campana." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/staff" && req.method === "GET") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const accounts = await listStaffAccounts();
      const staff = await Promise.all(accounts.map(async (account) => ({
        ...account,
        campaignIds: account.role === "admin" ? [] : await listStaffCampaignAccess(account.id),
      })));
      sendJson(res, 200, { staff });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el personal autorizado." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/staff" && req.method === "POST") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const temporaryPassword = String(body.temporaryPassword || "");
      if (!/^[a-zA-Z0-9._-]{4,64}$/.test(username)) throw new Error("El usuario debe tener entre 4 y 64 caracteres validos.");
      const policyError = await validateNewPassword({ username, currentPassword: "", newPassword: temporaryPassword, confirmPassword: temporaryPassword });
      if (policyError) throw new Error(policyError);
      const role = body.role === "admin" ? "admin" : "psychologist";
      const result = await createStaffAccount({ username, password: await hashPassword(temporaryPassword), role });
      if (!result.created) throw new Error("El nombre de usuario ya existe.");
      const campaignIds = role === "psychologist" ? await replaceStaffCampaignAccess(result.account.id, body.campaignIds || []) : [];
      await auditSafely({ accountId: admin.account.id, eventType: "staff.created", targetType: "account", targetId: result.account.id, detail: { role } });
      sendJson(res, 201, {
        staff: {
          id: result.account.id,
          username: result.account.username,
          role: result.account.role,
          active: result.account.active,
          mustChangePassword: result.account.must_change_password,
          campaignIds,
        },
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo crear la cuenta." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/admin/accounts/") && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const accountId = decodeURIComponent(requestUrl.pathname.replace("/api/admin/accounts/", ""));
      const body = await readBody(req);
      if (accountId === admin.account.id && body.active === false) throw new Error("No puedes desactivar tu propia cuenta.");
      const patch = {};
      if (typeof body.active === "boolean") patch.active = body.active;
      if (body.role && ["participant", "admin", "psychologist"].includes(body.role)) patch.role = body.role;
      if (body.temporaryPassword) {
        const target = await findAccountById(accountId);
        if (!target) throw new Error("No se encontro la cuenta.");
        const temporaryPassword = String(body.temporaryPassword);
        const policyError = await validateNewPassword({ username: target.username, currentPassword: "", newPassword: temporaryPassword, confirmPassword: temporaryPassword });
        if (policyError) throw new Error(policyError);
        patch.password = await hashPassword(temporaryPassword);
      }
      const account = await updateStaffAccount(accountId, patch);
      if (!account) {
        sendJson(res, 404, { error: "No se encontro la cuenta." });
        return;
      }
      await auditSafely({ accountId: admin.account.id, eventType: "account.updated", targetType: "account", targetId: accountId });
      sendJson(res, 200, { account: { id: account.id, username: account.username, role: account.role, active: account.active, mustChangePassword: account.must_change_password } });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo actualizar la cuenta." });
    }
    return;
  }

  if (/^\/api\/admin\/staff\/[^/]+\/campaigns$/.test(requestUrl.pathname) && req.method === "PUT") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const accountId = decodeURIComponent(requestUrl.pathname.split("/")[4]);
      const body = await readBody(req);
      const target = await findAccountById(accountId);
      if (!target || target.role !== "psychologist") throw new Error("La cuenta seleccionada no es de psicologia.");
      const validCampaignIds = new Set((await listCampaigns()).map((campaign) => campaign.id));
      const campaignIds = [...new Set((body.campaignIds || []).map(String))];
      if (campaignIds.some((campaignId) => !validCampaignIds.has(campaignId))) throw new Error("Una de las campanas no existe.");
      const access = await replaceStaffCampaignAccess(accountId, campaignIds);
      await auditSafely({ accountId: admin.account.id, eventType: "staff.scope_updated", targetType: "account", targetId: accountId, detail: { campaignIds: access } });
      sendJson(res, 200, { campaignIds: access });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo actualizar el alcance." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/assignments" && req.method === "POST") {
    const admin = await requireAdmin(req, res);
    if (!admin || !requireSupabaseManagement(res)) return;
    try {
      const body = await readBody(req);
      const personId = String(body.personId || "");
      const campaignId = String(body.campaignId || "");
      const instruments = validateInstrumentCodes(body.instrumentCodes);
      const campaigns = await listCampaigns();
      if (!campaigns.some((campaign) => campaign.id === campaignId)) throw new Error("La campana seleccionada no existe.");
      const result = await createAssignmentsForPerson(personId, campaignId, instruments);
      await auditSafely({ accountId: admin.account.id, eventType: "assignment.created", targetType: "person", targetId: personId, detail: { campaignId, instruments } });
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudieron asignar las evaluaciones." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/applications" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const applications = await listApplicationsForStaff(staff, {
        idNumber: requestUrl.searchParams.get("cedula") || "",
        instrumentCode: requestUrl.searchParams.get("instrument") || "",
        status: requestUrl.searchParams.get("status") || "",
      }, { summaries: true });
      sendJson(res, 200, { applications });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudieron listar las aplicaciones." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/admin/applications/") && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const applicationId = requestUrl.pathname.replace("/api/admin/applications/", "");
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion solicitada." });
        return;
      }
      if (!(await staffCanAccessApplication(staff, application))) {
        sendJson(res, 403, { error: "No tienes acceso a esta campana." });
        return;
      }
      sendJson(res, 200, application);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo leer la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/submissions" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const applications = await listApplicationsForStaff(staff, {
        idNumber: requestUrl.searchParams.get("cedula") || "",
        instrumentCode: requestUrl.searchParams.get("instrument") || "",
      });
      sendJson(res, 200, { applications });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudieron consultar los registros." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/submissions/") && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const idNumber = decodeURIComponent(requestUrl.pathname.replace("/api/submissions/", ""));
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      const application = await findCurrentApplication(idNumber, instrumentCode);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro ningun registro con esa cedula." });
        return;
      }
      if (!(await staffCanAccessApplication(staff, application))) {
        sendJson(res, 403, { error: "No tienes acceso a esta campana." });
        return;
      }
      sendJson(res, 200, application);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el registro." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/export/excel" && req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    try {
      const filter = {
        idNumber: requestUrl.searchParams.get("cedula") || "",
        instrumentCode: String(requestUrl.searchParams.get("instrument") || "").trim().toLowerCase(),
        status: requestUrl.searchParams.get("status") || "",
      };
      const applications = await listApplicationsForStaff(staff, filter);
      sendExcel(res, applications, filter.instrumentCode);
      await auditSafely({
        accountId: staff.account.id,
        eventType: "results.exported",
        targetType: "application",
        detail: { count: applications.length, instrumentCode: filter.instrumentCode, status: filter.status },
      });
    } catch (error) {
      console.error("No se pudo generar el archivo Excel:", error);
      sendJson(res, 500, { error: error.message || "No se pudo generar el archivo Excel." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/wellness/summary" && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    sendJson(res, 200, {
      configured: false,
      wellnessIndex: null,
      category: null,
      deltaWeek: null,
      habitRatio: null,
      weeklyTrend: [],
    });
    return;
  }

  if (requestUrl.pathname === "/api/habits/today" && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    sendJson(res, 200, { configured: false, habits: [] });
    return;
  }

  if (requestUrl.pathname === "/api/habits/toggle" && req.method === "POST") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      await readBody(req);
      sendJson(res, 501, { error: "El registro de hábitos todavía no está habilitado." });
    } catch {
      sendJson(res, 400, { error: "No se pudo actualizar el hábito." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/mood/history" && req.method === "GET") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    sendJson(res, 200, { configured: false, entries: [] });
    return;
  }

  if (requestUrl.pathname === "/api/mood/log" && req.method === "POST") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      await readBody(req);
      sendJson(res, 501, { error: "El registro de estado de ánimo todavía no está habilitado." });
    } catch {
      sendJson(res, 400, { error: "No se pudo registrar el estado de ánimo." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/tools/session" && req.method === "POST") {
    const context = await requireParticipant(req, res);
    if (!context) return;
    try {
      await readBody(req);
      sendJson(res, 501, { error: "El registro de ejercicios todavía no está habilitado." });
    } catch {
      sendJson(res, 400, { error: "No se pudo registrar la sesión." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/support-resources" && req.method === "GET") {
    sendJson(res, 200, { resources: [] });
    return;
  }

  if (VENDOR_FILES[requestUrl.pathname]) {
    sendFile(res, VENDOR_FILES[requestUrl.pathname]);
    return;
  }

  let filePath = path.join(PUBLIC_DIR, requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Acceso denegado." });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  sendFile(res, filePath);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${PORT} ya esta en uso. Cierra el servidor anterior o inicia con otro puerto:`);
    console.error(`$env:PORT=3001; npm start`);
    process.exit(1);
  }

  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});

async function ensureBootstrapAdmin() {
  if (!config.bootstrapAdminEnabled) return { enabled: false, created: false };
  if (!shouldUseSupabase()) throw new Error("BOOTSTRAP_ADMIN_ENABLED requiere almacenamiento Supabase.");
  if (!config.bootstrapAdminPassword) throw new Error("Falta BOOTSTRAP_ADMIN_PASSWORD para crear el administrador inicial.");
  const result = await createStaffAccount({
    username: config.bootstrapAdminUsername,
    password: await hashPassword(config.bootstrapAdminPassword),
    role: "admin",
  });
  if (result.created) {
    await auditSafely({ accountId: result.account.id, eventType: "staff.bootstrap_created", targetType: "account", targetId: result.account.id });
  }
  return { enabled: true, created: result.created };
}

function validateRuntimeSecurity() {
  if (config.nodeEnv === "production" && String(config.appSessionSecret || "").length < 32) {
    throw new Error("APP_SESSION_SECRET debe contener al menos 32 caracteres en produccion.");
  }
}

initializeStorage()
  .then(async (storage) => {
    validateRuntimeSecurity();
    const bootstrap = await ensureBootstrapAdmin();
    server.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
      console.log(`Almacenamiento activo: ${storage.driver}`);
      if (bootstrap.enabled) console.log(`Administrador inicial: ${bootstrap.created ? "creado" : "existente"}.`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar el almacenamiento:", error.message);
    process.exit(1);
  });
