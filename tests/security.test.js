const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter, createKeyedSingleFlight, getClientIp, securityHeaders } = require("../lib/security");

test("single flight shares one start for concurrent duplicates", async () => {
  const run = createKeyedSingleFlight();
  let calls = 0;
  const task = async () => { calls += 1; await new Promise((r) => setTimeout(r, 20)); return { id: `app-${calls}` }; };
  const results = await Promise.all(Array.from({ length: 7 }, () => run("person-1:ema", task)));
  assert.equal(calls, 1);
  assert.ok(results.every((r) => r.id === "app-1"));
  const other = await run("person-1:baron", task);
  assert.equal(other.id, "app-2");
});

test("rate limiter blocks after the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
  assert.equal(limiter.consume("a"), 0);
  assert.equal(limiter.consume("a"), 0);
  assert.equal(limiter.consume("a"), 0);
  assert.ok(limiter.consume("a") > 0);
  assert.equal(limiter.consume("b"), 0);
});

test("client ip uses first forwarded address", () => {
  assert.equal(getClientIp({
    headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1", "cf-connecting-ip": "9.9.9.9" },
    socket: {},
  }), "1.2.3.4");
});

test("security headers deny framing and sniffing", () => {
  const headers = securityHeaders({ https: true });
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.ok(headers["Strict-Transport-Security"]);
});

test("printable report does not rely on an inline script blocked by CSP", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const report = fs.readFileSync(path.join(__dirname, "..", "public", "js", "services", "reportGenerator.js"), "utf8");
  assert.doesNotMatch(report, /<script>/);
  assert.match(report, /printWindow\.addEventListener\('load'/);
});
