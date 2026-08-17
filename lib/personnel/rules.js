const OFFICER_RANKS = new Set(["TGRL", "BGRL", "CRNL", "TCRN", "MAYO", "CAPT", "TNTE", "SUBT"]);
const AEROTECH_RANKS = new Set(["SLDO", "CBOS", "CBOP", "SGOS", "SGOP", "SUBS", "SUBP", "SUBM"]);
const SENIOR_OFFICER_RANKS = new Set(["CRNL", "TCRN", "MAYO"]);
const SENIOR_NCO_RANKS = new Set(["SGOP", "SUBS", "SUBP", "SUBM"]);
const KNOWN_NON_ELIGIBLE_RANKS = new Set(["KDTE", "TRBP", "SPNR", "SPNP", "CPTO"]);

function normalizeText(value) {
  if (value == null) return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function normalizeCedula(value) {
  let raw = normalizeText(value);
  if (/^\d+\.0$/.test(raw)) raw = raw.slice(0, -2);
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return digits.padStart(10, "0");
  return digits;
}

function parsePromotion(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return Number.parseInt(digits, 10);
}

function isValidCedulaForImport(value) {
  return /^\d{10}$/.test(normalizeCedula(value));
}

function classifyRank(rankCode, promotion) {
  const rank = normalizeText(rankCode).toUpperCase();
  const promo = typeof promotion === "number" ? promotion : parsePromotion(promotion);
  const isOfficer = OFFICER_RANKS.has(rank);
  const isAerotech = AEROTECH_RANKS.has(rank);
  const isSeniorOfficer = SENIOR_OFFICER_RANKS.has(rank);
  const isSeniorNco = SENIOR_NCO_RANKS.has(rank);
  const eligible = isOfficer || isAerotech;
  const discRequired = (isSeniorOfficer && promo != null && promo >= 48 && promo <= 59) || isSeniorNco;

  let classification = "no_elegible";
  if (isSeniorOfficer) classification = "oficial_superior";
  else if (isOfficer) classification = "oficial";
  else if (isSeniorNco) classification = "aerotecnico_disc";
  else if (isAerotech) classification = "aerotecnico";

  return {
    rank,
    promotion: promo,
    knownRank: eligible || KNOWN_NON_ELIGIBLE_RANKS.has(rank),
    eligible,
    classification,
    baronRequired: eligible,
    emaRequired: eligible,
    discRequired,
  };
}

function buildInstrumentCodes(classification) {
  const instruments = [];
  if (classification.emaRequired) instruments.push("ema");
  if (classification.baronRequired) instruments.push("baron");
  if (classification.discRequired) instruments.push("disc");
  return instruments;
}

module.exports = {
  OFFICER_RANKS,
  AEROTECH_RANKS,
  SENIOR_OFFICER_RANKS,
  SENIOR_NCO_RANKS,
  normalizeText,
  normalizeCedula,
  parsePromotion,
  isValidCedulaForImport,
  classifyRank,
  buildInstrumentCodes,
};
