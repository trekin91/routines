// === State Management ===
// Single source of truth backed by localStorage

const STORAGE_KEY = 'mesroutines_data';

let _state = null;
let _listeners = [];

function createDefaultState() {
  return {
    version: 1,
    parentPin: '1234',
    children: [],
    routines: [],
    settings: {
      notificationSound: true,
      vibration: true,
      kioskMode: false,
    },
  };
}

// === Load / Save ===

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _state = raw ? JSON.parse(raw) : createDefaultState();
  } catch {
    _state = createDefaultState();
  }
  return _state;
}

export function getState() {
  if (!_state) loadState();
  return _state;
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  _listeners.forEach(fn => fn(_state));
}

export function replaceState(newState) {
  _state = newState;
  saveState();
}

// === Event System ===

export function onStateChange(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter(f => f !== fn);
  };
}

// === Children CRUD ===

export function addChild(child) {
  _state.children.push(child);
  saveState();
}

export function updateChild(childId, updates) {
  const child = _state.children.find(c => c.id === childId);
  if (child) {
    Object.assign(child, updates);
    saveState();
  }
}

export function deleteChild(childId) {
  _state.children = _state.children.filter(c => c.id !== childId);
  // Also remove from routine assignments
  _state.routines.forEach(r => {
    r.assignedTo = r.assignedTo.filter(id => id !== childId);
  });
  saveState();
}

export function getChild(childId) {
  return getState().children.find(c => c.id === childId);
}

// === Routines CRUD ===

export function addRoutine(routine) {
  _state.routines.push(routine);
  saveState();
}

export function updateRoutine(routineId, updates) {
  const routine = _state.routines.find(r => r.id === routineId);
  if (routine) {
    Object.assign(routine, updates);
    saveState();
  }
}

export function deleteRoutine(routineId) {
  _state.routines = _state.routines.filter(r => r.id !== routineId);
  saveState();
}

export function getRoutine(routineId) {
  return getState().routines.find(r => r.id === routineId);
}

// === Today's Routines ===

export function getTodayRoutines(childId) {
  const state = getState();
  const today = new Date().getDay(); // 0=Sun
  return state.routines.filter(r =>
    r.assignedTo.includes(childId) && r.days.includes(today)
  );
}

export function getAllTodayRoutines() {
  const state = getState();
  const today = new Date().getDay();
  return state.routines.filter(r => r.days.includes(today));
}

// === Routine Progress ===

import { todayKey } from './utils.js';

function ensureHistory(child, dateKey, routineId, totalSteps) {
  if (!child.history) child.history = {};
  if (!child.history[dateKey]) {
    child.history[dateKey] = { routines: {}, allCompleted: false };
  }
  if (!child.history[dateKey].routines[routineId]) {
    child.history[dateKey].routines[routineId] = {
      completedSteps: [],
      totalSteps,
      completedAt: null,
      starsEarned: 0,
    };
  }
}

export function toggleStep(childId, routineId, stepIndex) {
  const child = getChild(childId);
  const routine = getRoutine(routineId);
  if (!child || !routine) return null;

  const dateKey = todayKey();
  ensureHistory(child, dateKey, routineId, routine.steps.length);

  const progress = child.history[dateKey].routines[routineId];
  const idx = progress.completedSteps.indexOf(stepIndex);

  if (idx === -1) {
    progress.completedSteps.push(stepIndex);
    progress.completedSteps.sort((a, b) => a - b);
  } else {
    progress.completedSteps.splice(idx, 1);
  }

  // Check if routine is complete
  const isComplete = progress.completedSteps.length === routine.steps.length;
  if (isComplete && !progress.completedAt) {
    progress.completedAt = new Date().toISOString();
    progress.starsEarned = routine.starsPerCompletion || 3;
    child.stars = (child.stars || 0) + progress.starsEarned;
    updateStreaks(child);
    checkTrophies(child);
  } else if (!isComplete && progress.completedAt) {
    // Unchecked a step after completing — remove stars
    child.stars = Math.max(0, (child.stars || 0) - progress.starsEarned);
    progress.completedAt = null;
    progress.starsEarned = 0;
    updateStreaks(child);
  }

  // Check if all routines for today are complete
  const todayRoutines = getTodayRoutines(childId);
  child.history[dateKey].allCompleted = todayRoutines.every(r => {
    const rp = child.history[dateKey]?.routines[r.id];
    return rp && rp.completedAt;
  });

  saveState();
  return { isComplete, starsEarned: progress.starsEarned };
}

// Complete an entire routine at once (no checklist)
export function completeRoutine(childId, routineId) {
  const child = getChild(childId);
  const routine = getRoutine(routineId);
  if (!child || !routine) return null;

  const dateKey = todayKey();
  ensureHistory(child, dateKey, routineId, routine.steps.length);

  const progress = child.history[dateKey].routines[routineId];

  // Already completed today
  if (progress.completedAt) return { alreadyDone: true, starsEarned: 0 };

  // Mark all steps as completed
  progress.completedSteps = routine.steps.map((_, i) => i);
  progress.completedAt = new Date().toISOString();
  progress.starsEarned = routine.starsPerCompletion || 3;
  child.stars = (child.stars || 0) + progress.starsEarned;
  updateStreaks(child);
  checkTrophies(child);

  // Check if all routines for today are complete
  const todayRoutines = getTodayRoutines(childId);
  child.history[dateKey].allCompleted = todayRoutines.every(r => {
    const rp = child.history[dateKey]?.routines[r.id];
    return rp && rp.completedAt;
  });

  saveState();
  return { alreadyDone: false, starsEarned: progress.starsEarned };
}

export function getRoutineProgress(childId, routineId) {
  const child = getChild(childId);
  const routine = getRoutine(routineId);
  if (!child || !routine) return { completedSteps: [], totalSteps: 0 };

  const dateKey = todayKey();
  const progress = child.history?.[dateKey]?.routines?.[routineId];
  return {
    completedSteps: progress?.completedSteps || [],
    totalSteps: routine.steps.length,
    completedAt: progress?.completedAt || null,
    starsEarned: progress?.starsEarned || 0,
  };
}

export function isRoutineCompletedToday(childId, routineId) {
  const progress = getRoutineProgress(childId, routineId);
  return !!progress.completedAt;
}

// === Streaks ===

function updateStreaks(child) {
  const state = getState();
  const routines = state.routines.filter(r => r.assignedTo.includes(child.id));

  let streak = 0;
  const date = new Date();
  // Start from yesterday (today might not be complete yet)
  // Unless today is already allCompleted
  const todayStr = todayKey();
  if (child.history?.[todayStr]?.allCompleted) {
    streak = 1;
  }

  date.setDate(date.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();

    // Check if any routines were scheduled this day
    const dayRoutines = routines.filter(r => r.days.includes(dayOfWeek));
    if (dayRoutines.length === 0) {
      date.setDate(date.getDate() - 1);
      continue; // Skip days with no routines
    }

    const dayHistory = child.history?.[dateStr];
    if (!dayHistory || !dayHistory.allCompleted) break;

    streak++;
    date.setDate(date.getDate() - 1);
  }

  if (!child.streaks) child.streaks = { current: 0, best: 0 };
  child.streaks.current = streak;
  if (streak > child.streaks.best) {
    child.streaks.best = streak;
  }
}

// === Trophies ===

const TROPHY_DEFINITIONS = [
  { id: 'first_routine', condition: c => (c.stars || 0) > 0, name: 'Première routine !', icon: '🌟' },
  { id: 'streak_3', condition: c => c.streaks?.current >= 3, name: '3 jours de suite !', icon: '🔥' },
  { id: 'streak_7', condition: c => c.streaks?.current >= 7, name: 'Une semaine parfaite !', icon: '🏆' },
  { id: 'streak_14', condition: c => c.streaks?.current >= 14, name: '2 semaines de champion !', icon: '👑' },
  { id: 'streak_30', condition: c => c.streaks?.current >= 30, name: 'Un mois incroyable !', icon: '💎' },
  { id: 'stars_10', condition: c => (c.stars || 0) >= 10, name: '10 étoiles !', icon: '⭐' },
  { id: 'stars_50', condition: c => (c.stars || 0) >= 50, name: '50 étoiles !', icon: '🌟' },
  { id: 'stars_100', condition: c => (c.stars || 0) >= 100, name: '100 étoiles !', icon: '💯' },
  { id: 'stars_500', condition: c => (c.stars || 0) >= 500, name: 'Super star !', icon: '🤩' },
];

function checkTrophies(child) {
  if (!child.trophies) child.trophies = [];
  const existingIds = new Set(child.trophies.map(t => t.id));

  for (const def of TROPHY_DEFINITIONS) {
    if (!existingIds.has(def.id) && def.condition(child)) {
      child.trophies.push({
        id: def.id,
        name: def.name,
        icon: def.icon,
        earnedAt: new Date().toISOString().slice(0, 10),
      });
    }
  }
}

// === Settings ===

export function updateSettings(updates) {
  Object.assign(_state.settings, updates);
  saveState();
}

export function getSettings() {
  return getState().settings;
}

// === PIN ===

export function checkPin(pin) {
  return getState().parentPin === pin;
}

export function updatePin(newPin) {
  _state.parentPin = newPin;
  saveState();
}

// === Reset ===

export function resetChildProgress(childId) {
  const child = getChild(childId);
  if (child) {
    child.stars = 0;
    child.streaks = { current: 0, best: 0 };
    child.trophies = [];
    child.history = {};
    saveState();
  }
}

export function resetAll() {
  _state = createDefaultState();
  saveState();
}

// === Export / Import ===

export function exportState() {
  return JSON.stringify(getState(), null, 2);
}

export function importState(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.version || !Array.isArray(data.children) || !Array.isArray(data.routines)) {
    throw new Error('Format de données invalide');
  }
  replaceState(data);
}
