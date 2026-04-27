const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { getServerConfig } = require("./lib/env");
const { listInstruments, getInstrumentDefinition } = require("./lib/instruments");
const { buildExcelWorkbook } = require("./lib/exportExcel");
const { scoreInstrumentApplication, normalizeInstrumentAnswer } = require("./lib/scoring/index");
const {
  initializeStorage,
  shouldUseSupabase,
  startApplication,
  getApplicationById,
  findCurrentApplication,
  saveApplicationProgress,
  listApplications,
  exportApplications,
} = require("./lib/storage");

const config = getServerConfig();
const PORT = config.port;
const GOOGLE_CLIENT_ID = config.googleClientId;
const ADMIN_USERNAME = config.adminUsername;
const ADMIN_PASSWORD = config.adminPassword;
const PUBLIC_DIR = path.join(__dirname, "public");
const adminTokens = new Set();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
  });
  res.end(JSON.stringify(payload));
}

function createAdminToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getAdminToken(req) {
  return req.headers["x-admin-token"] || "";
}

function requireAdmin(req, res) {
  const token = getAdminToken(req);
  if (!token || !adminTokens.has(token)) {
    sendJson(res, 401, { error: "Acceso administrativo no autorizado." });
    return false;
  }
  return true;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 500, { error: "No se pudo cargar el recurso." });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
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

async function sendExcel(res, instrumentCode = "") {
  const applications = await exportApplications({ instrumentCode });
  const sheetName = instrumentCode ? `Resultados ${instrumentCode.toUpperCase()}` : "Resultados";
  const workbook = buildExcelWorkbook(applications, sheetName);
  res.writeHead(200, {
    "Content-Type": "application/vnd.ms-excel",
    "Content-Disposition": `attachment; filename="resultados-${instrumentCode || "consolidado"}.xls"`,
  });
  res.end(workbook);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
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

  if (requestUrl.pathname === "/api/admin/login" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const password = String(body.password || "");

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        sendJson(res, 401, { error: "Credenciales administrativas invalidas." });
        return;
      }

      const token = createAdminToken();
      adminTokens.add(token);
      sendJson(res, 200, { token });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo procesar el login." });
    }
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
    try {
      const body = await readBody(req);
      const participant = sanitizeParticipant(body.participant || body);
      const validationError = validateParticipant(participant);
      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const instrument = getInstrumentOrThrow(body.instrumentCode);
      const application = await startApplication({ participant, instrumentDefinition: instrument });
      sendJson(res, 200, buildPublicApplicationPayload(application, instrument));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo iniciar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/applications/resume" && req.method === "GET") {
    try {
      const idNumber = String(requestUrl.searchParams.get("cedula") || "").trim();
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      if (!isValidIdNumber(idNumber)) {
        sendJson(res, 400, { error: "La cedula consultada no tiene un formato valido." });
        return;
      }
      const application = await findCurrentApplication(idNumber, instrumentCode);
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
    try {
      const applicationId = requestUrl.pathname.split("/")[3];
      const body = await readBody(req);
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion." });
        return;
      }

      const instrument = getInstrumentOrThrow(application.instrumentCode);
      const answerMap = buildAnswerPayloadMap(application.answers || []);
      for (const answer of body.answers || []) {
        const normalized = normalizeInstrumentAnswer(instrument.code, answer.value);
        if (normalized == null) {
          sendJson(res, 400, { error: "Cada respuesta debe estar entre 1 y 5." });
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
    try {
      const applicationId = requestUrl.pathname.split("/")[3];
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion." });
        return;
      }
      sendJson(res, 200, buildPublicApplicationPayload(application, getInstrumentDefinition(application.instrumentCode)));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/results" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      const idNumber = String(requestUrl.searchParams.get("cedula") || "").trim();
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      const application = await findCurrentApplication(idNumber, instrumentCode);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro ningun resultado para esa cedula e instrumento." });
        return;
      }
      sendJson(res, 200, buildPublicApplicationPayload(application, getInstrumentDefinition(instrumentCode)));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el resultado." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/admin/applications" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      const applications = await listApplications({
        idNumber: requestUrl.searchParams.get("cedula") || "",
        instrumentCode: requestUrl.searchParams.get("instrument") || "",
        status: requestUrl.searchParams.get("status") || "",
      });
      sendJson(res, 200, { applications });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudieron listar las aplicaciones." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/admin/applications/") && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      const applicationId = requestUrl.pathname.replace("/api/admin/applications/", "");
      const application = await getApplicationById(applicationId);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro la aplicacion solicitada." });
        return;
      }
      sendJson(res, 200, application);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo leer la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/submissions" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      const applications = await listApplications({
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
    if (!requireAdmin(req, res)) return;
    try {
      const idNumber = decodeURIComponent(requestUrl.pathname.replace("/api/submissions/", ""));
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "ema").trim().toLowerCase();
      const application = await findCurrentApplication(idNumber, instrumentCode);
      if (!application) {
        sendJson(res, 404, { error: "No se encontro ningun registro con esa cedula." });
        return;
      }
      sendJson(res, 200, application);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "No se pudo consultar el registro." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/export/excel" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      const instrumentCode = String(requestUrl.searchParams.get("instrument") || "").trim().toLowerCase();
      await sendExcel(res, instrumentCode);
    } catch (error) {
      sendJson(res, 500, { error: error.message || "No se pudo generar el archivo Excel." });
    }
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

initializeStorage()
  .then((storage) => {
    server.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
      console.log(`Almacenamiento activo: ${storage.driver}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar el almacenamiento:", error.message);
    process.exit(1);
  });
