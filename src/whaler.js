// What makes her a whaler rather than a merchantman.
//
// The hull and the rig are the same. What is different is on her deck: four
// whaleboats hung on davits ready to drop at a word, a brick furnace amidships
// with two iron pots in it for boiling out the oil, and a plank stage rigged
// outboard on the starboard side for the mates to stand on while they cut the
// blubber off a whale chained alongside.
//
// Dimensions are from the surviving vessels and from the standard boat: a
// whaleboat is about twenty-eight feet, double-ended so she may be backed off
// a whale as fast as she is pulled on to him, and light enough for six men to
// handle. The try-works is a brick oven roughly ten feet by eight.
import * as THREE from 'three';
import { deckAt, beamAt } from './hull.js';
import { HUE } from './palette.js';

const CEDAR = new THREE.MeshLambertMaterial({ color: HUE.cedar, flatShading: true });
const TRIM  = new THREE.MeshLambertMaterial({ color: HUE.trim, flatShading: true });
const IRON  = new THREE.MeshLambertMaterial({ color: HUE.iron, flatShading: true });
const BRICK = new THREE.MeshLambertMaterial({ color: HUE.brick, flatShading: true });
const PLANK = new THREE.MeshLambertMaterial({ color: HUE.spar, flatShading: true });

const BOAT_LEN = 8.6, BOAT_BEAM = 1.85, BOAT_DEPTH = 0.95;

// A whaleboat: double-ended, sharp at both ends, with a good sheer to her.
function whaleboat() {
  const g = new THREE.Group();
  const STATIONS = [-1, -0.78, -0.5, -0.16, 0.16, 0.5, 0.78, 1];
  const RINGS = [0, 0.42, 0.78, 1];

  const halfAt = (u) => (BOAT_BEAM / 2) * Math.pow(Math.max(0, 1 - u * u), 0.42);
  const keelAt = (u) => -BOAT_DEPTH * (1 - Math.pow(Math.abs(u), 2.4));
  const sheerAt = (u) => 0.16 + 0.30 * u * u;

  const pos = [], idx = [];
  const wide = RINGS.length * 2 - 1;
  for (const u of STATIONS) {
    const half = halfAt(u), keel = keelAt(u), sheer = sheerAt(u);
    for (let s = -(RINGS.length - 1); s <= RINGS.length - 1; s++) {
      const r = RINGS[Math.abs(s)];
      pos.push(Math.sign(s) * half * Math.pow(Math.sin(r * Math.PI / 2), 0.5),
               keel + r * (sheer - keel), u * BOAT_LEN / 2);
    }
  }
  for (let i = 0; i < STATIONS.length - 1; i++) {
    for (let j = 0; j < wide - 1; j++) {
      const a = i * wide + j, b = a + wide;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const skin = new THREE.BufferGeometry();
  skin.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  skin.setIndex(idx);
  skin.computeVertexNormals();
  const hull = new THREE.Mesh(skin, CEDAR);
  hull.castShadow = true;
  g.add(hull);

  // A dark sheer strake, thwarts, and the loggerhead in the stern the line
  // takes a turn round when the whale runs.
  const strake = new THREE.Mesh(new THREE.BoxGeometry(BOAT_BEAM * 1.02, 0.12, BOAT_LEN * 0.92), TRIM);
  strake.position.y = 0.30;
  g.add(strake);
  for (const at of [-0.5, -0.18, 0.16, 0.48]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(BOAT_BEAM * 0.86, 0.07, 0.22), PLANK);
    t.position.set(0, 0.16, at * BOAT_LEN / 2);
    g.add(t);
  }
  const logger = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.34, 6), PLANK);
  logger.position.set(0, 0.30, -BOAT_LEN / 2 + 0.7);
  g.add(logger);

  return g;
}

// The davits she hangs from: two curved arms over the side, with falls.
function davits(side) {
  const g = new THREE.Group();
  for (const at of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.075, 5, 8, Math.PI / 2), IRON);
    arm.rotation.y = side > 0 ? 0 : Math.PI;
    arm.position.set(0, 0, at * BOAT_LEN * 0.30);
    g.add(arm);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 1.5, 6), IRON);
    post.position.set(side * -1.15, -0.75, at * BOAT_LEN * 0.30);
    g.add(post);
  }
  return g;
}

// The try-works: a brick oven set on deck between the fore and main masts,
// with two iron pots in it. It is the only fire allowed aboard a wooden ship,
// and it is bricked up and kept wet underneath for that reason.
function tryWorks() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.35, 2.5), BRICK);
  base.position.y = 0.67;
  base.castShadow = true;
  g.add(base);

  for (const at of [-0.72, 0.72]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.44, 0.62, 12, 1, true), IRON);
    pot.position.set(at, 1.5, 0);
    pot.castShadow = true;
    g.add(pot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 4, 12), IRON);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(at, 1.8, 0);
    g.add(rim);
  }
  // The chimneys, and the goose-pen of water under the bricks.
  for (const at of [-0.72, 0.72]) {
    const flue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), BRICK);
    flue.position.set(at, 1.55, -1.1);
    g.add(flue);
  }
  return g;
}

// The cutting stage: two planks swung out over the starboard side on ropes,
// with a rail to lean against, where the mates stand with their spades.
function cuttingStage(x) {
  const g = new THREE.Group();
  const plank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 3.4), PLANK);
  plank.position.set(x > 0 ? 1.0 : -1.0, 0, 0);
  g.add(plank);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 3.4), PLANK);
  rail.position.set(x > 0 ? 2.0 : -2.0, 1.05, 0);
  g.add(rail);
  for (const at of [-1, 1]) {
    for (const out of [0.15, 1.95]) {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 5), PLANK);
      stanchion.position.set(x > 0 ? out : -out, 0.55, at * 1.6);
      g.add(stanchion);
    }
  }
  return g;
}

// Larboard is +x, starboard is -x. She carries three boats to larboard and one
// on the starboard quarter, which was the usual arrangement.
const BOATS = [
  { key: 'larboard bow',       side:  1, z:  7.2 },
  { key: 'larboard waist',     side:  1, z: -0.4 },
  { key: 'larboard quarter',   side:  1, z: -8.6 },
  { key: 'starboard quarter',  side: -1, z: -8.6 }
];

// The smoke of the try-works. A ship trying out could be seen for miles by
// the smoke of her, and smelt further.
function makeSmoke() {
  const g = new THREE.Group();
  const puffs = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      color: '#3a352f', transparent: true, opacity: 0.5, depthWrite: false
    }));
    m.userData.at = i / 14;
    g.add(m);
    puffs.push(m);
  }
  g.visible = false;
  g.userData.update = (t) => {
    if (!g.visible) return;
    for (const p of puffs) {
      const u = (p.userData.at + t * 0.12) % 1;
      const size = 1.2 + u * 7;
      p.scale.set(size, size, 1);
      p.position.set(Math.sin(u * 5 + p.userData.at * 9) * u * 5.5, 2.2 + u * 22,
                     -u * 7 + Math.cos(u * 4) * u * 2);
      p.material.opacity = 0.55 * (1 - u) * (1 - u);
    }
  };
  return g;
}

export function makeWhalerDeck() {
  const group = new THREE.Group();
  const boats = {};

  for (const b of BOATS) {
    const hang = new THREE.Group();
    const x = (beamAt(b.z) + 1.15) * b.side;
    hang.position.set(x, deckAt(b.z) + 2.75, b.z);
    group.add(hang);
    hang.add(davits(b.side));

    const boat = whaleboat();
    boat.position.y = -1.1;
    hang.add(boat);
    boats[b.key] = { hang, boat, side: b.side, z: b.z };
  }

  const works = tryWorks();
  works.position.set(0, deckAt(5.2), 5.2);
  group.add(works);

  const stage = cuttingStage(-1);
  stage.position.set(-beamAt(0.5), deckAt(0.5) + 0.4, 0.5);
  group.add(stage);

  const smoke = makeSmoke();
  smoke.position.set(0, deckAt(5.2) + 1.6, 5.2);
  group.add(smoke);

  return { group, boats, smoke };
}
