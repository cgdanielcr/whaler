// Below her deck, for the view from above: the 'tween decks and the hold,
// each built as a drawer that can be slid out of her side and looked into.
//
// A whaleship of 1841 had one deck under the upper one. Aft was the cabin,
// where the master and mates lived; then steerage, for the boatsteerers and
// tradesmen; then the blubber room amidships, empty until a whale was cut in;
// and forward the forecastle, where the foremast hands slung their bunks.
// Under all of it, the hold, stowed with casks. Room lengths are inferred.
import * as THREE from 'three';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';
import { beamAt, deckAt, keelUnder } from './hull.js';

export const TWEEN_Y = 0.25;   // her lower deck, about seven feet under the upper
export const HOLD_Y = -2.6;
const FLOOR = 0.14, RIM = 0.5;

export const ROOMS = {
  cabin:      { said: 'The cabin',    z0: -15.4, z1: -9.0 },
  steerage:   { said: 'Steerage',     z0: -9.0,  z1: -4.0 },
  blubber:    { said: 'Blubber room', z0: -4.0,  z1: 7.0 },
  forecastle: { said: 'Forecastle',   z0: 7.0,   z1: 14.4 }
};
const HOLD = { z0: -12.4, z1: 10.6 };
const MAST_Z = [10.4, -0.6, -10.8];

const lambert = (c) => cutLight(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
const PLANK = lambert(HUE.deck), CEILED = lambert(HUE.cedar), WOOD = lambert(HUE.spar);
const OAK = lambert(HUE.band), IRON = lambert(HUE.iron), CHEST = lambert(HUE.trim);

// How far out her side stands, inside the planking, at a given height.
export function insideAt(z, y) {
  const keel = keelUnder(z), sheer = deckAt(z);
  const t = Math.max(0, Math.min(1, (y - keel) / (sheer - keel)));
  return Math.max(0.3, beamAt(z) * Math.pow(Math.sin(t * Math.PI / 2), 0.45) - 0.2);
}

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  return m;
}

// Her side at a given height, traced round from aft to forward and back.
function outline(z0, z1, y, inset) {
  const pts = [], n = Math.ceil((z1 - z0) / 0.5);
  const zAt = (i) => z0 + inset + (z1 - z0 - 2 * inset) * i / n;
  for (let i = 0; i <= n; i++) pts.push(new THREE.Vector2(insideAt(zAt(i), y) - inset, -zAt(i)));
  for (let i = n; i >= 0; i--) pts.push(new THREE.Vector2(-(insideAt(zAt(i), y) - inset), -zAt(i)));
  return pts;
}

// A floor the shape of her, with a low rim round it so it reads as a drawer.
function tray(z0, z1, y) {
  const g = new THREE.Group();
  const lay = (shape, depth, mat) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y - FLOOR, 0);
    g.add(new THREE.Mesh(geo, mat));
  };
  lay(new THREE.Shape(outline(z0, z1, y, 0)), FLOOR, PLANK);
  const rim = new THREE.Shape(outline(z0, z1, y, 0));
  rim.holes.push(new THREE.Path(outline(z0, z1, y, 0.12)));
  lay(rim, FLOOR + RIM, WOOD);
  return g;
}

// A bulkhead across her, with a door in the middle of it.
function bulkhead(z, y) {
  const g = new THREE.Group(), w = insideAt(z, y + 1), door = 0.45;
  for (const s of [-1, 1]) g.add(box(w - door, 1.85, 0.1, CEILED, s * (w + door) / 2, y, z));
  return g;
}

// Bunks two high down both sides, and a sea chest in front of each.
function bunks(g, zs, y) {
  for (const z of zs) {
    for (const s of [-1, 1]) {
      const x = insideAt(z, y) - 0.42;
      g.add(box(0.75, 0.4, 1.9, WOOD, s * x, y + 0.25, z));
      g.add(box(0.75, 0.4, 1.9, WOOD, s * x, y + 1.15, z));
      g.add(box(0.55, 0.42, 0.4, CHEST, s * (x - 0.75), y, z));
    }
  }
}

function tweenDecks(labels) {
  const g = tray(ROOMS.cabin.z0, ROOMS.forecastle.z1, TWEEN_Y);
  const y = TWEEN_Y;
  for (const z of [-9.0, -4.0, 7.0]) g.add(bulkhead(z, y));

  // The cabin: a table, and the mates' staterooms down either side.
  g.add(box(1.0, 0.75, 2.4, WOOD, 0, y, -13.0));
  for (const z of [-14.4, -12.6, -10.8]) {
    for (const s of [-1, 1]) {
      const x = insideAt(z, y);
      g.add(box(1.7, 1.85, 0.08, CEILED, s * (x - 0.85), y, z));
      g.add(box(0.7, 0.45, 1.5, WOOD, s * (x - 0.4), y + 0.4, z + 0.9));
    }
  }
  bunks(g, [-7.8, -5.4], y);
  bunks(g, [8.3, 10.4, 12.5], y);

  // The blubber room: bare boards, the main hatch over it, a ladder up.
  g.add(box(2.0, 0.03, 2.0, IRON, 0, y, 2.6));
  const ladder = box(0.55, 2.2, 0.08, WOOD, 0, y, 4.3);
  ladder.rotation.x = -0.45;
  g.add(ladder);

  for (const key in ROOMS) {
    const at = new THREE.Object3D();
    at.position.set(0, y + 2.2, (ROOMS[key].z0 + ROOMS[key].z1) / 2);
    g.add(at);
    labels.push({ said: ROOMS[key].said, at, level: 'tween' });
  }
  return g;
}

function hold(labels) {
  const g = tray(HOLD.z0, HOLD.z1, HOLD_Y);
  const cask = new THREE.CylinderGeometry(0.4, 0.4, 1.15, 10);
  cask.rotateX(Math.PI / 2);
  const spots = [];
  for (let z = HOLD.z0 + 1; z <= HOLD.z1 - 0.8; z += 1.3) {
    for (const [tier, y] of [[0, HOLD_Y + 0.4], [1, HOLD_Y + 1.15]]) {
      const n = Math.floor(2 * (insideAt(z, y) - 0.45) / 0.86) + 1 - tier;
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 0.86;
        if (Math.abs(x) < 0.8 && MAST_Z.some((mz) => Math.abs(mz - z) < 0.9)) continue;
        spots.push([x, y, z]);
      }
    }
  }
  const casks = new THREE.InstancedMesh(cask, OAK, spots.length);
  const m = new THREE.Matrix4();
  spots.forEach(([x, y, z], i) => casks.setMatrixAt(i, m.makeTranslation(x, y, z)));
  g.add(casks);

  const at = new THREE.Object3D();
  at.position.set(0, HOLD_Y + 2.4, -1);
  g.add(at);
  labels.push({ said: 'The hold', at, level: 'hold' });
  return g;
}

export function makeInterior() {
  const labels = [];
  const fixed = new THREE.Group();
  // The masts go down through both decks to her keelson, and stay put when
  // a deck is drawn out past them.
  for (const z of MAST_Z) {
    const h = deckAt(z) - HOLD_Y;
    fixed.add(box(0.66, h, 0.66, WOOD, 0, HOLD_Y, z));
  }

  // A man's own place in his room, the same every time he goes below.
  const spotIn = (key, id) => {
    const r = ROOMS[key];
    const a = ((id * 0.618034) % 1), b = ((id * 0.414214 + 0.3) % 1);
    const z = r.z0 + 0.9 + a * (r.z1 - r.z0 - 1.8);
    const x = (id % 2 ? -1 : 1) * (0.5 + b * 0.7);
    return new THREE.Vector3(x, TWEEN_Y + 0.02, z);
  };

  return { tween: tweenDecks(labels), hold: hold(labels), fixed, labels, spotIn };
}
