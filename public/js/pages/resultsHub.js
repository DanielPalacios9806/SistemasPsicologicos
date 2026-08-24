/**
 * MENTE DE ACERO V2 - EVALUATIONS & RESULTS
 */

import {
  buildEvaluationRows,
  escapeHtml,
  formatDate,
  getDimensions,
  getObservationGroups,
  getOverallProgress,
  getScoreSummary,
  sortApplications,
  statusClass,
  statusLabel,
} from '../core/assessmentData.mjs';
import { renderRadarChart } from '../charts/radarChart.js';
import { generateReportPdf } from '../services/reportGenerator.js';

function renderHero(row) {
  if (!row) {
    return `
      <div class="hero-eval-content">
        <span class="eyebrow">EVALUACIONES</span>
        <h2>Sin instrumentos asignados</h2>
        <p>Tu ruta aparecerá cuando la administración active una evaluación para tu perfil.</p>
      </div>
      <div class="hero-eval-illustration"><i data-lucide="clipboard-check"></i></div>
    `;
  }
  const completed = row.status === 'completed' || row.status === 'invalid';
  return `
    <div class="hero-eval-content">
      <span class="eyebrow">${completed ? 'RESULTADO DISPONIBLE' : 'EVALUACIÓN ACTUAL'}</span>
      <h2>${escapeHtml(row.name)}</h2>
      <p>${completed ? 'Consulta el perfil y las dimensiones calculadas para este instrumento.' : `Tienes ${row.percentageComplete}% completado. Puedes continuar sin perder tus respuestas.`}</p>
      <div>
        <a href="${completed ? '#resultDetail' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`}" class="btn btn-primary">
          ${completed ? 'Ver resultado' : row.status === 'in_progress' ? 'Continuar evaluación' : 'Iniciar evaluación'}
          <i data-lucide="arrow-right"></i>
        </a>
      </div>
    </div>
    <div class="hero-eval-illustration accent-${row.accent}"><i data-lucide="${row.icon}"></i></div>
  `;
}

function renderStepper(rows, completedApplications) {
  const allCompleted = rows.length > 0 && rows.every((row) => ['completed', 'invalid'].includes(row.status));
  const hasResult = completedApplications.length > 0;
  const steps = [
    { label: 'Información personal', state: 'completed' },
    { label: 'Cuestionarios', state: allCompleted ? 'completed' : 'active' },
    { label: 'Resultados', state: hasResult ? 'completed' : allCompleted ? 'active' : '' },
    { label: 'Perfil', state: hasResult ? 'completed' : '' },
  ];
  return steps.map((step, index) => `
    <div class="step-node ${step.state}">
      <div class="step-circle">${step.state === 'completed' ? '✓' : index + 1}</div>
      <span class="step-label">${step.label}</span>
    </div>
  `).join('');
}

function renderEvaluationList(rows) {
  if (!rows.length) {
    return '<div class="empty-inline">No hay evaluaciones asignadas.</div>';
  }
  return rows.map((row) => {
    const completed = ['completed', 'invalid'].includes(row.status);
    return `
      <div class="active-eval-item">
        <div class="active-eval-left">
          <div class="active-eval-icon accent-${row.accent}"><i data-lucide="${row.icon}"></i></div>
          <div class="active-eval-info">
            <span>${escapeHtml(row.shortName)}</span>
            <small>${statusLabel(row.status)} · ${row.percentageComplete}%</small>
            <div class="progress-track"><div class="progress-fill" style="width:${row.percentageComplete}%"></div></div>
          </div>
        </div>
        <a href="${completed ? '#resultDetail' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`}" class="btn btn-secondary btn-sm">
          ${completed ? 'Ver' : row.status === 'in_progress' ? 'Continuar' : 'Iniciar'}
        </a>
      </div>
    `;
  }).join('');
}

function renderResultSelector(applications, selectedId) {
  if (!applications.length) {
    return `
      <div class="empty-state compact-empty">
        <i data-lucide="file-clock"></i>
        <h3>No hay informes disponibles</h3>
        <p>Los resultados aparecerán después de completar una evaluación.</p>
      </div>
    `;
  }
  return applications.map((application) => {
    const summary = getScoreSummary(application);
    const selected = application.id === selectedId;
    return `
      <button class="result-selector ${selected ? 'active' : ''}" type="button" data-result-id="${escapeHtml(application.id)}">
        <div>
          <strong>${escapeHtml(application.instrumentName)}</strong>
          <span>${formatDate(application.completedAt)}</span>
        </div>
        <span class="badge ${statusClass(application.status)}">${escapeHtml(summary?.value || summary?.profile || statusLabel(application.status))}</span>
        <i data-lucide="chevron-right"></i>
      </button>
    `;
  }).join('');
}

function renderInsight(title, icon, items, className) {
  if (!items.length) return '';
  return `
    <div class="insight-block ${className}">
      <div class="insight-header"><i data-lucide="${icon}"></i>${title}</div>
      ${items.slice(0, 2).map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
    </div>
  `;
}

function renderDetail(application) {
  if (!application) {
    return `
      <div class="result-detail-empty">
        <i data-lucide="chart-radar"></i>
        <h3>Completa una evaluación para construir tu perfil</h3>
        <p>Esta sección no utiliza valores de referencia ni puntajes simulados.</p>
      </div>
    `;
  }
  const summary = getScoreSummary(application);
  const dimensions = getDimensions(application);
  const observations = getObservationGroups(application);
  return `
    <div class="result-detail-heading">
      <div>
        <span class="eyebrow">${escapeHtml(application.instrumentCode.toUpperCase())} · ${formatDate(application.completedAt)}</span>
        <h2>${escapeHtml(application.instrumentName)}</h2>
        <p>${escapeHtml(summary?.profile || 'Resultado disponible')}</p>
      </div>
      <span class="result-main-score ${summary?.valid === false ? 'warning' : ''}">${escapeHtml(summary?.value || 'Perfil')}</span>
    </div>
    ${summary?.valid === false ? '<div class="result-validity-warning"><i data-lucide="triangle-alert"></i>Este resultado requiere revisión por sus indicadores de validez.</div>' : ''}
    <div class="result-detail-grid">
      <div class="result-chart-panel">
        <h3>Dimensiones evaluadas</h3>
        <div id="resultsRadarContainer" class="radar-wrapper"></div>
      </div>
      <div class="result-dimension-list">
        ${dimensions.length ? dimensions.map((dimension) => `
          <div class="dimension-progress-row">
            <div><span>${escapeHtml(dimension.label)}</span><strong>${escapeHtml(dimension.displayValue)}</strong></div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.min((dimension.value / dimension.max) * 100, 100)}%"></div></div>
            <small>${escapeHtml(dimension.level)}</small>
          </div>
        `).join('') : '<div class="empty-inline">Este instrumento no tiene dimensiones disponibles para graficar.</div>'}
      </div>
    </div>
    <div class="result-insights-grid">
      ${renderInsight('Fortalezas', 'star', observations.strengths, 'strengths')}
      ${renderInsight('Áreas de atención', 'target', observations.attentionAreas, 'opportunities')}
      ${renderInsight('Sugerencias', 'lightbulb', observations.suggestions, 'suggestions')}
    </div>
  `;
}

export async function renderResultsHub(container, userData, selectedResultId = null) {
  const person = userData?.user?.person || {};
  const applications = userData?.applications || [];
  const rows = buildEvaluationRows(userData?.assignments || [], applications);
  const completedApplications = sortApplications(applications).filter((item) => ['completed', 'invalid'].includes(item.status));
  const selected = completedApplications.find((item) => item.id === selectedResultId) || completedApplications[0] || null;
  const currentRow = rows.find((row) => row.status === 'in_progress') || rows.find((row) => row.status === 'pending') || rows[0];

  container.innerHTML = `
    <div class="results-hub-grid">
      <div class="results-top-row">
        <section class="card hero-eval-card">${renderHero(currentRow)}</section>
        <section class="card stepper-card">
          <div class="card-header">
            <div><h3>Tu ruta de evaluación</h3><span class="card-subtitle">${getOverallProgress(rows)}% de avance general</span></div>
          </div>
          <div class="stepper-track">${renderStepper(rows, completedApplications)}</div>
          <p class="stepper-footer">El progreso se actualiza automáticamente al guardar cada respuesta.</p>
        </section>
      </div>

      <div class="results-workspace-row">
        <section class="card">
          <div class="card-header"><div><h3>Instrumentos asignados</h3><span class="card-subtitle">Acceso directo a cada evaluación</span></div></div>
          <div class="active-evals-list">${renderEvaluationList(rows)}</div>
        </section>
        <section class="card result-selector-card">
          <div class="card-header"><div><h3>Informes disponibles</h3><span class="card-subtitle">Selecciona un resultado para revisarlo</span></div></div>
          <div class="result-selector-list">${renderResultSelector(completedApplications, selected?.id)}</div>
        </section>
      </div>

      <section class="card result-detail-card" id="resultDetail">
        ${renderDetail(selected)}
        ${selected ? `
          <div class="report-actions">
            <div><i data-lucide="lock-keyhole"></i><span>Informe personal y confidencial</span></div>
            <button class="btn btn-primary btn-sm" id="downloadPdfBtn" type="button"><i data-lucide="download"></i>Descargar informe</button>
          </div>
        ` : ''}
      </section>

      <div class="privacy-footer-banner">
        <i data-lucide="shield-check"></i>
        <p>Las puntuaciones mostradas provienen de tus respuestas guardadas y no sustituyen una valoración clínica.</p>
      </div>
    </div>
  `;

  if (selected) {
    const dimensions = getDimensions(selected).map((item) => ({ axis: item.label, value: item.value, max: item.max }));
    renderRadarChart(container.querySelector('#resultsRadarContainer'), dimensions);
    container.querySelector('#downloadPdfBtn')?.addEventListener('click', () => generateReportPdf(selected, person));
  }

  container.querySelectorAll('[data-result-id]').forEach((button) => {
    button.addEventListener('click', () => renderResultsHub(container, userData, button.dataset.resultId));
  });
  window.lucide?.createIcons();
}
