// The port: a plank wharf on pilings, a crane at its head, barrels and
// crates, and a huddle of snowbound houses behind.
import * as THREE from 'three';
import { PIER, seeded } from './world.js';
import { groundHeight } from './land.js';
import { bake } from './bake.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...o });
const PILE = mat(0x3f2d20), BARREL = mat(0x6a4a2e), CRATE = mat(0x8b6a45), SNOW = mat(0xe9eef2);
const WALLS = [mat(0x6b4a33), mat(0x7a5536), mat(0x5c4232), mat(0x8a3f2e)];
const GLOW = mat(0xffc36b, { emissive: 0xffa53a, emissiveIntensity: 1.4 });

function box(w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  return b;
}

export function makePort(scene) {
  const g = new THREE.Group(), rand = seeded(7);
  const len = PIER.x1 - PIER.x0, mid = (PIER.x0 + PIER.x1) / 2, plank = 0.75;

  // Planks laid across the wharf, each a slightly different board.
  for (let z = PIER.z0; z < PIER.z1 - 0.01; z += plank) {
    const shade = new THREE.Color(0x7d5b3d).multiplyScalar(0.85 + rand() * 0.3);
    g.add(box(len, 0.3, plank * 0.94, mat(shade), mid, 1.2, z + plank / 2));
  }
  // Pilings along both edges.
  const pile = new THREE.CylinderGeometry(0.28, 0.3, 5, 6);
  for (let x = PIER.x0 + 1; x < PIER.x1; x += 4) {
    for (const z of [PIER.z0 + 0.3, PIER.z1 - 0.3]) {
      const p = new THREE.Mesh(pile, PILE); p.position.set(x, -1.3, z); g.add(p);
    }
  }
  // Barrels and crates on the planks.
  const barrel = new THREE.CylinderGeometry(0.36, 0.36, 0.9, 8);
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(barrel, BARREL);
    b.position.set(PIER.x0 + 8 + rand() * (len - 10), 1.8, PIER.z0 + 1 + rand() * 3);
    g.add(b);
  }
  for (let i = 0; i < 6; i++) {
    const s = 0.8 + rand() * 0.5;
    const c = box(s, s, s, CRATE, PIER.x0 + 10 + rand() * (len - 14), 1.35 + s / 2, PIER.z0 + 1 + rand() * 2);
    c.rotation.y = rand();
    g.add(c);
  }
  // A crane at the head of the wharf, for swaying up casks.
  g.add(box(0.4, 6, 0.4, PILE, PIER.x0 + 4, 4.3, PIER.z0 + 1));
  const arm = box(5, 0.3, 0.3, PILE, PIER.x0 + 2.2, 7, PIER.z0 + 1);
  arm.rotation.z = -0.35;
  g.add(arm);

  // The houses.
  const spots = [[104, -20, 0], [106, 15, 1], [117, -5, 0], [122, 23, 1], [129, -25, 0], [113, 31, 0], [133, 5, 1], [101, -2, 1]];
  for (const [x, z, turn] of spots) {
    const w = 5 + rand() * 3, d = 4 + rand() * 2.5, h = 3 + rand() * 1.5;
    const house = houseMesh(w, d, h, WALLS[Math.floor(rand() * WALLS.length)]);
    house.position.set(x, groundHeight(x, z), z);
    house.rotation.y = turn * Math.PI / 2 + (rand() - 0.5) * 0.2;
    g.add(house);
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(bake(g));
}

function houseMesh(w, d, h, walls) {
  const g = new THREE.Group();
  g.add(box(w, h, d, walls, 0, h / 2, 0));
  // A snow-covered roof: gable ends in the wall colour, slopes in snow.
  const tri = new THREE.Shape();
  tri.moveTo(-w / 2 - 0.4, 0); tri.lineTo(w / 2 + 0.4, 0); tri.lineTo(0, h * 0.65); tri.lineTo(-w / 2 - 0.4, 0);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d + 0.7, bevelEnabled: false }), [walls, SNOW]);
  roof.position.set(0, h, -(d + 0.7) / 2);
  g.add(roof);
  g.add(box(0.7, 1.8, 0.7, walls, w * 0.25, h + h * 0.5, d * 0.15));        // chimney
  for (const x of [-w * 0.25, w * 0.25]) g.add(box(0.7, 0.8, 0.08, GLOW, x, h * 0.5, d / 2 + 0.02));
  return g;
}
