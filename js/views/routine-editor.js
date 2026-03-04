// === Routine Editor View ===

import { getState, getRoutine, addRoutine, updateRoutine } from '../state.js';
import { navigate } from '../router.js';
import { generateId, FR } from '../utils.js';
import { ICON_CATALOG, getAllIcons } from '../icons.js';

export function render(container, params) {
  const isNew = params.p0 === 'new';
  const routine = isNew ? null : getRoutine(params.p0);
  const state = getState();

  if (!isNew && !routine) {
    navigate('#/parent');
    return;
  }

  // Form state
  let name = routine?.name || '';
  let icon = routine?.icon || '🌅';
  let time = routine?.time || '07:30';
  let days = routine?.days ? [...routine.days] : [1, 2, 3, 4, 5];
  let assignedTo = routine?.assignedTo ? [...routine.assignedTo] : [];
  let steps = routine?.steps ? routine.steps.map(s => ({ ...s })) : [];
  let starsPerCompletion = routine?.starsPerCompletion || 3;
  let showIconPicker = false;

  container.innerHTML = '';
  container.className = 'page';

  renderForm();

  function renderForm() {
    const allDays = days.length === 7;
    const weekdays = [1, 2, 3, 4, 5].every(d => days.includes(d)) && !days.includes(0) && !days.includes(6);
    const weekend = days.includes(0) && days.includes(6) && days.length === 2;

    container.innerHTML = `
      <header class="app-header">
        <button class="btn-icon back-btn">←</button>
        <div class="app-header__title">
          ${isNew ? FR.parent.addRoutine : 'Modifier la routine'}
        </div>
        <div style="width:48px;"></div>
      </header>

      <div class="page-content">
        <!-- Name -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.name}</label>
          <input class="input" type="text" id="routine-name" placeholder="Ex: Routine du matin"
                 value="${name}" maxlength="40">
        </div>

        <!-- Icon -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.icon}</label>
          <button class="btn btn-outline icon-toggle" style="font-size:32px; padding:8px 24px;">
            ${icon} ▼
          </button>
          ${showIconPicker ? renderIconPicker() : ''}
        </div>

        <!-- Time -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.time}</label>
          <input class="input" type="time" id="routine-time" value="${time}"
                 style="font-size:24px; text-align:center; max-width:200px;">
        </div>

        <!-- Days -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.days}</label>
          <div class="day-picker">
            <div class="day-picker__shortcuts">
              <button class="day-picker__shortcut${allDays ? ' day-picker__shortcut--active' : ''}"
                      data-shortcut="all">${FR.routineEditor.allDays}</button>
              <button class="day-picker__shortcut${weekdays ? ' day-picker__shortcut--active' : ''}"
                      data-shortcut="week">${FR.routineEditor.weekdays}</button>
              <button class="day-picker__shortcut${weekend ? ' day-picker__shortcut--active' : ''}"
                      data-shortcut="weekend">${FR.routineEditor.weekend}</button>
            </div>
            <div class="day-picker__days">
              ${[1, 2, 3, 4, 5, 6, 0].map(d => `
                <button class="day-picker__day${days.includes(d) ? ' day-picker__day--active' : ''}"
                        data-day="${d}">${['D', 'L', 'M', 'M', 'J', 'V', 'S'][d]}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Assign To -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.assignTo}</label>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${state.children.map(c => `
              <button class="btn ${assignedTo.includes(c.id) ? 'btn-primary' : 'btn-outline'} assign-btn"
                      data-child="${c.id}">
                ${c.avatar} ${c.name}
              </button>
            `).join('')}
            ${state.children.length === 0 ? '<span style="color:#757575;">Aucun enfant créé</span>' : ''}
          </div>
        </div>

        <!-- Stars -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.starsPerCompletion}</label>
          <div style="display:flex; align-items:center; gap:12px;">
            <button class="btn btn-outline stars-minus" style="width:48px;">-</button>
            <span style="font-size:24px; font-weight:700; min-width:60px; text-align:center;">
              ⭐ ${starsPerCompletion}
            </span>
            <button class="btn btn-outline stars-plus" style="width:48px;">+</button>
          </div>
        </div>

        <!-- Steps -->
        <div class="form-group">
          <label class="form-group__label">${FR.routineEditor.steps}</label>
          <div class="steps-editor" style="display:flex; flex-direction:column; gap:8px;">
            ${steps.map((step, i) => `
              <div class="list-item" style="gap:8px;">
                <button class="btn-icon step-icon-btn" data-step="${i}" style="font-size:24px;">
                  ${step.icon}
                </button>
                <input class="input step-text" data-step="${i}" value="${step.text}"
                       placeholder="Étape ${i + 1}" style="flex:1;">
                <button class="btn-icon step-up" data-step="${i}" ${i === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
                <button class="btn-icon step-down" data-step="${i}" ${i === steps.length - 1 ? 'disabled style="opacity:0.3"' : ''}>↓</button>
                <button class="btn-icon step-delete" data-step="${i}">🗑️</button>
              </div>
            `).join('')}
            <button class="btn btn-outline add-step-btn" style="width:100%;">
              + ${FR.routineEditor.addStep}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex; gap:12px; justify-content:center; margin-top:24px; padding-bottom:24px;">
          <button class="btn btn-outline cancel-btn">${FR.parent.cancel}</button>
          <button class="btn btn-success save-btn">${FR.parent.save}</button>
        </div>
      </div>
    `;

    // === Event Handlers ===

    container.querySelector('.back-btn').addEventListener('click', () => navigate('#/parent'));
    container.querySelector('.cancel-btn').addEventListener('click', () => navigate('#/parent'));

    // Name
    container.querySelector('#routine-name').addEventListener('input', (e) => {
      name = e.target.value;
    });

    // Time
    container.querySelector('#routine-time').addEventListener('change', (e) => {
      time = e.target.value;
    });

    // Icon toggle
    container.querySelector('.icon-toggle').addEventListener('click', () => {
      showIconPicker = !showIconPicker;
      renderForm();
    });

    // Icon picker buttons
    container.querySelectorAll('.icon-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        icon = btn.dataset.icon;
        showIconPicker = false;
        renderForm();
      });
    });

    // Day shortcuts
    container.querySelectorAll('[data-shortcut]').forEach(btn => {
      btn.addEventListener('click', () => {
        const shortcut = btn.dataset.shortcut;
        if (shortcut === 'all') days = [0, 1, 2, 3, 4, 5, 6];
        else if (shortcut === 'week') days = [1, 2, 3, 4, 5];
        else if (shortcut === 'weekend') days = [0, 6];
        renderForm();
      });
    });

    // Individual days
    container.querySelectorAll('.day-picker__day').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.day);
        const idx = days.indexOf(d);
        if (idx === -1) days.push(d);
        else days.splice(idx, 1);
        days.sort((a, b) => a - b);
        renderForm();
      });
    });

    // Assign buttons
    container.querySelectorAll('.assign-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.child;
        const idx = assignedTo.indexOf(id);
        if (idx === -1) assignedTo.push(id);
        else assignedTo.splice(idx, 1);
        renderForm();
      });
    });

    // Stars +/-
    container.querySelector('.stars-minus')?.addEventListener('click', () => {
      if (starsPerCompletion > 1) { starsPerCompletion--; renderForm(); }
    });
    container.querySelector('.stars-plus')?.addEventListener('click', () => {
      if (starsPerCompletion < 10) { starsPerCompletion++; renderForm(); }
    });

    // Steps
    container.querySelectorAll('.step-text').forEach(input => {
      input.addEventListener('input', (e) => {
        steps[parseInt(e.target.dataset.step)].text = e.target.value;
      });
    });

    container.querySelector('.add-step-btn').addEventListener('click', () => {
      steps.push({ icon: '✅', text: '' });
      renderForm();
      // Focus the new input
      const inputs = container.querySelectorAll('.step-text');
      inputs[inputs.length - 1]?.focus();
    });

    container.querySelectorAll('.step-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        steps.splice(parseInt(btn.dataset.step), 1);
        renderForm();
      });
    });

    container.querySelectorAll('.step-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.step);
        if (i > 0) {
          [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]];
          renderForm();
        }
      });
    });

    container.querySelectorAll('.step-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.step);
        if (i < steps.length - 1) {
          [steps[i], steps[i + 1]] = [steps[i + 1], steps[i]];
          renderForm();
        }
      });
    });

    // Step icon buttons — cycle through common icons
    container.querySelectorAll('.step-icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.step);
        const allIcons = getAllIcons();
        const currentIdx = allIcons.indexOf(steps[i].icon);
        steps[i].icon = allIcons[(currentIdx + 1) % allIcons.length];
        renderForm();
      });
    });

    // Save
    container.querySelector('.save-btn').addEventListener('click', () => {
      name = container.querySelector('#routine-name').value.trim();
      if (!name) {
        container.querySelector('#routine-name').focus();
        return;
      }
      if (steps.length === 0) {
        alert('Ajoutez au moins une étape');
        return;
      }
      if (days.length === 0) {
        alert('Sélectionnez au moins un jour');
        return;
      }

      // Clean empty step texts
      const cleanSteps = steps.filter(s => s.text.trim()).map(s => ({
        icon: s.icon,
        text: s.text.trim(),
      }));

      if (cleanSteps.length === 0) {
        alert('Ajoutez au moins une étape avec du texte');
        return;
      }

      const routineData = {
        name,
        icon,
        time,
        days,
        assignedTo,
        steps: cleanSteps,
        starsPerCompletion,
      };

      if (isNew) {
        addRoutine({
          id: generateId('routine'),
          ...routineData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        updateRoutine(routine.id, {
          ...routineData,
          updatedAt: new Date().toISOString(),
        });
      }

      navigate('#/parent');
    });
  }
}

function renderIconPicker() {
  let html = '<div style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #E0E0E0; border-radius:12px; padding:8px;">';

  for (const [category, icons] of Object.entries(ICON_CATALOG)) {
    html += `<div style="font-size:12px; color:#757575; font-weight:600; margin:8px 0 4px;">${category}</div>`;
    html += '<div style="display:flex; flex-wrap:wrap; gap:4px;">';
    icons.forEach(ic => {
      html += `<button class="avatar-picker__item icon-pick-btn" data-icon="${ic}" style="width:44px; height:44px; font-size:24px;">${ic}</button>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}
