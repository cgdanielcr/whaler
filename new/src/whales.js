// Whales: they wander the grounds, surface to blow and sound again. When the
// boats get fast to one she runs; if she gets away she sounds and is lost for
// a while; when she is killed she rolls fin out, and floats or sinks.
import * as THREE from 'three';
import { shoreX, EDGE, GROUNDS, wrap } from './world.js';
import { SPECIES, pickKind, bodyGeometry } from './species.js';

const rand = Math.random;
const COUNT = 16;
const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, side: THREE.DoubleSide });
const flukeMats = {};
const flukeMat = (kind) => (flukeMats[kind] ||= new THREE.MeshStandardMaterial({
  color: SPECIES[kind].color, flatShading: true, roughness: 0.6, side: THREE.DoubleSide }));

const FLUKES = (() => {
  const half = [[0.4, 0], [-0.3, 0.7], [-1.1, 2.1], [-2.3, 3.0], [-2.0, 1.7], [-1.7, 0.5], [-1.9, 0]];
  const pts = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [x, -y])];
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
  g.rotateX(-Math.PI / 2);
  return g;
})();

// Where each kind blows from and which way: [blowhole, direction], along her body.
const BLOWS = {
  v: [[[3.3, 1.1, -0.3], [0, 5, -0.9]], [[3.3, 1.1, 0.3], [0, 5, 0.9]]],   // two streams, a V
  forward: [[[5.3, 0.9, -0.5], [2.8, 3.8, -0.3]]],                          // the sperm whale's, bent forward
  column: [[[3.0, 1.0, 0], [0, 7, 0]]],                                     // one tall column
};
const PUFF = new THREE.IcosahedronGeometry(0.5, 0);

function whaleMesh(kind) {
  const g = new THREE.Group();
  g.rotation.order = 'YZX';                  // turn, then pitch, then roll about her length
  g.add(new THREE.Mesh(bodyGeometry(kind), bodyMat));
  const pivot = new THREE.Group();
  pivot.position.x = SPECIES[kind].body === 'fin' ? -5.8 : -5.3;
  pivot.add(new THREE.Mesh(FLUKES, flukeMat(kind)));
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
    const kind = pickKind(z, rand), sp = SPECIES[kind];
    const size = sp.size[0] + rand() * (sp.size[1] - sp.size[0]), k = (size - sp.size[0]) / (sp.size[1] - sp.size[0]);
    const group = whaleMesh(kind);
    group.scale.setScalar(size);
    group.position.set(x, -1, z);
    scene.add(group);
    list.push({
      kind, sp, group, size, barrels: Math.round((sp.bbl[0] + (sp.bbl[1] - sp.bbl[0]) * k) * (0.9 + rand() * 0.2)),
      heading: rand() * 6.3, turn: 0, state: 'free', phase: 'up', clock: 5 + rand() * 10, away: 0,
      diveT: 0, pitch: 0, spoutIn: rand() * 3, sighted: false, known: false, sinks: false, seed: rand() * 6,
      get surfaced() { return this.group.position.y > -1.2 && this.state !== 'dead'; },
    });
  }
  for (let i = 0; i < COUNT; i++) spawn(null);

  function blow(w) {
    for (const [h, d] of BLOWS[w.sp.blow]) {
      for (let k = 0; k < 5; k++) {
        const p = puffs[nextPuff++ % puffs.length];
        w.group.localToWorld(hole.set(...h));
        p.m.position.copy(hole);
        p.v.set(d[0] + (rand() - 0.5) * 0.6, d[1] * (0.8 + rand() * 0.4), d[2] + (rand() - 0.5) * 0.6).applyQuaternion(w.group.quaternion);
        p.age = -k * 0.05; p.m.visible = true;
      }
    }
  }

  function update(dt, t, ship) {
    for (const w of [...list]) {
      const g = w.group, p = g.position;
      if (w.state === 'dead') {
        w.clock += dt;
        g.rotation.x = Math.min(Math.PI, w.clock * 1.2);
        const down = w.clock > (w.sinks ? 2 : 6);
        p.y += ((down ? -10 : -0.6) - p.y) * Math.min(1, dt * (down ? 0.3 : 1));
        if (p.y < -8.5) { scene.remove(g); list.splice(list.indexOf(w), 1); spawn(ship); }
        continue;
      }
      if (w.state === 'escaped' && (w.away -= dt) <= 0) {
        w.state = 'free'; w.sighted = w.known = false;
      }
      const fleeing = w.state !== 'free';
      if (w.state === 'fast') w.phase = 'up';
      else if (w.state === 'free' && (w.clock -= dt) <= 0) {
        w.phase = w.phase === 'up' ? 'down' : 'up';
        w.clock = w.phase === 'up' ? 10 + rand() * 8 : 7 + rand() * 7;
        w.diveT = 0;
      }
      w.diveT += dt;

      if (fleeing) {                               // run from the ship
        const from = Math.atan2(p.z - ship.z, p.x - ship.x);
        w.heading += wrap(from - w.heading) * Math.min(1, dt * 0.5);
      } else {                                     // wander, and keep to the grounds
        w.turn = (w.turn + (rand() - 0.5) * dt * 0.6) * 0.98;
        w.heading += w.turn * dt;
      }
      if (p.x > shoreX(p.z) - 45 || Math.abs(p.z) > EDGE - 40 || p.x < -EDGE + 40) {
        w.heading += wrap(Math.atan2(-p.z, -200 - p.x) - w.heading) * Math.min(1, dt * 0.8);
      }
      const speed = fleeing ? w.sp.flee : w.sp.wander;
      p.x += Math.cos(w.heading) * speed * dt;
      p.z += Math.sin(w.heading) * speed * dt;
      p.y += ((w.phase === 'up' ? -0.35 : -5.5) - p.y) * Math.min(1, dt * 0.8);
      w.pitch += ((w.phase === 'down' && w.diveT < 3 ? -0.4 : 0) - w.pitch) * Math.min(1, dt * 2);
      g.rotation.set(0, -w.heading, w.pitch);
      g.userData.pivot.rotation.z = Math.sin(t * (fleeing ? 4 : 1.6) + w.seed) * 0.3;

      if (w.surfaced && (w.spoutIn -= dt) <= 0) { blow(w); w.spoutIn = fleeing ? 1.8 : 3.5 + rand() * 2; }
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

  const dist = (w, pos) => Math.hypot(w.group.position.x - pos.x, w.group.position.z - pos.z);
  return {
    list,
    update,
    within: (pos, r) => list.filter((w) => w.state === 'free' && dist(w, pos) < r),
    nearest(pos, r) {
      let best = null, bd = r;
      for (const w of list) if (w.state === 'free' && dist(w, pos) < bd) { best = w; bd = dist(w, pos); }
      return best;
    },
    hunt(w) { w.state = 'fast'; },
    escape(w) { Object.assign(w, { state: 'escaped', away: 25, phase: 'down', diveT: 0 }); },
    kill(w, sinks) { Object.assign(w, { state: 'dead', clock: 0, sinks }); },
  };
}
