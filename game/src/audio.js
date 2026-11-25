// Dapur Kilat — tiny synthesised sound effects. One clear job: short bleeps
// from the Web Audio API, no audio files and no network. Silent until the
// player first interacts (browsers require a gesture for audio).
let context = null;
let muted = false;

/** Create the audio context on the first user gesture. */
export function unlockAudio() {
  if (context) return;
  try {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (AudioContext) context = new AudioContext();
  } catch {
    context = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function beep(frequency, duration, type, gainValue, when = 0) {
  if (!context || muted) return;
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, context.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + when + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + when);
    oscillator.stop(context.currentTime + when + duration);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

export const sfx = {
  pickup() { beep(520, 0.07, 'sine', 0.12); },
  chop() { beep(220, 0.06, 'square', 0.1); beep(180, 0.06, 'square', 0.08, 0.05); },
  grill() { beep(160, 0.25, 'sawtooth', 0.05); },
  plate() { beep(660, 0.08, 'sine', 0.12); beep(880, 0.1, 'sine', 0.1, 0.07); },
  serve() { beep(784, 0.12, 'sine', 0.14); beep(1046, 0.2, 'sine', 0.14, 0.1); },
  error() { beep(140, 0.15, 'square', 0.08); },
  expire() { beep(196, 0.3, 'sawtooth', 0.1); beep(147, 0.35, 'sawtooth', 0.1, 0.15); },
};
