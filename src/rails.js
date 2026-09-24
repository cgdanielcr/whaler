// Where the ropes come down to: the fife rails round the foot of the fore and
// main masts, the pin rails along the inside of her bulwarks, the belaying
// pins in both with the ropes made fast and coiled down on them, and a few
// water casks lashed by the mainmast.
//
// Every running rope aboard ends on a pin, and a good mate could send a green
// hand to any one of them in the dark. The layout is inferred; that it was a
// rail of pins at the mast and along the side is not.
import * as THREE from 'three';
import { deckAt, beamAt } from './hull.js';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';

const lambert = (c) => cutLight(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
const OAK = lambert(HUE.spar), ROPE = lambert(HUE.furled), IRON = lambert(HUE.iron);
const CASK = lambert(HUE.band);

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
};

const PIN = new THREE.CylinderGeometry(0.025, 0.035, 0.34, 5);
const COIL = new THREE.TorusGeometry(0.2, 0.055, 4, 10);

// A row of pins along a rail, every other one with a coil hung on it.
function pins(g, x0, z0, x1, z1, y, n) {
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1);
    const x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
    const pin = new THREE.Mesh(PIN, OAK);
    pin.position.set(x, y + 0.1, z);
    g.add(pin);
    if (i % 2) continue;
    const coil = new THREE.Mesh(COIL, ROPE);
    coil.position.set(x, y - 0.18, z);
    coil.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
    g.add(coil);
  }
}

// The fife rail: three sides of a square abaft the mast, on turned posts.
function fifeRail(g, z) {
  const y = deckAt(z) + 0.95, half = 1.0, aft = z - 1.2;
  g.add(box(half * 2 + 0.16, 0.12, 0.2, OAK, 0, y, aft));
  for (const side of [-1, 1]) {
    g.add(box(0.2, 0.12, 1.3, OAK, side * half, y, z - 0.55));
    for (const pz of [z + 0.05, aft]) g.add(box(0.14, 0.95, 0.14, OAK, side * half, y - 0.48, pz));
    pins(g, side * half, z - 0.05, side * half, aft + 0.2, y, 4);
  }
  pins(g, -half + 0.3, aft, half - 0.3, aft, y, 4);
}

// A pin rail along the inside of the bulwark, abreast of a mast.
function pinRail(g, z) {
  for (const side of [-1, 1]) {
    const x = side * (beamAt(z) * 0.96 - 0.28);
    const y = deckAt(z) + 1.05;
    g.add(box(0.22, 0.1, 2.6, OAK, x, y, z));
    pins(g, x, z - 1.1, x, z + 1.1, y, 6);
  }
}

// Water, standing on end and lashed, handy to the galley.
function casks(g) {
  const geo = new THREE.CylinderGeometry(0.34, 0.34, 0.95, 10);
  for (const side of [-1, 1]) {
    for (const dz of [0, 0.75]) {
      const c = new THREE.Mesh(geo, CASK);
      const z = -2.2 + dz;
      c.position.set(side * 2.5, deckAt(z) + 0.48, z);
      g.add(c);
      g.add(box(0.72, 0.05, 0.05, IRON, side * 2.5, deckAt(z) + 0.7, z - 0.34));
    }
  }
}

export function makeRails() {
  const g = new THREE.Group();
  for (const z of [10.4, -0.6]) fifeRail(g, z);       // the fore and the main
  for (const z of [10.4, -0.6, -10.8]) pinRail(g, z);
  casks(g);
  return g;
}
