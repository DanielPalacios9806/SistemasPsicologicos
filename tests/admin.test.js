const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const XLSX = require("xlsx");

process.env.STORAGE_DRIVER = "local";
process.env.APP_DATA_DIR = path.join(os.tmpdir(), `mente-de-acero-admin-tests-${process.pid}`);

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

test("Admin: buildExcelWorkbook generates a real XLSX workbook", async () => {
  const apps = await exportApplications({});
  const buffer = buildExcelWorkbook(apps);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  assert.equal(Buffer.isBuffer(buffer), true);
  assert.ok(buffer.subarray(0, 2).equals(Buffer.from("PK")));
  assert.ok(workbook.SheetNames.includes("Resumen"));
  const summaryRows = XLSX.utils.sheet_to_json(workbook.Sheets.Resumen, { defval: "" });
  if (summaryRows.length) assert.ok(Object.hasOwn(summaryRows[0], "Puntaje total normalizado"));
});
