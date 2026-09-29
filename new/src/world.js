// The lay of the land and the sea: where the coast runs, where the wharf is,
// where the whales keep. Every other file asks this one.
// East is +x, south is +z, up is +y.

export const EDGE = 360;                              // the sea runs from -EDGE to +EDGE
export const BERTH = { x: 70, z: 7.2 };               // where she lies at the wharf
export const PIER = { x0: 60, x1: 96, z0: -4.5, z1: 4.5 };
export const GROUNDS = { x0: -330, x1: -60 };         // the whales keep far out to the west

// How far east the sea runs at a given z. Land lies beyond it.
// The coast is calm and straight near the port, wilder away from it.
export function shoreX(z) {
  const wild = 26 * Math.sin(z * 0.017 + 0.6) + 11 * Math.sin(z * 0.047 + 2.1) + 5 * Math.sin(z * 0.11 + 0.3);
  const away = Math.min(1, Math.max(0, (Math.abs(z) - 25) / 45));
  return 92 + wild * away;
}

// A repeatable run of random numbers, so the world is the same every time.
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// An angle brought back into -PI..PI.
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
