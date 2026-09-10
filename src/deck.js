// Her deck furniture: the things a ship is worked by, as against the things
// that make her a whaler.
//
// The owner noticed she had no helm, which she had not. She had a hull, three
// masts, four boats, a try-works and a cutting stage, and nothing else at all
// -- no wheel to steer her, no windlass to get her anchor, no hatch to go
// below by, no galley to cook in.
//
// What is here is what MORGAN.md can justify. The two spare boats stowed
// bottom-up on the skids are documented; so is a deckhouse galley and a
// windlass forward. The exact shapes and stations are inferred, and will stay
// inferred until somebody buys the deck plan from Mystic.
import * as THREE from 'three';
import { deckAt, beamAt } from './hull.js';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';
import { whaleboat } from './whaler.js';

const OAK   = cutLight(new THREE.MeshLambertMaterial({ color: HUE.spar, flatShading: true }));
const IRON  = cutLight(new THREE.MeshLambertMaterial({ color: HUE.iron, flatShading: true }));
const TRIM  = cutLight(new THREE.MeshLambertMaterial({ color: HUE.trim, flatShading: true }));
const HOUSE = cutLight(new THREE.MeshLambertMaterial({ color: HUE.cedar, flatShading: true }));
const BRASS = cutLight(new THREE.MeshLambertMaterial({ color: HUE.band, flatShading: true }));

const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  return m;
};

const post = (r, h, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, h, 7), mat);
  m.position.set(x, y + h / 2, z);
  return m;
};

// The wheel, right aft, abaft the mizzen. She is steered from here and there
// is no other place aboard she is steered from.
function helm() {
  const g = new THREE.Group();

  // The wheel box, with the tiller ropes coming up into it.
  g.add(box(1.1, 0.72, 0.9, OAK, 0, 0, 0));

  const wheel = new THREE.Group();
  wheel.position.set(0, 1.32, 0.05);

  const RIM = 0.72;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM, 0.055, 5, 18), OAK);
  wheel.add(rim);

  // Eight spokes, each running out through the rim into a handle, which is
  // what a ship's wheel actually looks like and what makes it read as one.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, RIM * 2 + 0.34, 5), OAK);
    spoke.rotation.z = a;
    wheel.add(spoke);
  }
  wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 8), BRASS)
    .rotateX(Math.PI / 2));

  g.add(wheel);
  g.userData.wheel = wheel;
  return g;
}

// The binnacle: the box the compass lives in, standing just forward of the
// wheel where the man steering can see it.
function binnacle() {
  const g = new THREE.Group();
  g.add(box(0.52, 1.02, 0.52, HOUSE, 0, 0, 0));
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), BRASS);
  hood.position.y = 1.02;
  g.add(hood);
  return g;
}

// The windlass, forward: the barrel her cable comes in over, turned by
// handspikes through the holes in it.
function windlass() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.0, 8), OAK);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = 0.72;
  g.add(barrel);
  for (const side of [-1, 1]) {
    g.add(box(0.34, 1.05, 0.5, OAK, side * 1.62, 0, 0));
    const whelp = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 8), IRON);
    whelp.rotation.z = Math.PI / 2;
    whelp.position.set(side * 1.05, 0.72, 0);
    g.add(whelp);
  }
  return g;
}

// A hatch, or a scuttle: a raised coaming with a grating over it. This is how
// a man gets below, and it is the only sign on deck that there is a below.
function hatch(w, d) {
  const g = new THREE.Group();
  g.add(box(w, 0.34, d, OAK, 0, 0, 0));
  const grate = box(w - 0.16, 0.06, d - 0.16, IRON, 0, 0.3, 0);
  g.add(grate);
  return g;
}

// The galley, in a deckhouse: her cook's whole kingdom, and the only fire
// aboard except the try-works.
function galley() {
  const g = new THREE.Group();
  g.add(box(2.4, 1.85, 2.1, HOUSE, 0, 0, 0));
  g.add(box(2.55, 0.12, 2.25, TRIM, 0, 1.85, 0));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.85, 7), IRON);
  pipe.position.set(0.7, 2.38, -0.5);
  g.add(pipe);
  return g;
}

// The skids: spare spars laid across her amidships on stanchions, carrying the
// spare boats bottom-up. Documented -- she carried five boats on davits and
// two more stowed over the deck.
function skids(z) {
  const g = new THREE.Group();
  const half = beamAt(z) * 0.82;
  const high = 2.35;

  for (const dz of [-1.9, 1.9]) {
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, half * 2, 6), OAK);
    spar.rotation.z = Math.PI / 2;
    spar.position.set(0, high, dz);
    g.add(spar);
    for (const side of [-1, 1]) g.add(post(0.09, high, OAK, side * half * 0.82, 0, dz));
  }

  for (const [i, side] of [-1, 1].entries()) {
    const boat = whaleboat();
    boat.rotation.z = Math.PI;                 // bottom up, as they were stowed
    boat.position.set(side * half * 0.44, high + 0.5, i ? 0.1 : -0.1);
    g.add(boat);
  }
  return g;
}

export function makeDeckGear() {
  const group = new THREE.Group();

  const at = (thing, z, x = 0, lift = 0) => {
    thing.position.set(x, deckAt(z) + lift, z);
    group.add(thing);
    return thing;
  };

  // Aft: the wheel and the compass in front of it, abaft the mizzen.
  const wheel = at(helm(), -13.4);
  at(binnacle(), -12.0);
  at(hatch(1.5, 1.3), -11.0);                 // the companion down to the cabin

  at(skids(-5.4), -5.4);
  at(hatch(2.3, 2.0), -4.6);                  // the main hatch
  at(galley(), 2.6);
  at(hatch(1.4, 1.2), 8.2);                   // the fore scuttle, down to the forecastle
  at(windlass(), 12.6);

  // The helmsman turns her wheel as you put the helm over, which is the only
  // moving thing on deck that answers you directly.
  group.userData.update = (heldOver) => {
    wheel.userData.wheel.rotation.z += (heldOver * 2.4 - wheel.userData.wheel.rotation.z) * 0.08;
  };

  return group;
}
