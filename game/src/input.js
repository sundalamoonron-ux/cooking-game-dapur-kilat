// Dapur Kilat — mouse and keyboard input. One clear job: translate pointer
// and key events on the canvas into world clicks, in canvas coordinates.
import { VIEW } from './config.js';
import { clickAt, keyAction } from './world.js';
import { sfx, toggleMute, unlockAudio } from './audio.js';

/** Convert a pointer event to logical canvas coordinates (1280x720). */
function toCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

/** Wire the canvas and the keyboard to the world. */
export function attachInput(canvas, state) {
  canvas.addEventListener('pointermove', (event) => {
    const at = toCanvas(canvas, event);
    state.mouse.x = at.x;
    state.mouse.y = at.y;
    state.mouse.inside = true;
  });
  canvas.addEventListener('pointerleave', () => {
    state.mouse.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const at = toCanvas(canvas, event);
    state.mouse.x = at.x;
    state.mouse.y = at.y;
    const before = state.hand ? state.hand.id : null;
    clickAt(state, at.x, at.y);
    const after = state.hand ? state.hand.id : null;
    if (before !== after) sfx.pickup();
    else sfx.plate();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
      toggleMute();
      return;
    }
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    unlockAudio();
    keyAction(state, event.key);
  });
}
