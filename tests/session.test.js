const test = require("node:test");
const assert = require("node:assert/strict");

process.env.APP_SESSION_SECRET = "test-secret-with-more-than-thirty-two-characters";

const { createSessionToken, verifySessionToken, buildSessionCookie, buildClearSessionCookie } = require("../lib/auth/session");

test("signed sessions preserve role and reject tampering", () => {
  const token = createSessionToken({
    accountId: "account-1",
    personId: null,
    role: "psychologist",
    username: "psicologia",
    tokenVersion: 3,
  });
  const session = verifySessionToken(token);
  assert.equal(session.sub, "account-1");
  assert.equal(session.role, "psychologist");
  assert.equal(session.tokenVersion, 3);
  assert.equal(verifySessionToken(`${token}x`), null);
});

test("session cookies are HttpOnly and can be invalidated", () => {
  const cookie = buildSessionCookie("token", { secure: true });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.match(buildClearSessionCookie(), /Max-Age=0/);
});
