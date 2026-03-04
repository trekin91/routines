// === Routine Card Component (individual) ===

import { getRoutineProgress } from '../state.js';
import { navigate } from '../router.js';
import { isTimeInWindow } from '../utils.js';

export function renderRoutineCard(routine, childId) {
  const progress = getRoutineProgress(childId, routine.id);
  const done = progress.completedSteps.length;
  const total = progress.totalSteps;
  const isComplete = !!progress.completedAt;
  const isActive = !isComplete && isTimeInWindow(routine.time, 5);

  const card = document.createElement('div');
  card.className = `routine-card${isComplete ? ' routine-card--completed' : ''}${isActive ? ' routine-card--active' : ''}`;

  const progressPercent = total > 0 ? (done / total) * 100 : 0;

  card.innerHTML = `
    <div class="routine-card__header">
      <span class="routine-card__icon">${routine.icon}</span>
      <span class="routine-card__name">${routine.name}</span>
      <span class="routine-card__time">${routine.time}</span>
    </div>
    <div class="routine-card__progress">
      <div class="routine-card__progress-fill${isComplete ? ' routine-card__progress-fill--done' : ''}"
           style="width: ${progressPercent}%"></div>
    </div>
    <div class="routine-card__status">
      ${isComplete ? '✅ Terminée !' : `${done}/${total}`}
    </div>
  `;

  card.addEventListener('click', () => {
    navigate(`#/routine/${routine.id}/${childId}`);
  });

  return card;
}
