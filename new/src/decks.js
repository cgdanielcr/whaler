// The three decks of the ship as separate models, for the exploded view: the
// upper deck with its fittings, the 'tween deck with its rooms and berths, and
// the hold with its casks, coloured by what they hold. Each layer has its own
// materials so it can be faded while you look at the one beneath it.
import * as THREE from 'three';
import { trace, lift, ring, DAVITS } from './ship.js';
import { boatMesh } from './boats.js';
import { bake } from './bake.js';
import { STATIONS, TWEEN } from './stations.js';
import { HOLD, PER_DAY } from './stores.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const DECK = mat(0xa07a52), PLANK = mat(0x7d5b3d), HULL = mat(0x2e2620), RAIL = mat(0x4a3526);
const BRICK = mat(0x8c4b34), IRON = mat(0x2b2b2b), SPAR = mat(0x4e3a29), BUNK = mat(0x6b4d33), BRASS = mat(0xb08a3c);
const PLATE = mat(0xe0b252, { emissive: 0x6b4a10, emissiveIntensity: 0.7 });
const MAST_X = [3.9, 0.3, -3.7];

// Half the breadth of her deck at a point along her length.
const EDGE_PTS = trace(new THREE.Shape(), 1).getPoints(20);
export function halfBeam(x, s = 1) {
  let best = 0;
  for (let i = 0; i < EDGE_PTS.length - 1; i++) {
    const a = EDGE_PTS[i], b = EDGE_PTS[i + 1];
    if (a.x !== b.x && (a.x - x / s) * (b.x - x / s) <= 0) best = Math.max(best, Math.abs(a.y + ((b.y - a.y) * (x / s - a.x)) / (b.x - a.x)));
  }
  return best * s;
}

function box(g, w, h, d, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); g.add(o); return o;
}
function cyl(g, r, h, m, x, y, z, across = false) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), m);
  o.position.set(x, y, z); if (across) o.rotation.x = Math.PI / 2; g.add(o); return o;
}
const floor = (s, m) => new THREE.Mesh(lift(trace(new THREE.Shape(), s), 0.25, -0.25), [m, HULL]);

function upper() {
  const g = new THREE.Group();
  g.add(floor(1, DECK), ring(1, 0.94, 0.45, 0, RAIL));
  cyl(g, 0.22, 1.8, SPAR, 6.0, 0.3, 0, true);                                  // windlass
  for (const z of [-0.5, 0.5]) box(g, 0.2, 0.6, 0.2, SPAR, 6.35, 0.3, z);
  box(g, 0.7, 0.25, 0.6, IRON, 5.0, 0.12, 0);                                 // forecastle scuttle
  MAST_X.forEach((x, i) => {
    cyl(g, 0.17, i === 2 ? 2.2 : 3.3, SPAR, x, i === 2 ? 1.1 : 1.65, 0);
    if (i < 2) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 4, 12), IRON); hoop.rotation.x = Math.PI / 2; hoop.position.set(x, 3.3, 0); g.add(hoop); }
  });
  box(g, 1.6, 0.8, 1.8, BRICK, 2.4, 0.4, 0);                                  // tryworks, forward of amidships
  for (const z of [-0.45, 0.45]) cyl(g, 0.42, 0.22, IRON, 2.4, 0.86, z);
  box(g, 0.25, 0.7, 0.25, BRICK, 1.75, 0.95, 0);
  box(g, 1.0, 0.12, 1.1, IRON, 1.2, 0.06, 0);                                 // main hatch
  box(g, 2.6, 0.1, 0.5, PLANK, 0.4, -0.3, 2.3);                               // cutting stage, over the starboard side
  for (const x of [-0.8, 1.6]) box(g, 0.05, 0.8, 0.05, SPAR, x, 0.1, 2.3);
  for (const [x, side] of DAVITS) {
    const b = boatMesh(false); b.scale.setScalar(0.8); b.position.set(x, 1.0, side * 2.4); g.add(b);
  }
  box(g, 2.2, 0.9, 2.4, RAIL, -5.3, 0.45, 0);                                 // after house, with the galley
  cyl(g, 0.09, 0.6, IRON, -4.6, 1.2, 0.8);
  for (const z of [-0.55, 0.55]) {                                            // spare boats on the skids
    const b = boatMesh(false); b.scale.setScalar(0.75); b.rotation.x = Math.PI; b.position.set(-5.3, 1.3, z); g.add(b);
  }
  box(g, 1.1, 0.45, 0.4, BUNK, -2.2, 0.22, -1.25);                            // carpenter's bench
  box(g, 0.15, 0.6, 0.3, SPAR, -6.55, 0.3, 0);                                // wheel
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 4, 10), SPAR);
  wheel.rotation.y = Math.PI / 2; wheel.position.set(-6.5, 0.8, 0); g.add(wheel);
  return g;
}

function tween() {
  const g = new THREE.Group(), s = 0.92;
  g.add(floor(0.96, PLANK), ring(0.96, s, 0.55, 0, HULL));
  const wall = (x) => box(g, 0.08, 0.55, halfBeam(x, s) * 2, RAIL, x, 0.275, 0);
  [TWEEN.forecastleAft, TWEEN.blubberAft, TWEEN.steerageAft, TWEEN.mastersCabin].forEach(wall);
  box(g, 1.9, 0.55, 0.06, RAIL, -4.75, 0.275, -0.85);                         // mates' cabins, larboard
  box(g, 0.06, 0.55, 0.9, RAIL, -4.75, 0.275, -1.3);
  box(g, 1.1, 0.55, 0.06, RAIL, -5.15, 0.275, 0.85);                          // pantry, starboard
  box(g, 0.06, 0.55, 0.9, RAIL, -4.6, 0.275, 1.3);
  box(g, 0.9, 0.28, 0.55, BUNK, -4.2, 0.3, 0);                                // the cabin table
  box(g, 0.5, 0.3, 1.1, BUNK, -6.35, 0.15, -0.55);                            // the master's berth
  box(g, 0.35, 0.25, 0.3, BRASS, -6.3, 0.13, 0.75);                           // medicine chest
  for (const [x, z] of [[-4.3, -1.35], [-5.2, -1.35]]) box(g, 0.7, 0.2, 0.4, BUNK, x, 0.12, z);
  for (const x of [5.0, 5.8]) for (const side of [-1, 1]) for (const y of [0.12, 0.4]) {   // forecastle bunks
    box(g, 0.7, 0.08, 0.45, BUNK, x, y, side * (halfBeam(x, s) - 0.25));
  }
  for (const x of [-1.6, -2.4, -3.2]) for (const side of [-1, 1]) for (const y of [0.12, 0.4]) {  // steerage bunks
    box(g, 0.7, 0.08, 0.45, BUNK, x, y, side * (halfBeam(x, s) - 0.25));
  }
  box(g, 1.0, 0.02, 1.1, DECK, 1.2, 0.01, 0);                                 // under the main hatch
  for (const x of MAST_X) cyl(g, 0.17, 0.55, SPAR, x, 0.275, 0);
  return g;
}

function hold() {
  const g = new THREE.Group(), s = 0.86;
  g.add(floor(0.9, PLANK), ring(0.9, s, 1.2, 0, HULL));
  for (const x of MAST_X) cyl(g, 0.17, 0.4, SPAR, x, 0.2, 0);
  // Casks in tiers, the outer ones stowed first.
  const spots = [];
  for (let x = -5.3; x <= 5.7; x += 0.6) {
    const hb = halfBeam(x, s) - 0.32;
    for (let z = -hb; z <= hb + 0.01; z += 0.6) {
      if (Math.abs(x - 1.2) < 0.55 && Math.abs(z) < 0.6) continue;            // room for the cooper
      spots.push([x, 0.28, z]);
      if (Math.abs(x) < 4) spots.push([x, 0.84, z]);
    }
  }
  spots.sort((a, b) => (Math.abs(b[2]) + Math.abs(b[0]) * 0.3 + b[1]) - (Math.abs(a[2]) + Math.abs(a[0]) * 0.3 + a[1]));
  const casks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 8), mat(0xffffff), spots.length);
  const m = new THREE.Matrix4();
  spots.forEach((p, i) => { m.makeTranslation(...p); casks.setMatrixAt(i, m); casks.setColorAt(i, new THREE.Color(0x4b3a2a)); });
  casks.castShadow = true;
  g.add(casks);
  g.userData.casks = casks;
  return g;
}

// Every station gets a gold plate where the man stands.
function plates(g, deck) {
  for (const s of STATIONS.filter((x) => x.deck === deck)) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.4, 14).rotateX(-Math.PI / 2), PLATE);
    p.position.set(s.at[0], s.at[1] + 0.03, s.at[2]);
    p.userData.station = s.id;
    g.add(p);
  }
}

// Give a layer its own copies of its materials, so it can be faded alone.
function own(g) {
  const copies = new Map();
  g.traverse((o) => {
    if (!o.isMesh) return;
    o.material = [].concat(o.material).map((m) => { if (!copies.has(m)) copies.set(m, m.clone()); return copies.get(m); });
    if (o.material.length === 1) o.material = o.material[0];
  });
  return [...copies.values()];
}

const CASK = { stores: new THREE.Color(0x7fb069), whale: new THREE.Color(0xd9a441), sperm: new THREE.Color(0xf1e2b8), empty: new THREE.Color(0x4b3a2a) };

export function makeDecks() {
  const root = new THREE.Group();
  const layers = [['upper', upper()], ['tween', tween()], ['hold', hold()]].map(([deck, g]) => {
    plates(g, deck);
    const keep = []; g.traverse((o) => { if (o.userData.station || o.isInstancedMesh) keep.push(o); });
    bake(g, keep);
    g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    const mats = own(g);
    root.add(g);
    return {
      deck, group: g,
      fade(k) {
        const see = k < 0.99;
        for (const m of mats) {
          m.opacity = k; m.depthWrite = k > 0.5;
          if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; }   // solid and see-through are drawn differently
        }
        g.visible = k > 0.02;
      },
    };
  });

  // Colour the casks by what the hold holds: provisions outermost, then oil.
  function setHold(v) {
    const casks = layers[2].group.userData.casks, n = casks.count;
    const counts = [['stores', (v.stores * PER_DAY) / HOLD], ['whale', v.whale / HOLD], ['sperm', v.sperm / HOLD]];
    let i = 0;
    for (const [kind, share] of counts) for (let k = Math.round(share * n); k > 0 && i < n; k--) casks.setColorAt(i++, CASK[kind]);
    while (i < n) casks.setColorAt(i++, CASK.empty);
    casks.instanceColor.needsUpdate = true;
  }

  const platesOn = (i) => { const out = []; layers[i].group.traverse((o) => { if (o.userData.station) out.push(o); }); return out; };
  return { root, layers, setHold, platesOn };
}
