// === Header Component ===

import { formatDateShort } from '../utils.js';
import { showPinPad } from './pin-pad.js';
import { navigate } from '../router.js';
import { setPinVerified } from '../kiosk.js';

export function renderHeader(container, { title = 'MesRoutines', showBack = false, showLock = true, backHash = '#/' } = {}) {
  const header = document.createElement('header');
  header.className = 'app-header';

  const today = new Date();
  const dateStr = formatDateShort(today);

  header.innerHTML = `
    ${showBack ? `<button class="btn-icon back-btn">←</button>` : ''}
    <div class="app-header__title">
      ${showBack ? '' : '🏠 '}${title}
    </div>
    <div class="app-header__date">${dateStr}</div>
    ${showLock ? `<button class="btn-icon lock-btn">🔒</button>` : ''}
  `;

  if (showBack) {
    header.querySelector('.back-btn').addEventListener('click', () => {
      navigate(backHash);
    });
  }

  if (showLock) {
    header.querySelector('.lock-btn').addEventListener('click', () => {
      showPinPad(() => {
        setPinVerified(true);
        navigate('#/parent');
      });
    });
  }

  container.appendChild(header);
  return header;
}
