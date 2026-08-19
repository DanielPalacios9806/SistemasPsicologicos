/**
 * MENTE DE ACERO V2 — RADIAL PROGRESS GAUGE (SVG)
 * Renders habit adherence or single-metric percentage.
 */

export function renderRadialGauge(container, score = 72, maxScore = 100, category = 'Adherencia Saludable', unit = '%') {
  if (!container) return;

  const size = 150;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(Math.max(score / maxScore, 0), 1);
  const offset = circumference - progressRatio * circumference;

  container.innerHTML = `
    <div class="gauge-wrapper" aria-label="Adherencia a hábitos: ${score}${unit}">
      <svg class="gauge-svg" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B716C" />
            <stop offset="100%" stop-color="#2563EB" />
          </linearGradient>
        </defs>
        <circle class="gauge-track" cx="${size/2}" cy="${size/2}" r="${radius}" />
        <circle class="gauge-fill" cx="${size/2}" cy="${size/2}" r="${radius}" 
          stroke-dasharray="${circumference}" 
          stroke-dashoffset="${offset}" />
      </svg>
      <div class="gauge-content">
        <span class="gauge-score">${score}<small style="font-size:1.1rem; font-weight:700;">${unit}</small></span>
        <span class="gauge-max">cumplimiento</span>
      </div>
    </div>
    <span class="badge badge-success" style="margin-top: 4px;">${category}</span>
  `;
}
