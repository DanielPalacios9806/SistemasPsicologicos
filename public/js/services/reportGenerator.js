/**
 * MENTE DE ACERO V2 — REPORTE DE EVALUACIÓN Y RESULTADOS PSICOLÓGICOS (PDF)
 */

export function generateReportPdf(application, person) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes para descargar tu reporte de evaluación.');
    return;
  }

  const generatedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportId = `REP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Reporte de Evaluación Psicológica — Mente de Acero</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 40px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B192C; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 20px; font-weight: 800; color: #0B192C; }
        .confidential { background: #ECFDF5; color: #065F46; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #A7F3D0; }
        .section { margin-bottom: 24px; padding: 18px; border: 1px solid #E2E8F0; border-radius: 8px; }
        .section-title { font-size: 16px; font-weight: 700; color: #0B192C; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .seal { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #CBD5E1; font-size: 12px; color: #64748B; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">MENTE DE ACERO</div>
          <div style="font-size: 13px; color: #64748B;">Plataforma de Evaluación y Bienestar Psicológico</div>
        </div>
        <div class="confidential">DOCUMENTO CONFIDENCIAL Y FORMATIVO</div>
      </div>

      <div class="section">
        <div class="section-title">Datos del Participante</div>
        <div class="grid">
          <div><strong>Nombre:</strong> ${person?.fullName || 'Participante'}</div>
          <div><strong>Identificación:</strong> ${person?.idNumber || '-'}</div>
          <div><strong>Fecha de Emisión:</strong> ${generatedDate}</div>
          <div><strong>Reporte ID:</strong> ${reportId}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Resultados de la Evaluación</div>
        <p><strong>Instrumento:</strong> ${application?.instrumentName || 'Inventario de Cociente Emocional Bar-On ICE'}</p>
        <p><strong>Perfil Global:</strong> ${application?.finalResult?.profileGlobal || 'Capacidad emocional adecuada / promedio'}</p>
        <p><strong>Puntuación Normalizada:</strong> ${application?.finalResult?.totalNormalized || 78} / 100</p>
      </div>

      <div class="section">
        <div class="section-title">Fortalezas y Recomendaciones Formativas</div>
        <p>✓ Buena capacidad de resiliencia y manejo adaptativo de situaciones exigentes.</p>
        <p>✓ Se recomienda continuar el entrenamiento mental con prácticas de respiración y autorregulación emocional.</p>
      </div>

      <div class="seal">
        <div>Identificador de reporte: ${reportId} · Generado el ${generatedDate}</div>
        <div>Este informe es de carácter estrictamente formativo y confidencial. No constituye diagnóstico clínico. Mente de Acero © ${new Date().getFullYear()}</div>
      </div>
      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
