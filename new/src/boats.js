// Whaleboats and the men in them. The ship carries boats on her davits; when
// she lowers for a whale, one or two pull away, get fast to her, and come back,
// unless the whale stoves one, when it rolls over and goes down.
import * as THREE from 'three';
import { bake } from './bake.js';

const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 });
const WHITE = mat(0xe4ddcc), INSIDE = mat(0x8c6c49), COAT = mat(0x27324a), FACE = mat(0xd4a27b), OAR = mat(0xcbb389);
const SIT = new THREE.CylinderGeometry(0.12, 0.17, 0.45, 5), STAND = new THREE.CylinderGeometry(0.12, 0.17, 0.75, 5);
const HEAD = new THREE.SphereGeometry(0.12, 6, 4), OAR_GEO = new THREE.BoxGeometry(0.07, 0.05, 2.6);

// A small figure of a man: a coat and a head.
export function figure(parent, x, y, z, standing) {
  const h = standing ? 0.75 : 0.45;
  const body = new THREE.Mesh(standing ? STAND : SIT, COAT);
  body.position.set(x, y + h / 2, z);
  const head = new THREE.Mesh(HEAD, FACE);
  head.position.set(x, y + h + 0.1, z);
  parent.add(body, head);
}

let hullGeo = null;
function boatHull() {
  if (hullGeo) return hullGeo;
  const s = new THREE.Shape();          // pointed at both ends, like the real thing
  s.moveTo(2, 0); s.quadraticCurveTo(0.9, 0.5, 0, 0.5); s.quadraticCurveTo(-0.9, 0.5, -2, 0);
  s.quadraticCurveTo(-0.9, -0.5, 0, -0.5); s.quadraticCurveTo(0.9, -0.5, 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: false, curveSegments: 5 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.3, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setZ(i, p.getZ(i) * 0.4);
  g.computeVertexNormals();
  return (hullGeo = g);
}

export function boatMesh(manned) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(boatHull(), [INSIDE, WHITE]));
  g.userData.oars = [];
  if (manned) {
    for (let i = 0; i < 5; i++) {
      const x = 1.2 - i * 0.6, side = i % 2 ? 1 : -1;
      figure(g, x, 0.1, -side * 0.12, false);
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.35, side * 0.42);
      const oar = new THREE.Mesh(OAR_GEO, OAR);
      oar.position.z = side * 1.1;
      pivot.add(oar);
      g.add(pivot);
      g.userData.oars.push({ pivot, side, i });
    }
    figure(g, -1.7, 0.05, 0, true);     // the mate at the steering oar
    figure(g, 1.75, 0.05, 0, true);     // the boatsteerer in the bow
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeBoats(scene) {
  const boats = [];
  const active = () => boats.filter((b) => b.userData.mode !== 'stove');
  let reach = () => true;                   // asked when a boat comes up with the whale: does the dart go home?
  return {
    get fast() { const a = active(); return a.length > 0 && a.every((b) => b.userData.mode === 'fast'); },
    get aboard() { return boats.length === 0; },
    get out() { return active().length; },
    // The crews (by boat number) now fast to the whale.
    fastCrews: () => active().filter((b) => b.userData.mode === 'fast').map((b) => b.userData.crew),
    isOut: (crew) => boats.some((b) => b.userData.crew === crew && b.userData.mode !== 'stove'),
    onReach(fn) { reach = fn; },

    // crews: [{ crew: boat number, pull: how fast her oarsmen pull, 1 for ordinary }]
    launch(pos, heading, crews) {
      crews.forEach(({ crew, pull }, i) => {
        const side = crews.length === 1 ? 1 : i ? 1 : -1;
        const b = boatMesh(true);
        bake(b, b.userData.oars.map((o) => o.pivot));
        b.rotation.order = 'YXZ';           // so she can roll over along her length
        b.position.set(pos.x - Math.sin(heading) * side * 3.2, 0, pos.z + Math.cos(heading) * side * 3.2);
        Object.assign(b.userData, { mode: 'out', side, heading, crew, pull, wait: 0 });
        scene.add(b);
        boats.push(b);
      });
    },

    recall() { for (const b of active()) b.userData.mode = 'home'; },

    // The whale smashes one of the boats, fast ones first. Says which, and on which side.
    stove() {
      const a = active(), f = a.filter((b) => b.userData.mode === 'fast'), pool = f.length ? f : a;
      const b = pool[Math.floor(Math.random() * pool.length)];
      b.userData.mode = 'stove'; b.userData.sunk = 0;
      return { crew: b.userData.crew, side: b.userData.side < 0 ? 'larboard' : 'starboard' };
    },

    update(dt, t, whale, ship) {
      for (const b of [...boats]) {
        const u = b.userData;
        if (u.mode === 'stove') {                    // over she goes, and down
          u.sunk += dt;
          b.rotation.x = Math.min(Math.PI, u.sunk * 2.5);
          b.position.y = u.sunk < 2 ? 0.1 : 0.1 - (u.sunk - 2) * 1.5;
          if (u.sunk > 5) { scene.remove(b); boats.splice(boats.indexOf(b), 1); }
          continue;
        }
        if (!whale || whale.state !== 'fast') u.mode = 'home';
        let tx = ship.x, tz = ship.z, speed = 8 * u.pull;
        if (u.mode !== 'home') {                       // make for the whale's flank
          const h = whale.heading, w = whale.group.position, off = 3.4 * whale.size;
          tx = w.x - Math.cos(h) * 1.5 - Math.sin(h) * u.side * off;
          tz = w.z - Math.sin(h) * 1.5 + Math.cos(h) * u.side * off;
          speed = 7 * u.pull;
        }
        const dx = tx - b.position.x, dz = tz - b.position.z, d = Math.hypot(dx, dz);
        if (u.mode === 'missed' && (u.wait -= dt) <= 0) u.mode = 'out';       // the line is coiled down again
        if (u.mode === 'out' && d < 1.5) u.mode = reach(u.crew) ? 'fast' : (u.wait = 3, 'missed');
        if (u.mode === 'home' && d < 3.5) { scene.remove(b); boats.splice(boats.indexOf(b), 1); continue; }
        if (u.mode === 'fast') {                        // towed along beside her
          b.position.x = tx; b.position.z = tz; u.heading = whale.heading;
        } else if (u.mode !== 'missed' && d > 0.01) {
          const step = Math.min(d, speed * dt);
          b.position.x += (dx / d) * step; b.position.z += (dz / d) * step;
          u.heading = Math.atan2(dz, dx);
        }
        b.rotation.y = -u.heading;
        b.position.y = 0.12 + Math.sin(t * 2 + u.side) * 0.06;
        for (const o of u.oars) {                       // pull, or peak the oars when fast
          const rowing = u.mode === 'out' || u.mode === 'home';
          o.pivot.rotation.y = rowing ? Math.sin(t * 5.5 * u.pull) * 0.45 * o.side : 0;
          o.pivot.rotation.x = rowing ? o.side * 0.3 : -o.side * 0.45;
        }
      }
    },
  };
}
