// Dapur Kilat — everything the player sees. One clear job: draw the world
// state on a canvas, including the kitchen, the order board, the food and
// the screens. No game rules live here.
import {
  BINS, BOARD, COLORS, GRILL_SLOTS, PLATE, SERVE_BUTTON, STATIONS,
  TRASH, VIEW, GRILL_SECONDS, BURN_SECONDS, SHIFT_SECONDS,
} from './config.js';
import { BIN_ORDER, INGREDIENTS, recipeLabel } from './recipes.js';
import { drawCustomerFace } from './customers.js';
import {
  SCREEN_DAY_END, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE,
  binRect, itemReady, ticketRect,
} from './world.js';

const FONT = 'Trebuchet MS, Verdana, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = weight + ' ' + size + 'px ' + FONT;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

// --- food ------------------------------------------------------------------

/** Draw one ingredient at (x, y), centred, at the given width. */
export function drawIngredient(ctx, id, state, x, y, width) {
  const s = width / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (id === 'bun') {
    ctx.fillStyle = INGREDIENTS.bun.bottom;
    ctx.beginPath();
    ctx.ellipse(0, 12, 46, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.bun.top;
    ctx.beginPath();
    ctx.arc(0, 10, 44, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.bun.seed;
    for (const [sx, sy] of [[-22, -18], [0, -30], [22, -18], [-10, -8], [12, -8]]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    const colour = state === 'burnt' ? INGREDIENTS.patty.burnt
      : state === 'cooked' ? INGREDIENTS.patty.cooked : INGREDIENTS.patty.raw;
    ctx.fillStyle = colour;
    roundRect(ctx, -48, -12, 96, 24, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (const [sx, sy] of [[-28, -3], [0, 4], [28, -4]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state === 'burnt') {
      ctx.fillStyle = 'rgba(120,120,120,0.5)';
      ctx.beginPath();
      ctx.arc(-14, -22, 7, 0, Math.PI * 2);
      ctx.arc(6, -28, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? INGREDIENTS.lettuce.chopped : INGREDIENTS.lettuce.raw;
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const px = -48 + i * 16;
      const py = i % 2 === 0 ? -10 : 6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.quadraticCurveTo(px - 8, py - 16, px, py);
    }
    ctx.lineTo(48, 14);
    ctx.lineTo(-48, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = INGREDIENTS.tomato.raw;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f08a76';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b7a8';
    for (const a of [0, 1.05, 2.1, 3.15, 4.2, 5.25]) {
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 13, Math.sin(a) * 13, 5, 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state === 'chopped') {
      ctx.strokeStyle = '#b23a2c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-30, -8);
      ctx.lineTo(30, 8);
      ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = INGREDIENTS.cheese.top;
    ctx.beginPath();
    ctx.moveTo(-48, -14);
    ctx.lineTo(48, -14);
    ctx.lineTo(48, 10);
    ctx.lineTo(30, 10);
    ctx.lineTo(22, 22);
    ctx.lineTo(12, 10);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-14, 24);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-48, 10);
    ctx.closePath();
    ctx.fill();
    // Holes, so the slice reads as cheese and not a plain yellow block.
    ctx.fillStyle = '#d9a51c';
    for (const [hx, hy, hr] of [[-28, -4, 5], [8, -6, 4], [28, 0, 5], [-6, 4, 3]]) {
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// --- kitchen ----------------------------------------------------------------

/** A frying pan hanging from the rail at (x, railY): hook, handle, pan. */
function drawHangingPan(ctx, x, railY) {
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, railY);
  ctx.lineTo(x, railY + 8);
  ctx.stroke();
  ctx.fillStyle = '#3a3f47';
  ctx.beginPath();
  ctx.arc(x, railY + 20, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565e6a';
  ctx.beginPath();
  ctx.arc(x, railY + 20, 8, 0, Math.PI * 2);
  ctx.fill();
}

/** A ladle hanging from the rail at (x, railY). */
function drawHangingLadle(ctx, x, railY) {
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, railY);
  ctx.lineTo(x, railY + 20);
  ctx.stroke();
  ctx.fillStyle = '#9aa1ad';
  ctx.beginPath();
  ctx.arc(x, railY + 26, 8, 0, Math.PI * 2);
  ctx.fill();
}

/** A spatula hanging from the rail at (x, railY). */
function drawHangingSpatula(ctx, x, railY) {
  ctx.strokeStyle = '#8a6a3f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, railY);
  ctx.lineTo(x, railY + 16);
  ctx.stroke();
  ctx.fillStyle = '#c9a86a';
  roundRect(ctx, x - 7, railY + 16, 14, 18, 3);
  ctx.fill();
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.width, 108);
  ctx.fillStyle = COLORS.wallDark;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 100, 64, 4);
  }
  // Floor tiles: horizontal and vertical grout lines, so the floor reads
  // as tiles and not a flat wash.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 108, VIEW.width, VIEW.height - 108);
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 2;
  for (let y = 140; y < VIEW.height; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 108);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }
  // Tile backsplash along the wall just above the counter, so the kitchen
  // reads as a place and not a flat backdrop.
  for (let x = 0; x < VIEW.width; x += 32) {
    for (let y = 104; y < 140; y += 18) {
      ctx.fillStyle = ((x / 32 + y / 18) % 2 === 0) ? '#f2e3c2' : '#e9d3a8';
      ctx.fillRect(x, y, 31, 17);
    }
  }
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 140);
  ctx.lineTo(VIEW.width, 140);
  ctx.stroke();
  // A rail with hanging utensils on the wall: pan, ladle, spatula.
  ctx.strokeStyle = '#8a6a3f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, 106);
  ctx.lineTo(300, 106);
  ctx.moveTo(1100, 106);
  ctx.lineTo(1250, 106);
  ctx.stroke();
  drawHangingPan(ctx, 76, 106);
  drawHangingLadle(ctx, 140, 106);
  drawHangingSpatula(ctx, 204, 106);
  drawHangingPan(ctx, 1150, 106);
  drawHangingLadle(ctx, 1214, 106);
  // The long kitchen counter.
  ctx.fillStyle = COLORS.counterFront;
  ctx.fillRect(24, 148, VIEW.width - 48, 240);
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, 16, 140, VIEW.width - 32, 26, 10);
  ctx.fill();
}

function drawStationLabel(ctx, rect) {
  text(ctx, rect.label, rect.x + rect.width / 2, rect.y + 16, 15, '#f3e2c0', 'center');
}

function drawBoard(ctx, state) {
  const rect = STATIONS.board;
  drawStationLabel(ctx, rect);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, rect.x + 22, rect.y + 34, rect.width - 44, 128, 14);
  ctx.fill();
  ctx.strokeStyle = COLORS.boardEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (state.board) {
    drawIngredient(ctx, state.board.id, state.board.state, rect.x + rect.width / 2, rect.y + 98, 120);
    if (state.board.chops > 0 && state.board.state !== 'chopped') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, rect.x + 52, rect.y + 138, rect.width - 104, 12, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.green;
      roundRect(ctx, rect.x + 52, rect.y + 138, (rect.width - 104) * (state.board.chops / 3), 12, 6);
      ctx.fill();
      text(ctx, 'POTONG! (' + state.board.chops + '/3)', rect.x + rect.width / 2, rect.y + 176, 14, COLORS.ink, 'center');
    }
  } else {
    text(ctx, 'Letakkan selada / tomat', rect.x + rect.width / 2, rect.y + 98, 14, '#8a6a3f', 'center');
    text(ctx, 'lalu klik 3x', rect.x + rect.width / 2, rect.y + 120, 14, '#8a6a3f', 'center');
  }
  // A little knife resting on the board.
  ctx.save();
  ctx.translate(rect.x + rect.width - 46, rect.y + 52);
  ctx.rotate(0.5);
  ctx.fillStyle = COLORS.steelDark;
  roundRect(ctx, 0, -4, 44, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  roundRect(ctx, 44, -4, 22, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawGrill(ctx, state) {
  const rect = STATIONS.grill;
  drawStationLabel(ctx, rect);
  ctx.fillStyle = COLORS.grill;
  roundRect(ctx, rect.x + 18, rect.y + 34, rect.width - 36, 128, 14);
  ctx.fill();
  ctx.strokeStyle = '#22262c';
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < GRILL_SLOTS.length; i += 1) {
    const slot = GRILL_SLOTS[i];
    const item = state.grill[i];
    ctx.fillStyle = '#23272e';
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565e6a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (item) {
      // Flame glow while it cooks.
      if (item.t < BURN_SECONDS) {
        ctx.fillStyle = 'rgba(226,88,62,' + (0.25 + 0.2 * Math.sin(state.time * 6 + i)) + ')';
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, slot.r - 6, 0, Math.PI * 2);
        ctx.fill();
      }
      const cookedState = item.t >= BURN_SECONDS ? 'burnt' : item.t >= GRILL_SECONDS ? 'cooked' : 'raw';
      drawIngredient(ctx, 'patty', cookedState, slot.x, slot.y, 84);
      // Cook progress ring.
      const frac = Math.min(1, item.t / GRILL_SECONDS);
      ctx.strokeStyle = item.t >= BURN_SECONDS ? COLORS.danger : item.t >= GRILL_SECONDS ? COLORS.green : COLORS.gold;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, slot.r + 6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (item.t >= BURN_SECONDS) {
        text(ctx, 'GOSONG!', slot.x, slot.y + slot.r + 14, 15, '#ffd9d2', 'center');
      } else if (item.t >= GRILL_SECONDS) {
        text(ctx, 'MATANG — AMBIL!', slot.x, slot.y + slot.r + 14, 14, '#bff0c0', 'center');
      }
    } else {
      text(ctx, 'Daging mentah', slot.x, slot.y - 4, 13, '#8b93a0', 'center');
      text(ctx, 'ke sini', slot.x, slot.y + 16, 13, '#8b93a0', 'center');
    }
  }
}

function drawPlateStation(ctx, state) {
  const rect = STATIONS.plate;
  drawStationLabel(ctx, rect);
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx, PLATE.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.plateEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#eef1f4';
  ctx.beginPath();
  ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx - 26, PLATE.ry - 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // The stack, bottom layer first.
  const baseY = PLATE.y + 6;
  for (let i = 0; i < state.plate.length; i += 1) {
    const item = state.plate[i];
    const y = baseY - i * 15;
    drawIngredient(ctx, item.id, item.state, PLATE.x + (i % 2 === 0 ? 0 : 4), y, item.id === 'bun' ? 108 : 96);
  }
  if (state.plate.length === 0) {
    text(ctx, 'Susun hidangan di sini', PLATE.x, PLATE.y - 6, 15, '#9aa1ad', 'center');
    text(ctx, 'mulai dengan roti', PLATE.x, PLATE.y + 16, 13, '#9aa1ad', 'center');
  }
  // Serve button.
  const ready = state.plate.length > 0
    && state.orders.some((order) => order.recipe.items.length === state.plate.length);
  ctx.fillStyle = ready ? COLORS.green : '#b9bfc7';
  roundRect(ctx, SERVE_BUTTON.x, SERVE_BUTTON.y, SERVE_BUTTON.width, SERVE_BUTTON.height, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SAJIKAN!', SERVE_BUTTON.x + SERVE_BUTTON.width / 2, SERVE_BUTTON.y + SERVE_BUTTON.height / 2, 22, '#ffffff', 'center');
  // Trash can.
  ctx.fillStyle = '#7d838d';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.width, TRASH.height, 8);
  ctx.fill();
  ctx.fillStyle = '#5d636d';
  ctx.fillRect(TRASH.x + 8, TRASH.y - 6, TRASH.width - 16, 8);
  text(ctx, 'BUANG', TRASH.x + TRASH.width / 2, TRASH.y + TRASH.height / 2, 13, '#ffffff', 'center');
}

// --- top bar -----------------------------------------------------------------

function drawTopBar(ctx, state) {
  // Score panel.
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  roundRect(ctx, 12, 10, 244, 82, 12);
  ctx.fill();
  text(ctx, 'DAPUR KILAT', 24, 28, 20, '#ffd98a');
  text(ctx, 'SKOR ' + state.score, 24, 52, 16, '#ffffff');
  text(ctx, 'KO ' + state.coins + '   HARI ' + state.day, 24, 74, 14, '#ffd98a');
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.hearts ? '#e2604a' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    const hx = 196 + i * 22;
    ctx.arc(hx, 52, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shift timer.
  const frac = state.shiftLeft / SHIFT_SECONDS;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 150, 70, 94, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac < 0.25 ? COLORS.danger : COLORS.gold;
  roundRect(ctx, 150, 70, 94 * frac, 10, 5);
  ctx.fill();
  text(ctx, formatTime(state.shiftLeft), 150, 52, 14, '#ffffff');
  if (state.combo >= 2) {
    text(ctx, 'KOMBO x' + state.combo, 248, 28, 14, '#8fe388', 'right');
  }
  // Order board.
  for (let i = 0; i < state.orders.length; i += 1) {
    drawTicket(ctx, state, state.orders[i], ticketRect(i));
  }
  for (let i = state.orders.length; i < BOARD.maxTickets; i += 1) {
    const rect = ticketRect(i);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.stroke();
  }
}

function drawTicket(ctx, state, order, rect) {
  const urgent = order.patience < 8;
  const shakeX = state.shake > 0 && urgent ? Math.sin(state.time * 40) * 2 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? COLORS.danger : COLORS.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = order.colour;
  roundRect(ctx, rect.x, rect.y, 10, rect.height, 5);
  ctx.fill();
  // The customer waiting for this order, so the board reads as people.
  drawCustomerFace(ctx, order.id, rect.x + 23, rect.y + 23, 11);
  text(ctx, '#' + (order.id + 1) + '  ' + order.recipe.name, rect.x + 40, rect.y + 16, 15, COLORS.ink);
  // Recipe icons.
  let ix = rect.x + 22;
  for (const id of order.recipe.items) {
    drawIngredient(ctx, id, id === 'patty' ? 'cooked' : id === 'lettuce' || id === 'tomato' ? 'chopped' : 'raw', ix + 14, rect.y + 46, 30);
    ix += 32;
  }
  // Patience bar.
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = '#e8ddc4';
  roundRect(ctx, rect.x + 16, rect.y + rect.height - 14, rect.width - 32, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac < 0.3 ? COLORS.danger : frac < 0.6 ? COLORS.gold : COLORS.green;
  roundRect(ctx, rect.x + 16, rect.y + rect.height - 14, (rect.width - 32) * frac, 8, 4);
  ctx.fill();
  text(ctx, Math.ceil(order.patience) + ' dtk', rect.x + rect.width - 16, rect.y + 16, 13, urgent ? COLORS.danger : COLORS.inkSoft, 'right');
  ctx.restore();
}

// --- bins, hand, overlays ------------------------------------------------------

function drawBins(ctx, state) {
  for (let i = 0; i < BIN_ORDER.length; i += 1) {
    const rect = binRect(i);
    const id = BIN_ORDER[i];
    ctx.fillStyle = '#fff6dd';
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, id, 'raw', rect.x + rect.width / 2, rect.y + 58, 96);
    text(ctx, INGREDIENTS[id].name, rect.x + rect.width / 2, rect.y + 116, 17, COLORS.ink, 'center');
    text(ctx, '[' + (i + 1) + ']', rect.x + rect.width - 14, rect.y + 18, 13, COLORS.inkSoft, 'right');
    if (INGREDIENTS[id].needs === 'chop') text(ctx, 'perlu dipotong', rect.x + rect.width / 2, rect.y + 136, 12, COLORS.inkSoft, 'center');
    if (INGREDIENTS[id].needs === 'grill') text(ctx, 'perlu dipanggang', rect.x + rect.width / 2, rect.y + 136, 12, COLORS.inkSoft, 'center');
  }
  text(ctx, 'BAHAN — klik untuk mengambil, lalu olah & susun di piring', VIEW.width / 2, BINS.y - 18, 15, COLORS.inkSoft, 'center');
  text(ctx, '1-5 bahan · C potong · G panggang · V piring · Spasi sajikan · P jeda', VIEW.width / 2, VIEW.height - 14, 13, COLORS.inkSoft, 'center');
}

function drawHand(ctx, state) {
  if (!state.hand || !state.mouse.inside) return;
  const { x, y } = state.mouse;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.inkSoft;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawIngredient(ctx, state.hand.id, state.hand.state, x, y, 52);
  ctx.restore();
  const label = INGREDIENTS[state.hand.id].name
    + (state.hand.state === 'burnt' ? ' (gosong!)' : state.hand.state === 'cooked' ? ' (matang)' : state.hand.state === 'chopped' ? ' (terpotong)' : '');
  text(ctx, label, x, y + 48, 13, COLORS.ink, 'center');
}

function drawPopups(ctx, state) {
  for (const pop of state.popups) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, pop.life);
    text(ctx, pop.text, pop.x, pop.y, 22, pop.colour, 'center');
    ctx.restore();
  }
}

function drawMessage(ctx, state) {
  if (state.message.life <= 0 || state.screen !== SCREEN_PLAY) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.message.life);
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  const width = 40 + state.message.text.length * 8.5;
  roundRect(ctx, VIEW.width / 2 - width / 2, 452, width, 34, 17);
  ctx.fill();
  text(ctx, state.message.text, VIEW.width / 2, 470, 15, '#fff8e7', 'center');
  ctx.restore();
}

function dim(ctx, alpha) {
  ctx.fillStyle = 'rgba(30,20,10,' + alpha + ')';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawTitle(ctx, state) {
  dim(ctx, 0.45);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 290, 150, 700, 400, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, '🍳 DAPUR KILAT', 640, 220, 54, COLORS.ink, 'center');
  text(ctx, 'Game masak serba cepat: terima pesanan, olah bahan,', 640, 300, 20, COLORS.inkSoft, 'center');
  text(ctx, 'susun burger di piring, sajikan sebelum waktu habis!', 640, 330, 20, COLORS.inkSoft, 'center');
  text(ctx, 'Roti dulu, lalu daging panggang, selada & tomat potong, keju.', 640, 380, 17, COLORS.ink, 'center');
  text(ctx, 'KLIK UNTUK MULAI  ·  mouse + keyboard (1-5, C, G, V, Spasi)', 640, 440, 17, COLORS.red, 'center');
  text(ctx, '3 hati — pesanan yang hangus mengurangi hati. Hari makin sulit!', 640, 490, 15, COLORS.inkSoft, 'center');
}

function drawDayEnd(ctx, state) {
  dim(ctx, 0.5);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 180, 600, 330, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'HARI ' + state.day + ' SELESAI!', 640, 250, 40, COLORS.ink, 'center');
  text(ctx, 'Bonus shift: +' + state.dayBonus + ' poin', 640, 320, 22, COLORS.green, 'center');
  text(ctx, 'Skor: ' + state.score + '   ·   Tersaji: ' + state.served + '   ·   Kombo terbaik: x' + state.bestCombo, 640, 370, 18, COLORS.ink, 'center');
  text(ctx, 'Hari berikutnya: pesanan lebih cepat & resep lebih rumit.', 640, 420, 16, COLORS.inkSoft, 'center');
  text(ctx, 'KLIK UNTUK LANJUT KE HARI ' + (state.day + 1), 640, 470, 18, COLORS.red, 'center');
}

function drawOver(ctx, state) {
  dim(ctx, 0.55);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 170, 600, 350, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SHIFT BERAKHIR!', 640, 240, 42, COLORS.danger, 'center');
  text(ctx, 'Terlalu banyak pesanan hangus.', 640, 300, 19, COLORS.inkSoft, 'center');
  text(ctx, 'Skor akhir: ' + state.score, 640, 350, 26, COLORS.ink, 'center');
  text(ctx, 'Hidangan tersaji: ' + state.served + '   ·   Kombo terbaik: x' + state.bestCombo, 640, 395, 18, COLORS.ink, 'center');
  text(ctx, 'KLIK UNTUK MAIN LAGI', 640, 460, 19, COLORS.red, 'center');
}

function drawPaused(ctx) {
  dim(ctx, 0.5);
  text(ctx, 'JEDA — tekan P untuk lanjut', 640, 360, 34, '#ffffff', 'center');
}

/** Draw the whole game for the current state. */
export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawBackground(ctx);
  drawBoard(ctx, state);
  drawGrill(ctx, state);
  drawPlateStation(ctx, state);
  drawBins(ctx, state);
  drawTopBar(ctx, state);
  drawPopups(ctx, state);
  drawMessage(ctx, state);
  if (state.screen === SCREEN_PLAY) drawHand(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  if (state.screen === SCREEN_DAY_END) drawDayEnd(ctx, state);
  if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  if (state.paused && state.screen === SCREEN_PLAY) drawPaused(ctx);
  // Serve flash: a quick golden blink over the plate.
  if (state.serveFlash > 0) {
    ctx.save();
    ctx.globalAlpha = state.serveFlash;
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx + 14, PLATE.ry + 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
