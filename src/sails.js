// Sail states and the canvas itself.
//
// Reducing canvas goes from the top down: royals first, then topgallants, then
// reef the topsails. A sail runs down this ladder one step at a time.
import * as THREE from 'three';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';

export const REEFABLE = ['set', '1st reef', '2nd reef', 'close-reefed', 'furled'];
export const PLAIN    = ['set', 'furled'];   // courses, royals and headsails do not reef

// Two numbers describe a sail. HOIST is where her yard rides: a reef takes a
// band out near the head, so the yard comes down and the sail shortens.
// SPREAD is how much canvas hangs from that yard: furling gathers her up to
// the yard until none of her is showing.
const HOIST = {
  'set': 1.00, '1st reef': 0.80, '2nd reef': 0.62, 'close-reefed': 0.45, 'furled': 1.00
};
const SPREAD = {
  'set': 1, '1st reef': 1, '2nd reef': 1, 'close-reefed': 1, 'furled': 0
};
export const hoistFor = (state) => HOIST[state];
export const spreadFor = (state) => SPREAD[state];

// Smooth-shaded, because a sail is one curved piece of cloth. The steps in
// the light give it its flat look; faceting it would only draw the mesh.
export const CANVAS = cutLight(new THREE.MeshLambertMaterial({
  color: HUE.canvas, side: THREE.DoubleSide
}));

const FURLED = cutLight(new THREE.MeshLambertMaterial({ color: HUE.furled, flatShading: true }));

// A square sail: bent to its yard at the head, spread to the yard below at the
// foot, with a little belly in it so it looks like cloth and not a board.
// Built with the foot at local y = 0.
//
// "roach" is the hollow cut in the foot, deepest amidships and dying away at
// the clews. The courses are cut this way so their feet clear the deck and
// everything on it; without it a course hangs about the height of a man's head.
export function squareSail(headHalf, footHalf, hoist, belly, roach = 0) {
  const COLS = 6, ROWS = 4;
  const pos = [], idx = [];
  for (let r = 0; r <= ROWS; r++) {
    const v = r / ROWS;                                   // 0 at the foot, 1 at the head
    const half = footHalf + (headHalf - footHalf) * v;
    for (let c = 0; c <= COLS; c++) {
      const u = c / COLS;
      const cut = roach * Math.sin(Math.PI * u) * (1 - v) * (1 - v);
      pos.push((u * 2 - 1) * half, hoist * v + cut,
               belly * Math.sin(Math.PI * u) * Math.sin(Math.PI * v));
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = r * (COLS + 1) + c, b = a + COLS + 1;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A four-cornered fore-and-aft sail (the spanker), given its corners in order:
// throat, peak, clew, tack. Reefing rolls the foot up to the boom.
export function gaffSail(throat, peak, clew, tack) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    ...throat, ...peak, ...clew, ...tack
  ], 3));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  g.computeVertexNormals();
  return g;
}

// A headsail: a triangle hanging on a stay, given head, tack and clew, with a
// belly blown out to leeward so she reads as cloth rather than a sheet of card.
export function stayTriangle(head, tack, clew, belly = 0) {
  const N = 6;
  const pos = [], idx = [], rowStart = [];
  for (let i = 0; i <= N; i++) {
    rowStart.push(pos.length / 3);
    for (let j = 0; j <= i; j++) {
      const a = 1 - i / N;                          // towards the head
      const c = i === 0 ? 0 : (j / i) * (i / N);    // towards the clew
      const b = 1 - a - c;                          // towards the tack
      const bulge = belly * 27 * a * b * c;
      pos.push(head[0] * a + tack[0] * b + clew[0] * c + bulge,
               head[1] * a + tack[1] * b + clew[1] * c,
               head[2] * a + tack[2] * b + clew[2] * c);
    }
  }
  for (let i = 0; i < N; i++) {
    const r0 = rowStart[i], r1 = rowStart[i + 1];
    for (let j = 0; j <= i; j++) {
      idx.push(r0 + j, r1 + j, r1 + j + 1);
      if (j < i) idx.push(r0 + j, r1 + j + 1, r0 + j + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// What a furled sail looks like: a roll of canvas gathered along its yard.
export function furledBundle(half) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, half * 1.86, 6), FURLED);
  m.rotation.z = Math.PI / 2;
  m.castShadow = true;
  return m;
}
