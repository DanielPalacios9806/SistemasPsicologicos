/**
 * MENTE DE ACERO V2 - EVALUACIONES ASIGNADAS
 * Reemplaza el selector heredado de /index.html: el participante elige su
 * instrumento dentro del portal y solo pasa a /index.html?instrument=... para responder.
 */

import { api } from '../core/api.js';
import {
  buildEvaluationRows,
  escapeHtml,
  formatDate,
  statusClass,
  statusLabel,
} from '../core/assessmentData.mjs';

const DESCRIPTIONS = {
  ema: {
    title: 'Asertividad',
    intro: 'Explora cómo expresas ideas, necesidades y límites en situaciones cotidianas.',
  },
  baron: {
    title: 'Inteligencia emocional',
    intro: 'Observa tus recursos emocionales, tu adaptabilidad y la forma en que manejas la presión.',
  },
  disc: {
    title: 'Estilo conductual',
    intro: 'Identifica tendencias de comportamiento mediante elecciones simples entre palabras.',
  },
};

function estimatedMinutes(itemCount) {
  return Math.max(5, Math.ceil(Number(itemCount || 0) * 0.18));
}

async function loadItemCounts() {
  try {
    const payload = await api.getInstruments();
    return new Map((payload?.instruments || []).map((instrument) => [instrument.code, Number(instrument.itemCount) || 0]));
  } catch {
    return new Map();
  }
}

function renderCard(row, itemCount) {
  const copy = DESCRIPTIONS[row.instrumentCode] || { title: row.name, intro: 'Responde con calma desde tu experiencia habitual.' };
  const completed = row.status === 'completed' || row.status === 'invalid';
  const href = completed ? '#results' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`;
  const actionLabel = completed ? 'Ver resultado' : row.status === 'in_progress' ? 'Continuar evaluación' : 'Comenzar evaluación';
  const meta = itemCount ? `${itemCount} preguntas · ${estimatedMinutes(itemCount)} min aprox.` : 'Duración variable';
  const activity = row.application
    ? `Última actividad: ${formatDate(row.application.completedAt || row.application.startedAt)}`
    : 'Aún no iniciada';

  return `
    <article class="card evaluation-choice-card accent-border-${row.accent}">
      <header class="evaluation-choice-head">
        <span class="status-instrument-icon accent-${row.accent}"><i data-lucide="${row.icon}"></i></span>
        <span class="badge ${statusClass(row.status)}">${statusLabel(row.status)}</span>
      </header>
      <div class="evaluation-choice-copy">
        <span class="eyebrow">${escapeHtml(row.shortName)}</span>
        <h3>${escapeHtml(copy.title)}</h3>
        <p>${escapeHtml(copy.intro)}</p>
      </div>
      <div class="evaluation-choice-progress">
        <div class="progress-track"><div class="progress-fill" style="width:${row.percentageComplete}%"></div></div>
        <div class="progress-evaluation-meta"><span>${row.percentageComplete}% completado</span><span>${escapeHtml(activity)}</span></div>
      </div>
      <footer class="evaluation-choice-foot">
        <small><i data-lucide="clock-3"></i>${escapeHtml(meta)}</small>
        <a class="btn ${completed ? 'btn-secondary' : 'btn-navy'}" href="${href}" data-start-instrument="${completed ? '' : escapeHtml(row.instrumentCode)}">
          <span>${actionLabel}</span><i data-lucide="arrow-right"></i>
        </a>
      </footer>
    </article>
  `;
}

export async function renderEvaluationsView(container, userData) {
  const rows = buildEvaluationRows(userData?.assignments || [], userData?.applications || []);
  const itemCounts = await loadItemCounts();
  const pending = rows.filter((row) => !['completed', 'invalid'].includes(row.status)).length;

  container.innerHTML = `
    <div class="evaluations-page">
      <section class="progress-summary-band evaluations-intro">
        <div class="progress-summary-copy">
          <span class="eyebrow">${escapeHtml(userData?.assignments?.[0]?.campaignName || 'Evaluaciones asignadas')}</span>
          <h2>${rows.length ? (pending ? `Tienes ${pending} ${pending === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'}` : 'Completaste todas tus evaluaciones') : 'Sin evaluaciones asignadas'}</h2>
          <p>${rows.length ? 'Solo se muestran los instrumentos asignados a tu perfil. Tu avance se guarda automáticamente.' : 'La administración todavía no ha asignado instrumentos a tu perfil.'}</p>
        </div>
      </section>

      ${rows.length ? `
        <div class="evaluation-choice-grid">
          ${rows.map((row) => renderCard(row, itemCounts.get(row.instrumentCode))).join('')}
        </div>
      ` : `
        <div class="empty-state profile-empty">
          <i data-lucide="calendar-clock"></i>
          <h2>No hay una campaña pendiente</h2>
          <p>Vuelve más tarde o consulta con la administración responsable.</p>
        </div>
      `}

      <div class="privacy-footer-banner">
        <i data-lucide="shield-check"></i>
        <p>No hay respuestas correctas o incorrectas. Responde con naturalidad; puedes salir y retomar donde quedaste.</p>
      </div>
    </div>
  `;

  // Evita dobles clics que abren varias pestañas/solicitudes de inicio.
  container.querySelectorAll('[data-start-instrument]').forEach((link) => {
    if (!link.dataset.startInstrument) return;
    link.addEventListener('click', (event) => {
      if (link.classList.contains('is-loading')) {
        event.preventDefault();
        return;
      }
      link.classList.add('is-loading');
      link.setAttribute('aria-disabled', 'true');
    });
  });

  window.lucide?.createIcons();
}
