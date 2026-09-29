// The wake: patches of foam shed from either quarter as she moves, spreading
// and fading behind her.
import * as THREE from 'three';

const LIFE = 3.2;

export function makeWake(scene) {
  const geo = new THREE.CircleGeometry(1, 7).rotateX(-Math.PI / 2);
  const pool = [];
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xe8f6f8, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    m.renderOrder = 1;
    scene.add(m);
    pool.push({ m, age: LIFE, dx: 0, dz: 0 });
  }
  let next = 0, run = 0;

  return {
    update(dt, pos, heading, speed) {
      run += dt * speed;
      const c = Math.cos(heading), s = Math.sin(heading);
      if (run > 1.3 && speed > 0.5) {
        run = 0;
        for (const side of [-1, 1]) {
          const f = pool[next++ % pool.length];
          f.m.position.set(pos.x - c * 5.8 - s * side * 1.3, 0.56, pos.z - s * 5.8 + c * side * 1.3);
          f.dx = -s * side * 0.7; f.dz = c * side * 0.7;
          f.age = 0; f.m.visible = true;
        }
      }
      for (const f of pool) {
        if (f.age >= LIFE) { f.m.visible = false; continue; }
        f.age += dt;
        const k = f.age / LIFE;
        f.m.position.x += f.dx * dt; f.m.position.z += f.dz * dt;
        f.m.scale.setScalar(0.6 + k * 2.4);
        f.m.material.opacity = 0.45 * (1 - k);
      }
    },
  };
}
