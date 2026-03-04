// === Family Dashboard View ===
// Main screen showing all children timelines side by side

import { getState, getTodayRoutines, getAllTodayRoutines, onStateChange } from '../state.js';
import { renderHeader } from '../components/header.js';
import { renderRoutineCard } from '../components/routine-card.js';
import { renderBridgeCard } from '../components/bridge-card.js';
import { navigate } from '../router.js';
import { FR } from '../utils.js';

export function render(container, params) {
  const state = getState();

  // If no children, show setup prompt
  if (state.children.length === 0) {
    renderEmpty(container);
    return;
  }

  container.innerHTML = '';
  container.className = 'page';

  // Header
  renderHeader(container);

  // Dashboard columns area
  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'dashboard-columns';
  container.appendChild(columnsWrapper);

  // Bottom navigation
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  bottomNav.innerHTML = `
    <button class="bottom-nav__item bottom-nav__item--active" data-tab="routines">
      <span class="bottom-nav__icon">📋</span>
      ${FR.nav.routines}
    </button>
    <button class="bottom-nav__item" data-tab="stars">
      <span class="bottom-nav__icon">⭐</span>
      ${FR.nav.stars}
    </button>
  `;
  container.appendChild(bottomNav);

  // Handle bottom nav
  bottomNav.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    if (tab.dataset.tab === 'stars') {
      // If one child, go directly. If multiple, show first child.
      const childId = state.children[0]?.id;
      if (childId) navigate(`#/rewards/${childId}`);
    }
  });

  // Render columns
  renderColumns(columnsWrapper, state);

  // Auto-refresh every 30s
  const refreshInterval = setInterval(() => {
    renderColumns(columnsWrapper, getState());
  }, 30000);

  // Listen for state changes
  const unsubscribe = onStateChange(() => {
    renderColumns(columnsWrapper, getState());
  });

  return () => {
    clearInterval(refreshInterval);
    unsubscribe();
  };
}

function renderColumns(wrapper, state) {
  wrapper.innerHTML = '';
  const today = new Date().getDay();
  const allRoutines = state.routines.filter(r => r.days.includes(today));

  // Identify bridge routines (assigned to multiple children)
  const bridgeRoutines = allRoutines.filter(r => r.assignedTo.length > 1);
  const bridgeRoutineIds = new Set(bridgeRoutines.map(r => r.id));

  // Sort routines by time
  const sortByTime = (a, b) => a.time.localeCompare(b.time);

  // Build a unified timeline with time slots
  // Collect all unique times
  const allTimes = [...new Set(allRoutines.map(r => r.time))].sort();

  state.children.forEach(child => {
    const column = document.createElement('div');
    column.className = `child-column theme-${child.theme}`;

    // Column header
    column.innerHTML = `
      <div class="child-column__header">
        <span class="child-column__avatar">${child.avatar}</span>
        <span class="child-column__name">${child.name}</span>
        <div class="child-column__stars">
          ⭐ ${child.stars || 0}
        </div>
      </div>
    `;

    const timeline = document.createElement('div');
    timeline.className = 'child-column__timeline';

    // Get routines for this child
    const childRoutines = allRoutines
      .filter(r => r.assignedTo.includes(child.id) && !bridgeRoutineIds.has(r.id))
      .sort(sortByTime);

    if (childRoutines.length === 0 && bridgeRoutines.filter(r => r.assignedTo.includes(child.id)).length === 0) {
      timeline.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🎉</div>
          <div class="empty-state__text">${FR.dashboard.noRoutines}</div>
        </div>
      `;
    } else {
      childRoutines.forEach(routine => {
        timeline.appendChild(renderRoutineCard(routine, child.id));
      });
    }

    column.appendChild(timeline);
    wrapper.appendChild(column);
  });

  // Now insert bridge cards between/across columns
  // Bridge cards are appended after the columns as absolutely positioned elements
  // Alternative: insert them in a separate container that spans all columns
  if (bridgeRoutines.length > 0) {
    const bridgeContainer = document.createElement('div');
    bridgeContainer.className = 'bridge-container';
    bridgeContainer.style.cssText = 'padding: 0 8px;';

    bridgeRoutines.sort(sortByTime).forEach(routine => {
      // Only show if at least one assigned child exists
      const hasChild = routine.assignedTo.some(id => state.children.find(c => c.id === id));
      if (hasChild) {
        bridgeContainer.appendChild(renderBridgeCard(routine));
      }
    });

    // Insert bridge cards after columns in a separate row
    // We restructure the layout: columns on top, bridges in between
    // For simplicity, we append bridges at the bottom of each column's timeline
    // Actually, let's use a different approach: interleave by time

    // Re-render with interleaved approach
    renderInterleavedTimeline(wrapper, state, allRoutines, bridgeRoutines);
  }
}

function renderInterleavedTimeline(wrapper, state, allRoutines, bridgeRoutines) {
  wrapper.innerHTML = '';
  const bridgeRoutineIds = new Set(bridgeRoutines.map(r => r.id));

  // Collect all time slots
  const allTimes = [...new Set(allRoutines.map(r => r.time))].sort();

  // For each time slot, render the appropriate content
  const columnsContainer = document.createElement('div');
  columnsContainer.style.cssText = 'display:flex; flex:1; flex-direction:column; overflow-y:auto; overflow-x:hidden;';

  // Create column headers row
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex; flex-shrink:0;';

  state.children.forEach(child => {
    const header = document.createElement('div');
    header.className = `child-column__header theme-${child.theme}`;
    header.style.cssText = 'flex:1;';
    header.innerHTML = `
      <span class="child-column__avatar">${child.avatar}</span>
      <span class="child-column__name">${child.name}</span>
      <div class="child-column__stars">⭐ ${child.stars || 0}</div>
    `;
    headerRow.appendChild(header);
  });

  columnsContainer.appendChild(headerRow);

  // Scrollable timeline area
  const timelineArea = document.createElement('div');
  timelineArea.style.cssText = 'flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px;';

  allTimes.forEach(time => {
    const timeRoutines = allRoutines.filter(r => r.time === time);
    const bridges = timeRoutines.filter(r => bridgeRoutineIds.has(r.id));
    const individuals = timeRoutines.filter(r => !bridgeRoutineIds.has(r.id));

    // Time label
    const timeLabel = document.createElement('div');
    timeLabel.style.cssText = 'font-size:12px; color:#757575; font-weight:600; padding:4px 0;';
    timeLabel.textContent = time;
    timelineArea.appendChild(timeLabel);

    // Individual routines in columns
    if (individuals.length > 0) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; gap:8px;';

      state.children.forEach(child => {
        const cell = document.createElement('div');
        cell.style.cssText = 'flex:1; min-width:0;';

        const childRoutines = individuals.filter(r => r.assignedTo.includes(child.id));
        childRoutines.forEach(routine => {
          cell.appendChild(renderRoutineCard(routine, child.id));
        });

        row.appendChild(cell);
      });

      timelineArea.appendChild(row);
    }

    // Bridge cards (span full width)
    bridges.forEach(routine => {
      timelineArea.appendChild(renderBridgeCard(routine));
    });
  });

  // Empty state
  if (allTimes.length === 0) {
    timelineArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🎉</div>
        <div class="empty-state__text">${FR.dashboard.noRoutines}</div>
      </div>
    `;
  }

  columnsContainer.appendChild(timelineArea);
  wrapper.appendChild(columnsContainer);
}

function renderEmpty(container) {
  container.innerHTML = '';
  container.className = 'page';

  renderHeader(container);

  const content = document.createElement('div');
  content.className = 'page-content';
  content.innerHTML = `
    <div class="empty-state" style="height:100%;">
      <div class="empty-state__icon">👋</div>
      <div class="empty-state__text" style="margin-bottom:24px;">
        Bienvenue dans MesRoutines !<br>
        Commencez par créer des profils enfants.
      </div>
      <button class="btn btn-primary setup-btn" style="font-size:20px; padding:16px 32px;">
        🔒 Configurer
      </button>
    </div>
  `;
  container.appendChild(content);

  content.querySelector('.setup-btn').addEventListener('click', () => {
    navigate('#/parent');
  });
}
