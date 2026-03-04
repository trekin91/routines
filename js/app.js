// === MesRoutines App Entry Point ===

import { loadState, toggleStep, getRoutineProgress, completeRoutine } from './state.js';
import { addRoute, initRouter, navigate } from './router.js';
import { initKiosk } from './kiosk.js';
import { startNotificationLoop, setAlertCallback } from './notifications.js';
import { unlockAudio, playSound } from './sounds.js';
import { initPWA } from './pwa.js';

// Load state from localStorage
loadState();

// Unlock audio on first interaction
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// Init PWA (service worker + install prompt)
initPWA();

// Register routes
addRoute(/^#\/$/, () => import('./views/family-dashboard.js'));
addRoute(/^#\/rewards\/([^/]+)$/, () => import('./views/rewards.js'));
addRoute(/^#\/parent$/, () => import('./views/parent-panel.js'));
addRoute(/^#\/parent\/profile\/(.+)$/, () => import('./views/profile-editor.js'));
addRoute(/^#\/parent\/routine\/(.+)$/, () => import('./views/routine-editor.js'));
addRoute(/^#\/parent\/data$/, () => import('./views/data-manager.js'));

// Setup notification alert display
setAlertCallback(showNotificationAlert);

// Init kiosk mode guard
initKiosk();

// Start router
const app = document.getElementById('app');
initRouter(app);

// Start notification polling
startNotificationLoop();

// === Notification Alert Display ===
function showNotificationAlert({ routine, children, isCommon }) {
  // Remove existing alert if any
  const existing = document.querySelector('.notification-alert');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'notification-alert';

  const names = children.map(c => c.name).join(' et ');

  // Build child sections with checklists
  const childSectionsHtml = children.map(child => {
    const progress = getRoutineProgress(child.id, routine.id);
    const alreadyDone = !!progress.completedAt;

    const stepsHtml = routine.steps.map((step, i) => {
      const checked = progress.completedSteps.includes(i);
      return `
        <label class="popup-step${checked ? ' popup-step--done' : ''}" data-child="${child.id}" data-step="${i}">
          <span class="popup-step__check">${checked ? '✅' : '⬜'}</span>
          <span class="popup-step__icon">${step.icon}</span>
          <span class="popup-step__text">${step.text}</span>
        </label>
      `;
    }).join('');

    const allChecked = progress.completedSteps.length === routine.steps.length;

    return `
      <div class="popup-child-section" data-child="${child.id}">
        ${isCommon ? `
          <div class="popup-child-section__header">
            <span>${child.avatar}</span>
            <span class="popup-child-section__name">${child.name}</span>
          </div>
        ` : ''}
        ${alreadyDone ? `
          <div class="popup-child-section__done">✅ Déjà fait !</div>
        ` : `
          <div class="popup-steps" data-child="${child.id}">
            ${stepsHtml}
          </div>
          <button class="btn btn-primary popup-done-btn${allChecked ? '' : ' popup-done-btn--disabled'}"
                  data-child="${child.id}" data-routine="${routine.id}"
                  ${allChecked ? '' : 'disabled'}>
            C'est fait !
          </button>
        `}
      </div>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="notification-alert__content">
      <div class="notification-alert__icon">${routine.icon}</div>
      <div class="notification-alert__title">
        ${isCommon ? '🔔🔔' : '🔔'} ${isCommon ? names + ' !' : 'Hey ' + children[0].name + ' !'}
      </div>
      <div class="notification-alert__subtitle">
        ${routine.name}<br>
        ${isCommon ? "C'est l'heure, tous ensemble !" : "C'est l'heure !"}
      </div>
      <div class="popup-children">
        ${childSectionsHtml}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Handle step clicks — toggle individually
  overlay.querySelectorAll('.popup-step').forEach(stepEl => {
    if (stepEl.closest('.popup-child-section__done')) return;
    stepEl.addEventListener('click', () => {
      const childId = stepEl.dataset.child;
      const stepIndex = parseInt(stepEl.dataset.step, 10);

      const result = toggleStep(childId, routine.id, stepIndex);
      if (!result) return;

      playSound('step-complete');

      // Update visual
      const isDone = stepEl.classList.toggle('popup-step--done');
      stepEl.querySelector('.popup-step__check').textContent = isDone ? '✅' : '⬜';

      // Check if all steps are now done for this child
      const section = stepEl.closest('.popup-child-section');
      const allSteps = section.querySelectorAll('.popup-step');
      const allChecked = [...allSteps].every(s => s.classList.contains('popup-step--done'));

      const doneBtn = section.querySelector('.popup-done-btn');
      if (doneBtn) {
        doneBtn.disabled = !allChecked;
        doneBtn.classList.toggle('popup-done-btn--disabled', !allChecked);
      }

      // Enable button when all steps checked (no celebration yet — wait for "C'est fait !")
      if (allChecked && doneBtn) {
        doneBtn.disabled = false;
        doneBtn.classList.remove('popup-done-btn--disabled');
      }
    });
  });

  // Handle "C'est fait !" buttons — only this triggers validation + close
  overlay.querySelectorAll('.popup-done-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const childId = btn.dataset.child;
      const routineId = btn.dataset.routine;
      const section = btn.closest('.popup-child-section');

      // Ensure routine is fully completed in state
      completeRoutine(childId, routineId);

      playSound('routine-done');

      // Replace section content with success
      const stepsEl = section.querySelector('.popup-steps');
      if (stepsEl) stepsEl.remove();
      btn.textContent = '✅ Bravo !';
      btn.disabled = true;
      btn.classList.add('btn-success');

      // Check if ALL children have clicked "C'est fait !" — only then close
      setTimeout(() => {
        const doneBtns = overlay.querySelectorAll('.popup-done-btn');
        const alreadyDoneSections = overlay.querySelectorAll('.popup-child-section__done');
        const totalChildren = children.length;
        const validatedCount = [...doneBtns].filter(b => b.disabled).length + alreadyDoneSections.length;

        if (validatedCount >= totalChildren && overlay.parentNode) {
          overlay.remove();
          if (location.hash === '#/' || location.hash === '') {
            navigate('#/');
          }
        }
      }, 1200);
    });
  });

  // If all children already done, auto-close after 3s
  const allAlreadyDone = overlay.querySelectorAll('.popup-child-section__done').length === children.length;
  if (allAlreadyDone) {
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 3000);
  }

  // Auto-dismiss after 5 minutes
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 5 * 60 * 1000);
}
