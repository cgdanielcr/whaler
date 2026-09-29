// The ship's accounts: what the hold holds, who is aboard, how many boats
// can be manned, how far home is, and what the oil will fetch.
import { BERTH } from './world.js';
import { PRICE } from './species.js';

export const HOLD = 500;              // barrels of space below
export const PER_DAY = 6;             // the space one day's provisions takes up
export const CREW = 28, BOATS = 4;
export const SHIPKEEPERS = 8;         // men who must stay aboard to work the ship
export const PER_BOAT = 6;            // a boat's crew
const MILES_A_DAY = 45;               // a fair day's run, in the chart's measure

export const FITS = [
  { name: 'Short', days: 30, note: 'Room for oil from the start, but a short leash.' },
  { name: 'Standard', days: 45, note: 'The usual reckoning.' },
  { name: 'Long', days: 60, note: 'Range to reach the far grounds, but a crowded hold.' },
];

export const oil = (v) => v.whale + v.sperm;
export const room = (v) => Math.max(0, HOLD - oil(v) - v.stores * PER_DAY);
export const worth = (v) => v.whale * PRICE.whale + v.sperm * PRICE.sperm;
export const daysHome = (pos) => Math.ceil(Math.hypot(pos.x - BERTH.x, pos.z - BERTH.z) / MILES_A_DAY);

// How many boats can be lowered: no more than two, no more than she has,
// and only as many as can be manned while leaving enough to work the ship.
export const lowerable = (v) => Math.max(0, Math.min(2, v.boats, Math.floor((v.crew - SHIPKEEPERS) / PER_BOAT)));

export function verdict(dollars) {
  if (dollars < 1500) return 'A broken voyage. The owners will not soon forget it.';
  if (dollars < 4000) return 'A middling voyage. The owners say little.';
  if (dollars < 8000) return 'A good voyage. The owners are pleased.';
  return 'A greasy voyage! The owners are delighted.';
}

export const money = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');

export const REPAIR = 25;             // dollars to make good each point of hull damage
export const NEW_SHIP = 8000;         // what the owners pay for another ship if she is lost
