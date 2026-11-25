// Dapur Kilat — entry point. One clear job: start the game loop, or render
// one deterministic screenshot scene when the page is opened with ?shot=.
import { VIEW } from './config.js';
import { attachInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, update } from './world.js';
import { makeRandom } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

if (shot) {
  // Screenshot mode: play one scene forward and draw a single frame.
  const staged = stageShot(shot, seed);
  render(ctx, staged.state);
  document.title = 'Dapur Kilat — shot ' + shot;
} else {
  const state = createWorld(makeRandom((Math.random() * 1e9) | 0));
  attachInput(canvas, state);
  let last = performance.now();
  let announced = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, dt);
    render(ctx, state);
    const line = state.screen === 'play'
      ? 'Skor ' + state.score + ', hari ' + state.day + ', ' + state.orders.length + ' pesanan, ' + state.hearts + ' hati.'
      : state.screen === 'title' ? 'Dapur Kilat. Klik untuk mulai.'
      : state.screen === 'dayEnd' ? 'Hari ' + state.day + ' selesai. Skor ' + state.score + '.'
      : 'Shift berakhir. Skor ' + state.score + '.';
    if (line !== announced) {
      announced = line;
      status.textContent = line;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
