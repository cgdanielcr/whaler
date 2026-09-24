// Her stern: the cabin windows in the transom, the taffrail over them, and a
// spare boat hung across it on the stern davits.
//
// All inferred. MORGAN.md cannot place any of it from what is published; the
// arrangement is the common one of New Bedford whaleships of the 1840s, and
// should be checked against the Mystic plans if they are ever bought. What is
// sure is that the master's cabin was right aft and lit from the stern.
import * as THREE from 'three';
import { deckAt, beamAt } from './hull.js';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';
import { whaleboat } from './whaler.js';

const lambert = (c) => cutLight(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
const OAK = lambert(HUE.spar), GLASS = lambert(HUE.iron), FRAME = lambert(HUE.cedar);

const STERN = -16.5;          // her transom, where the hull closes
const RAIL = 1.40;            // bulwark height, as in hull.js

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
};

// Five lights across the transom, below the deck line, where the cabin is.
function windows(g) {
  const y = deckAt(STERN) - 0.75;
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.95;
    g.add(box(0.62, 0.52, 0.06, FRAME, x, y, STERN - 0.03));
    g.add(box(0.46, 0.38, 0.06, GLASS, x, y, STERN - 0.06));
  }
}

// The taffrail: the capping rail right across her stern.
function taffrail(g) {
  const y = deckAt(STERN) + RAIL;
  const w = beamAt(STERN) * 2 * 0.95;
  g.add(box(w, 0.14, 0.34, OAK, 0, y, STERN + 0.05));
}

// Two davits standing up from the quarters and reaching out over the stern,
// with a spare boat hung from them athwartships and her falls up to each.
function davits(g) {
  const top = deckAt(STERN) + RAIL;
  const reach = 1.7, rise = 1.25;
  const hangY = top + 0.55;
  for (const side of [-1, 1]) {
    const x = side * 2.25;
    g.add(box(0.18, rise, 0.18, OAK, x, top + rise / 2, STERN + 0.25));
    g.add(box(0.16, 0.16, reach + 0.2, OAK, x, top + rise, STERN + 0.25 - reach / 2));
    // The fall, from the davit head down to the boat.
    g.add(box(0.035, rise - 0.45, 0.035, GLASS, x, top + rise - (rise - 0.45) / 2, STERN - reach + 0.3));
  }
  const boat = whaleboat();
  boat.rotation.y = Math.PI / 2;
  boat.position.set(0, hangY - 0.95, STERN - reach + 0.3);
  g.add(boat);
}

export function makeStern() {
  const g = new THREE.Group();
  windows(g);
  taffrail(g);
  davits(g);
  return g;
}
