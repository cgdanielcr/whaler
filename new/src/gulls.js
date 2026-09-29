// Gulls: a few wheel over the harbour, a few follow the ship.
import * as THREE from 'three';
import { BERTH } from './world.js';

export function makeGulls(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, side: THREE.DoubleSide, flatShading: true });
  const wing = (z) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0.35, 0, 0, -0.3, 0, 0, -0.1, 0, z], 3));
    g.computeVertexNormals();
    return g;
  };
  const L = wing(1.1), R = wing(-1.1);
  const gulls = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group(), left = new THREE.Mesh(L, mat), right = new THREE.Mesh(R, mat);
    left.castShadow = right.castShadow = true;
    g.add(left, right);
    scene.add(g);
    gulls.push({ g, left, right, ship: i >= 5, r: 8 + Math.random() * 10, h: 9 + Math.random() * 5,
      speed: (0.35 + Math.random() * 0.3) * (i % 2 ? 1 : -1), phase: Math.random() * 6.3 });
  }
  const harbour = { x: BERTH.x + 12, z: BERTH.z };

  return {
    update(dt, t, ship) {
      for (const b of gulls) {
        const c = b.ship ? ship : harbour, a = b.phase + t * b.speed;
        b.g.position.set(c.x + Math.cos(a) * b.r, b.h + Math.sin(t + b.phase) * 0.5, c.z + Math.sin(a) * b.r);
        b.g.rotation.y = -(a + Math.sign(b.speed) * Math.PI / 2);
        const f = Math.sin(t * 7 + b.phase) * 0.5;
        b.left.rotation.x = -f; b.right.rotation.x = f;
      }
    },
  };
}
