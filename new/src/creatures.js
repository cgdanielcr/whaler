// The other lives on the sea: seals hauled out on the floes, a white bear on
// one of the bergs, porpoises that come leaping along with the ship for a
// while, and the ring of white water about a whale lying at the surface.
import * as THREE from 'three';
import { bake } from './bake.js';
import { seeded } from './world.js';

const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });

export function makeCreatures(scene, ice) {
  const rand = seeded(23), g = new THREE.Group();
  const SEAL = [mat(0x4a4f55), mat(0x6b6259)], BEAR = mat(0xf2ecd9), NOSE = mat(0x26221f);
  const blob = (r, m, x, y, z, sx, sy, sz, ry = 0) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.y = ry; g.add(o); };
  // Seals: on the flatter floes, in twos and threes.
  for (const f of ice.floes.filter((x) => x.r > 2.6 && x.r < 6).slice(0, 26)) {
    if (rand() < 0.45) continue;
    for (let i = 0, n = 1 + Math.floor(rand() * 3); i < n; i++) {
      const a = rand() * 6.3, d = rand() * f.r * 0.45, x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d, turn = rand() * 6.3, m = SEAL[i % 2];
      blob(0.42, m, x, 0.75, z, 1.9, 0.75, 0.85, turn);
      blob(0.2, m, x + Math.cos(turn) * 0.75, 0.95, z - Math.sin(turn) * 0.75, 1, 1, 1);
    }
  }
  // One white bear, on the largest berg, looking out to sea.
  const berg = [...ice.floes].sort((a, b) => b.r - a.r)[2];
  if (berg) {
    const [x, y, z] = [berg.x, berg.r * 0.86, berg.z];
    blob(0.7, BEAR, x, y + 0.75, z, 1.7, 1, 0.9); blob(0.36, BEAR, x + 1.25, y + 1.05, z, 1.2, 0.9, 0.85); blob(0.09, NOSE, x + 1.68, y + 1.05, z, 1, 1, 1);
    for (const [dx, dz] of [[0.7, 0.35], [0.7, -0.35], [-0.7, 0.35], [-0.7, -0.35]]) blob(0.22, BEAR, x + dx, y + 0.25, z + dz, 1, 1.5, 1);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(bake(g));

  // Porpoises: a small school, each a dark back that arcs out of the water and in again.
  const body = new THREE.IcosahedronGeometry(0.5, 0).scale(2.1, 0.75, 0.6), DARK = mat(0x2f3b44);
  const school = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(body, DARK); m.visible = false; m.castShadow = true; scene.add(m);
    return { m, lag: i * 0.37, side: i % 2 ? 1 : -1, off: 4.5 + (i % 3) * 1.6 };
  });
  let visit = 0, rest = 12;

  // The white water about a whale at the surface.
  const RINGS = 16, rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.72, 1, 12).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xe8f8f6, transparent: true, opacity: 0.4, depthWrite: false }), RINGS);
  rings.frustumCulled = false; rings.renderOrder = 0;
  scene.add(rings);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();

  return {
    update(dt, t, helm, whales, sailing) {
      // They come when she is making good way, stay a little, and are gone.
      if (visit > 0) visit -= dt; else if (sailing && helm.speed > 4 && (rest -= dt) <= 0) { visit = 9; rest = 25 + Math.random() * 40; }
      const c = Math.cos(helm.heading), s = Math.sin(helm.heading);
      for (const f of school) {
        f.m.visible = visit > 0;
        if (!f.m.visible) continue;
        const a = (t * 2.3 + f.lag * 6.3) % 6.283, along = 3 + f.lag * 5;
        f.m.position.set(helm.pos.x + c * along - s * f.side * f.off, Math.sin(a) * 1.1 - 0.45, helm.pos.z + s * along + c * f.side * f.off);
        f.m.rotation.set(0, -helm.heading, Math.cos(a) * 0.7);
      }
      whales.list.forEach((w, i) => {
        if (i >= RINGS) return;
        const up = w.surfaced && w.state !== 'dead' ? 1 : 0, k = up * (2.6 + 0.35 * Math.sin(t * 2 + i)) * w.size;
        m4.compose(p.set(w.group.position.x, 0.46, w.group.position.z), q.setFromAxisAngle(sc.set(0, 1, 0), -w.heading), sc.set(k * 2.1 + 0.0001, 1, k + 0.0001));
        rings.setMatrixAt(i, m4);
      });
      rings.instanceMatrix.needsUpdate = true;
    },
  };
}
