const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const publicDir = path.join(__dirname, "..", "public");

function assertScriptIdsExist(scriptName, htmlName) {
  const script = fs.readFileSync(path.join(publicDir, scriptName), "utf8");
  const html = fs.readFileSync(path.join(publicDir, htmlName), "utf8");
  const ids = [...script.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map((match) => match[1]);
  const htmlIds = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map((match) => match[1]));
  assert.deepEqual([...new Set(ids)].filter((id) => !htmlIds.has(id)), []);
}

test("login JavaScript matches the login document", () => assertScriptIdsExist("login.js", "login.html"));
test("admin JavaScript matches the admin document", () => assertScriptIdsExist("admin.js", "admin.html"));

test("institutional assets are referenced without checkerboard source files", () => {
  const login = fs.readFileSync(path.join(publicDir, "login.html"), "utf8");
  const admin = fs.readFileSync(path.join(publicDir, "admin.html"), "utf8");
  assert.match(login, /assets\/mente-de-acero-logo-institucional\.png/);
  assert.match(admin, /assets\/mente-de-acero-logo-institucional\.png/);
  assert.equal(fs.existsSync(path.join(publicDir, "assets", "mente-de-acero-logo-institucional.png")), true);
  assert.equal(fs.existsSync(path.join(publicDir, "assets", "mente-de-acero-institucional-fondo-azul.png")), true);
});
