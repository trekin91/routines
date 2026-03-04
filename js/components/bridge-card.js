// === Bridge Card Component (shared routine) ===

import { getRoutineProgress, getChild, completeRoutine } from '../state.js';
import { isTimeInWindow } from '../utils.js';
import { playSound } from '../sounds.js';

export function renderBridgeCard(routine) {
  const isActive = isTimeInWindow(routine.time, 5);

  const card = document.createElement('div');
  card.className = `bridge-card${isActive ? ' anim-glow' : ''}`;

  // Check completion for all children
  const childStatuses = routine.assignedTo.map(childId => {
    const child = getChild(childId);
    const progress = getRoutineProgress(childId, routine.id);
    const isComplete = !!progress.completedAt;
    return { child, isComplete };
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
      ${childStatuses.map(({ child, isComplete }) => `
        <div class="bridge-card__child" data-child="${child.id}" data-routine="${routine.id}">
          <span class="bridge-card__child-avatar">${child.avatar}</span>
          <span class="bridge-card__child-name">${child.name}</span>
          <span class="bridge-card__child-status">
            ${isComplete
              ? '✅'
              : `<button class="btn btn-primary btn-sm bridge-card__go">C'est fait !</button>`
            }
          </span>
        </div>
      `).join('')}
    </div>
  `;

  // Each child zone is clickable independently
  card.querySelectorAll('.bridge-card__go').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const zone = btn.closest('.bridge-card__child');
      const childId = zone.dataset.child;
      const routineId = zone.dataset.routine;

      const result = completeRoutine(childId, routineId);
      if (result && !result.alreadyDone) {
        playSound('routine-done');
        // Update this child's status
        zone.querySelector('.bridge-card__child-status').innerHTML = '✅';

        // Star burst
        const burst = document.createElement('div');
        burst.className = 'star-burst';
        burst.innerHTML = `⭐ +${result.starsEarned}`;
        zone.appendChild(burst);
        setTimeout(() => burst.remove(), 1500);

        // Check if all children are now done
        const allDone = [...card.querySelectorAll('.bridge-card__child-status')]
          .every(s => s.textContent.trim() === '✅');
        if (allDone) {
          card.querySelector('.bridge-card__header').style.opacity = '0.6';
          const headerSpan = document.createElement('span');
          headerSpan.textContent = '✅';
          card.querySelector('.bridge-card__header').appendChild(headerSpan);
        }
      }
    });
  });

  return card;
}
