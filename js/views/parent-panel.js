// === Parent Panel View ===

import { getState, deleteChild, deleteRoutine, updateSettings, resetAll } from '../state.js';
import { navigate } from '../router.js';
import { showConfirm } from '../components/modal.js';
import { DAYS_SHORT, FR } from '../utils.js';

export function render(container, params) {
  const state = getState();

  container.innerHTML = '';
  container.className = 'page';

  container.innerHTML = `
    <header class="app-header">
      <button class="btn-icon back-btn">←</button>
      <div class="app-header__title">🔧 ${FR.parent.title}</div>
      <div style="width:48px;"></div>
    </header>

    <div class="page-content">
      <!-- Profiles Section -->
      <section style="margin-bottom:32px;">
        <div class="flex-between" style="margin-bottom:12px;">
          <h2>${FR.parent.profiles}</h2>
          <button class="btn btn-primary add-child-btn" style="font-size:14px;">
            + ${FR.parent.addChild}
          </button>
        </div>
        <div class="children-list" style="display:flex; flex-direction:column; gap:8px;">
          ${state.children.length === 0 ? `
            <div class="empty-state" style="padding:24px;">
              <div class="empty-state__text">Aucun enfant configuré</div>
            </div>
          ` : state.children.map(child => `
            <div class="list-item">
              <span class="list-item__icon">${child.avatar}</span>
              <div class="list-item__content">
                <div class="list-item__title">${child.name}</div>
                <div class="list-item__subtitle">⭐ ${child.stars || 0} étoiles</div>
              </div>
              <div class="list-item__actions">
                <button class="btn-icon edit-child-btn" data-id="${child.id}">✏️</button>
                <button class="btn-icon delete-child-btn" data-id="${child.id}">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Routines Section -->
      <section style="margin-bottom:32px;">
        <div class="flex-between" style="margin-bottom:12px;">
          <h2>${FR.parent.routines}</h2>
          <button class="btn btn-primary add-routine-btn" style="font-size:14px;">
            + ${FR.parent.addRoutine}
          </button>
        </div>
        <div class="routines-list" style="display:flex; flex-direction:column; gap:8px;">
          ${state.routines.length === 0 ? `
            <div class="empty-state" style="padding:24px;">
              <div class="empty-state__text">Aucune routine configurée</div>
            </div>
          ` : state.routines.map(routine => {
            const daysStr = routine.days.length === 7 ? 'Tous les jours' :
              routine.days.map(d => DAYS_SHORT[d]).join(', ');
            const childNames = routine.assignedTo
              .map(id => state.children.find(c => c.id === id))
              .filter(Boolean)
              .map(c => `${c.avatar} ${c.name}`)
              .join(', ');
            return `
              <div class="list-item">
                <span class="list-item__icon">${routine.icon}</span>
                <div class="list-item__content">
                  <div class="list-item__title">${routine.name}</div>
                  <div class="list-item__subtitle">
                    ${routine.time} · ${daysStr} · ${childNames || 'Non assignée'}
                  </div>
                </div>
                <div class="list-item__actions">
                  <button class="btn-icon edit-routine-btn" data-id="${routine.id}">✏️</button>
                  <button class="btn-icon delete-routine-btn" data-id="${routine.id}">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Settings Section -->
      <section style="margin-bottom:32px;">
        <h2 style="margin-bottom:12px;">${FR.parent.settings}</h2>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="list-item">
            <div class="list-item__content">
              <div class="list-item__title">🔒 ${FR.parent.kiosk}</div>
              <div class="list-item__subtitle">${FR.parent.kioskDesc}</div>
            </div>
            <button class="toggle${state.settings.kioskMode ? ' toggle--active' : ''}" id="kiosk-toggle"></button>
          </div>
          <div class="list-item">
            <div class="list-item__content">
              <div class="list-item__title">🔊 Son des notifications</div>
            </div>
            <button class="toggle${state.settings.notificationSound ? ' toggle--active' : ''}" id="sound-toggle"></button>
          </div>
          <div class="list-item">
            <div class="list-item__content">
              <div class="list-item__title">📳 Vibration</div>
            </div>
            <button class="toggle${state.settings.vibration ? ' toggle--active' : ''}" id="vibrate-toggle"></button>
          </div>
        </div>
      </section>

      <!-- Data Section -->
      <section>
        <h2 style="margin-bottom:12px;">${FR.parent.data}</h2>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button class="btn btn-outline data-btn" data-action="export">📤 ${FR.data.export}</button>
          <button class="btn btn-outline data-btn" data-action="import">📥 ${FR.data.import}</button>
          <button class="btn btn-danger data-btn" data-action="reset">⚠️ ${FR.data.resetAll}</button>
        </div>
      </section>
    </div>
  `;

  // === Event Handlers ===

  // Back
  container.querySelector('.back-btn').addEventListener('click', () => navigate('#/'));

  // Add child
  container.querySelector('.add-child-btn').addEventListener('click', () => {
    navigate('#/parent/profile/new');
  });

  // Edit child
  container.querySelectorAll('.edit-child-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(`#/parent/profile/${btn.dataset.id}`));
  });

  // Delete child
  container.querySelectorAll('.delete-child-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const child = state.children.find(c => c.id === btn.dataset.id);
      showConfirm(`Supprimer ${child?.name} ?`, () => {
        deleteChild(btn.dataset.id);
        render(container, params); // Re-render
      });
    });
  });

  // Add routine
  container.querySelector('.add-routine-btn').addEventListener('click', () => {
    navigate('#/parent/routine/new');
  });

  // Edit routine
  container.querySelectorAll('.edit-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(`#/parent/routine/${btn.dataset.id}`));
  });

  // Delete routine
  container.querySelectorAll('.delete-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const routine = state.routines.find(r => r.id === btn.dataset.id);
      showConfirm(`Supprimer "${routine?.name}" ?`, () => {
        deleteRoutine(btn.dataset.id);
        render(container, params); // Re-render
      });
    });
  });

  // Toggles
  document.getElementById('kiosk-toggle')?.addEventListener('click', function() {
    this.classList.toggle('toggle--active');
    updateSettings({ kioskMode: this.classList.contains('toggle--active') });
  });

  document.getElementById('sound-toggle')?.addEventListener('click', function() {
    this.classList.toggle('toggle--active');
    updateSettings({ notificationSound: this.classList.contains('toggle--active') });
  });

  document.getElementById('vibrate-toggle')?.addEventListener('click', function() {
    this.classList.toggle('toggle--active');
    updateSettings({ vibration: this.classList.contains('toggle--active') });
  });

  // Data buttons
  container.querySelectorAll('.data-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (action === 'export') {
        const { downloadExport } = await import('../data.js');
        downloadExport();
      } else if (action === 'import') {
        const { triggerImport } = await import('../data.js');
        try {
          await triggerImport();
          render(container, params); // Re-render with new data
        } catch (e) {
          alert('Erreur: ' + e.message);
        }
      } else if (action === 'reset') {
        showConfirm(FR.data.confirmReset, () => {
          resetAll();
          render(container, params);
        });
      }
    });
  });
}
