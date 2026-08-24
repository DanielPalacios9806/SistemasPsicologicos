/**
 * MENTE DE ACERO V2 - PARTICIPANT HOME
 */

import {
  buildEvaluationRows,
  escapeHtml,
  formatDate,
  getFirstName,
  getObservationGroups,
  getOverallProgress,
  getScoreSummary,
  sortApplications,
  statusClass,
  statusLabel,
} from '../core/assessmentData.mjs';
import { renderRadialGauge } from '../charts/radialGauge.js';

function renderCurrentEvaluation(row) {
  if (!row) {
    return `
      <div class="empty-state compact-empty">
        <i data-lucide="clipboard-check"></i>
        <h3>No tienes evaluaciones pendientes</h3>
        <p>Cuando se te asigne un instrumento aparecerá aquí.</p>
      </div>
    `;
  }

  const completed = row.status === 'completed' || row.status === 'invalid';
  const href = completed ? '#results' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`;
  return `
    <div class="current-eval-icon accent-${row.accent}"><i data-lucide="${row.icon}"></i></div>
    <div class="current-eval-body">
      <div class="current-eval-meta">
        <span class="badge ${statusClass(row.status)}"><span class="badge-dot"></span>${statusLabel(row.status)}</span>
        <span class="time-estimate"><i data-lucide="calendar-clock"></i>${formatDate(row.application?.startedAt || row.application?.completedAt)}</span>
      </div>
      <div>
        <h3>${escapeHtml(row.name)}</h3>
        <p>${completed ? 'Tu resultado ya está disponible en el portal.' : 'Continúa desde el punto exacto donde dejaste la evaluación.'}</p>
      </div>
      <div class="progress-track" aria-label="${row.percentageComplete}% completado">
        <div class="progress-fill" style="width:${row.percentageComplete}%"></div>
      </div>
      <div class="current-eval-footer">
        <span>${row.percentageComplete}% completado</span>
        <a href="${href}" class="btn btn-navy btn-sm">
          ${completed ? 'Ver resultado' : row.status === 'in_progress' ? 'Continuar evaluación' : 'Comenzar evaluación'}
          <i data-lucide="arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

function renderRecentResults(applications) {
  const completed = sortApplications(applications).filter((item) => ['completed', 'invalid'].includes(item.status)).slice(0, 3);
  if (!completed.length) {
    return `
      <div class="empty-state compact-empty">
        <i data-lucide="chart-no-axes-column"></i>
        <h3>Aún no hay resultados</h3>
        <p>Completa una evaluación para ver aquí su lectura orientativa.</p>
      </div>
    `;
  }

  return completed.map((application) => {
    const summary = getScoreSummary(application);
    const code = escapeHtml(application.instrumentCode || '');
    const icon = code === 'baron' ? 'brain' : code === 'disc' ? 'compass' : 'messages-square';
    return `
      <a class="recent-result-item" href="#results" aria-label="Ver resultado ${escapeHtml(application.instrumentName)}">
        <div class="result-item-left">
          <div class="result-icon accent-${code === 'disc' ? 'gold' : code === 'ema' ? 'teal' : 'blue'}"><i data-lucide="${icon}"></i></div>
          <div class="result-meta">
            <h4>${escapeHtml(application.instrumentName)}</h4>
            <small>${formatDate(application.completedAt)}</small>
          </div>
        </div>
        <div class="result-item-right">
          <span class="badge ${summary?.valid === false ? 'badge-warning' : 'badge-success'}">
            ${escapeHtml(summary?.value || summary?.profile || 'Disponible')}
          </span>
          <i data-lucide="chevron-right"></i>
        </div>
      </a>
    `;
  }).join('');
}

function renderEvaluationStatus(rows) {
  if (!rows.length) {
    return '<div class="empty-inline">No existen instrumentos asignados en la campaña activa.</div>';
  }
  return rows.map((row) => `
    <a class="evaluation-status-row" href="${row.status === 'completed' || row.status === 'invalid' ? '#results' : `/index.html?instrument=${encodeURIComponent(row.instrumentCode)}`}">
      <div class="status-instrument-icon accent-${row.accent}"><i data-lucide="${row.icon}"></i></div>
      <div class="status-instrument-copy">
        <strong>${escapeHtml(row.shortName)}</strong>
        <span>${statusLabel(row.status)} · ${row.percentageComplete}%</span>
      </div>
      <div class="mini-progress" aria-hidden="true"><span style="width:${row.percentageComplete}%"></span></div>
      <i data-lucide="chevron-right"></i>
    </a>
  `).join('');
}

function renderRecommendations(latestCompleted) {
  const groups = getObservationGroups(latestCompleted);
  const items = [
    ...groups.strengths.slice(0, 1).map((text) => ({ icon: 'star', tag: 'Fortaleza', text })),
    ...groups.attentionAreas.slice(0, 1).map((text) => ({ icon: 'target', tag: 'Atención', text })),
    ...groups.suggestions.slice(0, 2).map((text) => ({ icon: 'lightbulb', tag: 'Sugerencia', text })),
  ].slice(0, 3);

  if (!items.length) {
    return `
      <div class="empty-state compact-empty">
        <i data-lucide="sparkles"></i>
        <h3>Recomendaciones pendientes</h3>
        <p>Se generarán a partir de una evaluación completada y válida.</p>
      </div>
    `;
  }

  return items.map((item) => `
    <div class="recommendation-card-item static-item">
      <div class="rec-left">
        <div class="rec-icon"><i data-lucide="${item.icon}"></i></div>
        <div class="rec-body">
          <span class="rec-kicker">${item.tag}</span>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </div>
    </div>
  `).join('');
}

export async function renderHomeDashboard(container, userData) {
  const person = userData?.user?.person || {};
  const applications = userData?.applications || [];
  const rows = buildEvaluationRows(userData?.assignments || [], applications);
  const activeRow = rows.find((row) => row.status === 'in_progress')
    || rows.find((row) => row.status === 'pending')
    || rows[0];
  const completedApplications = sortApplications(applications).filter((item) => item.status === 'completed');
  const overallProgress = getOverallProgress(rows);
  const hasActiveCampaign = (userData?.assignments || []).length > 0;
  const activeCampaign = userData?.assignments?.[0]?.campaignName || '';
  const profileContext = [
    [person.rankName || person.rankCode, 'badge-check'],
    [person.unitName || person.unit, 'building-2'],
    [person.promotion != null ? `Promoción ${person.promotion}` : '', 'calendar-days'],
  ].filter(([value]) => value);

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="welcome-row">
        <div class="welcome-text">
          <span class="eyebrow">PORTAL PERSONAL</span>
          <h2>Bienvenido, ${escapeHtml(getFirstName(person.fullName))}</h2>
          <p>${escapeHtml(activeCampaign || 'Revisa tus evaluaciones asignadas y consulta tus resultados.')}</p>
          <div class="identity-context-row">${profileContext.map(([value, icon]) => `<span><i data-lucide="${icon}"></i>${escapeHtml(value)}</span>`).join('')}</div>
        </div>
        <div class="trust-banner">
          <div class="banner-icon"><i data-lucide="lock-keyhole"></i></div>
          <div class="trust-banner-content">
            <h4>Confidencialidad garantizada</h4>
            <p>Esta información está protegida y vinculada únicamente a tu sesión.</p>
          </div>
        </div>
      </div>

      <div class="dashboard-kpis" aria-label="Resumen de progreso">
        <div class="kpi-item"><span>Evaluaciones</span><strong>${rows.length}</strong></div>
        <div class="kpi-item"><span>Completadas</span><strong>${rows.filter((row) => row.status === 'completed').length}</strong></div>
        <div class="kpi-item"><span>En progreso</span><strong>${rows.filter((row) => row.status === 'in_progress').length}</strong></div>
        <div class="kpi-item"><span>Avance general</span><strong>${overallProgress}%</strong></div>
      </div>

      <div class="dashboard-row-1">
        <section class="card current-eval-card" aria-labelledby="currentEvaluationTitle">
          <span class="sr-only" id="currentEvaluationTitle">Evaluación actual</span>
          ${renderCurrentEvaluation(activeRow)}
        </section>

        <section class="card">
          <div class="card-header">
            <div><h3>Resultados recientes</h3><span class="card-subtitle">Tus evaluaciones finalizadas</span></div>
            <a href="#results" class="card-header-link">Ver todos <i data-lucide="arrow-right"></i></a>
          </div>
          <div class="recent-results-list">${renderRecentResults(applications)}</div>
        </section>
      </div>

      <div class="dashboard-row-2 assessment-overview-row">
        <section class="card profile-gauge-card">
          <div class="card-header"><h3>Avance general</h3><span class="badge badge-subtle">${hasActiveCampaign ? 'Campaña activa' : 'Historial'}</span></div>
          <div id="overallProgressGauge"></div>
          <p class="profile-gauge-desc">Promedio calculado con tus instrumentos disponibles.</p>
          <a href="#progress" class="card-header-link">Ver progreso <i data-lucide="arrow-right"></i></a>
        </section>

        <section class="card evaluation-status-card">
          <div class="card-header">
            <div><h3>Ruta de evaluación</h3><span class="card-subtitle">Estado por instrumento</span></div>
          </div>
          <div class="evaluation-status-list">${renderEvaluationStatus(rows)}</div>
        </section>

        <section class="card">
          <div class="card-header">
            <div><h3>Lectura más reciente</h3><span class="card-subtitle">Basada en resultados reales</span></div>
          </div>
          <div class="recommendations-list">${renderRecommendations(completedApplications[0])}</div>
        </section>
      </div>

      <div class="privacy-footer-banner">
        <i data-lucide="shield-check"></i>
        <p>Los resultados son orientativos y deben interpretarse dentro del contexto institucional correspondiente.</p>
      </div>
    </div>
  `;

  renderRadialGauge(
    container.querySelector('#overallProgressGauge'),
    overallProgress,
    100,
    rows.length ? `${rows.filter((row) => row.status === 'completed').length} de ${rows.length} completadas` : 'Sin asignaciones'
  );
  window.lucide?.createIcons();
}
