// Dapur Kilat — screenshot scenes behind ?shot=start|play|rush|serve.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed, steered by scripted clicks through the same clickAt a player uses,
// so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { BIN_ORDER, RECIPES } from './recipes.js';
import { BURN_SECONDS } from './config.js';
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
    // A dish mid-assembly: bun + patty + chopped lettuce stacked on the
    // plate, a second patty grilling, tomato mid-chop on the board.
    placeBun(state);
    grillPattyOntoPlate(state);
    const slot = freeGrillSlot(state);
    clickBin(state, 'patty');
    clickGrill(state, slot);
    chopOntoPlate(state, 'lettuce');
    clickBin(state, 'tomato');
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
    // Leave a patty on the grill to burn while dishes are served: the
    // rush shot shows the stakes (a burnt patty, "GOSONG!").
    clickBin(state, 'patty');
    clickGrill(state, 0);
    // Serve two quick dishes so the score and combo read as earned.
    buildDish(state, state.orders[0]);
    clickAt(state, serveCentre().x, serveCentre().y);
    buildDish(state, state.orders[0]);
    clickAt(state, serveCentre().x, serveCentre().y);
    // Make sure the left-behind patty has burnt before the photo.
    waitUntil(state, () => state.grill[0] && state.grill[0].t >= BURN_SECONDS, 15);
    // Let the board fill until one order is urgent, then start a third
    // dish: bun on the plate, tomato mid-chop on the board.
    waitUntil(state, () => state.orders.length >= 4
      && state.orders.some((candidate) => candidate.patience < 8), 30);
    placeBun(state);
    clickBin(state, 'tomato');
    clickBoard(state);
    clickBoard(state);
    // Fresh combo popup, honestly earned by the two serves above.
    const plate = plateCentre();
    state.popups.push({
      x: plate.x, y: plate.y - 70,
      text: 'KOMBO x' + state.combo + '!', colour: '#2b7a2e', life: 1.0,
    });
    state.mouse = { x: boardCentre().x, y: boardCentre().y, inside: true };
    return { state, screen: SCREEN_PLAY };
  }

  if (name === 'serve') {
    // Click through the title screen to start day one.
    clickAt(state, 640, 360);
    // Force the first order to the five-item Burger Spesial, so the plate
    // shows the tallest, most complete burger ready to serve.
    const special = RECIPES.find((recipe) => recipe.name === 'Burger Spesial');
    state.orders[0] = {
      id: state.orders[0].id,
      recipe: special,
      patience: 40,
      patienceMax: 40,
      colour: state.orders[0].colour,
      arrivedAt: 0,
    };
    buildDish(state, state.orders[0]);
    // Keep the kitchen busy behind the finished dish: a patty on the
    // grill and lettuce mid-chop on the board.
    const slot = freeGrillSlot(state);
    clickBin(state, 'patty');
    clickGrill(state, slot);
    clickBin(state, 'lettuce');
    clickBoard(state);
    clickBoard(state);
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
