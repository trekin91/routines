// === Kiosk Mode ===
// Blocks navigation to parent routes without PIN

import { getSettings } from './state.js';
import { navigate } from './router.js';

let pinVerifiedThisSession = false;

export function isKioskMode() {
  return getSettings().kioskMode;
}

export function isPinVerified() {
  return pinVerifiedThisSession;
}

export function setPinVerified(value) {
  pinVerifiedThisSession = value;
}

export function guardRoute(hash) {
  if (!isKioskMode()) return true;
  if (pinVerifiedThisSession) return true;

  // Allow child routes
  if (hash === '#/' || hash.startsWith('#/routine/') || hash.startsWith('#/rewards/')) {
    return true;
  }

  // Block parent routes
  if (hash.startsWith('#/parent')) {
    return false;
  }

  return true;
}

export function initKiosk() {
  // Intercept navigation attempts
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/';
    if (!guardRoute(hash)) {
      navigate('#/');
    }
  });
}
