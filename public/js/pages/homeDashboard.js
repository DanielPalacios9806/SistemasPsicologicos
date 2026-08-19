/**
 * MENTE DE ACERO V2 — HOME DASHBOARD PAGE (SCREEN 3 & MOBILE SCREEN 2)
 */

import { api } from '../core/api.js';
import { renderRadialGauge } from '../charts/radialGauge.js';
import { renderWeeklySparkline, renderMoodSpline } from '../charts/splineChart.js';
import { openBreathingTool } from '../tools/breathingTool.js';
import { openMoodCheckin } from '../tools/moodCheckin.js';
import { openCognitiveJournal } from '../tools/cognitiveJournal.js';
import { getPersonalizedRecommendations } from '../services/recommendations.js';

export async function renderHomeDashboard(container, userData) {
  const person = userData?.user?.person || {};
  const assignments = userData?.assignments || [];

  // Fetch longitudinal data
  const wellnessSummary = await api.getWellnessSummary();
  const habits = await api.getTodayHabits();
  const moodHistory = await api.getMoodHistory();
  const recommendations = getPersonalizedRecommendations(assignments);

  // Active in-progress assignment (e.g. Bar-On ICE or EMA)
  const activeAssignment = assignments.find((a) => a.status === 'in_progress') || assignments[0] || {
    instrumentCode: 'baron',
    percentageComplete: 65
  };

  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Welcome & Confidentiality Header Row -->
      <div class="welcome-row">
        <div class="welcome-text">
          <h1>Bienvenido, ${person.fullName ? person.fullName.split(' ')[0] : 'Participante'} 👋</h1>
          <p>Este es tu espacio seguro para conocer tu mente, fortalecer tu bienestar y alcanzar tu mejor versión.</p>
        </div>
        <div class="trust-banner">
          <div class="banner-icon"><i data-lucide="shield-check"></i></div>
          <div class="trust-banner-content">
            <h4>Confidencialidad garantizada</h4>
            <p>Tu información es privada, segura y utilizada solo para tu desarrollo.</p>
          </div>
        </div>
      </div>

      <!-- ROW 1: CURRENT EVALUATION & RECENT RESULTS -->
      <div class="dashboard-row-1">
        <div class="card current-eval-card">
          <div class="current-eval-icon">
            <i data-lucide="clipboard-list"></i>
          </div>
          <div class="current-eval-body">
            <div class="current-eval-meta">
              <span class="badge badge-info"><span class="badge-dot"></span> ${activeAssignment.status === 'completed' ? 'Completada' : 'En progreso'}</span>
              <span class="time-estimate"><i data-lucide="clock"></i> Tiempo estimado: 12 min</span>
            </div>
            <h3>${activeAssignment.instrumentCode === 'baron' ? 'Inventario de Cociente Emocional (Bar-On ICE)' : activeAssignment.instrumentCode === 'disc' ? 'Perfil Conductual DISC' : 'Escala de Asertividad (EMA)'}</h3>
            <p>Evaluación de bienestar emocional, funcionamiento personal y recursos adaptativos.</p>
            <div class="progress-track" style="margin: 6px 0;">
              <div class="progress-fill" style="width: ${activeAssignment.percentageComplete || 65}%;"></div>
            </div>
            <div class="current-eval-footer">
              <span style="font-size: 0.82rem; font-weight: 600; color: #64748B;">${activeAssignment.percentageComplete || 65}% completado</span>
              <a href="/index.html?instrument=${encodeURIComponent(activeAssignment.instrumentCode || 'baron')}" class="btn btn-navy btn-sm">
                ${activeAssignment.status === 'completed' ? 'Ver resultado' : 'Continuar evaluación'} <i data-lucide="arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Resultados recientes</h3>
            <a href="#results" class="card-header-link" id="viewAllResultsLink">Ver todos <i data-lucide="arrow-right"></i></a>
          </div>
          <div class="recent-results-list">
            <div class="recent-result-item">
              <div class="result-item-left">
                <div class="result-icon"><i data-lucide="heart-pulse"></i></div>
                <div class="result-meta">
                  <h4>Bar-On ICE (Cociente Emocional)</h4>
                  <small>Completada recientemente</small>
                </div>
              </div>
              <div class="result-item-right">
                <span class="badge badge-success">Adecuado · 78/100</span>
              </div>
            </div>

            <div class="recent-result-item">
              <div class="result-item-left">
                <div class="result-icon" style="color:#0B716C; background:rgba(11,113,108,0.1);"><i data-lucide="message-square"></i></div>
                <div class="result-meta">
                  <h4>Escala de Asertividad (EMA)</h4>
                  <small>Asertividad Directa</small>
                </div>
              </div>
              <div class="result-item-right">
                <span class="badge badge-info">Alta · 82/100</span>
              </div>
            </div>

            <div class="recent-result-item">
              <div class="result-item-left">
                <div class="result-icon" style="color:#D99B26; background:rgba(217,155,38,0.1);"><i data-lucide="compass"></i></div>
                <div class="result-meta">
                  <h4>Perfil Conductual DISC</h4>
                  <small>Patrón de respuesta</small>
                </div>
              </div>
              <div class="result-item-right">
                <span class="badge badge-warning">Orientado a Resultados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 2: HABIT ADHERENCE GAUGE, WELLNESS HABITS, WEEKLY PROGRESS -->
      <div class="dashboard-row-2">
        <div class="card profile-gauge-card">
          <div class="card-header" style="width: 100%;">
            <h3>Adherencia a hábitos</h3>
            <span class="badge badge-subtle">Semanal</span>
          </div>
          <div id="homeRadialGaugeContainer"></div>
          <p class="profile-gauge-desc">Tu registro muestra un 72% de cumplimiento en hábitos activos durante la semana.</p>
          <a href="#habits" class="card-header-link">Ver registro de hábitos <i data-lucide="arrow-right"></i></a>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3>Hábitos de bienestar</h3>
              <span class="card-subtitle" id="habitsCountLabel">${wellnessSummary.habitRatio || '3 de 5 completados'}</span>
            </div>
            <button class="btn btn-secondary btn-sm" id="quickBreathingBtn"><i data-lucide="wind"></i> Respirar</button>
          </div>
          <div class="habits-grid" id="homeHabitsGrid"></div>
        </div>

        <div class="card weekly-progress-card">
          <div class="card-header">
            <div>
              <h3>Progreso de hábitos</h3>
              <span class="card-subtitle">Constancia semanal</span>
            </div>
            <span class="delta-badge"><i data-lucide="trending-up"></i> +8 pts</span>
          </div>
          <div id="homeWeeklySparklineContainer" class="sparkline-wrapper"></div>
          <div class="sparkline-footer">
            <span>Promedio semanal: <strong>72%</strong></span>
            <span>Semana en curso</span>
          </div>
        </div>
      </div>

      <!-- ROW 3: 14-DAY MOOD SPLINE & PERSONALIZED RECOMMENDATIONS -->
      <div class="dashboard-row-3">
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Estado de ánimo</h3>
              <span class="card-subtitle">Evolución de los últimos 14 días</span>
            </div>
            <button class="btn btn-teal btn-sm" id="logMoodModalBtn"><i data-lucide="plus"></i> Check-in</button>
          </div>
          <div id="homeMoodSplineContainer" class="mood-spline-wrapper"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3>Recomendaciones personalizadas</h3>
              <span class="card-subtitle">Basadas en tus resultados</span>
            </div>
            <a href="#recommendations" class="card-header-link">Ver todas <i data-lucide="arrow-right"></i></a>
          </div>
          <div class="recommendations-list" id="homeRecommendationsList"></div>
        </div>
      </div>

      <!-- CRISIS & SUPPORT FOOTER BANNER -->
      <div class="support-banner">
        <div class="support-left">
          <div class="support-icon"><i data-lucide="heart-handshake"></i></div>
          <div>
            <h4>Estamos contigo en tu camino</h4>
            <p>Buscar apoyo y entrenar la mente es un acto de fortaleza y liderazgo personal.</p>
          </div>
        </div>
        <div class="support-right">
          <div class="helpline-pill">
            <i data-lucide="phone-call"></i> 01 800 123 4567 (Línea 24/7)
          </div>
          <button class="btn btn-secondary btn-sm" id="supportModalBtn">Recursos de ayuda</button>
        </div>
      </div>
    </div>
  `;

  // Render Charts
  const gaugeEl = container.querySelector('#homeRadialGaugeContainer');
  renderRadialGauge(gaugeEl, wellnessSummary.wellnessIndex || 76, 100, wellnessSummary.category || 'Adecuado');

  const sparklineEl = container.querySelector('#homeWeeklySparklineContainer');
  renderWeeklySparkline(sparklineEl, wellnessSummary.weeklyTrend);

  const moodEl = container.querySelector('#homeMoodSplineContainer');
  renderMoodSpline(moodEl, moodHistory);

  // Render Habits Grid
  const habitsGrid = container.querySelector('#homeHabitsGrid');
  habitsGrid.innerHTML = habits.map((h) => `
    <div class="habit-item ${h.completed ? 'completed' : ''}" data-habit="${h.key}">
      <div class="habit-left">
        <div class="habit-icon"><i data-lucide="${h.icon || 'check'}"></i></div>
        <div>
          <div class="habit-name">${h.label}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="habit-target">${h.target}</span>
        <div class="habit-check">${h.completed ? '✓' : ''}</div>
      </div>
    </div>
  `).join('');

  // Interactive habit toggling
  habitsGrid.querySelectorAll('.habit-item').forEach((item) => {
    item.addEventListener('click', async () => {
      const isCompleted = item.classList.contains('completed');
      const habitKey = item.dataset.habit;
      item.classList.toggle('completed');
      item.querySelector('.habit-check').textContent = !isCompleted ? '✓' : '';
      await api.toggleHabit(habitKey, !isCompleted);
    });
  });

  // Render Recommendations List
  const recList = container.querySelector('#homeRecommendationsList');
  recList.innerHTML = recommendations.map((r) => `
    <div class="recommendation-card-item" data-action="${r.action}">
      <div class="rec-left">
        <div class="rec-icon"><i data-lucide="${r.icon || 'sparkles'}"></i></div>
        <div class="rec-body">
          <h4>${r.title}</h4>
          <p>${r.description}</p>
        </div>
      </div>
      <div class="rec-right">
        <span class="badge badge-subtle">${r.tag}</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  `).join('');

  recList.querySelectorAll('.recommendation-card-item').forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'open_breathing') openBreathingTool();
      else if (action === 'open_journal') openCognitiveJournal();
    });
  });

  // Wire buttons
  container.querySelector('#quickBreathingBtn')?.addEventListener('click', openBreathingTool);
  container.querySelector('#logMoodModalBtn')?.addEventListener('click', () => {
    openMoodCheckin(() => {
      api.getMoodHistory().then((updated) => renderMoodSpline(moodEl, updated));
    });
  });
  container.querySelector('#supportModalBtn')?.addEventListener('click', () => {
    alert('Línea de Orientación Psicológica 24/7 disponible al 01 800 123 4567. Este servicio es gratuito y estrictamente confidencial.');
  });

  if (window.lucide) window.lucide.createIcons();
}
