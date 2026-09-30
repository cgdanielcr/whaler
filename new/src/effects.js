// What the men at their stations do for the ship. Each number is 1 for an
// ordinary man (a score of 3) at the work, better for a good one, worse for a
// poor one, and worst of all for an empty station. Watch stations count both
// watches alike; which watch is on deck will matter once the watches turn.
import { SLOTS, slotStation } from './stations.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function effects(co) {
  const avg = (id) => { const ks = SLOTS.filter((k) => slotStation(k).id === id); return ks.reduce((a, k) => a + co.scoreAt(k), 0) / ks.length; };
  const hands = co.alive().filter((m) => m.watch);
  const seamen = hands.length ? hands.reduce((a, m) => a + m.stats.seamanship, 0) / hands.length : 1;

  const eye = (avg('foreMast') + avg('mainMast')) / 2, helm = avg('wheel');
  const cook = avg('galley'), cooper = avg('cooper'), carpenter = avg('bench'), steward = avg('pantry');
  const gang = (avg('tryworks') * 2 + avg('blubber') * 2 + avg('cutting')) / 5;

  return {
    sight: clamp(0.6 + 0.1 * eye, 0.6, 1.35),            // how far off spouts are seen and whales made out
    speed: clamp(0.85 + 0.05 * (helm + seamen) / 2, 0.85, 1.12),   // her way through the water
    iceHarm: clamp(1.3 - 0.1 * helm, 0.7, 1.3),           // how hard she takes a blow from the ice
    eat: clamp(1.3 - 0.1 * cook, 0.7, 1.4),               // days of provisions eaten each day
    spoil: clamp(0.12 - 0.03 * cooper, 0, 0.12),          // chance each day a cask of provisions is found spoiled
    stow: clamp(0.88 + 0.03 * cooper, 0.88, 1),           // share of the oil that reaches the hold
    repair: 0.35 * carpenter,                              // hull mended each day at sea, in points
    care: 2 + 1.2 * steward,                               // health restored each day to the sick
    scurvy: clamp(1.25 - 0.08 * steward, 0.7, 1.25),       // how hard scurvy bites
    trying: clamp(0.55 + 0.15 * gang, 0.55, 1.35),        // how fast a whale is cut in and tried out
    scores: { eye, helm, seamen, cook, cooper, carpenter, steward, gang },
  };
}

// The same, said plainly for the roster's header.
export function describeEffects(fx, base) {
  const pct = (k) => `${Math.round(k * 100)}%`;
  return [
    ['Lookout', `spouts seen ${Math.round(base.sight * fx.sight)} off`],
    ['Speed', pct(fx.speed)],
    ['Provisions', `${fx.eat.toFixed(2)} days eaten a day`],
    ['Trying out', pct(fx.trying)],
    ['Oil stowed', pct(fx.stow)],
    ['Hull mended', `${fx.repair.toFixed(1)} a day`],
    ['Care of the sick', `+${Math.round(fx.care)} a day`],
  ];
}
