/**
 * MENTE DE ACERO V2 - ASSIGNMENT PROGRESS
 */

import {
  buildEvaluationRows,
  escapeHtml,
  formatDate,
  getOverallProgress,
  statusClass,
  statusLabel,
} from '../core/assessmentData.mjs';
import { renderRadialGauge } from '../charts/radialGauge.js';

export async function renderProgressView(container, userData) {
  const rows = buildEvaluationRows(userData?.assignments || [], userData?.applications || []);
  const overallProgress = getOverallProgress(rows);
  const completedCount = rows.filter((row) => row.status === 'completed').length;
  const hasActiveCampaign = (userData?.assignments || []).length > 0;
  const campaignName = userData?.assignments?.[0]?.campaignName || '';

  container.innerHTML = `
    <div class="progress-page">
      <section class="progress-summary-band">
        <div class="progress-summary-copy">
          <span class="eyebrow">${hasActiveCampaign ? escapeHtml(campaignName || 'CAMPAÑA ACTIVA') : 'HISTORIAL DE EVALUACIONES'}</span>
          <h2>${rows.length ? `${completedCount} de ${rows.length} evaluaciones completadas` : 'Sin evaluaciones asignadas'}</h2>
          <p>${rows.length ? 'Tu avance se guarda automáticamente después de cada respuesta.' : 'La administración todavía no ha asignado instrumentos a tu perfil.'}</p>
        </div>
        <div id="progressPageGauge"></div>
      </section>

      <section class="progress-list-section">
        <div class="profile-section-heading">
          <div><h2>Detalle del avance</h2><p>Estado actual de cada instrumento.</p></div>
        </div>
        <div class="progress-evaluation-list">
          ${rows.length ? rows.map((row, index) => {
            const completed = row.status === 'completed' || row.status === 'invalid';
            return `
              <article class="card progress-evaluation-card">
                <div class="progress-sequence">${String(index + 1).padStart(2, '0')}</div>
                <div class="status-instrument-icon accent-${row.accent}"><i data-lucide="${row.icon}"></i></div>
                <div class="progress-evaluation-copy">
                  <div class="progress-evaluation-heading">
                    <div><span class="eyebrow">${escapeHtml(row.shortName)}</span><h3>${escapeHtml(row.name)}</h3></div>
                    <span class="badge ${statusClass(row.status)}">${statusLabel(row.status)}</span>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:${row.percentageComplete}%"></div></div>
                  <div class="progress-evaluation-meta">
                    <span>${row.percentageComplete}% completado</span>
                    <span>${row.application ? `Última actividad: ${formatDate(row.application.completedAt || row.application.startedAt)}` : 'Aún no iniciada'}</span>
                  </div>
                </div>
                <a class="btn ${completed ? 'btn-secondary' : 'btn-navy'} btn-sm" href="${completed ? '#results' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`}">
                  ${completed ? 'Resultado' : row.status === 'in_progress' ? 'Continuar' : 'Comenzar'}
                  <i data-lucide="arrow-right"></i>
                </a>
              </article>
            `;
          }).join('') : `
            <div class="empty-state profile-empty">
              <i data-lucide="calendar-clock"></i>
              <h2>No hay una campaña pendiente</h2>
              <p>Vuelve más tarde o consulta con la administración responsable.</p>
            </div>
          `}
        </div>
      </section>

      <div class="privacy-footer-banner">
        <i data-lucide="save"></i>
        <p>Puedes salir y regresar: el sistema conserva el último avance guardado de cada instrumento.</p>
      </div>
    </div>
  `;

  renderRadialGauge(container.querySelector('#progressPageGauge'), overallProgress, 100, 'Avance de evaluaciones');
  window.lucide?.createIcons();
}
