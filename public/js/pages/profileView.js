/**
 * MENTE DE ACERO V2 - PARTICIPANT PROFILE
 */

import {
  escapeHtml,
  formatDate,
  getDimensions,
  getInstrumentMeta,
  getObservationGroups,
  getScoreSummary,
  sortApplications,
} from '../core/assessmentData.mjs';

function renderInstrumentProfile(application) {
  const meta = getInstrumentMeta(application.instrumentCode);
  const summary = getScoreSummary(application);
  const dimensions = getDimensions(application);
  const observations = getObservationGroups(application);
  return `
    <article class="card profile-instrument-card">
      <div class="profile-instrument-header">
        <div class="profile-instrument-title">
          <div class="status-instrument-icon accent-${meta.accent}"><i data-lucide="${meta.icon}"></i></div>
          <div>
            <span class="eyebrow">${escapeHtml(meta.shortName)} · ${formatDate(application.completedAt)}</span>
            <h2>${escapeHtml(application.instrumentName)}</h2>
          </div>
        </div>
        <div class="profile-score-summary">
          <strong>${escapeHtml(summary?.value || 'Perfil')}</strong>
          <span>${escapeHtml(summary?.profile || 'Resultado disponible')}</span>
        </div>
      </div>
      ${summary?.valid === false ? '<div class="result-validity-warning"><i data-lucide="triangle-alert"></i>El resultado requiere revisión de validez.</div>' : ''}
      <div class="profile-instrument-body">
        <div class="profile-dimensions">
          <h3>Dimensiones</h3>
          ${dimensions.length ? dimensions.map((dimension) => `
            <div class="dimension-progress-row">
              <div><span>${escapeHtml(dimension.label)}</span><strong>${escapeHtml(dimension.displayValue)}</strong></div>
              <div class="progress-track"><div class="progress-fill" style="width:${Math.min((dimension.value / dimension.max) * 100, 100)}%"></div></div>
              <small>${escapeHtml(dimension.level)}</small>
            </div>
          `).join('') : '<div class="empty-inline">No hay dimensiones desagregadas para este resultado.</div>'}
        </div>
        <div class="profile-observations">
          <h3>Lectura orientativa</h3>
          ${observations.strengths.slice(0, 2).map((item) => `<div class="profile-note strength"><i data-lucide="star"></i><p>${escapeHtml(item)}</p></div>`).join('')}
          ${observations.attentionAreas.slice(0, 2).map((item) => `<div class="profile-note attention"><i data-lucide="target"></i><p>${escapeHtml(item)}</p></div>`).join('')}
          ${!observations.strengths.length && !observations.attentionAreas.length ? '<div class="empty-inline">La interpretación detallada no está disponible para este registro.</div>' : ''}
        </div>
      </div>
    </article>
  `;
}

export async function renderProfileView(container, userData) {
  const person = userData?.user?.person || {};
  const completed = sortApplications(userData?.applications || []).filter((item) => ['completed', 'invalid'].includes(item.status));
  const initials = person.fullName
    ? person.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'MA';

  container.innerHTML = `
    <div class="profile-page">
      <section class="profile-identity-band">
        <div class="profile-identity-main">
          <div class="user-avatar profile-avatar">${escapeHtml(initials)}</div>
          <div>
            <span class="eyebrow">PERFIL PERSONAL</span>
            <h2>${escapeHtml(person.fullName || 'Participante')}</h2>
            <p>${escapeHtml(person.rankName || person.personnelCategory || 'Participante')}</p>
          </div>
        </div>
        <dl class="profile-identity-data">
          <div><dt>Identificación</dt><dd>${escapeHtml(person.idNumber || '-')}</dd></div>
          <div><dt>Unidad</dt><dd>${escapeHtml(person.unitName || person.unit || '-')}</dd></div>
          <div><dt>Perfiles disponibles</dt><dd>${completed.length}</dd></div>
        </dl>
      </section>

      <div class="profile-section-heading">
        <div><h2>Perfiles por instrumento</h2><p>Cada evaluación conserva su propio modelo de puntuación e interpretación.</p></div>
        <a class="btn btn-secondary btn-sm" href="#results"><i data-lucide="bar-chart-3"></i>Ver resultados</a>
      </div>

      <div class="profile-instruments-list">
        ${completed.length ? completed.map(renderInstrumentProfile).join('') : `
          <div class="empty-state profile-empty">
            <i data-lucide="user-round-search"></i>
            <h2>Tu perfil se está construyendo</h2>
            <p>Completa al menos una evaluación para ver sus dimensiones y lectura orientativa.</p>
            <a class="btn btn-primary" href="/index.html"><i data-lucide="clipboard-list"></i>Ir a evaluaciones</a>
          </div>
        `}
      </div>

      <div class="privacy-footer-banner">
        <i data-lucide="info"></i>
        <p>Los instrumentos se presentan de forma independiente para evitar mezclar escalas o interpretar un índice clínico inexistente.</p>
      </div>
    </div>
  `;
  window.lucide?.createIcons();
}
