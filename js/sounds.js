// === Web Audio API Sound Synthesis ===
// All sounds generated programmatically — zero external files

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Unlock audio context on first user interaction
export function unlockAudio() {
  getContext();
}

function playNote(freq, startTime, duration, type = 'sine', volume = 0.3) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// === Sound Effects ===

// Sirène alarme — montée/descente qui se répète
function playSiren(startTime, duration, lowFreq, highFreq, volume = 0.6) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  // Montée-descente en boucle
  const cycles = Math.floor(duration / 0.6);
  for (let i = 0; i < cycles; i++) {
    const t = startTime + i * 0.6;
    osc.frequency.setValueAtTime(lowFreq, t);
    osc.frequency.linearRampToValueAtTime(highFreq, t + 0.3);
    osc.frequency.linearRampToValueAtTime(lowFreq, t + 0.6);
  }

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Notification perso — sirène alarme 3 secondes
export function playNotification() {
  const ctx = getContext();
  const now = ctx.currentTime;
  playSiren(now, 3, 600, 1200, 0.6);
}

// Notification commune — double sirène 4 secondes (plus intense)
export function playNotificationFamily() {
  const ctx = getContext();
  const now = ctx.currentTime;
  playSiren(now, 4, 500, 1400, 0.7);
  playSiren(now, 4, 700, 1000, 0.3); // 2e couche désaccordée
}

// Step complete — petit "pop" satisfaisant
export function playStepComplete() {
  const ctx = getContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// Routine done — fanfare de victoire (arpège ascendant joyeux)
export function playRoutineDone() {
  const ctx = getContext();
  const now = ctx.currentTime;

  const notes = [
    { freq: 523.25, time: 0, dur: 0.15 },    // Do5
    { freq: 587.33, time: 0.1, dur: 0.15 },   // Ré5
    { freq: 659.25, time: 0.2, dur: 0.15 },   // Mi5
    { freq: 783.99, time: 0.3, dur: 0.15 },   // Sol5
    { freq: 1046.5, time: 0.45, dur: 0.5 },   // Do6 (tenu)
  ];

  notes.forEach(n => {
    playNote(n.freq, now + n.time, n.dur, 'sine', 0.3);
  });

  // Accord final
  playNote(523.25, now + 0.45, 0.5, 'triangle', 0.15); // Do5
  playNote(659.25, now + 0.45, 0.5, 'triangle', 0.15); // Mi5
  playNote(783.99, now + 0.45, 0.5, 'triangle', 0.15); // Sol5
}

// Star earned — tintement magique
export function playStarEarned() {
  const ctx = getContext();
  const now = ctx.currentTime;

  // Shimmer effect with high frequencies
  playNote(1318.5, now, 0.15, 'sine', 0.2);       // Mi6
  playNote(1568.0, now + 0.08, 0.15, 'sine', 0.2); // Sol6
  playNote(2093.0, now + 0.16, 0.3, 'sine', 0.25); // Do7

  // Subtle low harmony
  playNote(523.25, now + 0.16, 0.3, 'triangle', 0.1); // Do5
}

// === Play by name (for compatibility) ===
const SOUNDS = {
  'notification': playNotification,
  'notification-family': playNotificationFamily,
  'step-complete': playStepComplete,
  'routine-done': playRoutineDone,
  'star-earned': playStarEarned,
};

export function playSound(name) {
  const fn = SOUNDS[name];
  if (fn) {
    try {
      fn();
    } catch (e) {
      // Silently fail if audio not available
    }
  }
}
