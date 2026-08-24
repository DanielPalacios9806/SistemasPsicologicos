const XLSX = require("xlsx");

const INSTRUMENT_LABELS = { ema: "EMA", baron: "Bar-On ICE", disc: "DISC" };
const INSTRUMENT_ITEM_COUNTS = { ema: 45, baron: 133, disc: 28 };

function sanitizeCell(value) {
  if (value == null) return "";
  if (value instanceof Date || typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function parseDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? sanitizeCell(value) : date;
}

function durationMinutes(application) {
  if (!application.startedAt || !application.completedAt) return "";
  const duration = new Date(application.completedAt).getTime() - new Date(application.startedAt).getTime();
  return Number.isFinite(duration) && duration >= 0 ? Math.round(duration / 60000) : "";
}

function getObservations(application) {
  return (
    application.scoringSnapshot?.observations ||
    application.finalResult?.interpretationJson?.observations ||
    application.finalResult?.interpretationJson ||
    {}
  );
}

function buildCommonRow(application, index) {
  const participant = application.participant || {};
  const finalResult = application.finalResult || {};
  const observations = getObservations(application);
  return {
    Numero: index + 1,
    "Fecha de evaluacion": parseDate(application.completedAt || application.startedAt),
    Cedula: sanitizeCell(participant.idNumber),
    "Nombres y apellidos": sanitizeCell(participant.fullName),
    "Grado militar": sanitizeCell([participant.rankCode, participant.rankName].filter(Boolean).join(" - ")),
    "Unidad o dependencia": sanitizeCell(participant.unitName || participant.unit || participant.unitCode || participant.career),
    "Curso o promocion": sanitizeCell(participant.promotion == null ? "" : `Promocion ${participant.promotion}`),
    Campana: sanitizeCell(application.campaign?.name || application.campaignName || ""),
    Evaluacion: sanitizeCell(INSTRUMENT_LABELS[application.instrumentCode] || application.instrumentName),
    Estado: sanitizeCell(application.status),
    "Fecha de inicio": parseDate(application.startedAt),
    "Fecha de finalizacion": parseDate(application.completedAt),
    "Duracion (minutos)": durationMinutes(application),
    "Avance %": Number(application.percentageComplete || 0),
    Valido: application.valid == null ? "" : application.valid ? "Si" : "No",
    "Puntaje total bruto": finalResult.totalRaw ?? application.scoringSnapshot?.totalRaw ?? application.scoringSnapshot?.total?.rawScore ?? "",
    "Puntaje total normalizado": finalResult.totalNormalized ?? application.scoringSnapshot?.overallPercentage ?? application.scoringSnapshot?.total?.ceScore ?? "",
    "Perfil global": sanitizeCell(finalResult.profileGlobal ?? application.scoringSnapshot?.profile ?? ""),
    Resumen: sanitizeCell(finalResult.interpretationJson?.summary ?? application.scoringSnapshot?.summary ?? ""),
    Fortalezas: sanitizeCell((observations.strengths || []).join(" | ")),
    "Areas de atencion": sanitizeCell((observations.attentionAreas || []).join(" | ")),
    Sugerencias: sanitizeCell((observations.suggestions || []).join(" | ")),
  };
}

function buildInstrumentRow(application, index) {
  const row = buildCommonRow(application, index);
  const answerMap = new Map((application.answers || []).map((answer) => [Number(answer.itemId), answer.value]));
  const itemCount = INSTRUMENT_ITEM_COUNTS[application.instrumentCode] || answerMap.size;
  for (let itemId = 1; itemId <= itemCount; itemId += 1) row[`P${itemId}`] = answerMap.get(itemId) ?? "";

  if (application.instrumentCode === "baron") {
    for (const component of application.scoringSnapshot?.components || []) {
      row[`CE ${component.label}`] = component.ceScore ?? "";
      row[`Categoria ${component.label}`] = sanitizeCell(component.category || "");
    }
  } else if (application.instrumentCode === "disc") {
    for (const key of ["D", "I", "S", "C"]) {
      row[`DISC ${key} MAS`] = application.scoringSnapshot?.most?.[key] ?? "";
      row[`DISC ${key} MENOS`] = application.scoringSnapshot?.least?.[key] ?? "";
      row[`DISC ${key} DIF`] = application.scoringSnapshot?.difference?.[key] ?? "";
    }
  } else {
    for (const dimension of application.scoringSnapshot?.dimensions || []) {
      row[`EMA ${dimension.label} %`] = dimension.favorablePercentage ?? "";
      row[`EMA ${dimension.label} nivel`] = sanitizeCell(dimension.band || "");
    }
  }
  return row;
}

function formatWorksheet(worksheet, rowCount) {
  if (!worksheet["!ref"]) return worksheet;
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const widths = [];
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    let maxLength = 12;
    for (let row = range.s.r; row <= Math.min(range.e.r, 200); row += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      maxLength = Math.max(maxLength, String(cell?.v ?? "").length);
    }
    widths.push({ wch: Math.min(maxLength + 2, 42) });
  }
  worksheet["!cols"] = widths;
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ r: 0, c: range.s.c }, { r: Math.max(rowCount, 1), c: range.e.c }),
  };
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
  return worksheet;
}

function appendSheet(workbook, name, rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  formatWorksheet(worksheet, rows.length);
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function buildExcelWorkbook(applications) {
  const workbook = XLSX.utils.book_new();
  const rows = applications || [];
  appendSheet(workbook, "Resumen", rows.map(buildCommonRow));
  for (const code of ["ema", "baron", "disc"]) {
    const instrumentApplications = rows.filter((application) => application.instrumentCode === code);
    if (instrumentApplications.length) {
      appendSheet(workbook, INSTRUMENT_LABELS[code], instrumentApplications.map(buildInstrumentRow));
    }
  }
  workbook.Props = {
    Title: "MENTE DE ACERO - Resultados de evaluaciones",
    Subject: "Resultados separados por instrumento",
    Author: "MENTE DE ACERO",
    CreatedDate: new Date(),
  };
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellDates: true, compression: true });
}

module.exports = { buildExcelWorkbook, sanitizeCell };
