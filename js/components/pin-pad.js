// === PIN Pad Component ===

import { checkPin } from '../state.js';
import { showModal, closeModal } from './modal.js';
import { playSound } from '../utils.js';

export function showPinPad(onSuccess) {
  let pin = '';
  let dots = [];

  const content = document.createElement('div');
  content.className = 'pin-pad';
  content.innerHTML = `
    <div class="pin-pad__title">🔒 Code parent</div>
    <div class="pin-pad__dots">
      <div class="pin-pad__dot" data-idx="0"></div>
      <div class="pin-pad__dot" data-idx="1"></div>
      <div class="pin-pad__dot" data-idx="2"></div>
      <div class="pin-pad__dot" data-idx="3"></div>
    </div>
    <div class="pin-pad__grid">
      <button class="pin-pad__key" data-key="1">1</button>
      <button class="pin-pad__key" data-key="2">2</button>
      <button class="pin-pad__key" data-key="3">3</button>
      <button class="pin-pad__key" data-key="4">4</button>
      <button class="pin-pad__key" data-key="5">5</button>
      <button class="pin-pad__key" data-key="6">6</button>
      <button class="pin-pad__key" data-key="7">7</button>
      <button class="pin-pad__key" data-key="8">8</button>
      <button class="pin-pad__key" data-key="9">9</button>
      <button class="pin-pad__key pin-pad__key--empty"></button>
      <button class="pin-pad__key" data-key="0">0</button>
      <button class="pin-pad__key pin-pad__key--delete" data-key="del">⌫</button>
    </div>
  `;

  const overlay = showModal(content);
  dots = [...content.querySelectorAll('.pin-pad__dot')];

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.className = 'pin-pad__dot' + (i < pin.length ? ' pin-pad__dot--filled' : '');
    });
  }

  function showError() {
    dots.forEach(dot => dot.classList.add('pin-pad__dot--error'));
    content.classList.add('anim-shake');
    setTimeout(() => {
      pin = '';
      updateDots();
      content.classList.remove('anim-shake');
    }, 500);
  }

  content.addEventListener('click', (e) => {
    const key = e.target.closest('[data-key]');
    if (!key) return;

    const val = key.dataset.key;

    if (val === 'del') {
      pin = pin.slice(0, -1);
      updateDots();
      return;
    }

    if (pin.length >= 4) return;

    pin += val;
    updateDots();

    if (pin.length === 4) {
      setTimeout(() => {
        if (checkPin(pin)) {
          closeModal(overlay);
          if (onSuccess) onSuccess();
        } else {
          showError();
        }
      }, 200);
    }
  });

  return overlay;
}
