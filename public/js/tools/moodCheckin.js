/**
 * MENTE DE ACERO V2 — 1-TAP MOOD CHECK-IN MODAL
 */

import { api } from '../core/api.js';

export function openMoodCheckin(onComplete) {
  const existing = document.getElementById('moodModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'moodModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="moodTitle">
      <div class="modal-header">
        <h3 id="moodTitle">Check-in de Estado de Ánimo</h3>
        <button class="modal-close-btn" id="closeMoodBtn" aria-label="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.88rem; color:#475569;">¿Cómo te has sentido en el transcurso del día de hoy?</p>
        
        <div class="mood-selector-grid">
          <div class="mood-option-card" data-valence="3">
            <span class="mood-icon">😊</span>
            <span>Positivo</span>
            <small style="font-size:0.72rem; color:#64748B;">Enérgico / En calma</small>
          </div>
          <div class="mood-option-card" data-valence="2">
            <span class="mood-icon">😐</span>
            <span>En equilibrio</span>
            <small style="font-size:0.72rem; color:#64748B;">Estable / Normal</small>
          </div>
          <div class="mood-option-card" data-valence="1">
            <span class="mood-icon">😔</span>
            <span>Desafiante</span>
            <small style="font-size:0.72rem; color:#64748B;">Cansado / Ansioso</small>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:0.85rem; font-weight:600; color:#0F172A;">Nota opcional</label>
          <textarea id="moodNote" style="width:100%; height:70px; padding:10px; border-radius:8px; border:1px solid #E2E8F0; font-size:0.85rem; resize:none;" placeholder="¿Qué factor influyó principalmente en tu día?"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelMoodBtn">Cancelar</button>
        <button class="btn btn-teal" id="saveMoodBtn" disabled>Guardar check-in</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  let selectedValence = null;
  const cards = modal.querySelectorAll('.mood-option-card');
  const saveBtn = modal.querySelector('#saveMoodBtn');
  const cancelBtn = modal.querySelector('#cancelMoodBtn');
  const closeBtn = modal.querySelector('#closeMoodBtn');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedValence = Number(card.dataset.valence);
      saveBtn.removeAttribute('disabled');
    });
  });

  function close() {
    modal.remove();
  }

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  saveBtn.addEventListener('click', async () => {
    const note = document.getElementById('moodNote').value.trim();
    if (selectedValence) {
      await api.logMood(selectedValence, 3, note);
      close();
      if (onComplete) onComplete();
    }
  });
}
