// Dapur Kilat — deterministic random numbers (mulberry32) so a screenshot
// scene with a fixed seed always plays out the same way.
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `items` using `random`. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

/** An integer in [min, max] using `random`. */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
