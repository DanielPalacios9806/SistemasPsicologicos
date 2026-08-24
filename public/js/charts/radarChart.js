/**
 * MENTE DE ACERO V2 — 5-AXIS RADAR CHART (SVG)
 * Renders the user's real dimension scores without artificial benchmarks.
 */

export function renderRadarChart(container, dimensions = []) {
  if (!container) return;
  if (dimensions.length < 3) {
    container.innerHTML = '<div class="empty-inline">No hay suficientes dimensiones para generar esta gráfica.</div>';
    return;
  }

  const data = dimensions;
  const numAxes = data.length;
  const size = 300;
  const center = size / 2;
  const radius = center - 45;
  const angleStep = (Math.PI * 2) / numAxes;

  // Generate concentric polygon grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  let gridPolygons = '';

  gridLevels.forEach((level) => {
    const points = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * level;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    gridPolygons += `<polygon points="${points.join(' ')}" fill="none" stroke="#E2E8F0" stroke-width="1.2" stroke-dasharray="3,3" />`;
  });

  // Generate spokes (axis lines) and labels
  let spokesAndLabels = '';
  const userPoints = [];

  data.forEach((dim, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const xEnd = center + radius * Math.cos(angle);
    const yEnd = center + radius * Math.sin(angle);
    spokesAndLabels += `<line x1="${center}" y1="${center}" x2="${xEnd.toFixed(1)}" y2="${yEnd.toFixed(1)}" stroke="#E2E8F0" stroke-width="1.2" />`;

    // User score vertex
    const maxValue = Number(dim.max) > 0 ? Number(dim.max) : 100;
    const normalizedScore = Math.min(Math.max((Number(dim.value) || 0) / maxValue, 0), 1.0);
    const ux = center + radius * normalizedScore * Math.cos(angle);
    const uy = center + radius * normalizedScore * Math.sin(angle);
    userPoints.push(`${ux.toFixed(1)},${uy.toFixed(1)}`);

    // Axis label position
    const labelRadius = radius + 24;
    const lx = center + labelRadius * Math.cos(angle);
    const ly = center + labelRadius * Math.sin(angle);
    const horizontalDirection = Math.cos(angle);
    const anchor = Math.abs(horizontalDirection) < 0.2 ? 'middle' : horizontalDirection > 0 ? 'end' : 'start';
    const label = String(dim.axis || '').length > 20 ? `${String(dim.axis).slice(0, 19)}…` : String(dim.axis || '');

    spokesAndLabels += `
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="10.5" font-family="'Inter', sans-serif" font-weight="600" fill="#475569">
        ${label}
      </text>
    `;
  });

  // User polygon & markers
  const userPolygon = `
    <polygon points="${userPoints.join(' ')}" fill="rgba(37, 99, 235, 0.18)" stroke="#2563EB" stroke-width="2.5" stroke-linejoin="round" />
  `;

  let markers = '';
  userPoints.forEach((p) => {
    const [px, py] = p.split(',');
    markers += `<circle cx="${px}" cy="${py}" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" />`;
  });

  container.innerHTML = `
    <svg class="radar-svg" viewBox="0 0 ${size} ${size}" aria-label="Perfil psicológico multidimensional">
      ${gridPolygons}
      ${spokesAndLabels}
      ${userPolygon}
      ${markers}
    </svg>
    <div style="display: flex; gap: 16px; font-size: 0.78rem; color: #64748B; font-weight: 600; margin-top: 8px;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 12px; height: 3px; background-color: #2563EB; border-radius: 2px;"></span> Tu perfil
      </span>
    </div>
  `;
}
