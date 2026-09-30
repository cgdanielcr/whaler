// The decks below in full. The 'tween deck: sea chests and blankets in the
// forecastle, the kid and mess pans, lamps on the beams, blubber in the blubber
// room, the cabin table laid, the master's berth and chart table, the pantry's
// crockery, ladders up to the deck, knees along her sides and doors in the
// bulkheads. The hold: her keelson and frames, dunnage under the casks, the
// pump well, the cooper's staves and hoops. And the cask itself, lying on its
// side as casks were stowed, with its hoops.
import * as THREE from 'three';
import { halfBeam } from './decks.js';
import { BERTHS, TWEEN } from './stations.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const WOOD = mat(0x6b4d33), DARK = mat(0x3f2d20), IRON = mat(0x2b2b2b), CASK = mat(0x7a5a38), BLUBBER = mat(0xd9b8a0);
const PLATE = mat(0xd8d2c2), LAMP = mat(0xffd48a, { emissive: 0xffa53a, emissiveIntensity: 1.3 }), GLASS = mat(0x9cc3d6, { roughness: 0.3 });
const CHESTS = [0x5a3a24, 0x2f4a63, 0x6b2e22, 0x3f5a3a, 0x7a6a4a, 0x4a3a5a].map((c) => mat(c));
const BLANKETS = [0x8e2a22, 0x3a4a6a, 0x6b6f5a, 0x9a8a5a, 0x5a3a2a].map((c) => mat(c));

function tools(g) {
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const cyl = (r, h, m, x, y, z, rx = 0, rz = 0, seg = 8) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  const ladder = (x, z, h, ry = 0) => {
    for (const s of [-0.13, 0.13]) { const r = box(0.04, h * 1.1, 0.04, WOOD, x, h / 2, z + s); r.rotation.z = 0.35; r.rotation.y = ry; }
    for (let y = 0.12; y < h; y += 0.14) box(0.04, 0.03, 0.26, WOOD, x + Math.sin(0.35) * (y - h / 2), y, z, ry);
  };
  const lamp = (x, y, z) => { box(0.08, 0.1, 0.08, LAMP, x, y, z); box(0.01, 0.2, 0.01, IRON, x, y + 0.15, z); };
  return { box, cyl, ladder, lamp };
}

// A cask on its side, with a bulge at the bilge, and its hoops apart (they take a darker colour).
export function caskGeometry() {
  const pts = [[0.13, -0.27], [0.165, -0.14], [0.18, 0], [0.165, 0.14], [0.13, 0.27]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 9).rotateZ(Math.PI / 2);
}
export function hoopGeometry() {
  const hoop = (x, r) => new THREE.TorusGeometry(r, 0.012, 3, 9).rotateY(Math.PI / 2).translate(x, 0, 0);
  const parts = [hoop(-0.22, 0.148), hoop(-0.1, 0.176), hoop(0.1, 0.176), hoop(0.22, 0.148)].map((x) => x.toNonIndexed());
  const n = parts.reduce((a, p) => a + p.attributes.position.count, 0), pos = new Float32Array(n * 3);
  let off = 0; for (const p of parts) { pos.set(p.attributes.position.array, off); off += p.attributes.position.array.length; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}

export function detailTween(g) {
  const { box, cyl, ladder, lamp } = tools(g), s = 0.92;
  // Hanging knees along her sides, where the deck beams met the frames.
  for (let x = -6.2; x <= 5.6; x += 0.9) for (const side of [-1, 1]) box(0.08, 0.3, 0.12, DARK, x, 0.4, side * (halfBeam(x, s) - 0.08));
  // Doors in the bulkheads.
  for (const x of [TWEEN.forecastleAft, TWEEN.blubberAft, TWEEN.steerageAft, TWEEN.mastersCabin]) box(0.1, 0.5, 0.36, DARK, x, 0.25, 0);

  // Forecastle and steerage: a chest for every berth (a man sits on his), blankets in the bunks.
  [...BERTHS.forecastle, ...BERTHS.steerage].forEach(([x, , z], i) => box(0.3, 0.12, 0.2, CHESTS[i % CHESTS.length], x, 0.06, z, (i % 3) * 0.3));
  let b = 0;
  for (const x of [5.0, 5.8, -1.6, -2.4, -3.2]) for (const side of [-1, 1]) for (const y of [0.17, 0.45]) {
    box(0.55, 0.03, 0.34, BLANKETS[b++ % BLANKETS.length], x, y, side * (halfBeam(x, s) - 0.25));
  }
  // The kid and the mess pans on the forecastle deck; the ladder up the scuttle; a lamp.
  cyl(0.13, 0.12, CASK, 5.35, 0.06, 0.05, 0, 0, 10); cyl(0.11, 0.02, mat(0x8a5a3a), 5.35, 0.125, 0.05, 0, 0, 10);
  for (const [dx, dz] of [[-0.25, 0.25], [0.2, 0.3], [0.25, -0.2], [-0.2, -0.25]]) cyl(0.05, 0.02, IRON, 5.35 + dx, 0.01, 0.05 + dz, 0, 0, 7);
  ladder(5.0, 0, 0.55); lamp(5.5, 0.5, 0.4);

  // The blubber room: horse pieces piled ready for mincing, hooks, the ladder up the main hatch.
  for (let i = 0; i < 7; i++) box(0.3, 0.08, 0.2, BLUBBER, 2.4 + (i % 3) * 0.32, 0.04 + Math.floor(i / 3) * 0.08, -0.7 + (i % 2) * 0.22, i * 0.4);
  for (const x of [0.4, 2.8]) { box(0.02, 0.2, 0.02, IRON, x, 0.45, 0.9); }
  ladder(1.2, 0.3, 0.55);

  // Steerage: a small mess table and a lamp; clothes on pegs.
  box(0.5, 0.2, 0.35, WOOD, -2.5, 0.2, 0); lamp(-2.3, 0.5, -0.5);
  for (const x of [-1.3, -2.0, -2.8]) box(0.14, 0.2, 0.04, BLANKETS[(x * 10) & 3], x, 0.35, -(halfBeam(x, s) - 0.05));

  // The cabin: the table laid, lockers to sit on, the companionway, a lamp over the table.
  for (const [dx, dz] of [[-0.3, -0.16], [0, -0.16], [0.3, -0.16], [-0.3, 0.16], [0, 0.16], [0.3, 0.16]]) {
    cyl(0.06, 0.012, PLATE, -4.2 + dx, 0.45, dz, 0, 0, 8); cyl(0.025, 0.05, PLATE, -4.2 + dx + 0.08, 0.475, dz * 0.6);
  }
  for (const z of [-0.45, 0.45]) box(1.0, 0.18, 0.18, WOOD, -4.2, 0.09, z);
  ladder(-4.3, -0.3, 0.55, Math.PI); lamp(-4.2, 0.55, 0);
  // The master's cabin: a chest, a chart table with a chart, the quarter windows; his blanket.
  box(0.3, 0.14, 0.22, CHESTS[1], -6.1, 0.07, 0.2); box(0.45, 0.28, 0.35, WOOD, -6.55, 0.14, 0.35);
  box(0.4, 0.005, 0.3, PLATE, -6.55, 0.285, 0.35);
  box(0.45, 0.03, 1.0, BLANKETS[0], -6.35, 0.31, -0.55);
  for (const side of [-1, 1]) box(0.25, 0.12, 0.02, GLASS, -6.4, 0.38, side * (halfBeam(-6.4, s) - 0.02));
  // The mates' blankets; the pantry's shelves of crockery and a bread barrel.
  for (const x of [-4.3, -5.2]) box(0.6, 0.03, 0.34, BLANKETS[3], x, 0.23, -1.35);
  for (const y of [0.25, 0.42]) { box(0.8, 0.02, 0.15, WOOD, -5.15, y, 1.6); for (let i = 0; i < 5; i++) cyl(0.035, 0.05, PLATE, -5.45 + i * 0.15, y + 0.035, 1.6); }
  cyl(0.12, 0.28, CASK, -4.8, 0.14, 1.3, 0, 0, 9);
  return g;
}

export function detailHold(g) {
  const { box, cyl, ladder, lamp } = tools(g), s = 0.86;
  box(12.6, 0.12, 0.22, DARK, -0.1, 0.06, 0);                                  // the keelson, down her middle
  for (let x = -6.0; x <= 6.2; x += 0.7) {                                   // frames up her far side (the near side is cut away, as in a drawing)
    const hb = halfBeam(x, s); box(0.08, 1.15, 0.08, DARK, x, 0.58, -(hb - 0.04));
  }
  for (let x = -5.5; x <= 5.8; x += 0.6) for (const side of [-1, 1]) box(0.5, 0.04, 0.08, WOOD, x, 0.02, side * 0.9);   // dunnage
  box(0.4, 0.9, 0.4, WOOD, 0.3, 0.45, 0.5); cyl(0.05, 1.0, IRON, 0.2, 0.5, 0.5); cyl(0.05, 1.0, IRON, 0.4, 0.5, 0.5);  // the pump well
  ladder(1.2, 0.3, 1.1);
  // The cooper's stock and work: bundles of staves, a pile of hoops, his horse, a lamp.
  for (let i = 0; i < 3; i++) box(0.5, 0.12, 0.18, WOOD, 1.8, 0.06 + i * 0.12, -0.35, i * 0.2);
  for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 3, 12), IRON); h.rotation.x = Math.PI / 2; h.position.set(0.7, 0.01 + i * 0.025, -0.4); g.add(h); }
  box(0.6, 0.06, 0.14, WOOD, 1.2, 0.3, -0.5); for (const dx of [-0.25, 0.25]) box(0.05, 0.28, 0.12, WOOD, 1.2 + dx, 0.14, -0.5);
  lamp(1.2, 0.9, 0.3);
  return g;
}
