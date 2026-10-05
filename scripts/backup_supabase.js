const fs = require("fs");
const path = require("path");

require("../lib/env");
const { shouldUseSupabase, supabaseRequestAll, TABLES } = require("../lib/storage");

const outputDir = process.argv[2] ? path.resolve(process.argv[2]) : "";
if (!outputDir) {
  console.error("Uso: npm run backup:supabase -- <directorio-destino>");
  process.exit(1);
}
if (!shouldUseSupabase()) {
  console.error("El respaldo requiere una conexion Supabase configurada.");
  process.exit(1);
}

const tableNames = [
  TABLES.people,
  TABLES.personnelProfiles,
  TABLES.userAccounts,
  TABLES.assessmentCampaigns,
  TABLES.assessmentAssignments,
  TABLES.applications,
  TABLES.responses,
  TABLES.partialResults,
  TABLES.finalResults,
  TABLES.staffCampaignAccess,
  TABLES.auditEvents,
  "instrument_versions",
  "survey_submissions",
];

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const manifest = { createdAt: new Date().toISOString(), tables: {} };
  for (const tableName of tableNames) {
    let rows;
    try {
      rows = await supabaseRequestAll(`/rest/v1/${tableName}?select=*`);
    } catch (error) {
      console.warn(`${tableName}: omitida (${error.message})`);
      manifest.tables[tableName] = { error: error.message };
      continue;
    }
    const fileName = `${tableName}.json`;
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(rows, null, 2), { encoding: "utf8", mode: 0o600 });
    manifest.tables[tableName] = { rows: rows.length, file: fileName };
    console.log(`${tableName}: ${rows.length}`);
  }
  fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), { encoding: "utf8", mode: 0o600 });
  console.log(`Respaldo completo: ${outputDir}`);
}

main().catch((error) => {
  console.error(`No se pudo completar el respaldo: ${error.message}`);
  process.exit(1);
});
