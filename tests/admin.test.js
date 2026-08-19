const test = require("node:test");
const assert = require("node:assert/strict");

const { listApplications, exportApplications } = require("../lib/storage");
const { buildExcelWorkbook } = require("../lib/exportExcel");

test("Admin: listApplications returns filtered applications", async () => {
  const allApps = await listApplications({});
  assert.ok(Array.isArray(allApps));

  const baronApps = await listApplications({ instrumentCode: "baron" });
  assert.ok(Array.isArray(baronApps));
  baronApps.forEach((a) => assert.equal(a.instrumentCode, "baron"));

  const completedApps = await listApplications({ status: "completed" });
  assert.ok(Array.isArray(completedApps));
  completedApps.forEach((a) => assert.equal(a.status, "completed"));
});

test("Admin: buildExcelWorkbook generates valid Excel XML workbook string", async () => {
  const apps = await exportApplications({});
  const xmlWorkbook = buildExcelWorkbook(apps);

  assert.equal(typeof xmlWorkbook, "string");
  assert.ok(xmlWorkbook.includes("<?xml version=\"1.0\"?>"));
  assert.ok(xmlWorkbook.includes("<Workbook"));
  assert.ok(xmlWorkbook.includes("<Worksheet ss:Name=\"Resultados\">"));
  assert.ok(xmlWorkbook.includes("Puntaje total normalizado"));
});
