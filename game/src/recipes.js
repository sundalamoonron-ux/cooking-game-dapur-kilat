// Dapur Kilat — ingredients, recipes and orders. One clear job: what a dish
// is made of, and how new orders are born.
import { intBetween, pick } from './random.js';

// Every ingredient: id, display name, whether it needs work before plating,
// and the colours its drawing uses.
export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Roti', needs: 'none', top: '#e8a34c', bottom: '#c97e2e', seed: '#fff3d6' },
  patty: { id: 'patty', name: 'Daging', needs: 'grill', raw: '#c96a6a', cooked: '#7a4a2b', burnt: '#2e2118' },
  lettuce: { id: 'lettuce', name: 'Selada', needs: 'chop', raw: '#7fae4e', chopped: '#5da244' },
  tomato: { id: 'tomato', name: 'Tomat', needs: 'chop', raw: '#d94f3d', chopped: '#e2604a' },
  cheese: { id: 'cheese', name: 'Keju', needs: 'none', top: '#f2c230', bottom: '#e0a51c' },
};

export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];

// A recipe is a name plus the multiset of ingredient ids a plate must hold.
// The first item on a plate must always be a bun; the rest may arrive in any order.
export const RECIPES = [
  { name: 'Burger Klasik', items: ['bun', 'patty', 'lettuce'], day: 1 },
  { name: 'Cheeseburger', items: ['bun', 'patty', 'cheese'], day: 1 },
  { name: 'Burger Tomat', items: ['bun', 'patty', 'tomato', 'lettuce'], day: 1 },
  { name: 'Burger Sayur', items: ['bun', 'lettuce', 'tomato', 'cheese'], day: 2 },
  { name: 'Double Sapi', items: ['bun', 'patty', 'patty', 'cheese'], day: 2 },
  { name: 'Burger Spesial', items: ['bun', 'patty', 'lettuce', 'tomato', 'cheese'], day: 3 },
];

/** Recipes a customer may order on the given day. */
export function recipesForDay(day) {
  const open = RECIPES.filter((recipe) => recipe.day <= day);
  return open.length === 0 ? [RECIPES[0]] : open;
}

/** Build one order ticket: a recipe, a patience clock, and a customer colour. */
export function makeOrder(random, day, id) {
  const recipe = pick(random, recipesForDay(day));
  const patience = Math.max(22, 42 - day * 2 - recipe.items.length);
  const hues = ['#e2604a', '#4f8fd9', '#7a5fd0', '#d9a13b', '#4c9a4f', '#c96a9a'];
  return {
    id,
    recipe,
    patience,
    patienceMax: patience,
    colour: hues[id % hues.length],
    arrivedAt: 0,
  };
}

/** How often a new order arrives, in seconds; it quickens as days pass. */
export function orderIntervalSeconds(day) {
  return Math.max(7, 13 - day);
}

/** Two multisets hold the same ingredients, in any order. */
export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

/** A short label for a recipe, e.g. "Roti + Daging + Selada". */
export function recipeLabel(recipe) {
  return recipe.items.map((id) => INGREDIENTS[id].name).join(' + ');
}
