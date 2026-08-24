const crypto = require("crypto");

const COOKIE_NAME = "sp_session";
const DEFAULT_MAX_AGE_SECONDS = 8 * 60 * 60;
const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-session-secret";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", APP_SESSION_SECRET).update(payload).digest("base64url");
}

function createSessionToken(session) {
  const payload = base64url(
    JSON.stringify({
      sub: session.accountId,
      personId: session.personId || null,
      role: session.role,
      username: session.username,
      mustChangePassword: Boolean(session.mustChangePassword),
      tokenVersion: session.tokenVersion || 0,
      exp: Math.floor(Date.now() / 1000) + DEFAULT_MAX_AGE_SECONDS,
    })
  );
  return `${payload}.${sign(payload)}`;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

function verifySessionToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function getSessionFromRequest(req) {
  const token = parseCookies(req.headers.cookie || "")[COOKIE_NAME];
  return verifySessionToken(token);
}

function buildSessionCookie(token, { secure = false } = {}) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${DEFAULT_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function buildClearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
};
