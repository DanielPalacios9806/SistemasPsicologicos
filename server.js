const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { getServerConfig } = require("./lib/env");
const { getInstrumentDefinition, QUESTIONS } = require("./lib/instrument");
const { scoreSubmission, normalizeAnswer } = require("./lib/scoring");
const { buildExcelWorkbook } = require("./lib/exportExcel");
const { findByIdNumber, initializeStorage, readSubmissions, saveSubmission, shouldUseSupabase } = require("./lib/storage");

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
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
      if (body.length > 2_000_000) {
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

async function validateSubmission(body) {
  const participant = sanitizeParticipant(body);
  const requiredFields = ["fullName", "idNumber", "career", "age", "gender"];
  for (const field of requiredFields) {
    if (!participant[field]) return `El campo ${field} es obligatorio.`;
  }

  if (!isValidIdNumber(participant.idNumber)) {
    return "La cedula debe contener solo numeros y entre 8 y 15 digitos.";
  }

  if (!Array.isArray(body.answers) || body.answers.length !== QUESTIONS.length) {
    return `Debes responder las ${QUESTIONS.length} preguntas.`;
  }

  const invalidAnswer = body.answers.some((value) => {
    const parsed = normalizeAnswer(value);
    return parsed < 1 || parsed > 5;
  });

  if (invalidAnswer) {
    return "Cada respuesta debe estar entre 1 y 5.";
  }

  if (await findByIdNumber(participant.idNumber)) {
    return "Ya existe un registro con esa cedula.";
  }

  return null;
}

function buildSubmission(body) {
  const participant = sanitizeParticipant(body);
  const normalizedAnswers = QUESTIONS.map((question, index) => ({
    questionId: question.id,
    value: normalizeAnswer(body.answers[index]),
  }));
  const scoring = scoreSubmission(body.answers);

  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    participant,
    answers: normalizedAnswers,
    scoring,
  };
}

async function sendExcel(res) {
  const workbook = buildExcelWorkbook(await readSubmissions());
  res.writeHead(200, {
    "Content-Type": "application/vnd.ms-excel",
    "Content-Disposition": 'attachment; filename="resultados-ema.xls"',
  });
  res.end(workbook);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

  if (requestUrl.pathname === "/api/instrument" && req.method === "GET") {
    sendJson(res, 200, getInstrumentDefinition());
    return;
  }

  if (requestUrl.pathname.startsWith("/api/check-id/") && req.method === "GET") {
    const idNumber = decodeURIComponent(requestUrl.pathname.replace("/api/check-id/", ""));
    if (!isValidIdNumber(idNumber)) {
      sendJson(res, 400, { error: "La cedula consultada no tiene un formato valido." });
      return;
    }

    sendJson(res, 200, { exists: Boolean(await findByIdNumber(idNumber)) });
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

  if (requestUrl.pathname === "/api/submit" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const validationError = await validateSubmission(body);
      if (validationError) {
        sendJson(res, validationError.includes("Ya existe") ? 409 : 400, { error: validationError });
        return;
      }

      const submission = buildSubmission(body);
      await saveSubmission(submission);
      sendJson(res, 200, submission);
    } catch (error) {
      sendJson(res, 500, { error: error.message || "No se pudo guardar la aplicacion." });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/api/submissions/") && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    const idNumber = decodeURIComponent(requestUrl.pathname.replace("/api/submissions/", ""));
    if (!isValidIdNumber(idNumber)) {
      sendJson(res, 400, { error: "La cedula consultada no tiene un formato valido." });
      return;
    }

    const result = await findByIdNumber(idNumber);
    if (!result) {
      sendJson(res, 404, { error: "No se encontro ningun registro con esa cedula." });
      return;
    }

    sendJson(res, 200, result);
    return;
  }

  if (requestUrl.pathname === "/api/export/excel" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    try {
      await sendExcel(res);
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
