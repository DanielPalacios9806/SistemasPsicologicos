/**
 * MENTE DE ACERO V2 - PRINTABLE PARTICIPANT REPORT
 */

import {
  escapeHtml,
  formatDate,
  getDimensions,
  getObservationGroups,
  getScoreSummary,
} from '../core/assessmentData.mjs';

function renderList(items, emptyMessage) {
  if (!items.length) return `<p class="muted">${escapeHtml(emptyMessage)}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function generateReportPdf(application, person) {
  if (!application?.finalResult && !application?.scoring) {
    alert('Este resultado todavía no tiene información suficiente para generar un informe.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Habilita las ventanas emergentes para abrir el informe.');
    return;
  }

  const summary = getScoreSummary(application);
  const dimensions = getDimensions(application);
  const observations = getObservationGroups(application);
  const reportId = `REP-${String(application.id || Date.now()).replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase()}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Informe ${escapeHtml(application.instrumentCode?.toUpperCase() || '')} - Mente de Acero</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #102342; margin: 36px; line-height: 1.5; }
        header { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; border-bottom:3px solid #0a3974; padding-bottom:18px; }
        h1 { margin:0; font-size:24px; } h2 { font-size:17px; margin:0 0 12px; } p { margin:6px 0; }
        .brand { font-size:21px; font-weight:800; } .brand strong { color:#d89b22; }
        .confidential { border:1px solid #9bb4d6; padding:6px 10px; font-size:11px; font-weight:700; }
        .meta { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px 24px; }
        .section { margin-top:20px; padding:18px; border:1px solid #dbe4ef; border-radius:8px; break-inside:avoid; }
        .score { display:inline-block; padding:7px 12px; background:#eef5ff; color:#0a3974; font-size:18px; font-weight:800; }
        .dimensions { width:100%; border-collapse:collapse; } th, td { text-align:left; padding:8px; border-bottom:1px solid #e7edf5; font-size:13px; }
        th { color:#53657d; font-size:11px; text-transform:uppercase; }
        ul { margin:8px 0 0; padding-left:20px; } li { margin:5px 0; }
        .muted, footer { color:#65758b; font-size:12px; }
        footer { margin-top:28px; padding-top:14px; border-top:1px solid #dbe4ef; }
        @media print { body { margin:16mm; } .section { box-shadow:none; } }
      </style>
    </head>
    <body>
      <header>
        <div><div class="brand">MENTE <strong>DE ACERO</strong></div><p class="muted">Plataforma de evaluación psicológica</p></div>
        <div class="confidential">INFORME PERSONAL Y CONFIDENCIAL</div>
      </header>

      <section class="section">
        <h2>Datos del participante</h2>
        <div class="meta">
          <div><strong>Nombre:</strong> ${escapeHtml(person?.fullName || 'Participante')}</div>
          <div><strong>Identificación:</strong> ${escapeHtml(person?.idNumber || '-')}</div>
          <div><strong>Instrumento:</strong> ${escapeHtml(application.instrumentName || application.instrumentCode)}</div>
          <div><strong>Fecha:</strong> ${formatDate(application.completedAt)}</div>
        </div>
      </section>

      <section class="section">
        <h2>Resultado general</h2>
        ${summary?.value ? `<span class="score">${escapeHtml(summary.value)}</span>` : ''}
        <p><strong>${escapeHtml(summary?.profile || 'Resultado disponible')}</strong></p>
        ${summary?.valid === false ? '<p>Advertencia: los indicadores de validez requieren revisión profesional.</p>' : ''}
      </section>

      <section class="section">
        <h2>Dimensiones evaluadas</h2>
        ${dimensions.length ? `
          <table class="dimensions">
            <thead><tr><th>Dimensión</th><th>Resultado</th><th>Nivel</th></tr></thead>
            <tbody>${dimensions.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.displayValue)}</td><td>${escapeHtml(item.level)}</td></tr>`).join('')}</tbody>
          </table>
        ` : '<p class="muted">Este resultado no incluye dimensiones desagregadas.</p>'}
      </section>

      <section class="section"><h2>Fortalezas</h2>${renderList(observations.strengths, 'Sin observaciones registradas.')}</section>
      <section class="section"><h2>Áreas de atención</h2>${renderList(observations.attentionAreas, 'Sin observaciones registradas.')}</section>
      <section class="section"><h2>Sugerencias</h2>${renderList(observations.suggestions, 'Sin sugerencias registradas.')}</section>

      <footer>
        <div>Identificador: ${escapeHtml(reportId)}</div>
        <div>Documento orientativo. No constituye diagnóstico clínico ni reemplaza una evaluación profesional.</div>
      </footer>
      <script>window.addEventListener('load', () => window.print());</script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
