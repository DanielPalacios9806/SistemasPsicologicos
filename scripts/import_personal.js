#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

require("../lib/env");

const { readPersonnelWorkbook } = require("../lib/personnel/excel");
const { buildInstrumentCodes } = require("../lib/personnel/rules");
const {
  shouldUseSupabase,
  supabaseRequest,
  supabaseRequestAll,
  TABLES,
  getActiveCampaign,
} = require("../lib/storage");
const { hashPassword } = require("../lib/auth/password");

const BATCH_SIZE = 400;
const HASH_CONCURRENCY = 16;

function parseArgs(argv) {
  const args = {
    file: process.env.PERSONNEL_IMPORT_FILE || "C:\\Users\\Mauro\\Downloads\\ESCALAFÓN 29-JUN-26.xlsx",
    dryRun: false,
    apply: false,
    resetAccount: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") args.file = argv[++index];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--reset-account") args.resetAccount = true;
  }
  if (!args.dryRun && !args.apply) args.dryRun = true;
  if (args.dryRun && args.apply) throw new Error("Usa solo --dry-run o --apply, no ambos.");
  return args;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(filePath, rows, fields) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const content = [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
  fs.writeFileSync(filePath, `\ufeff${content}\n`, "utf8");
}

function buildReportRows(records) {
  const seen = new Map();
  for (const record of records) {
    if (!record.cedula) continue;
    seen.set(record.cedula, (seen.get(record.cedula) || 0) + 1);
  }

  return records.map((record) => {
    const observaciones = [...record.observaciones];
    let accion = record.accion;
    if (record.cedula && seen.get(record.cedula) > 1) {
      observaciones.push("cedula_duplicada");
      accion = "excluir";
    }
    return {
      cedula: record.cedula,
      nombres: record.nombres,
      grado: record.grado,
      promocion: record.promocion == null ? "" : record.promocion,
      unidad: record.unidad,
      clasificacion: record.classification.classification,
      baron_required: record.classification.baronRequired,
      ema_required: record.classification.emaRequired,
      disc_required: record.classification.discRequired,
      accion,
      observacion: observaciones.join(";"),
      rowNumber: record.rowNumber,
      specialtyCode: record.specialtyCode,
      descripcion: record.descripcion,
      sexo: record.sexo,
      _source: record,
    };
  });
}

function summarize(rows) {
  return {
    total: rows.length,
    elegibles: rows.filter((row) => row.accion === "upsert").length,
    excluidos: rows.filter((row) => row.accion !== "upsert").length,
    baron: rows.filter((row) => row.accion === "upsert" && row.baron_required).length,
    ema: rows.filter((row) => row.accion === "upsert" && row.ema_required).length,
    disc: rows.filter((row) => row.accion === "upsert" && row.disc_required).length,
    incidencias: rows.filter((row) => row.observacion).length,
  };
}

async function applyImport(rows, options) {
  if (!shouldUseSupabase()) throw new Error("La importacion real requiere STORAGE_DRIVER=supabase.");
  const campaign = await getActiveCampaign();
  if (!campaign) throw new Error("No existe una campana activa para crear asignaciones.");
  const validRows = rows.filter((item) => item.accion === "upsert");

  const result = {
    personas_procesadas: validRows.length,
    personas_creadas: 0,
    personas_actualizadas: 0,
    cuentas_creadas: 0,
    cuentas_ya_existentes: 0,
    baron_asignados: 0,
    ema_asignados: 0,
    disc_asignados: 0,
    registros_excluidos: rows.filter((row) => row.accion !== "upsert").length,
    errores: 0,
  };

  const cedulas = validRows.map((row) => row.cedula);
  const existingPeopleBefore = await fetchPeopleByCedulas(cedulas);
  const existingAccountsBefore = await fetchAccountsByUsernames(cedulas);
  const peopleBeforeSet = new Set(existingPeopleBefore.map((person) => person.id_number));
  const accountsBeforeSet = new Set(existingAccountsBefore.map((account) => account.username));

  await postBatches(
    TABLES.people,
    validRows.map((row) => ({
      id_number: row.cedula,
      full_name: row.nombres,
      age: "",
      gender: row.sexo || "",
      career: row.unidad || "PERSONAL MILITAR",
      email: "",
      google_id: "",
      picture: "",
    })),
    "id_number",
    "return=minimal,resolution=merge-duplicates"
  );

  const people = await fetchPeopleByCedulas(cedulas);
  const peopleByCedula = new Map(people.map((person) => [person.id_number, person]));
  result.personas_creadas = cedulas.filter((cedula) => !peopleBeforeSet.has(cedula)).length;
  result.personas_actualizadas = validRows.length - result.personas_creadas;

  await postBatches(
    TABLES.personnelProfiles,
    validRows.map((row) => ({
      person_id: peopleByCedula.get(row.cedula)?.id,
      unit_code: row.unidad || null,
      rank_code: row.grado,
      promotion: row.promocion === "" ? null : Number(row.promocion),
      specialty_code: row.specialtyCode || null,
      description: row.descripcion || null,
      sex: row.sexo || null,
      classification: row.clasificacion || null,
      source: "ESCALAFON_2026",
      source_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })).filter((row) => row.person_id),
    "person_id",
    "return=minimal,resolution=merge-duplicates"
  );

  const accountRows = await mapLimit(validRows, HASH_CONCURRENCY, async (row) => {
    const person = peopleByCedula.get(row.cedula);
    if (!person) return null;
    if (accountsBeforeSet.has(row.cedula) && !options.resetAccount) return null;
    const password = await hashPassword(row.cedula);
    return {
      person_id: person.id,
      username: row.cedula,
      password_hash: password.hash,
      password_salt: password.salt,
      password_algorithm: "scrypt-v1",
      role: "participant",
      active: true,
      must_change_password: true,
      failed_login_attempts: 0,
      locked_until: null,
      token_version: options.resetAccount ? 1 : 0,
      updated_at: new Date().toISOString(),
    };
  }).then((items) => items.filter(Boolean));
  if (accountRows.length) {
    await postBatches(
      TABLES.userAccounts,
      accountRows,
      "username",
      options.resetAccount ? "return=minimal,resolution=merge-duplicates" : "return=minimal,resolution=ignore-duplicates"
    );
  }
  result.cuentas_creadas = validRows.filter((row) => !accountsBeforeSet.has(row.cedula)).length;
  result.cuentas_ya_existentes = validRows.length - result.cuentas_creadas;

  const assignmentRows = [];
  for (const row of validRows) {
    const person = peopleByCedula.get(row.cedula);
    if (!person) continue;
    for (const code of buildInstrumentCodes(row._source.classification)) {
      assignmentRows.push({
        campaign_id: campaign.id,
        person_id: person.id,
        instrument_code: code,
        required: true,
        status: "pending",
      });
      if (code === "ema") result.ema_asignados += 1;
      if (code === "baron") result.baron_asignados += 1;
      if (code === "disc") result.disc_asignados += 1;
    }
  }
  await postBatches(
    TABLES.assessmentAssignments,
    assignmentRows,
    "campaign_id,person_id,instrument_code",
    "return=minimal,resolution=ignore-duplicates"
  );

  return result;
}

function chunks(items, size = BATCH_SIZE) {
  const out = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

function formatIn(values) {
  return values.map((value) => encodeURIComponent(value)).join(",");
}

async function fetchPeopleByCedulas(cedulas) {
  const rows = [];
  for (const chunk of chunks([...new Set(cedulas)], 250)) {
    rows.push(
      ...(await supabaseRequestAll(
        `/rest/v1/${TABLES.people}?select=id,id_number&id_number=in.(${formatIn(chunk)})`
      ))
    );
  }
  return rows;
}

async function fetchAccountsByUsernames(usernames) {
  const rows = [];
  for (const chunk of chunks([...new Set(usernames)], 250)) {
    rows.push(
      ...(await supabaseRequestAll(
        `/rest/v1/${TABLES.userAccounts}?select=id,username&username=in.(${formatIn(chunk)})`
      ))
    );
  }
  return rows;
}

async function postBatches(table, rows, onConflict, prefer) {
  for (const batch of chunks(rows)) {
    if (!batch.length) continue;
    await supabaseRequest(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: "POST",
      headers: { Prefer: prefer },
      body: JSON.stringify(batch),
    });
  }
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  const workbook = readPersonnelWorkbook(args.file);
  const rows = buildReportRows(workbook.rows);
  const dryRunRows = rows.map(({ _source, ...row }) => row);
  const fields = [
    "cedula",
    "nombres",
    "grado",
    "promocion",
    "unidad",
    "clasificacion",
    "baron_required",
    "ema_required",
    "disc_required",
    "accion",
    "observacion",
  ];

  writeCsv(path.join("reports", "import_personal_dry_run.csv"), dryRunRows, fields);
  writeCsv(
    path.join("reports", "import_personal_excepciones.csv"),
    dryRunRows.filter((row) => row.observacion),
    ["rowNumber", ...fields, "specialtyCode", "descripcion", "sexo"]
  );

  const summary = summarize(rows);
  console.log(JSON.stringify({ sheetName: workbook.sheetName, ...summary }, null, 2));

  if (args.apply) {
    const applyResult = await applyImport(rows, args);
    fs.writeFileSync(path.join("reports", "import_personal_apply_result.json"), JSON.stringify(applyResult, null, 2));
    console.log(JSON.stringify(applyResult, null, 2));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
