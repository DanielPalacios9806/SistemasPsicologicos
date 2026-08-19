/**
 * MENTE DE ACERO V2 — MI PERFIL (DECOUPLED PSYCHOLOGICAL PROFILES)
 */

export function renderProfileView(container, userData) {
  const person = userData?.user?.person || {};

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card" style="padding: 28px;">
        <div style="display:flex; align-items:center; gap:20px;">
          <div class="user-avatar" style="width:64px; height:64px; font-size:1.5rem;">
            ${person.fullName ? person.fullName.split(' ').map(p => p[0]).slice(0,2).join('') : 'MA'}
          </div>
          <div>
            <h2>${person.fullName || 'Participante'}</h2>
            <p style="font-size:0.88rem; color:#64748B;">Identificación: ${person.idNumber || '-'} · Perfil Personal</p>
          </div>
        </div>
      </div>

      <!-- DECOUPLED PSYCHOLOGICAL DIMENSIONS -->
      <div class="dashboard-row-2">
        <!-- 1. EMA ASSERTIVENESS -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Asertividad (EMA)</h3>
              <span class="card-subtitle">Patrones de comunicación</span>
            </div>
            <span class="badge badge-info">3 Dimensiones</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>Asertividad Directa</span>
                <strong>78% (Alta)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:78%;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>No Asertividad (Inhibición)</span>
                <strong>25% (Baja)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:25%; background:#10B981;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>Asertividad Indirecta</span>
                <strong>30% (Baja)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:30%; background:#10B981;"></div></div>
            </div>
          </div>
        </div>

        <!-- 2. BAR-ON ICE -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Cociente Emocional (Bar-On)</h3>
              <span class="card-subtitle">Recursos y adaptabilidad</span>
            </div>
            <span class="badge badge-success">5 Compuestos</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>Intrapersonal</span>
                <strong>104 CE (Adecuado)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:72%;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>Interpersonal</span>
                <strong>108 CE (Adecuado)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:75%;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span>Manejo del Estrés</span>
                <strong>98 CE (Adecuado)</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:68%;"></div></div>
            </div>
          </div>
        </div>

        <!-- 3. DISC -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Perfil Conductual (DISC)</h3>
              <span class="card-subtitle">Tendencias de interacción</span>
            </div>
            <span class="badge badge-warning">Patrón</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <p style="font-size:0.9rem; font-weight:700; color:#0F172A;">Patrón Principal: Orientado a Resultados</p>
            <p style="font-size:0.82rem; color:#64748B;">Predisposición a la acción resolutiva, toma de decisiones y enfoque pragmático ante objetivos exigentes.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
