// === Bridge Card Component (shared routine) ===

import { getRoutineProgress, getChild } from '../state.js';
import { navigate } from '../router.js';
import { isTimeInWindow } from '../utils.js';

export function renderBridgeCard(routine) {
  const isActive = isTimeInWindow(routine.time, 5);

  const card = document.createElement('div');
  card.className = `bridge-card${isActive ? ' anim-glow' : ''}`;

  // Check completion for all children
  const childStatuses = routine.assignedTo.map(childId => {
    const child = getChild(childId);
    const progress = getRoutineProgress(childId, routine.id);
    const done = progress.completedSteps.length;
    const total = progress.totalSteps;
    const isComplete = !!progress.completedAt;
    return { child, done, total, isComplete };
  });

  const allComplete = childStatuses.every(s => s.isComplete);

  card.innerHTML = `
    <div class="bridge-card__header" ${allComplete ? 'style="opacity:0.6"' : ''}>
      <span class="bridge-card__icon">${routine.icon}</span>
      <span class="bridge-card__name">${routine.name}</span>
      <span class="bridge-card__time">${routine.time}</span>
      ${allComplete ? '<span>✅</span>' : ''}
    </div>
    <div class="bridge-card__children">
      ${childStatuses.map(({ child, done, total, isComplete }) => `
        <div class="bridge-card__child" data-child="${child.id}" data-routine="${routine.id}">
          <span class="bridge-card__child-avatar">${child.avatar}</span>
          <span class="bridge-card__child-name">${child.name}</span>
          <span class="bridge-card__child-status">
            ${isComplete ? '✅' : `${done}/${total}`}
          </span>
        </div>
      `).join('')}
    </div>
  `;

  // Each child zone is clickable independently
  card.querySelectorAll('.bridge-card__child').forEach(zone => {
    zone.addEventListener('click', () => {
      const childId = zone.dataset.child;
      const routineId = zone.dataset.routine;
      navigate(`#/routine/${routineId}/${childId}`);
    });
  });

  return card;
}
