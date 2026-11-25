// Dapur Kilat — shared constants: canvas size, station geometry, palette.
// One clear job: every number the world and the renderer agree on lives here.
export const VIEW = { width: 1280, height: 720 };

export const COLORS = {
  wall: '#f7e8c9',
  wallDark: '#efd9a7',
  floor: '#e8b06a',
  floorLine: '#d99a4e',
  counterTop: '#b4713b',
  counterFront: '#8f5427',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  board: '#e9c893',
  boardEdge: '#c49a5b',
  grill: '#3a3f47',
  grillHot: '#e2583e',
  plate: '#fdfdf6',
  plateEdge: '#cfd6dd',
  ink: '#2b2118',
  inkSoft: '#6b543a',
  cream: '#fff8e7',
  red: '#d94f3d',
  green: '#4c9a4f',
  gold: '#f2b234',
  ticket: '#fffdf4',
  ticketEdge: '#d8c49a',
  danger: '#c0392b',
};

// Order-board tickets live in the top bar.
export const BOARD = { x: 268, y: 10, width: 240, height: 82, gap: 8, maxTickets: 4 };

// The three work stations on the kitchen counter.
export const STATIONS = {
  board: { x: 44, y: 168, width: 280, height: 196, label: 'TALENAN' },
  grill: { x: 384, y: 168, width: 356, height: 196, label: 'PANGGANGAN' },
  plate: { x: 800, y: 168, width: 436, height: 196, label: 'PIRING SAJI' },
};

// Grill has two slots; a patty cooks in one of them.
export const GRILL_SLOTS = [
  { x: 480, y: 268, r: 52 },
  { x: 640, y: 268, r: 52 },
];

// The plate sits in the middle of the plating station.
export const PLATE = { x: 1018, y: 276, rx: 118, ry: 46 };

// Serve button under the plate.
export const SERVE_BUTTON = { x: 928, y: 392, width: 180, height: 52 };

// Trash can, bottom right of the kitchen counter.
export const TRASH = { x: 1168, y: 392, width: 68, height: 52 };

// Ingredient bins along the bottom of the screen.
export const BINS = { y: 512, height: 148, gap: 14, width: 186, firstX: 44 };

// How long a shift (one day) lasts, in seconds.
export const SHIFT_SECONDS = 120;

// Chopping takes three clicks; grilling takes seconds on the grill.
export const CHOPS_NEEDED = 3;
export const GRILL_SECONDS = 7;
export const BURN_SECONDS = 14;

// Points: a served dish pays a base plus a patience bonus, times the combo.
export const SCORE_BASE = 40;
export const SCORE_PER_INGREDIENT = 20;
export const SCORE_PATIENCE_BONUS = 50;
export const COMBO_STEP = 0.1;
