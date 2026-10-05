const INSTRUMENTS = {
  baron: {
    shortName: 'Bar-On ICE',
    name: 'Inventario de Cociente Emocional Bar-On ICE',
    icon: 'brain',
    accent: 'blue',
  },
  ema: {
    shortName: 'EMA',
    name: 'Escala Multidimensional de Asertividad',
    icon: 'messages-square',
    accent: 'teal',
  },
  disc: {
    shortName: 'DISC',
    name: 'Perfil Conductual DISC',
    icon: 'compass',
    accent: 'gold',
  },
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : min;
}

export function getInstrumentMeta(code) {
  const normalized = String(code || '').toLowerCase();
  return INSTRUMENTS[normalized] || {
    shortName: normalized ? normalized.toUpperCase() : 'Evaluación',
    name: 'Evaluación psicológica',
    icon: 'clipboard-list',
    accent: 'blue',
  };
}

export function formatDate(value, options = {}) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function sortApplications(applications = []) {
  return [...applications].sort((a, b) => {
    const left = new Date(a.completedAt || a.startedAt || 0).getTime();
    const right = new Date(b.completedAt || b.startedAt || 0).getTime();
    return right - left;
  });
}

export function getLatestByInstrument(applications = []) {
  const result = new Map();
  for (const application of sortApplications(applications)) {
    if (!result.has(application.instrumentCode)) {
      result.set(application.instrumentCode, application);
    }
  }
  return result;
}

export function buildEvaluationRows(assignments = [], applications = []) {
  const latestByInstrument = getLatestByInstrument(applications);
  const assignmentCodes = new Set(assignments.map((item) => item.instrumentCode));
  const codes = [
    ...assignments.map((item) => item.instrumentCode),
    ...applications.map((item) => item.instrumentCode).filter((code) => !assignmentCodes.has(code)),
  ];

  return [...new Set(codes)].map((instrumentCode) => {
    const assignment = assignments.find((item) => item.instrumentCode === instrumentCode) || {};
    const application = latestByInstrument.get(instrumentCode) || null;
    const status = application?.status || assignment.status || 'pending';
    const percentageComplete = clamp(application?.percentageComplete ?? assignment.percentageComplete ?? 0);
    return {
      instrumentCode,
      ...getInstrumentMeta(instrumentCode),
      status,
      percentageComplete,
      application,
      required: assignment.required !== false,
    };
  });
}

export function statusLabel(status) {
  if (status === 'completed') return 'Completada';
  if (status === 'invalid') return 'Requiere revisión';
  if (status === 'in_progress') return 'En progreso';
  return 'Pendiente';
}

export function statusClass(status) {
  if (status === 'completed') return 'badge-success';
  if (status === 'invalid') return 'badge-warning';
  if (status === 'in_progress') return 'badge-info';
  return 'badge-subtle';
}

export function getScoreSummary(application) {
  if (!application || !['completed', 'invalid'].includes(application.status)) return null;
  const scoring = application.scoring || {};
  const finalResult = application.finalResult || {};
  const profile = finalResult.profileGlobal || scoring.profile || 'Resultado disponible';

  if (application.instrumentCode === 'baron') {
    const value = scoring.total?.ceScore ?? finalResult.totalNormalized;
    return {
      profile,
      value: Number.isFinite(Number(value)) ? `CE ${Math.round(Number(value))}` : null,
      valid: application.valid !== false,
    };
  }

  if (application.instrumentCode === 'disc') {
    return { profile, value: null, valid: application.valid !== false };
  }

  const value = finalResult.totalNormalized ?? scoring.overallPercentage;
  return {
    profile,
    value: Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : null,
    valid: application.valid !== false,
  };
}

export function getDimensions(application) {
  if (!application) return [];
  const scoring = application.scoring || application.finalResult?.detailJson || {};

  if (application.instrumentCode === 'baron') {
    return (scoring.components || []).map((item) => ({
      key: item.key,
      label: item.label,
      value: clamp(item.ceScore, 0, 140),
      max: 140,
      displayValue: item.ceScore == null ? 'Parcial' : `CE ${Math.round(item.ceScore)}`,
      level: formatLevel(item.category || 'pendiente'),
    }));
  }

  if (application.instrumentCode === 'disc') {
    return (scoring.dimensions || []).map((item) => ({
      key: item.key,
      label: item.label,
      value: clamp((Number(scoring.most?.[item.key]) / 28) * 100),
      max: 100,
      displayValue: item.interpretiveLevel || `DIF ${item.rawTotal ?? 0}`,
      level: item.band || 'Intermedio',
    }));
  }

  // EMA: en "No asertividad" y "Asertividad indirecta" se muestra cuánto del rasgo
  // aparece (100 − porcentaje favorable), para que un valor alto signifique "más del rasgo".
  return (scoring.dimensions || []).map((item) => {
    const isRisk = EMA_RISK_KEYS.has(item.key);
    const favorable = item.favorablePercentage;
    const shown = favorable == null ? null : isRisk ? 100 - Number(favorable) : Number(favorable);
    return {
      key: item.key,
      label: item.label,
      value: clamp(shown),
      max: 100,
      displayValue: shown == null ? 'Parcial' : `${Math.round(shown)}%`,
      level: emaLevel(item, isRisk),
    };
  });
}

export function getOverallProgress(rows = []) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, item) => sum + item.percentageComplete, 0) / rows.length);
}

export function getObservationGroups(application) {
  const observations = application?.scoring?.observations || {};
  return {
    strengths: Array.isArray(observations.strengths) ? observations.strengths : [],
    attentionAreas: Array.isArray(observations.attentionAreas) ? observations.attentionAreas : [],
    suggestions: Array.isArray(observations.suggestions) ? observations.suggestions : [],
  };
}

const EMA_RISK_KEYS = new Set(['no_asertividad', 'asertividad_indirecta']);

function emaLevel(item, isRisk) {
  if (!isRisk) return item.interpretiveLevel || formatLevel(item.band) || 'Pendiente';
  if (item.band === 'high') return 'Presencia baja (favorable)';
  if (item.band === 'medium') return 'Presencia moderada';
  if (item.band === 'low') return 'Presencia elevada (requiere atención)';
  return item.interpretiveLevel || 'Pendiente';
}

const LEVEL_LABELS = {
  very_low: 'Muy bajo',
  low: 'Bajo',
  average: 'Promedio',
  high: 'Alto',
  very_high: 'Muy alto',
  pendiente: 'Pendiente',
};

/** Traduce códigos internos de nivel (very_low, average…) a texto legible. */
export function formatLevel(value) {
  const key = String(value || '').trim();
  return LEVEL_LABELS[key] || LEVEL_LABELS[key.toLowerCase()] || key;
}

function titleCase(value) {
  return String(value || '')
    .toLocaleLowerCase('es-EC')
    .replace(/(^|[\s'-])(\p{L})/gu, (match, separator, letter) => separator + letter.toLocaleUpperCase('es-EC'));
}

/** Nombre completo en formato legible: "PALACIOS GALLARDO DANIEL" → "Palacios Gallardo Daniel". */
export function formatPersonName(fullName) {
  const clean = String(fullName || '').trim().replace(/\s+/g, ' ');
  return clean ? titleCase(clean) : 'Participante';
}

/**
 * Nombre de pila para saludos. Las nóminas institucionales registran
 * "APELLIDO APELLIDO NOMBRE NOMBRE" en mayúsculas; en ese caso se usa el
 * tercer término. Si el nombre viene escrito por la persona, se usa el primero.
 */
export function getFirstName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Participante';
  const isInstitutionalFormat = parts.length >= 3 && parts.join(' ') === parts.join(' ').toLocaleUpperCase('es-EC');
  return titleCase(isInstitutionalFormat ? parts[2] : parts[0]);
}
