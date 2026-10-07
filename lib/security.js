/**
 * Protecciones HTTP comunes: cabeceras de seguridad, limite de solicitudes por
 * cliente y bloqueo de operaciones concurrentes por clave.
 *
 * Nota sobre inyeccion SQL: el servidor no construye SQL; toda consulta pasa por
 * la API REST de Supabase (PostgREST) con valores codificados (encodeURIComponent),
 * por lo que un texto malicioso se trata como dato, nunca como codigo.
 */

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.pexels.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function securityHeaders({ https = false } = {}) {
  const headers = {
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  if (https) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return headers;
}

/** IP real del cliente detras del proxy de Render (primer valor de X-Forwarded-For). */
function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (forwarded) return forwarded;
  const proxyIp = String(req.headers["cf-connecting-ip"] || req.headers["true-client-ip"] || "").trim();
  return proxyIp || req.socket?.remoteAddress || "local";
}

/**
 * Limitador de ventana fija en memoria. Suficiente para una sola instancia de Render;
 * con varias instancias cada una aplica su propio limite.
 */
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, Math.max(windowMs, 30_000));
  sweep.unref?.();

  return {
    /** Devuelve 0 si se permite, o los segundos a esperar si se excedio el limite. */
    consume(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count > max ? Math.ceil((entry.resetAt - now) / 1000) : 0;
    },
    reset() {
      hits.clear();
    },
  };
}

/**
 * Ejecuta una sola tarea por clave a la vez. Las solicitudes simultaneas con la
 * misma clave reciben el mismo resultado en lugar de repetir el trabajo.
 */
function createKeyedSingleFlight() {
  const inFlight = new Map();
  return function run(key, task) {
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = Promise.resolve()
      .then(task)
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}

module.exports = {
  securityHeaders,
  getClientIp,
  createRateLimiter,
  createKeyedSingleFlight,
  CONTENT_SECURITY_POLICY,
};
