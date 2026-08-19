/**
 * MENTE DE ACERO V2 — RESULTS & EVALUATIONS HUB PAGE (SCREEN 1)
 */

import { api } from '../core/api.js';
import { renderRadarChart } from '../charts/radarChart.js';
import { generateReportPdf } from '../services/reportGenerator.js';
import { getPersonalizedRecommendations } from '../services/recommendations.js';

export async function renderResultsHub(container, userData) {
  const person = userData?.user?.person || {};
  const assignments = userData?.assignments || [];

  const recommendations = getPersonalizedRecommendations(assignments);

  // Radar dimensions from user's real scores (e.g. Bar-On composites)
  const radarDimensions = [
    { axis: 'Ansiedad / Manejo Estrés', value: 75 },
    { axis: 'Autoestima', value: 80 },
    { axis: 'Resiliencia', value: 85 },
    { axis: 'Estado emocional', value: 70 },
    { axis: 'Bienestar percibido', value: 78 }
  ];

  container.innerHTML = `
    <div class="results-hub-grid">
      <!-- TOP ROW: HERO EVALUATION & 5-STEP STEPPER -->
      <div class="results-top-row">
        <div class="card hero-eval-card">
          <div class="hero-eval-content">
            <span class="eyebrow">EVALUACIÓN PRINCIPAL</span>
            <h2>Evaluación de perfil mental</h2>
            <p>Conoce tu estado actual en las principales dimensiones de tu bienestar y funcionamiento adaptativo.</p>
            <div>
              <a href="/index.html?instrument=baron" class="btn btn-primary">
                Iniciar evaluación <i data-lucide="arrow-right"></i>
              </a>
            </div>
          </div>
          <div class="hero-eval-illustration">
            <svg viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="60" fill="rgba(11, 113, 108, 0.08)" />
              <path d="M70 25 C45 25 35 45 35 70 C35 95 50 115 70 115 C90 115 105 95 105 70 C105 45 95 25 70 25 Z" fill="rgba(37, 99, 235, 0.15)" />
              <circle cx="65" cy="55" r="4" fill="#0B716C" />
              <circle cx="80" cy="65" r="5" fill="#2563EB" />
              <circle cx="60" cy="80" r="4" fill="#D99B26" />
              <path d="M65 55 L80 65 L60 80 Z" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="2,2" />
            </svg>
          </div>
        </div>

        <div class="card stepper-card">
          <div class="card-header">
            <h3>Tu progreso en la evaluación</h3>
            <span class="badge badge-info">Paso 2 de 5</span>
          </div>
          <div class="stepper-track">
            <div class="step-node completed">
              <div class="step-circle">✓</div>
              <span class="step-label">Información personal</span>
            </div>
            <div class="step-node active">
              <div class="step-circle">2</div>
              <span class="step-label">Cuestionarios</span>
            </div>
            <div class="step-node">
              <div class="step-circle">3</div>
              <span class="step-label">Análisis</span>
            </div>
            <div class="step-node">
              <div class="step-circle">4</div>
              <span class="step-label">Informe</span>
            </div>
            <div class="step-node">
              <div class="step-circle">5</div>
              <span class="step-label">Recomendaciones</span>
            </div>
          </div>
          <p class="stepper-footer">Vas por buen camino. Completa todos los pasos para obtener tu informe completo.</p>
        </div>
      </div>

      <!-- MIDDLE ROW: ACTIVE ASSESSMENTS, RADAR CHART, INSIGHTS -->
      <div class="results-middle-row">
        <!-- Active Assessments Card -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Evaluaciones activas</h3>
              <span class="card-subtitle">Tus evaluaciones en progreso</span>
            </div>
          </div>
          <div class="active-evals-list">
            <div class="active-eval-item">
              <div class="active-eval-left">
                <div class="active-eval-icon"><i data-lucide="wind"></i></div>
                <div class="active-eval-info">
                  <span>Manejo de ansiedad</span>
                  <div class="progress-track" style="height:6px;">
                    <div class="progress-fill" style="width:65%;"></div>
                  </div>
                </div>
              </div>
              <a href="/index.html?instrument=baron" class="btn btn-secondary btn-sm">Continuar</a>
            </div>

            <div class="active-eval-item">
              <div class="active-eval-left">
                <div class="active-eval-icon" style="color:#D99B26; background:rgba(217,155,38,0.1);"><i data-lucide="heart"></i></div>
                <div class="active-eval-info">
                  <span>Autoestima (EMA)</span>
                  <div class="progress-track" style="height:6px;">
                    <div class="progress-fill gold" style="width:40%;"></div>
                  </div>
                </div>
              </div>
              <a href="/index.html?instrument=ema" class="btn btn-secondary btn-sm">Continuar</a>
            </div>

            <div class="active-eval-item">
              <div class="active-eval-left">
                <div class="active-eval-icon" style="color:#10B981; background:rgba(16,185,129,0.1);"><i data-lucide="mountain"></i></div>
                <div class="active-eval-info">
                  <span>Resiliencia adaptativa</span>
                  <div class="progress-track" style="height:6px;">
                    <div class="progress-fill" style="width:80%; background:#10B981;"></div>
                  </div>
                </div>
              </div>
              <a href="/index.html?instrument=baron" class="btn btn-secondary btn-sm">Continuar</a>
            </div>
          </div>
        </div>

        <!-- Radar Chart Card (Real Dimensions) -->
        <div class="card radar-chart-card">
          <div class="card-header" style="width:100%;">
            <div>
              <h3>Perfil psicológico multidimensional</h3>
              <span class="card-subtitle">Dimensiones de tu evaluación</span>
            </div>
          </div>
          <div id="resultsRadarContainer" class="radar-wrapper"></div>
        </div>

        <!-- Interpretation Insights Card -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>¿Qué significa tu resultado?</h3>
              <span class="card-subtitle">Análisis orientativo</span>
            </div>
          </div>
          <div class="insight-card-wrapper">
            <div class="insight-block strengths">
              <div class="insight-header">
                <i data-lucide="star"></i> Fortalezas
              </div>
              <p>Tienes una sólida capacidad de resiliencia y adaptabilidad frente a los desafíos cotidianos.</p>
            </div>

            <div class="insight-block opportunities">
              <div class="insight-header">
                <i data-lucide="target"></i> Áreas de oportunidad
              </div>
              <p>Podrías trabajar en la gestión de pausas conscientes para alcanzar un mayor equilibrio diario.</p>
            </div>

            <p style="font-size:0.75rem; color:#64748B; font-style:italic;">
              Recuerda: cada paso cuenta. Sigue entrenando tu mente con disciplina y constancia.
            </p>
          </div>
        </div>
      </div>

      <!-- BOTTOM ROW: RECOMMENDATIONS & PDF REPORT CARD -->
      <div class="results-bottom-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Recomendaciones personalizadas</h3>
              <span class="card-subtitle">Sugerencias basadas en tus resultados</span>
            </div>
          </div>
          <div class="recommendations-list" id="resultsRecommendationsList"></div>
        </div>

        <div class="card report-pdf-card">
          <div class="report-pdf-icon">
            <i data-lucide="file-text"></i>
          </div>
          <div class="report-pdf-body">
            <h4>Informe de perfil mental</h4>
            <div class="report-pdf-checklist">
              <span><i data-lucide="check" style="color:#10B981; width:14px;"></i> Resultados detallados</span>
              <span><i data-lucide="check" style="color:#10B981; width:14px;"></i> Análisis e interpretación</span>
              <span><i data-lucide="check" style="color:#10B981; width:14px;"></i> Recomendaciones personalizadas</span>
            </div>
            <button class="btn btn-primary btn-sm" id="downloadPdfBtn" style="margin-top:8px;">
              <i data-lucide="download"></i> Descargar informe (PDF)
            </button>
            <small style="font-size:0.72rem; color:#64748B;"><i data-lucide="shield-check" style="width:12px;"></i> Documento seguro y confidencial</small>
          </div>
        </div>
      </div>

      <!-- CONFIDENTIALITY GLOBAL BANNER -->
      <div class="trust-banner" style="margin-top: 8px;">
        <div class="banner-icon"><i data-lucide="lock"></i></div>
        <div class="trust-banner-content">
          <h4>Privacidad y Reserva Profesional</h4>
          <p>En Mente de Acero, tus respuestas son estrictamente confidenciales y utilizadas únicamente para tu desarrollo personal.</p>
        </div>
      </div>
    </div>
  `;

  // Render Radar Chart
  const radarEl = container.querySelector('#resultsRadarContainer');
  renderRadarChart(radarEl, radarDimensions);

  // Render Recommendations List
  const recList = container.querySelector('#resultsRecommendationsList');
  recList.innerHTML = recommendations.map((r) => `
    <div class="recommendation-card-item">
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

  // Wire PDF download
  container.querySelector('#downloadPdfBtn')?.addEventListener('click', () => {
    generateReportPdf(assignments[0] || {}, person);
  });

  if (window.lucide) window.lucide.createIcons();
}
