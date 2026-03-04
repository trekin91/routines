// === MesRoutines App Entry Point ===

import { loadState } from './state.js';
import { addRoute, initRouter, navigate } from './router.js';
import { initKiosk } from './kiosk.js';
import { startNotificationLoop, setAlertCallback } from './notifications.js';
import { unlockAudio } from './utils.js';

// Load state from localStorage
loadState();

// Unlock audio on first interaction
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// Register routes
addRoute(/^#\/$/, () => import('./views/family-dashboard.js'));
addRoute(/^#\/routine\/([^/]+)\/([^/]+)$/, () => import('./views/routine-run.js'));
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
  const avatars = children.map(c => c.avatar).join('');

  let buttonsHtml;
  if (isCommon) {
    buttonsHtml = children.map(c =>
      `<button class="btn btn-primary" data-child="${c.id}" data-routine="${routine.id}">
        ${c.avatar} ${c.name}
      </button>`
    ).join('');
  } else {
    buttonsHtml = `<button class="btn btn-primary" data-child="${children[0].id}" data-routine="${routine.id}">
      C'est parti !
    </button>`;
  }

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
      <div class="notification-alert__buttons">
        ${buttonsHtml}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Handle button clicks
  overlay.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const childId = btn.dataset.child;
      const routineId = btn.dataset.routine;
      overlay.remove();
      navigate(`#/routine/${routineId}/${childId}`);
    });
  });

  // Auto-dismiss after 5 minutes
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 5 * 60 * 1000);
}
