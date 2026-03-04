// === ID Generation ===
export function generateId(prefix = '') {
  const rand = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${rand}` : rand;
}

// === Date / Time Helpers ===
export const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const DAYS_LONG = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const DAYS_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function todayKey() {
  return formatDateKey(new Date());
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(date) {
  return `${DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDateShort(date) {
  return `${DAYS_SHORT[date.getDay()]}. ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function currentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function isTimeInWindow(routineTime, windowMinutes = 2) {
  const now = new Date();
  const [rH, rM] = routineTime.split(':').map(Number);
  const routineMinutes = rH * 60 + rM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.abs(nowMinutes - routineMinutes) <= windowMinutes;
}

export function formatTime(time) {
  return time; // Already in HH:MM format
}

// === DOM Helpers ===
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  }
  return el;
}

// === Sound (re-exported from sounds.js) ===
export { unlockAudio, playSound } from './sounds.js';

// === Vibration ===
export function vibrate(pattern = [200, 100, 200]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// === French UI Strings ===
export const FR = {
  app: {
    title: 'MesRoutines',
  },
  dashboard: {
    noRoutines: 'Pas de routine aujourd\'hui !',
    allDone: 'Tout est fait, bravo !',
  },
  routine: {
    start: 'C\'est parti !',
    progress: '{done}/{total}',
    completed: 'Terminée !',
    allDone: 'Bravo ! Routine terminée !',
    starsEarned: '{n} étoiles gagnées !',
  },
  notification: {
    hey: 'Hey {name} !',
    heyAll: '{names} !',
    timeFor: 'C\'est l\'heure !',
    timeForAll: 'C\'est l\'heure, tous ensemble !',
    go: 'C\'est parti !',
  },
  parent: {
    title: 'Mode Parent',
    enterPin: 'Code parent',
    wrongPin: 'Code incorrect',
    profiles: 'Profils',
    routines: 'Routines',
    data: 'Données',
    settings: 'Réglages',
    addChild: 'Ajouter un enfant',
    addRoutine: 'Ajouter une routine',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    confirmDelete: 'Vraiment supprimer ?',
    kiosk: 'Mode kiosque',
    kioskDesc: 'Verrouille la tablette sur l\'écran routines',
  },
  profile: {
    name: 'Prénom',
    avatar: 'Avatar',
    theme: 'Couleur',
  },
  routineEditor: {
    name: 'Nom de la routine',
    icon: 'Icône',
    time: 'Heure',
    days: 'Jours',
    allDays: 'Tous les jours',
    weekdays: 'Semaine',
    weekend: 'Week-end',
    assignTo: 'Assigner à',
    steps: 'Étapes',
    addStep: 'Ajouter une étape',
    starsPerCompletion: 'Étoiles par complétion',
  },
  rewards: {
    title: 'Mes étoiles',
    stars: 'étoiles',
    streak: 'jours de suite',
    best: 'record',
    trophies: 'Trophées',
    noTrophies: 'Continue comme ça pour gagner des trophées !',
  },
  data: {
    export: 'Exporter (JSON)',
    import: 'Importer (JSON)',
    reset: 'Réinitialiser',
    resetChild: 'Réinitialiser la progression',
    resetAll: 'Tout réinitialiser',
    confirmReset: 'Toutes les données seront perdues. Continuer ?',
    exportSuccess: 'Données exportées !',
    importSuccess: 'Données importées !',
  },
  nav: {
    routines: 'Routines',
    stars: 'Étoiles',
  },
};
