// === Routine Run View (Checklist) ===

import { getRoutine, getChild, getRoutineProgress, toggleStep } from '../state.js';
import { navigate } from '../router.js';
import { playSound } from '../utils.js';

export function render(container, params) {
  const routineId = params.p0;
  const childId = params.p1;
  const routine = getRoutine(routineId);
  const child = getChild(childId);

  if (!routine || !child) {
    navigate('#/');
    return;
  }

  container.innerHTML = '';
  container.className = `page theme-${child.theme}`;

  renderView();

  function renderView() {
    const progress = getRoutineProgress(childId, routineId);
    const done = progress.completedSteps.length;
    const total = progress.totalSteps;
    const isComplete = !!progress.completedAt;
    const progressPercent = total > 0 ? (done / total) * 100 : 0;

    container.innerHTML = `
      <header class="app-header">
        <button class="btn-icon back-btn">←</button>
        <div class="app-header__title">
          <span>${child.avatar}</span>
          <span>${routine.icon} ${routine.name}</span>
        </div>
        <div style="width:48px;"></div>
      </header>

      <div class="page-content">
        <!-- Progress bar -->
        <div style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:14px; color:#757575; font-weight:600;">Progression</span>
            <span style="font-size:14px; font-weight:700; color:var(--color-primary);">${done}/${total}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill${isComplete ? ' progress-bar__fill--done' : ''}"
                 style="width:${progressPercent}%"></div>
          </div>
        </div>

        <!-- Steps -->
        <div class="steps-list" style="display:flex; flex-direction:column; gap:12px;">
          ${routine.steps.map((step, index) => {
            const isDone = progress.completedSteps.includes(index);
            return `
              <div class="step-item${isDone ? ' step-item--done' : ''}" data-index="${index}">
                <div class="step-item__checkbox">
                  ${isDone ? '✓' : ''}
                </div>
                <span class="step-item__icon">${step.icon}</span>
                <span class="step-item__text">${step.text}</span>
              </div>
            `;
          }).join('')}
        </div>

        ${isComplete ? `
          <div style="text-align:center; margin-top:32px;" class="anim-bounce-in">
            <div style="font-size:64px; margin-bottom:16px;">🎉</div>
            <div style="font-size:24px; font-weight:700; color:var(--color-success);">
              Bravo ${child.name} !
            </div>
            <div style="font-size:18px; color:#757575; margin-top:8px;">
              +${progress.starsEarned} ⭐ gagnées !
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Back button
    container.querySelector('.back-btn').addEventListener('click', () => {
      navigate('#/');
    });

    // Step click handlers
    container.querySelectorAll('.step-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        const result = toggleStep(childId, routineId, index);

        if (result) {
          const wasDone = item.classList.contains('step-item--done');
          if (!wasDone) {
            playSound('step-complete');
          }

          // Re-render
          renderView();

          // Check if just completed
          if (result.isComplete && result.starsEarned > 0) {
            playSound('routine-done');
            showCelebration();
          }
        }
      });
    });
  }
}

function showCelebration() {
  const celebration = document.createElement('div');
  celebration.className = 'celebration';

  const emojis = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🏆'];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'celebration__particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${30 + Math.random() * 40}%`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.animationDuration = `${1.5 + Math.random() * 1}s`;
    celebration.appendChild(particle);
  }

  document.body.appendChild(celebration);
  setTimeout(() => celebration.remove(), 3000);
}
