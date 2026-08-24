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
      level: item.category || 'pendiente',
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

  return (scoring.dimensions || []).map((item) => ({
    key: item.key,
    label: item.label,
    value: clamp(item.favorablePercentage),
    max: 100,
    displayValue: item.favorablePercentage == null ? 'Parcial' : `${Math.round(item.favorablePercentage)}%`,
    level: item.interpretiveLevel || item.band || 'Pendiente',
  }));
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

export function getFirstName(fullName) {
  return String(fullName || 'Participante').trim().split(/\s+/)[0] || 'Participante';
}
