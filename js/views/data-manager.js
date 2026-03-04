// === Data Manager View ===

import { getState, resetChildProgress, resetAll } from '../state.js';
import { downloadExport, triggerImport } from '../data.js';
import { navigate } from '../router.js';
import { showConfirm } from '../components/modal.js';
import { FR } from '../utils.js';

export function render(container, params) {
  const state = getState();

  container.innerHTML = '';
  container.className = 'page';

  container.innerHTML = `
    <header class="app-header">
      <button class="btn-icon back-btn">←</button>
      <div class="app-header__title">📦 ${FR.parent.data}</div>
      <div style="width:48px;"></div>
    </header>

    <div class="page-content">
      <section style="margin-bottom:32px;">
        <h2 style="margin-bottom:12px;">Sauvegarde</h2>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <button class="btn btn-primary export-btn" style="width:100%;">
            📤 ${FR.data.export}
          </button>
          <button class="btn btn-outline import-btn" style="width:100%;">
            📥 ${FR.data.import}
          </button>
        </div>
      </section>

      <section style="margin-bottom:32px;">
        <h2 style="margin-bottom:12px;">${FR.data.resetChild}</h2>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${state.children.map(child => `
            <div class="list-item">
              <span class="list-item__icon">${child.avatar}</span>
              <div class="list-item__content">
                <div class="list-item__title">${child.name}</div>
                <div class="list-item__subtitle">⭐ ${child.stars || 0} · 🔥 ${child.streaks?.current || 0}j</div>
              </div>
              <button class="btn btn-danger reset-child-btn" data-id="${child.id}" style="font-size:12px;">
                Réinitialiser
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <section>
        <button class="btn btn-danger reset-all-btn" style="width:100%;">
          ⚠️ ${FR.data.resetAll}
        </button>
      </section>
    </div>
  `;

  // Back
  container.querySelector('.back-btn').addEventListener('click', () => navigate('#/parent'));

  // Export
  container.querySelector('.export-btn').addEventListener('click', () => {
    downloadExport();
  });

  // Import
  container.querySelector('.import-btn').addEventListener('click', async () => {
    try {
      await triggerImport();
      render(container, params);
    } catch (e) {
      alert('Erreur: ' + e.message);
    }
  });

  // Reset child
  container.querySelectorAll('.reset-child-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const child = state.children.find(c => c.id === btn.dataset.id);
      showConfirm(`Réinitialiser la progression de ${child?.name} ?`, () => {
        resetChildProgress(btn.dataset.id);
        render(container, params);
      });
    });
  });

  // Reset all
  container.querySelector('.reset-all-btn').addEventListener('click', () => {
    showConfirm(FR.data.confirmReset, () => {
      resetAll();
      navigate('#/');
    });
  });
}
