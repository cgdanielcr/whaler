// Her bow: the catheads, her two bower anchors hung from them, and the bitts.
//
// An anchor is too heavy to bring aboard. When it is hove up it is catted --
// hoisted to a stout timber sticking out over the bow, the cathead -- and
// hung there ready to let go. While she rides to one, that one is gone from
// its cathead and its cable runs out of the hawse into the sea.
//
// Positions and sizes are inferred; that a ship of her size carried two
// bowers catted forward is not.
import * as THREE from 'three';
import { deckAt, beamAt } from './hull.js';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';

const lambert = (c) => cutLight(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
const OAK = lambert(HUE.spar), IRON = lambert(HUE.iron);

const CAT_Z = 14.0;           // where the catheads stand, just abaft the knightheads
const RAIL = 1.40;

const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
};

// An old-pattern anchor: a long iron shank, the wooden stock across its head,
// and two arms turned up at the crown, each ending in a fluke.
function anchor() {
  const g = new THREE.Group();
  const SHANK = 2.6;
  g.add(box(0.14, SHANK, 0.14, IRON, 0, -SHANK / 2, 0));
  g.add(box(0.2, 0.2, 2.2, OAK, 0, -0.15, 0));                 // the stock
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 4, 10), IRON));  // the ring
  for (const side of [-1, 1]) {
    const arm = box(0.12, 1.0, 0.12, IRON, side * 0.38, -SHANK + 0.25, 0);
    arm.rotation.z = side * 0.75;
    g.add(arm);
    g.add(box(0.36, 0.3, 0.06, IRON, side * 0.72, -SHANK + 0.55, 0));  // the fluke
  }
  return g;
}

// The cable, from her hawse down into the water ahead, while she rides to it.
function cable(side) {
  const from = new THREE.Vector3(side * 0.9, deckAt(16) + 0.2, 16.2);
  const to = new THREE.Vector3(side * 1.4, -3.5, 27);
  const len = from.distanceTo(to);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 5), IRON);
  m.position.copy(from).lerp(to, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return m;
}

export function makeBow() {
  const g = new THREE.Group();
  const top = deckAt(CAT_Z) + RAIL;
  const anchors = {};

  for (const side of [-1, 1]) {
    const x = beamAt(CAT_Z) * 0.97;
    const cat = box(0.3, 0.3, 1.7, OAK, side * (x + 0.45), top - 0.2, CAT_Z + 0.3);
    cat.rotation.y = side * 0.9;
    g.add(cat);

    const a = anchor();
    a.position.set(side * (x + 0.95), top - 0.35, CAT_Z + 0.75);
    a.rotation.y = side * 0.9;
    g.add(a);
    anchors[side] = a;
  }

  // The bitts, abaft the windlass: two posts and a crosspiece the cable is
  // turned round when she rides.
  const bz = 11.2, by = deckAt(bz);
  for (const side of [-1, 1]) g.add(box(0.36, 1.0, 0.36, OAK, side * 0.8, by + 0.5, bz));
  g.add(box(2.0, 0.26, 0.3, OAK, 0, by + 0.8, bz));

  // The larboard bower is the one she rides to.
  const riding = cable(1);
  g.add(riding);

  g.userData.update = (anchored) => {
    riding.visible = anchored;
    anchors[1].visible = !anchored;
  };
  return g;
}
