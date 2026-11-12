// Smoke: thin grey puffs from the galley stovepipe and from the chimneys of
// the town, rising and trailing away down the wind. All drawn at once.
import * as THREE from 'three';

const N = 90, LIFE = 4.5;

export function makeSmoke(scene) {
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshBasicMaterial({ color: 0xcfd3d6, transparent: true, opacity: 0.42, depthWrite: false }), N);
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  scene.add(mesh);
  const puffs = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), age: LIFE, big: 1 }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let next = 0, clock = 0;

  return {
    // sources: [{ x, y, z, big }] in the world. from: where the wind blows from; blow: how hard.
    update(dt, sources, from, blow) {
      if ((clock += dt) > 0.28) {
        clock = 0;
        for (const s of sources) { const f = puffs[next++ % N]; f.p.set(s.x, s.y, s.z); f.age = 0; f.big = s.big || 1; }
      }
      const dx = -Math.cos(from) * (0.8 + 3 * blow), dz = -Math.sin(from) * (0.8 + 3 * blow);
      puffs.forEach((f, i) => {
        f.age += dt;
        const k = f.age / LIFE, s = k >= 1 ? 0.0001 : (0.25 + k * 1.3) * f.big * Math.min(1, (1 - k) * 2.5);
        if (k < 1) { f.p.x += dx * dt * k; f.p.z += dz * dt * k; f.p.y += dt * (1.3 - k * 0.7); }
        m4.compose(f.p, q, sc.setScalar(s));
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
