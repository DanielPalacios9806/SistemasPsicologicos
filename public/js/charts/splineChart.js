/**
 * MENTE DE ACERO V2 — 14-DAY MOOD SPLINE & 7-DAY TREND SPARKLINE (SVG)
 */

export function renderMoodSpline(container, moodHistory = []) {
  if (!container) return;

  const data = moodHistory.length ? moodHistory : [
    { date: '4 may', valence: 2 },
    { date: '6 may', valence: 2 },
    { date: '8 may', valence: 1 },
    { date: '10 may', valence: 2 },
    { date: '12 may', valence: 3 },
    { date: '14 may', valence: 2 },
    { date: '16 may', valence: 3 },
    { date: '18 may', valence: 3 }
  ];

  const width = 450;
  const height = 150;
  const paddingX = 24;
  const paddingY = 24;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    // valence 1 (low) -> bottom, 2 (neutral) -> middle, 3 (high) -> top
    const y = height - paddingY - ((d.valence - 1) / 2) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  // Calculate smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  // Area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  let markers = '';
  points.forEach((p) => {
    const color = p.valence === 3 ? '#10B981' : p.valence === 2 ? '#F59E0B' : '#EF4444';
    markers += `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="2">
        <title>${p.date}: Nivel ${p.valence}</title>
      </circle>
    `;
  });

  container.innerHTML = `
    <svg class="mood-svg" viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
      <defs>
        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#moodGradient)" />
      <path d="${pathD}" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" />
      ${markers}
    </svg>
    <div class="mood-axis-labels">
      ${data.map((d) => `<span>${d.date}</span>`).join('')}
    </div>
  `;
}

export function renderWeeklySparkline(container, weeklyTrend = []) {
  if (!container) return;

  const data = weeklyTrend.length ? weeklyTrend : [
    { day: 'L', score: 68 },
    { day: 'M', score: 72 },
    { day: 'M', score: 70 },
    { day: 'J', score: 74 },
    { day: 'V', score: 76 },
    { day: 'S', score: 78 },
    { day: 'D', score: 80 }
  ];

  const width = 320;
  const height = 100;
  const pad = 16;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((d.score - 50) / 50) * (height - pad * 2);
    return { x, y, ...d };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const lastPoint = points[points.length - 1];

  container.innerHTML = `
    <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <path d="${pathD}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="5" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" />
    </svg>
  `;
}
