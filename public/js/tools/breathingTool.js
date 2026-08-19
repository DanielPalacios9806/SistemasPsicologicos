/**
 * MENTE DE ACERO V2 — 4-7-8 GUIDED BREATHING PACER TOOL
 */

import { api } from '../core/api.js';

export function openBreathingTool() {
  const existing = document.getElementById('breathingModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'breathingModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="breathingTitle">
      <div class="modal-header">
        <h3 id="breathingTitle">Respiración Guiada 4-7-8</h3>
        <button class="modal-close-btn" id="closeBreathingBtn" aria-label="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="stress-slider-group" id="preStressGroup">
          <label for="preStressSlider">¿Cómo calificarías tu nivel de estrés actual? (1 = Mínimo, 10 = Máximo)</label>
          <input type="range" id="preStressSlider" class="stress-slider" min="1" max="10" value="6" />
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#64748B;">
            <span>1 Calma</span>
            <span id="preStressVal" style="font-weight:700; color:#0B716C;">Nivel 6</span>
            <span>10 Muy Alto</span>
          </div>
        </div>

        <div class="breathing-container" id="pacerArea" style="display:none;">
          <div class="breathing-circle-wrapper">
            <div class="breathing-outer-ring"></div>
            <div class="breathing-circle" id="breathingCircle">
              <i data-lucide="wind" style="color:#0B716C; width:32px; height:32px;"></i>
            </div>
          </div>
          <div class="breathing-instruction" id="breathingStateText">Inhala profundamente...</div>
          <div class="breathing-timer" id="breathingTimer">Ciclo 1 de 4 · Tiempo: 4s</div>
        </div>

        <div class="stress-slider-group" id="postStressGroup" style="display:none;">
          <label for="postStressSlider">¿Cómo te sientes ahora tras el ejercicio?</label>
          <input type="range" id="postStressSlider" class="stress-slider" min="1" max="10" value="3" />
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#64748B;">
            <span>1 Calma</span>
            <span id="postStressVal" style="font-weight:700; color:#0B716C;">Nivel 3</span>
            <span>10 Muy Alto</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelBreathingBtn">Cancelar</button>
        <button class="btn btn-teal" id="startBreathingBtn">Comenzar ejercicio</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const preSlider = document.getElementById('preStressSlider');
  const preVal = document.getElementById('preStressVal');
  preSlider.addEventListener('input', () => { preVal.textContent = `Nivel ${preSlider.value}`; });

  const postSlider = document.getElementById('postStressSlider');
  const postVal = document.getElementById('postStressVal');
  postSlider.addEventListener('input', () => { postVal.textContent = `Nivel ${postSlider.value}`; });

  const closeBtn = document.getElementById('closeBreathingBtn');
  const cancelBtn = document.getElementById('cancelBreathingBtn');
  const startBtn = document.getElementById('startBreathingBtn');

  let intervalId = null;

  function closeModal() {
    if (intervalId) clearInterval(intervalId);
    modal.remove();
  }

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  startBtn.addEventListener('click', () => {
    if (startBtn.dataset.state === 'finished') {
      api.logToolSession('breathing_478', 120, Number(preSlider.value), Number(postSlider.value));
      closeModal();
      return;
    }

    document.getElementById('preStressGroup').style.display = 'none';
    document.getElementById('pacerArea').style.display = 'flex';
    startBtn.style.display = 'none';
    cancelBtn.textContent = 'Detener';

    const circle = document.getElementById('breathingCircle');
    const stateText = document.getElementById('breathingStateText');
    const timerText = document.getElementById('breathingTimer');

    let cycle = 1;
    const totalCycles = 3;

    function runPacer() {
      // 1. INHALE (4 seconds)
      circle.className = 'breathing-circle inhale';
      stateText.textContent = 'Inhala profundamente (por la nariz)...';
      timerText.textContent = `Ciclo ${cycle} de ${totalCycles} · 4s`;

      setTimeout(() => {
        // 2. HOLD (7 seconds)
        circle.className = 'breathing-circle hold';
        stateText.textContent = 'Mantén el aire...';
        timerText.textContent = `Ciclo ${cycle} de ${totalCycles} · 7s`;

        setTimeout(() => {
          // 3. EXHALE (8 seconds)
          circle.className = 'breathing-circle exhale';
          stateText.textContent = 'Exhala suavemente (por la boca)...';
          timerText.textContent = `Ciclo ${cycle} de ${totalCycles} · 8s`;

          setTimeout(() => {
            cycle++;
            if (cycle <= totalCycles) {
              runPacer();
            } else {
              // Finished
              circle.className = 'breathing-circle';
              stateText.textContent = '¡Ejercicio completado!';
              timerText.textContent = 'Tu mente y cuerpo están más relajados.';
              document.getElementById('postStressGroup').style.display = 'flex';
              startBtn.style.display = 'inline-flex';
              startBtn.textContent = 'Guardar y Finalizar';
              startBtn.dataset.state = 'finished';
              cancelBtn.style.display = 'none';
            }
          }, 8000);
        }, 7000);
      }, 4000);
    }

    runPacer();
  });
}
