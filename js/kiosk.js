// === Kiosk Mode ===
// Fullscreen + lock navigation + prevent exit

import { getSettings } from './state.js';
import { navigate } from './router.js';

let pinVerifiedThisSession = false;
let wakeLock = null;

export function isKioskMode() {
  return getSettings().kioskMode;
}

export function isPinVerified() {
  return pinVerifiedThisSession;
}

export function setPinVerified(value) {
  pinVerifiedThisSession = value;
  // Auto-expire PIN after 5 minutes
  if (value) {
    setTimeout(() => { pinVerifiedThisSession = false; }, 5 * 60 * 1000);
  }
}

export function guardRoute(hash) {
  if (!isKioskMode()) return true;
  if (pinVerifiedThisSession) return true;

  // Allow child routes
  if (hash === '#/' || hash.startsWith('#/rewards/')) {
    return true;
  }

  // Block parent routes
  if (hash.startsWith('#/parent')) {
    return false;
  }

  return true;
}

// === Fullscreen API ===

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export async function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    }
  } catch (e) {
    // Fullscreen may fail if not triggered by user gesture
  }
}

export async function exitFullscreen() {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    }
  } catch (e) {
    // May fail if not in fullscreen
  }
}

export async function toggleFullscreen() {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
}

// === Wake Lock (keep screen on) ===

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) {
    // Wake lock may fail (low battery, etc.)
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// === Init ===

export function initKiosk() {
  // Guard hash navigation
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/';
    if (!guardRoute(hash)) {
      navigate('#/');
    }
  });

  // Block Android back button — push dummy history entries
  if (isKioskMode()) {
    enableBackButtonBlock();
    enableWakeLock();
  }

  // Disable context menu in kiosk mode
  document.addEventListener('contextmenu', (e) => {
    if (isKioskMode()) e.preventDefault();
  });

  // Re-request wake lock when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isKioskMode()) {
      requestWakeLock();
    }
  });

  // Auto-fullscreen on first touch in kiosk mode
  const autoFullscreen = () => {
    if (isKioskMode() && !isFullscreen()) {
      enterFullscreen();
    }
  };
  document.addEventListener('touchstart', autoFullscreen, { once: true });
  document.addEventListener('click', autoFullscreen, { once: true });

  // Re-enter fullscreen if user exits while in kiosk mode
  document.addEventListener('fullscreenchange', () => {
    if (!isFullscreen() && isKioskMode() && !pinVerifiedThisSession) {
      // Small delay to avoid infinite loop
      setTimeout(() => {
        if (!isFullscreen() && isKioskMode()) {
          // Will need a user gesture, so we wait for next tap
          const reenter = () => {
            if (isKioskMode() && !isFullscreen()) {
              enterFullscreen();
            }
          };
          document.addEventListener('touchstart', reenter, { once: true });
          document.addEventListener('click', reenter, { once: true });
        }
      }, 500);
    }
  });
}

function enableBackButtonBlock() {
  // Push state so back button doesn't leave the app
  history.pushState(null, '', window.location.href);
  window.addEventListener('popstate', (e) => {
    if (isKioskMode() && !pinVerifiedThisSession) {
      history.pushState(null, '', window.location.href);
      // Redirect to home if trying to go back
      if (window.location.hash !== '#/') {
        navigate('#/');
      }
    }
  });
}

function enableWakeLock() {
  requestWakeLock();
}

// === Called from parent panel when toggling kiosk ===

export function onKioskToggle(enabled) {
  if (enabled) {
    enableBackButtonBlock();
    enableWakeLock();
    enterFullscreen();
  } else {
    releaseWakeLock();
    exitFullscreen();
  }
}
