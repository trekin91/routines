// === Header Component ===

import { formatDateShort } from '../utils.js';
import { showPinPad } from './pin-pad.js';
import { navigate } from '../router.js';
import { setPinVerified, toggleFullscreen, isFullscreen } from '../kiosk.js';
import { getInstallPrompt, triggerInstall } from '../pwa.js';

function formatClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function renderHeader(container, { title = 'MesRoutines', showBack = false, showLock = true, backHash = '#/' } = {}) {
  const header = document.createElement('header');
  header.className = 'app-header';

  const today = new Date();
  const dateStr = formatDateShort(today);
  const hasInstall = !!getInstallPrompt();

  header.innerHTML = `
    ${showBack ? `<button class="btn-icon back-btn">←</button>` : ''}
    <div class="app-header__title">
      ${showBack ? '' : '🏠 '}${title}
    </div>
    <div class="app-header__right">
      <span class="app-header__clock">${formatClock()}</span>
      <span class="app-header__date">${dateStr}</span>
    </div>
    <div class="app-header__actions">
      <button class="btn-icon install-btn" title="Installer l'app" style="${hasInstall ? '' : 'display:none'}">📲</button>
      <button class="btn-icon refresh-btn" title="Rafraîchir">🔄</button>
      <button class="btn-icon fullscreen-btn" title="Plein écran">⛶</button>
      ${showLock ? `<button class="btn-icon lock-btn">🔒</button>` : ''}
    </div>
  `;

  // Update clock every 15 seconds
  const clockEl = header.querySelector('.app-header__clock');
  const clockInterval = setInterval(() => {
    if (!clockEl.isConnected) {
      clearInterval(clockInterval);
      return;
    }
    clockEl.textContent = formatClock();
  }, 15000);

  // Refresh button
  header.querySelector('.refresh-btn').addEventListener('click', () => {
    window.location.reload();
  });

  // Install PWA button
  header.querySelector('.install-btn').addEventListener('click', () => {
    triggerInstall();
  });

  // Fullscreen toggle
  const fsBtn = header.querySelector('.fullscreen-btn');
  fsBtn.addEventListener('click', async () => {
    await toggleFullscreen();
    fsBtn.textContent = isFullscreen() ? '⊠' : '⛶';
  });

  // Update fullscreen icon when state changes externally
  document.addEventListener('fullscreenchange', () => {
    if (fsBtn.isConnected) {
      fsBtn.textContent = isFullscreen() ? '⊠' : '⛶';
    }
  });

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
