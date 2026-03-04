// === Profile Editor View ===

import { getState, getChild, addChild, updateChild } from '../state.js';
import { navigate } from '../router.js';
import { generateId, FR } from '../utils.js';
import { AVATAR_ICONS, COLOR_THEMES } from '../icons.js';

export function render(container, params) {
  const isNew = params.p0 === 'new';
  const child = isNew ? null : getChild(params.p0);

  if (!isNew && !child) {
    navigate('#/parent');
    return;
  }

  let selectedAvatar = child?.avatar || AVATAR_ICONS[0];
  let selectedTheme = child?.theme || COLOR_THEMES[0].id;
  let name = child?.name || '';

  container.innerHTML = '';
  container.className = 'page';

  renderForm();

  function renderForm() {
    container.innerHTML = `
      <header class="app-header">
        <button class="btn-icon back-btn">←</button>
        <div class="app-header__title">
          ${isNew ? FR.parent.addChild : 'Modifier ' + child.name}
        </div>
        <div style="width:48px;"></div>
      </header>

      <div class="page-content">
        <!-- Name -->
        <div class="form-group">
          <label class="form-group__label">${FR.profile.name}</label>
          <input class="input" type="text" id="child-name" placeholder="Prénom de l'enfant"
                 value="${name}" maxlength="20">
        </div>

        <!-- Avatar -->
        <div class="form-group">
          <label class="form-group__label">${FR.profile.avatar}</label>
          <div class="avatar-picker">
            ${AVATAR_ICONS.map(icon => `
              <button class="avatar-picker__item${icon === selectedAvatar ? ' avatar-picker__item--selected' : ''}"
                      data-avatar="${icon}">${icon}</button>
            `).join('')}
          </div>
        </div>

        <!-- Theme -->
        <div class="form-group">
          <label class="form-group__label">${FR.profile.theme}</label>
          <div class="theme-picker">
            ${COLOR_THEMES.map(t => `
              <button class="theme-picker__item${t.id === selectedTheme ? ' theme-picker__item--selected' : ''}"
                      data-theme="${t.id}"
                      style="background:${t.color};"
                      title="${t.name}"></button>
            `).join('')}
          </div>
        </div>

        <!-- Preview -->
        <div style="margin:24px 0; text-align:center;">
          <div style="font-size:64px;">${selectedAvatar}</div>
          <div style="font-size:20px; font-weight:700; margin-top:8px;">${name || 'Prénom'}</div>
        </div>

        <!-- Actions -->
        <div style="display:flex; gap:12px; justify-content:center; margin-top:24px;">
          <button class="btn btn-outline cancel-btn">${FR.parent.cancel}</button>
          <button class="btn btn-success save-btn">${FR.parent.save}</button>
        </div>
      </div>
    `;

    // Event handlers
    container.querySelector('.back-btn').addEventListener('click', () => navigate('#/parent'));
    container.querySelector('.cancel-btn').addEventListener('click', () => navigate('#/parent'));

    // Name input
    const nameInput = container.querySelector('#child-name');
    nameInput.addEventListener('input', (e) => {
      name = e.target.value.trim();
      renderForm();
      // Re-focus and set cursor position
      const newInput = container.querySelector('#child-name');
      newInput.focus();
      newInput.setSelectionRange(name.length, name.length);
    });

    // Avatar picker
    container.querySelectorAll('.avatar-picker__item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAvatar = btn.dataset.avatar;
        renderForm();
      });
    });

    // Theme picker
    container.querySelectorAll('.theme-picker__item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTheme = btn.dataset.theme;
        renderForm();
      });
    });

    // Save
    container.querySelector('.save-btn').addEventListener('click', () => {
      if (!name) {
        container.querySelector('#child-name').focus();
        return;
      }

      if (isNew) {
        addChild({
          id: generateId('child'),
          name,
          avatar: selectedAvatar,
          theme: selectedTheme,
          stars: 0,
          streaks: { current: 0, best: 0 },
          trophies: [],
          history: {},
        });
      } else {
        updateChild(child.id, {
          name,
          avatar: selectedAvatar,
          theme: selectedTheme,
        });
      }

      navigate('#/parent');
    });
  }
}
