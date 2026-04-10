const { QUESTIONS } = require("./instrument");

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildHeaders() {
  return [
    "ID",
    "Fecha",
    "Cedula",
    "Nombres y apellidos",
    "Carrera",
    "Edad",
    "Genero",
    "Correo",
    ...QUESTIONS.map((question) => `P${question.id}`),
    "Puntaje Asertividad directa",
    "Promedio Asertividad directa",
    "Porcentaje Asertividad directa",
    "Puntaje No asertividad",
    "Promedio No asertividad",
    "Porcentaje No asertividad",
    "Puntaje Asertividad indirecta",
    "Promedio Asertividad indirecta",
    "Porcentaje Asertividad indirecta",
    "Puntaje total bruto",
    "Puntaje total ajustado",
    "Promedio total",
    "Porcentaje total",
    "Perfil global",
    "Fortalezas",
    "Areas de atencion",
    "Sugerencias",
  ];
}

function submissionToRow(submission, index) {
  const dimensionMap = Object.fromEntries(submission.scoring.dimensions.map((item) => [item.key, item]));
  return [
    index + 1,
    submission.createdAt,
    submission.participant.idNumber,
    submission.participant.fullName,
    submission.participant.career,
    submission.participant.age,
    submission.participant.gender,
    submission.participant.email || "",
    ...submission.answers.map((answer) => answer.value),
    dimensionMap.asertividad_directa.rawTotal,
    dimensionMap.asertividad_directa.rawAverage,
    dimensionMap.asertividad_directa.favorablePercentage,
    dimensionMap.no_asertividad.rawTotal,
    dimensionMap.no_asertividad.rawAverage,
    dimensionMap.no_asertividad.favorablePercentage,
    dimensionMap.asertividad_indirecta.rawTotal,
    dimensionMap.asertividad_indirecta.rawAverage,
    dimensionMap.asertividad_indirecta.favorablePercentage,
    submission.scoring.totalRaw,
    submission.scoring.totalAdjusted,
    submission.scoring.overallAverage,
    submission.scoring.overallPercentage,
    submission.scoring.profile,
    submission.scoring.observations.strengths.join(" | "),
    submission.scoring.observations.attentionAreas.join(" | "),
    submission.scoring.observations.suggestions.join(" | "),
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

function buildExcelWorkbook(submissions) {
  const headers = buildHeaders();
  const rows = submissions.map(submissionToRow);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Resultados EMA">
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
