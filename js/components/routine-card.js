// === Routine Card Component (individual) ===

import { getRoutineProgress, completeRoutine } from '../state.js';
import { isTimeInWindow } from '../utils.js';
import { playSound } from '../sounds.js';

export function renderRoutineCard(routine, childId) {
  const progress = getRoutineProgress(childId, routine.id);
  const isComplete = !!progress.completedAt;
  const isActive = !isComplete && isTimeInWindow(routine.time, 5);

  const card = document.createElement('div');
  card.className = `routine-card${isComplete ? ' routine-card--completed' : ''}${isActive ? ' routine-card--active' : ''}`;

  card.innerHTML = `
    <div class="routine-card__header">
      <span class="routine-card__icon">${routine.icon}</span>
      <span class="routine-card__name">${routine.name}</span>
      <span class="routine-card__time">${routine.time}</span>
    </div>
    <div class="routine-card__status">
      ${isComplete
        ? '✅ Terminée !'
        : `<button class="btn btn-primary routine-card__go">C'est fait !</button>`
      }
    </div>
  `;

  if (!isComplete) {
    card.querySelector('.routine-card__go').addEventListener('click', (e) => {
      e.stopPropagation();
      const result = completeRoutine(childId, routine.id);
      if (result && !result.alreadyDone) {
        playSound('routine-done');
        showCelebration(card, result.starsEarned);
      }
    });
  }

  return card;
}

function showCelebration(card, stars) {
  card.classList.add('routine-card--completed', 'anim-bounce-in');
  card.querySelector('.routine-card__status').innerHTML = '✅ Terminée !';

  // Star burst animation
  const burst = document.createElement('div');
  burst.className = 'star-burst';
  burst.innerHTML = `⭐ +${stars}`;
  card.appendChild(burst);
  setTimeout(() => burst.remove(), 1500);
}
