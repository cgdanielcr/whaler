// The wind: how hard each force drives her, how she goes on each point of
// sailing, and the words for where it blows from. A square-rigged ship cannot
// lie closer to the wind than six points; to get to windward she must beat.
// Angles are as everywhere else: 0 is east, a quarter turn on is south.
import { wrap } from './world.js';

export const CLOSE = (6 * Math.PI) / 16;      // six points off the wind: close-hauled

// How hard each force drives her under the canvas she can carry in it.
export const DRIVE = {
  'light airs': 0.42, 'moderate breeze': 0.72, 'fresh breeze': 0.92, 'strong breeze': 1.08,
  'fresh gale': 1.05, 'strong gale': 1.0, 'whole gale': 0.9,
};

// Her speed on each point of sailing, by how far off the wind's eye she heads:
// nothing inside six points, best with the wind on the quarter.
const POINTS = [[0, 0], [CLOSE - 0.22, 0], [CLOSE, 0.56], [Math.PI / 2, 0.84], [2.2, 1], [Math.PI, 0.86]];
export function pointOfSail(off) {
  const a = Math.abs(wrap(off));
  for (let i = 1; i < POINTS.length; i++) {
    const [a0, k0] = POINTS[i - 1], [a1, k1] = POINTS[i];
    if (a <= a1) return k0 + ((k1 - k0) * (a - a0)) / (a1 - a0);
  }
  return 0.86;
}

// How she is sailing, as a seaman says it. off: her head from the wind's eye; side: which side the wind is on.
export function sailing(off) {
  const a = Math.abs(wrap(off)), tack = wrap(off) > 0 ? 'larboard' : 'starboard';
  if (a < CLOSE - 0.12) return 'In stays, head to wind';
  if (a < CLOSE + 0.2) return `Close-hauled on the ${tack} tack`;
  if (a < 1.85) return `Wind abeam, on the ${tack} tack`;
  if (a < 2.75) return `Wind on the ${tack} quarter`;
  return 'Running before the wind';
}

const NAMES = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
// The compass name of a direction (east is 0, south a quarter turn on).
export const compass = (angle) => NAMES[((Math.round((angle + Math.PI / 2) / (Math.PI / 4)) % 8) + 8) % 8];

// The wind over a voyage: where it blows from, backing and veering a little
// each day about the quarter it favours that season.
export function makeWind(rand = Math.random) {
  const w = { from: Math.PI, want: Math.PI, prevail: Math.PI };
  // A new voyage: this season's wind favours some westerly quarter.
  w.season = () => { w.prevail = Math.PI + (rand() - 0.5) * 1.6; w.from = w.want = w.prevail; };
  w.newDay = () => { w.want = w.prevail + wrap(w.want - w.prevail) * 0.7 + (rand() - 0.5) * 1.5; };
  w.shift = (by) => { w.want = w.from + by; };              // a squall brings the wind round
  w.update = (dt) => { w.from = wrap(w.from + wrap(w.want - w.from) * Math.min(1, dt * 0.25)); };
  return w;
}
