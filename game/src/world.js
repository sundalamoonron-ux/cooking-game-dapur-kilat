// Dapur Kilat — the game state and its rules. One clear job: what happens
// when time passes and when the player clicks something. The renderer only
// draws this state; the input layer only calls clickAt/keyAction.
import {
  BINS, BOARD, CHOPS_NEEDED, GRILL_SECONDS, BURN_SECONDS, GRILL_SLOTS,
  PLATE, SERVE_BUTTON, SHIFT_SECONDS, STATIONS, TRASH,
  SCORE_BASE, SCORE_PER_INGREDIENT, SCORE_PATIENCE_BONUS, COMBO_STEP,
} from './config.js';
import {
  BIN_ORDER, INGREDIENTS, makeOrder, orderIntervalSeconds, sameMultiset,
} from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DAY_END = 'dayEnd';
export const SCREEN_OVER = 'over';

const MAX_HEARTS = 3;
const MAX_ORDERS = 4;

/** A fresh world: title screen, an empty kitchen, day one waiting. */
export function createWorld(random) {
  const state = {
    random,
    screen: SCREEN_TITLE,
    paused: false,
    day: 1,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    shiftLeft: SHIFT_SECONDS,
    time: 0,
    orders: [],
    nextOrderIn: 2,
    nextOrderId: 0,
    hand: null,
    board: null,
    grill: [null, null],
    plate: [],
    popups: [],
    shake: 0,
    serveFlash: 0,
    message: { text: '', life: 0 },
    served: 0,
    expired: 0,
    dayBonus: 0,
    mouse: { x: 640, y: 360, inside: false },
  };
  return state;
}

/** Start (or restart) a day: fresh orders, fresh stations, full patience. */
export function startDay(state) {
  state.screen = SCREEN_PLAY;
  state.shiftLeft = SHIFT_SECONDS;
  state.orders = [];
  state.nextOrderIn = 1.5;
  state.hand = null;
  state.board = null;
  state.grill = [null, null];
  state.plate = [];
  state.popups = [];
  state.serveFlash = 0;
  state.message = { text: 'Hari ' + state.day + ': layani pelanggan secepatnya!', life: 3 };
  spawnOrder(state);
  spawnOrder(state);
}

function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const order = makeOrder(state.random, state.day, state.nextOrderId);
  state.nextOrderId += 1;
  state.orders.push(order);
}

function announce(state, text, life = 2.2) {
  state.message = { text, life };
}

function popup(state, x, y, text, colour = '#2b2118') {
  state.popups.push({ x, y, text, colour, life: 1.4 });
}

function loseHeart(state, order) {
  state.hearts -= 1;
  state.combo = 0;
  state.expired += 1;
  const ticket = ticketRect(state.orders.indexOf(order));
  popup(state, ticket.x + ticket.width / 2, ticket.y + ticket.height + 18, 'Pesanan hangus!', '#c0392b');
  announce(state, 'Pesanan ' + order.recipe.name + ' hangus! Hati -1');
  if (state.hearts <= 0) {
    state.screen = SCREEN_OVER;
  }
}

function serveOrder(state, order) {
  const items = order.recipe.items.length;
  const patienceLeft = Math.max(0, order.patience / order.patienceMax);
  const points = Math.round(
    (SCORE_BASE + SCORE_PER_INGREDIENT * items + SCORE_PATIENCE_BONUS * patienceLeft)
    * (1 + state.combo * COMBO_STEP),
  );
  state.score += points;
  state.coins += 4 + items * 2;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  state.serveFlash = 0.6;
  const ticket = ticketRect(state.orders.indexOf(order));
  popup(state, ticket.x + ticket.width / 2, ticket.y + ticket.height + 18, '+' + points, '#2b7a2e');
  popup(state, PLATE.x, PLATE.y - 70, 'Tersaji!', '#2b7a2e');
  state.orders.splice(state.orders.indexOf(order), 1);
  state.plate = [];
  if (state.combo >= 3) announce(state, 'Kombo x' + state.combo + '! Terus!');
}

/** Advance the world by `dt` seconds of real play. */
export function update(state, dt) {
  state.time += dt;
  if (state.screen !== SCREEN_PLAY || state.paused) {
    for (const pop of state.popups) pop.life -= dt;
    state.popups = state.popups.filter((pop) => pop.life > 0);
    return;
  }
  if (state.shake > 0) state.shake -= dt;
  if (state.serveFlash > 0) state.serveFlash -= dt;
  if (state.message.life > 0) state.message.life -= dt;
  for (const pop of state.popups) {
    pop.life -= dt;
    pop.y -= 28 * dt;
  }
  state.popups = state.popups.filter((pop) => pop.life > 0);

  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.dayBonus = 150 + state.day * 50;
    state.score += state.dayBonus;
    state.screen = SCREEN_DAY_END;
    return;
  }

  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = orderIntervalSeconds(state.day);
  }

  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) loseHeart(state, order);
    if (state.screen !== SCREEN_PLAY) return;
  }

  for (const slot of state.grill) {
    if (slot) slot.t += dt;
  }
}

// --- hit-testing helpers ---------------------------------------------------

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function binRect(index) {
  const x = BINS.firstX + index * (BINS.width + BINS.gap);
  return { x, y: BINS.y, width: BINS.width, height: BINS.height };
}

export function ticketRect(index) {
  return {
    x: BOARD.x + index * (BOARD.width + BOARD.gap),
    y: BOARD.y,
    width: BOARD.width,
    height: BOARD.height,
  };
}

function grillSlotRect(index) {
  const slot = GRILL_SLOTS[index];
  return { x: slot.x - slot.r, y: slot.y - slot.r, width: slot.r * 2, height: slot.r * 2 };
}

function centre(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export const binCentre = (index) => centre(binRect(index));
export const boardCentre = () => centre(STATIONS.board);
export const grillCentre = (index) => ({ x: GRILL_SLOTS[index].x, y: GRILL_SLOTS[index].y });
export const plateCentre = () => ({ x: PLATE.x, y: PLATE.y });
export const serveCentre = () => centre(SERVE_BUTTON);
export const trashCentre = () => centre(TRASH);
export const ticketCentre = (index) => centre(ticketRect(index));

/** Is this carried item ready to go on a plate? */
export function itemReady(item) {
  if (!item) return false;
  const needs = INGREDIENTS[item.id].needs;
  if (needs === 'none') return true;
  if (needs === 'chop') return item.state === 'chopped';
  if (needs === 'grill') return item.state === 'cooked';
  return false;
}

function plateIds(state) {
  return state.plate.map((item) => item.id);
}

function tryServe(state, orderIndex) {
  if (state.plate.length === 0) {
    announce(state, 'Piring masih kosong — susun hidangan dulu!');
    state.shake = 0.25;
    return false;
  }
  const order = orderIndex == null
    ? state.orders.find((candidate) => sameMultiset(plateIds(state), candidate.recipe.items))
    : state.orders[orderIndex];
  if (!order) {
    announce(state, 'Belum ada pesanan yang cocok dengan piring ini!');
    state.shake = 0.3;
    return false;
  }
  if (orderIndex != null && !sameMultiset(plateIds(state), order.recipe.items)) {
    announce(state, 'Pesanan itu minta ' + order.recipe.items.map((id) => INGREDIENTS[id].name).join(' + ') + '!');
    state.shake = 0.3;
    return false;
  }
  serveOrder(state, order);
  return true;
}

/** Handle a click (or tap) at canvas coordinates (x, y). */
export function clickAt(state, x, y) {
  if (state.screen === SCREEN_TITLE) {
    state.day = 1;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = MAX_HEARTS;
    state.served = 0;
    state.expired = 0;
    startDay(state);
    return;
  }
  if (state.screen === SCREEN_DAY_END) {
    state.day += 1;
    startDay(state);
    return;
  }
  if (state.screen === SCREEN_OVER) {
    state.day = 1;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = MAX_HEARTS;
    state.served = 0;
    state.expired = 0;
    startDay(state);
    return;
  }
  if (state.paused) return;

  // Order tickets: serve that exact order when the plate matches it.
  for (let i = 0; i < state.orders.length; i += 1) {
    if (inside(x, y, ticketRect(i))) {
      tryServe(state, i);
      return;
    }
  }

  // Serve button: serve the first order the plate matches.
  if (inside(x, y, SERVE_BUTTON)) {
    tryServe(state, null);
    return;
  }

  // Trash: throw away what the hand holds (burnt patties included).
  if (inside(x, y, TRASH)) {
    if (state.hand) {
      state.hand = null;
      announce(state, 'Dibuang ke tempat sampah.');
    } else if (state.board) {
      state.board = null;
      announce(state, 'Bahan di talenan dibuang.');
    } else {
      announce(state, 'Tidak ada yang dibuang.');
    }
    return;
  }

  // Ingredient bins: pick up one raw ingredient when the hand is empty.
  for (let i = 0; i < BIN_ORDER.length; i += 1) {
    if (inside(x, y, binRect(i))) {
      if (state.hand) {
        announce(state, 'Tangan penuh! Letakkan dulu bahan yang dibawa.');
        return;
      }
      const id = BIN_ORDER[i];
      state.hand = { id, state: 'raw', chops: 0, t: 0 };
      return;
    }
  }

  // Chopping board: place a choppable ingredient, or chop what lies there.
  if (inside(x, y, STATIONS.board)) {
    if (state.board) {
      state.board.chops += 1;
      if (state.board.chops >= CHOPS_NEEDED) {
        state.board.state = 'chopped';
        state.hand = state.board;
        state.board = null;
        announce(state, INGREDIENTS[state.hand.id].name + ' sudah dipotong!');
      }
      return;
    }
    if (state.hand && INGREDIENTS[state.hand.id].needs === 'chop' && state.hand.state === 'raw') {
      state.board = state.hand;
      state.hand = null;
      announce(state, 'Klik talenan 3x untuk memotong!');
      return;
    }
    if (state.hand) announce(state, 'Bahan ini tidak perlu dipotong.');
    return;
  }

  // Grill: place a raw patty, or pick up a cooked (or burnt) one.
  for (let i = 0; i < state.grill.length; i += 1) {
    if (inside(x, y, grillSlotRect(i))) {
      const slot = state.grill[i];
      if (slot) {
        if (slot.t >= GRILL_SECONDS) {
          state.hand = { id: 'patty', state: slot.t >= BURN_SECONDS ? 'burnt' : 'cooked', chops: 0, t: slot.t };
          state.grill[i] = null;
          if (state.hand.state === 'burnt') announce(state, 'Gosong! Buang ke tempat sampah.');
          return;
        }
        announce(state, 'Daging masih dimasak… tunggu sebentar.');
        return;
      }
      if (state.hand && state.hand.id === 'patty' && state.hand.state === 'raw') {
        state.grill[i] = { id: 'patty', state: 'raw', chops: 0, t: 0 };
        state.hand = null;
        return;
      }
      if (state.hand) announce(state, 'Hanya daging mentah yang bisa dipanggang.');
      return;
    }
  }

  // Plating station: add a ready ingredient, or take the top one back.
  if (inside(x, y, STATIONS.plate)) {
    if (state.hand) {
      if (state.plate.length === 0 && state.hand.id !== 'bun') {
        announce(state, 'Mulai susunan dengan roti!');
        state.shake = 0.2;
        return;
      }
      if (!itemReady(state.hand)) {
        const needs = INGREDIENTS[state.hand.id].needs;
        announce(state, needs === 'chop' ? 'Potong dulu di talenan!' : 'Panggang dulu di panggangan!');
        state.shake = 0.2;
        return;
      }
      state.plate.push(state.hand);
      state.hand = null;
      return;
    }
    if (state.plate.length > 0) {
      state.hand = state.plate.pop();
      announce(state, 'Diambil kembali dari piring.');
    }
    return;
  }
}

/** Keyboard shortcuts, mapped onto the same clicks a mouse would make. */
export function keyAction(state, key) {
  if (key === 'p' || key === 'P' || key === 'Escape') {
    if (state.screen === SCREEN_PLAY) state.paused = !state.paused;
    return;
  }
  if (state.screen === SCREEN_TITLE || state.screen === SCREEN_DAY_END || state.screen === SCREEN_OVER) {
    if (key === 'Enter' || key === ' ') clickAt(state, 640, 360);
    return;
  }
  if (state.paused) return;
  if (key >= '1' && key <= '5') {
    const at = binCentre(Number(key) - 1);
    clickAt(state, at.x, at.y);
    return;
  }
  if (key === 'c' || key === 'C') {
    const at = boardCentre();
    clickAt(state, at.x, at.y);
    return;
  }
  if (key === 'g' || key === 'G') {
    const at = grillCentre(0);
    clickAt(state, at.x, at.y);
    return;
  }
  if (key === 'v' || key === 'V') {
    const at = plateCentre();
    clickAt(state, at.x, at.y);
    return;
  }
  if (key === 'x' || key === 'X' || key === 'Backspace') {
    const at = trashCentre();
    clickAt(state, at.x, at.y);
    return;
  }
  if (key === ' ' || key === 'Enter') {
    const at = serveCentre();
    clickAt(state, at.x, at.y);
  }
}
