// Dapur Kilat — screenshot scenes behind ?shot=start|play|rush|serve.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed, steered by scripted clicks through the same clickAt a player uses,
// so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { BIN_ORDER } from './recipes.js';
import { SCREEN_PLAY } from './world.js';
import {
  binCentre, boardCentre, clickAt, createWorld, grillCentre, plateCentre,
  serveCentre, startDay, update,
} from './world.js';
import { makeRandom } from './random.js';

const STEP = 1 / 60;

/** Advance the world by `seconds`, in fixed steps. */
function waitSeconds(state, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    update(state, STEP);
    if (state.screen !== SCREEN_PLAY) break;
  }
}

/** Advance until `condition` holds, or `maxSeconds` pass. */
function waitUntil(state, condition, maxSeconds) {
  let waited = 0;
  while (!condition() && waited < maxSeconds && state.screen === SCREEN_PLAY) {
    update(state, STEP);
    waited += STEP;
  }
  return condition();
}

function clickBin(state, id) {
  const at = binCentre(BIN_ORDER.indexOf(id));
  clickAt(state, at.x, at.y);
}

function clickBoard(state) {
  const at = boardCentre();
  clickAt(state, at.x, at.y);
}

function clickGrill(state, slot) {
  const at = grillCentre(slot);
  clickAt(state, at.x, at.y);
}

function clickPlate(state) {
  const at = plateCentre();
  clickAt(state, at.x, at.y);
}

function freeGrillSlot(state) {
  return state.grill[0] === null ? 0 : 1;
}

/** Put a bun on the plate first, as every recipe starts with one. */
function placeBun(state) {
  clickBin(state, 'bun');
  clickPlate(state);
}

/** Grill one patty and place it on the plate. */
function grillPattyOntoPlate(state) {
  const slot = freeGrillSlot(state);
  clickBin(state, 'patty');
  clickGrill(state, slot);
  waitUntil(state, () => state.grill[slot] && state.grill[slot].t >= 7.3, 12);
  clickGrill(state, slot);
  clickPlate(state);
}

/** Chop one vegetable and place it on the plate. */
function chopOntoPlate(state, id) {
  clickBin(state, id);
  clickBoard(state);
  clickBoard(state);
  clickBoard(state);
  clickBoard(state);
  clickPlate(state);
}

/** Add one recipe item to the plate, doing whatever work it needs. */
function addRecipeItem(state, id) {
  if (id === 'bun') placeBun(state);
  else if (id === 'patty') grillPattyOntoPlate(state);
  else if (id === 'lettuce' || id === 'tomato') chopOntoPlate(state, id);
  else {
    clickBin(state, id);
    clickPlate(state);
  }
}

/** Build the whole dish for `order` on the plate, without serving it. */
function buildDish(state, order) {
  for (const id of order.recipe.items) {
    addRecipeItem(state, id);
    if (state.screen !== SCREEN_PLAY) return;
  }
}

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * Scenes: start (early game), play (dish mid-assembly), rush (busy day two),
 * serve (a finished dish ready to serve). Any other name is start.
 */
export function stageShot(name, seed = 1) {
  const state = createWorld(makeRandom(seed));
  state.mouse = { x: 640, y: 360, inside: true };

  if (name === 'play') {
    // Click through the title screen to start day one.
    clickAt(state, 640, 360);
    // Bun + patty on the plate, a second patty grilling, lettuce chopped
    // and carried toward the plate: a dish mid-assembly.
    placeBun(state);
    grillPattyOntoPlate(state);
    const slot = freeGrillSlot(state);
    clickBin(state, 'patty');
    clickGrill(state, slot);
    clickBin(state, 'lettuce');
    clickBoard(state);
    clickBoard(state);
    clickBoard(state);
    clickBoard(state);
    waitSeconds(state, 2.5);
    state.mouse = { x: plateCentre().x, y: plateCentre().y - 40, inside: true };
    return { state, screen: SCREEN_PLAY };
  }

  if (name === 'rush') {
    // Start straight into day two: faster orders, harder recipes.
    state.day = 2;
    startDay(state);
    const order = state.orders[0];
    // Serve one quick dish first so the score and combo read as earned.
    buildDish(state, order);
    const serve = serveCentre();
    clickAt(state, serve.x, serve.y);
    // Then start a second dish and let the board fill up: orders arrive,
    // the first one's patience runs low, the grill stays busy.
    placeBun(state);
    grillPattyOntoPlate(state);
    const slot = freeGrillSlot(state);
    clickBin(state, 'patty');
    clickGrill(state, slot);
    clickBin(state, 'tomato');
    clickBoard(state);
    waitUntil(state, () => state.orders.length >= 3
      && state.orders.some((candidate) => candidate.patience < 12), 45);
    state.mouse = { x: boardCentre().x, y: boardCentre().y, inside: true };
    return { state, screen: SCREEN_PLAY };
  }

  if (name === 'serve') {
    // Click through the title screen to start day one.
    clickAt(state, 640, 360);
    const order = state.orders[0];
    buildDish(state, order);
    // A finished burger on the plate, the serve button glowing green,
    // the matching ticket on the board: a plate ready to serve.
    state.mouse = { x: serveCentre().x, y: serveCentre().y, inside: true };
    return { state, screen: SCREEN_PLAY };
  }

  // start: early game — bun on the plate, patty on the grill, lettuce
  // on the board mid-chop, two fresh orders on the board.
  clickAt(state, 640, 360);
  placeBun(state);
  clickBin(state, 'patty');
  clickGrill(state, 0);
  clickBin(state, 'lettuce');
  clickBoard(state);
  clickBoard(state);
  waitSeconds(state, 3);
  state.mouse = { x: boardCentre().x, y: boardCentre().y, inside: true };
  return { state, screen: SCREEN_PLAY };
}
