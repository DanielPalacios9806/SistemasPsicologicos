function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildHeaders(maxQuestionCount) {
  return [
    "ID",
    "Instrumento",
    "Estado",
    "Fecha inicio",
    "Fecha fin",
    "Cedula",
    "Nombres y apellidos",
    "Carrera",
    "Edad",
    "Genero",
    "Correo",
    "Modulo actual",
    "Avance %",
    "Valido",
    ...Array.from({ length: maxQuestionCount }, (_, index) => `P${index + 1}`),
    "Puntaje total bruto",
    "Puntaje total normalizado",
    "Perfil global",
    "Resumen",
    "Fortalezas",
    "Areas de atencion",
    "Sugerencias",
  ];
}

function getAnswerMap(application) {
  const map = new Map();
  for (const answer of application.answers || []) {
    map.set(answer.itemId, answer.value);
  }
  return map;
}

function applicationToRow(application, index, maxQuestionCount) {
  const answerMap = getAnswerMap(application);
  const finalResult = application.finalResult || {};
  const observations =
    application.scoringSnapshot?.observations ||
    finalResult.interpretationJson?.observations ||
    finalResult.interpretationJson ||
    {};

  return [
    index + 1,
    application.instrumentCode,
    application.status,
    application.startedAt || "",
    application.completedAt || "",
    application.participant?.idNumber || "",
    application.participant?.fullName || "",
    application.participant?.career || "",
    application.participant?.age || "",
    application.participant?.gender || "",
    application.participant?.email || "",
    application.currentModuleKey || "",
    application.percentageComplete ?? 0,
    application.valid == null ? "" : application.valid ? "Si" : "No",
    ...Array.from({ length: maxQuestionCount }, (_, position) => answerMap.get(position + 1) ?? ""),
    finalResult.totalRaw ?? application.scoringSnapshot?.totalRaw ?? application.scoringSnapshot?.total?.rawScore ?? "",
    finalResult.totalNormalized ??
      application.scoringSnapshot?.overallPercentage ??
      application.scoringSnapshot?.total?.ceScore ??
      "",
    finalResult.profileGlobal ?? application.scoringSnapshot?.profile ?? "",
    finalResult.interpretationJson?.summary ?? application.scoringSnapshot?.summary ?? "",
    (observations.strengths || []).join(" | "),
    (observations.attentionAreas || []).join(" | "),
    (observations.suggestions || []).join(" | "),
  ];
}

function buildRow(cells) {
  const xmlCells = cells
    .map(
      (cell) =>
        `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`
    )
    .join("");
  return `<Row>${xmlCells}</Row>`;
}

function buildExcelWorkbook(applications, sheetName = "Resultados") {
  const maxQuestionCount = applications.reduce((max, application) => {
    const count = Math.max(
      application.answers?.length || 0,
      application.scoringSnapshot?.answerCount || 0,
      application.instrumentCode === "baron" ? 133 : 45
    );
    return Math.max(max, count);
  }, 45);

  const headers = buildHeaders(maxQuestionCount);
  const rows = applications.map((application, index) => applicationToRow(application, index, maxQuestionCount));

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="${xmlEscape(sheetName)}">
    <Table>
      ${buildRow(headers)}
      ${rows.map(buildRow).join("")}
    </Table>
  </Worksheet>
</Workbook>`;
}

module.exports = {
  buildExcelWorkbook,
};
