// === Notification System ===
// Polls for routine times and triggers visual + audio alerts

import { getState, getAllTodayRoutines, isRoutineCompletedToday } from './state.js';
import { isTimeInWindow, playSound, vibrate } from './utils.js';

let checkInterval = null;
const alertedRoutines = new Set(); // routineIds already alerted today
let alertCallback = null; // function to call when alert triggers
let lastDateCheck = new Date().toDateString();

export function setAlertCallback(fn) {
  alertCallback = fn;
}

export function startNotificationLoop() {
  checkRoutines(); // immediate check
  checkInterval = setInterval(checkRoutines, 30000); // every 30s
}

export function stopNotificationLoop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function checkRoutines() {
  // Reset alerts on new day
  const today = new Date().toDateString();
  if (today !== lastDateCheck) {
    alertedRoutines.clear();
    lastDateCheck = today;
  }

  const state = getState();
  const todayRoutines = getAllTodayRoutines();

  for (const routine of todayRoutines) {
    if (alertedRoutines.has(routine.id)) continue;
    if (!isTimeInWindow(routine.time, 2)) continue;

    // Check if routine is already completed by ALL assigned children
    const allCompleted = routine.assignedTo.every(childId =>
      isRoutineCompletedToday(childId, routine.id)
    );
    if (allCompleted) continue;

    // Trigger alert
    alertedRoutines.add(routine.id);
    triggerAlert(routine, state);
  }
}

function triggerAlert(routine, state) {
  const isCommon = routine.assignedTo.length > 1;
  const children = routine.assignedTo
    .map(id => state.children.find(c => c.id === id))
    .filter(Boolean);

  // Sound
  if (state.settings.notificationSound) {
    playSound(isCommon ? 'notification-family' : 'notification');
  }

  // Vibration
  if (state.settings.vibration) {
    vibrate(isCommon ? [200, 100, 200, 100, 200] : [200, 100, 200]);
  }

  // Visual alert via callback
  if (alertCallback) {
    alertCallback({
      routine,
      children,
      isCommon,
    });
  }
}

// Handle visibility change — catch up on missed checks
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkRoutines();
  }
});
