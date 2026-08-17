const XLSX = require("xlsx");
const {
  normalizeText,
  normalizeCedula,
  isValidCedulaForImport,
  parsePromotion,
  classifyRank,
} = require("./rules");

const HEADER_ALIASES = {
  unidad: ["rpto", "reparto", "unidad"],
  grado: ["grado", "rank"],
  cedula: ["cedula", "cédula", "id_number", "identificacion"],
  nombres: ["nombres", "nombre", "full_name"],
  specialty: ["cefae", "especialidad", "codigo"],
  descripcion: ["descripcion", "descripción", "description"],
  promotion: ["prom", "promocion", "promoción"],
  sexo: ["sexo", "gender"],
};

function normalizeHeader(value) {
  return normalizeText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectColumns(headers) {
  const normalized = headers.map(normalizeHeader);
  const detected = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const aliasSet = new Set(aliases.map(normalizeHeader));
    const index = normalized.findIndex((header) => aliasSet.has(header));
    if (index >= 0) detected[key] = index;
  }
  return detected;
}

function readPersonnelWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
    cellText: true,
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  const headerRowIndex = matrix.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "cedula"));
  if (headerRowIndex < 0) throw new Error("No se encontro una fila de encabezados con cedula.");

  const headers = matrix[headerRowIndex].map(normalizeText);
  const columns = detectColumns(headers);
  for (const required of ["cedula", "nombres", "grado"]) {
    if (columns[required] == null) throw new Error(`No se encontro la columna requerida: ${required}.`);
  }

  const rows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => normalizeText(cell)));
  return {
    sheetName,
    headers,
    columns,
    rows: rows.map((row, index) => buildPersonnelRecord(row, columns, headerRowIndex + index + 2)),
  };
}

function buildPersonnelRecord(row, columns, rowNumber) {
  const cedula = normalizeCedula(row[columns.cedula]);
  const rank = normalizeText(row[columns.grado]).toUpperCase();
  const promotion = parsePromotion(columns.promotion == null ? "" : row[columns.promotion]);
  const classification = classifyRank(rank, promotion);
  const observaciones = [];

  if (!cedula) observaciones.push("cedula_vacia");
  else if (!isValidCedulaForImport(cedula)) observaciones.push("cedula_invalida");
  if (!normalizeText(row[columns.nombres])) observaciones.push("sin_nombre");
  if (!classification.knownRank) observaciones.push("grado_desconocido");
  if (!classification.eligible) observaciones.push("fuera_de_reglas_oficial_aerotecnico");

  const fatal = observaciones.some((item) =>
    ["cedula_vacia", "cedula_invalida", "sin_nombre", "grado_desconocido"].includes(item)
  );

  return {
    rowNumber,
    cedula,
    nombres: normalizeText(row[columns.nombres]).toUpperCase(),
    grado: rank,
    promocion: promotion,
    unidad: normalizeText(columns.unidad == null ? "" : row[columns.unidad]).toUpperCase(),
    specialtyCode: normalizeText(columns.specialty == null ? "" : row[columns.specialty]).toUpperCase(),
    descripcion: normalizeText(columns.descripcion == null ? "" : row[columns.descripcion]).toUpperCase(),
    sexo: normalizeText(columns.sexo == null ? "" : row[columns.sexo]).toUpperCase(),
    classification,
    accion: classification.eligible && !fatal ? "upsert" : "excluir",
    observaciones,
  };
}

module.exports = {
  readPersonnelWorkbook,
};
