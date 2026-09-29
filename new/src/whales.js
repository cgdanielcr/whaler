// Whales: bowheads that wander the grounds, surface to blow and sound again.
// When the boats get fast to one she runs; when she is killed she rolls fin
// out and sinks, and another appears somewhere out of sight.
import * as THREE from 'three';
import { shoreX, EDGE, GROUNDS, wrap } from './world.js';

const rand = Math.random;
const COUNT = 12;
const DARK = new THREE.Color(0x34404c), PALE = new THREE.Color(0xd3d7da);
const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 });
const flukeMat = new THREE.MeshStandardMaterial({ color: 0x34404c, flatShading: true, roughness: 0.6, side: THREE.DoubleSide });

// A body turned on a lathe, the great head forward, a white chin under it.
const BODY = (() => {
  const pts = [[0, 5.2], [1.0, 4.7], [1.6, 3.4], [1.8, 1.4], [1.6, -0.8], [1.15, -2.6], [0.65, -4], [0.3, -5], [0.16, -5.6]];
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 8);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, 0.72, 1);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const c = p.getY(i) < -0.4 && p.getX(i) > 2.6 ? PALE : DARK;
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
})();

const FLUKES = (() => {
  const half = [[0.4, 0], [-0.3, 0.7], [-1.1, 2.1], [-2.3, 3.0], [-2.0, 1.7], [-1.7, 0.5], [-1.9, 0]];
  const pts = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [x, -y])];
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
  g.rotateX(-Math.PI / 2);
  return g;
})();

// Puffs of a spout, shared by all the whales.
const PUFF = new THREE.IcosahedronGeometry(0.5, 0);

function whaleMesh() {
  const g = new THREE.Group();
  g.rotation.order = 'YZX';                  // turn, then pitch, then roll about her length
  g.add(new THREE.Mesh(BODY, bodyMat));
  const pivot = new THREE.Group();
  pivot.position.x = -5.3;
  pivot.add(new THREE.Mesh(FLUKES, flukeMat));
  g.add(pivot);
  g.userData.pivot = pivot;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeWhales(scene) {
  const list = [], puffs = [];
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(PUFF, new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; m.renderOrder = 2;
    scene.add(m);
    puffs.push({ m, age: 99, v: new THREE.Vector3() });
  }
  let nextPuff = 0;
  const hole = new THREE.Vector3();

  function spawn(away) {
    let x, z, tries = 0;
    do {
      z = (rand() * 2 - 1) * (EDGE - 40);
      x = GROUNDS.x0 + rand() * (GROUNDS.x1 - GROUNDS.x0);
    } while ((x > shoreX(z) - 40 || (away && Math.hypot(x - away.x, z - away.z) < 110)) && tries++ < 60);
    const group = whaleMesh(), size = 0.8 + rand() * 0.45;
    group.scale.setScalar(size);
    group.position.set(x, -1, z);
    scene.add(group);
    list.push({
      group, size, barrels: Math.round(35 + (size - 0.8) * 140 + rand() * 15),
      heading: rand() * 6.3, turn: 0, state: 'free', phase: 'up', clock: 5 + rand() * 10,
      diveT: 0, pitch: 0, spoutIn: rand() * 3, sighted: false, seed: rand() * 6,
      get surfaced() { return this.group.position.y > -1.2 && this.state !== 'dead'; },
    });
  }
  for (let i = 0; i < COUNT; i++) spawn(null);

  // A bowhead blows a V: two streams from the twin blowholes.
  function blow(w) {
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1, p = puffs[nextPuff++ % puffs.length];
      w.group.localToWorld(hole.set(3.3, 1.1, side * 0.3));
      p.m.position.copy(hole);
      p.v.set((rand() - 0.5) * 0.6, 4 + rand() * 3, 0);
      p.v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -w.heading);
      p.v.z += side * 0.9 * Math.cos(w.heading); p.v.x += -side * 0.9 * Math.sin(w.heading);
      p.age = -k * 0.04; p.m.visible = true;
    }
  }

  function update(dt, t, ship) {
    for (const w of [...list]) {
      const g = w.group, p = g.position;
      if (w.state === 'dead') {
        w.clock += dt;
        g.rotation.x = Math.min(Math.PI, w.clock * 1.2);
        p.y += ((w.clock > 5 ? -10 : -0.6) - p.y) * Math.min(1, dt * (w.clock > 5 ? 0.25 : 1));
        if (p.y < -8.5) { scene.remove(g); list.splice(list.indexOf(w), 1); spawn(ship); }
        continue;
      }
      const fast = w.state === 'fast';
      if (fast) w.phase = 'up';
      else if ((w.clock -= dt) <= 0) {
        w.phase = w.phase === 'up' ? 'down' : 'up';
        w.clock = w.phase === 'up' ? 10 + rand() * 8 : 7 + rand() * 7;
        w.diveT = 0;
      }
      w.diveT += dt;

      if (fast) {                                  // run from the ship
        const away = Math.atan2(p.z - ship.z, p.x - ship.x);
        w.heading += wrap(away - w.heading) * Math.min(1, dt * 0.5);
      } else {                                     // wander, and keep to the grounds
        w.turn = (w.turn + (rand() - 0.5) * dt * 0.6) * 0.98;
        w.heading += w.turn * dt;
        if (p.x > shoreX(p.z) - 45 || Math.abs(p.z) > EDGE - 40 || p.x < -EDGE + 40) {
          w.heading += wrap(Math.atan2(-p.z, -200 - p.x) - w.heading) * Math.min(1, dt * 0.8);
        }
      }
      const speed = fast ? 2.2 : 1.4;
      p.x += Math.cos(w.heading) * speed * dt;
      p.z += Math.sin(w.heading) * speed * dt;
      p.y += ((w.phase === 'up' ? -0.35 : -5.5) - p.y) * Math.min(1, dt * 0.8);
      w.pitch += ((w.phase === 'down' && w.diveT < 3 ? -0.4 : 0) - w.pitch) * Math.min(1, dt * 2);
      g.rotation.set(0, -w.heading, w.pitch);
      g.userData.pivot.rotation.z = Math.sin(t * (fast ? 4 : 1.6) + w.seed) * 0.3;

      if (w.surfaced && (w.spoutIn -= dt) <= 0) { blow(w); w.spoutIn = fast ? 1.8 : 3.5 + rand() * 2; }
    }
    for (const p of puffs) {
      if (p.age > 1.8) { p.m.visible = false; continue; }
      p.age += dt;
      if (p.age < 0) continue;
      p.m.position.addScaledVector(p.v, dt);
      p.v.multiplyScalar(1 - Math.min(1, dt * 1.6));
      p.m.scale.setScalar(0.4 + p.age * 1.6);
      p.m.material.opacity = 0.8 * (1 - p.age / 1.8);
    }
  }

  const near = (w, pos, r) => Math.hypot(w.group.position.x - pos.x, w.group.position.z - pos.z) < r;
  return {
    list,
    update,
    within: (pos, r) => list.filter((w) => w.state === 'free' && near(w, pos, r)),
    nearest(pos, r) {
      let best = null, bd = r;
      for (const w of list) {
        const d = Math.hypot(w.group.position.x - pos.x, w.group.position.z - pos.z);
        if (w.state === 'free' && d < bd) { best = w; bd = d; }
      }
      return best;
    },
    hunt(w) { w.state = 'fast'; },
    kill(w) { w.state = 'dead'; w.clock = 0; },
  };
}
