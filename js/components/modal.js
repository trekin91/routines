// === Reusable Modal Component ===

export function showModal(content, { onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const modal = document.createElement('div');
  modal.className = 'modal anim-bounce-in';

  if (typeof content === 'string') {
    modal.innerHTML = content;
  } else {
    modal.appendChild(content);
  }

  overlay.appendChild(modal);

  // Close on overlay click (not modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
      if (onClose) onClose();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function closeModal(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.remove();
  }
}

export function showConfirm(message, onConfirm, onCancel) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal__title">${message}</div>
    <div class="modal__actions">
      <button class="btn btn-outline cancel-btn">Annuler</button>
      <button class="btn btn-danger confirm-btn">Confirmer</button>
    </div>
  `;

  const overlay = showModal(content);

  content.querySelector('.confirm-btn').addEventListener('click', () => {
    closeModal(overlay);
    if (onConfirm) onConfirm();
  });

  content.querySelector('.cancel-btn').addEventListener('click', () => {
    closeModal(overlay);
    if (onCancel) onCancel();
  });

  return overlay;
}
