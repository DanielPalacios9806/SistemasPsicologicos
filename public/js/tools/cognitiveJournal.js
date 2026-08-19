/**
 * MENTE DE ACERO V2 — 3-STEP COGNITIVE REFRAMING JOURNAL TOOL
 */

export function openCognitiveJournal() {
  const existing = document.getElementById('journalModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'journalModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="journalTitle">
      <div class="modal-header">
        <h3 id="journalTitle">Diario de Reestructuración Cognitiva</h3>
        <button class="modal-close-btn" id="closeJournalBtn" aria-label="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div id="journalStep1">
          <span class="badge badge-info" style="margin-bottom:8px;">Paso 1 de 3</span>
          <h4 style="font-size:1rem; margin-bottom:4px;">1. Situación y Pensamiento Automático</h4>
          <p style="font-size:0.82rem; color:#64748B; margin-bottom:12px;">Describe brevemente qué ocurrió y cuál fue el primer pensamiento limitante que cruzó por tu mente.</p>
          <textarea id="journalInput1" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid #E2E8F0; font-size:0.85rem;" placeholder="Ej: No logré terminar a tiempo una tarea y pensé 'nunca podré con esto'"></textarea>
        </div>

        <div id="journalStep2" style="display:none;">
          <span class="badge badge-warning" style="margin-bottom:8px;">Paso 2 de 3</span>
          <h4 style="font-size:1rem; margin-bottom:4px;">2. Identificar Distorsión Cognitiva</h4>
          <p style="font-size:0.82rem; color:#64748B; margin-bottom:12px;">¿Qué sesgo o distorsión puede estar afectando este pensamiento?</p>
          <select id="journalSelect2" style="width:100%; padding:10px; border-radius:8px; border:1px solid #E2E8F0; font-size:0.85rem; background:#fff;">
            <option value="generalizacion">Sobregeneralización ("siempre / nunca")</option>
            <option value="catastrofismo">Catastrofismo ("lo peor va a pasar")</option>
            <option value="polarizado">Pensamiento Todo o Nada ("si no es perfecto, fracasé")</option>
            <option value="filtro">Filtro Negativo (ignorar lo positivo)</option>
          </select>
        </div>

        <div id="journalStep3" style="display:none;">
          <span class="badge badge-success" style="margin-bottom:8px;">Paso 3 de 3</span>
          <h4 style="font-size:1rem; margin-bottom:4px;">3. Pensamiento Racional y Adaptativo</h4>
          <p style="font-size:0.82rem; color:#64748B; margin-bottom:12px;">Formula una perspectiva más realista, empática y orientada a soluciones.</p>
          <textarea id="journalInput3" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid #E2E8F0; font-size:0.85rem;" placeholder="Ej: Es un obstáculo temporal; he superado desafíos similares organizando mi tiempo."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="backJournalBtn" style="display:none;">Anterior</button>
        <button class="btn btn-teal" id="nextJournalBtn">Continuar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  let step = 1;
  const s1 = modal.querySelector('#journalStep1');
  const s2 = modal.querySelector('#journalStep2');
  const s3 = modal.querySelector('#journalStep3');
  const nextBtn = modal.querySelector('#nextJournalBtn');
  const backBtn = modal.querySelector('#backJournalBtn');
  const closeBtn = modal.querySelector('#closeJournalBtn');

  function close() { modal.remove(); }
  closeBtn.addEventListener('click', close);

  backBtn.addEventListener('click', () => {
    if (step === 2) {
      step = 1;
      s1.style.display = 'block';
      s2.style.display = 'none';
      backBtn.style.display = 'none';
    } else if (step === 3) {
      step = 2;
      s2.style.display = 'block';
      s3.style.display = 'none';
      nextBtn.textContent = 'Continuar';
    }
  });

  nextBtn.addEventListener('click', () => {
    if (step === 1) {
      step = 2;
      s1.style.display = 'none';
      s2.style.display = 'block';
      backBtn.style.display = 'inline-flex';
    } else if (step === 2) {
      step = 3;
      s2.style.display = 'none';
      s3.style.display = 'block';
      nextBtn.textContent = 'Guardar Reflexión';
    } else if (step === 3) {
      close();
    }
  });
}
