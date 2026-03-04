// === Rewards View ===

import { getState, getChild } from '../state.js';
import { navigate } from '../router.js';
import { DAYS_SHORT } from '../utils.js';

export function render(container, params) {
  const childId = params.p0;
  const state = getState();
  const child = getChild(childId);

  if (!child) {
    navigate('#/');
    return;
  }

  container.innerHTML = '';
  container.className = `page theme-${child.theme}`;

  container.innerHTML = `
    <header class="app-header">
      <button class="btn-icon back-btn">←</button>
      <div class="app-header__title">
        ${child.avatar} ${child.name}
      </div>
      <div style="width:48px;"></div>
    </header>

    <div class="page-content" style="text-align:center;">
      <!-- Star Counter -->
      <div style="margin:24px 0;">
        <div style="font-size:80px;">⭐</div>
        <div style="font-size:48px; font-weight:700; color:var(--color-primary-dark);">
          ${child.stars || 0}
        </div>
        <div style="font-size:16px; color:#757575;">étoiles</div>
      </div>

      <!-- Streak -->
      <div style="display:flex; justify-content:center; gap:32px; margin:24px 0;">
        <div class="card" style="text-align:center; padding:16px 24px;">
          <div style="font-size:32px;">🔥</div>
          <div style="font-size:28px; font-weight:700;">${child.streaks?.current || 0}</div>
          <div style="font-size:12px; color:#757575;">jours de suite</div>
        </div>
        <div class="card" style="text-align:center; padding:16px 24px;">
          <div style="font-size:32px;">🏅</div>
          <div style="font-size:28px; font-weight:700;">${child.streaks?.best || 0}</div>
          <div style="font-size:12px; color:#757575;">record</div>
        </div>
      </div>

      <!-- History (last 14 days) -->
      <div style="margin:24px 0;">
        <h3 style="margin-bottom:12px; text-align:left;">Historique</h3>
        <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;">
          ${renderHistory(child)}
        </div>
      </div>

      <!-- Trophies -->
      <div style="margin:24px 0;">
        <h3 style="margin-bottom:12px; text-align:left;">Trophées</h3>
        ${renderTrophies(child)}
      </div>

      <!-- Child switcher if multiple children -->
      ${state.children.length > 1 ? `
        <div style="margin:24px 0; display:flex; justify-content:center; gap:12px;">
          ${state.children.map(c => `
            <button class="btn ${c.id === childId ? 'btn-primary' : 'btn-outline'} child-switch-btn"
                    data-child="${c.id}" style="font-size:24px; padding:8px 16px;">
              ${c.avatar} ${c.name}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="bottom-nav__item" data-tab="routines">
        <span class="bottom-nav__icon">📋</span>
        Routines
      </button>
      <button class="bottom-nav__item bottom-nav__item--active" data-tab="stars">
        <span class="bottom-nav__icon">⭐</span>
        Étoiles
      </button>
    </nav>
  `;

  // Back button
  container.querySelector('.back-btn').addEventListener('click', () => {
    navigate('#/');
  });

  // Bottom nav
  container.querySelector('[data-tab="routines"]').addEventListener('click', () => {
    navigate('#/');
  });

  // Child switcher
  container.querySelectorAll('.child-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`#/rewards/${btn.dataset.child}`);
    });
  });
}

function renderHistory(child) {
  const days = [];
  const today = new Date();

  // Generate last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayData = child.history?.[key];
    const isToday = i === 0;

    let color = '#E0E0E0'; // gray = no data
    let label = date.getDate();

    if (dayData) {
      if (dayData.allCompleted) {
        color = '#4CAF50'; // green
      } else {
        // Check if any routines were done
        const hasAny = Object.values(dayData.routines || {}).some(r => r.completedSteps.length > 0);
        color = hasAny ? '#FF9800' : '#E0E0E0'; // orange = partial
      }
    }

    days.push(`
      <div style="
        aspect-ratio:1;
        border-radius:8px;
        background:${color};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:11px;
        font-weight:600;
        color:${color === '#E0E0E0' ? '#999' : 'white'};
        ${isToday ? 'border:2px solid var(--color-primary);' : ''}
      ">${label}</div>
    `);
  }

  return days.join('');
}

function renderTrophies(child) {
  const trophies = child.trophies || [];

  if (trophies.length === 0) {
    return `<div style="color:#757575; font-size:14px; padding:16px;">
      Continue comme ça pour gagner des trophées !
    </div>`;
  }

  return `<div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
    ${trophies.map(t => `
      <div class="card" style="text-align:center; padding:12px; min-width:100px;">
        <div style="font-size:36px;">${t.icon}</div>
        <div style="font-size:12px; font-weight:600; margin-top:4px;">${t.name}</div>
      </div>
    `).join('')}
  </div>`;
}
