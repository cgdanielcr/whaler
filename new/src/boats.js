// Whaleboats and the men in them. The ship carries boats on her davits; when
// she lowers for a whale, two pull away, get fast to her, and come back.
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
  return {
    get fast() { return boats.length > 0 && boats.every((b) => b.userData.mode === 'fast'); },
    get aboard() { return boats.length === 0; },

    launch(pos, heading) {
      for (const side of [-1, 1]) {
        const b = boatMesh(true);
        bake(b, b.userData.oars.map((o) => o.pivot));
        b.position.set(pos.x - Math.sin(heading) * side * 3.2, 0, pos.z + Math.cos(heading) * side * 3.2);
        Object.assign(b.userData, { mode: 'out', side, heading });
        scene.add(b);
        boats.push(b);
      }
    },

    recall() { for (const b of boats) b.userData.mode = 'home'; },

    update(dt, t, whale, ship) {
      for (const b of [...boats]) {
        const u = b.userData;
        if (!whale || whale.state !== 'fast') u.mode = 'home';
        let tx = ship.x, tz = ship.z, speed = 8;
        if (u.mode !== 'home') {                       // make for the whale's flank
          const h = whale.heading, w = whale.group.position, off = 3.4 * whale.size;
          tx = w.x - Math.cos(h) * 1.5 - Math.sin(h) * u.side * off;
          tz = w.z - Math.sin(h) * 1.5 + Math.cos(h) * u.side * off;
          speed = 7;
        }
        const dx = tx - b.position.x, dz = tz - b.position.z, d = Math.hypot(dx, dz);
        if (u.mode === 'out' && d < 1.5) u.mode = 'fast';
        if (u.mode === 'home' && d < 3.5) { scene.remove(b); boats.splice(boats.indexOf(b), 1); continue; }
        if (u.mode === 'fast') {                        // towed along beside her
          b.position.x = tx; b.position.z = tz; u.heading = whale.heading;
        } else if (d > 0.01) {
          const step = Math.min(d, speed * dt);
          b.position.x += (dx / d) * step; b.position.z += (dz / d) * step;
          u.heading = Math.atan2(dz, dx);
        }
        b.rotation.y = -u.heading;
        b.position.y = 0.12 + Math.sin(t * 2 + u.side) * 0.06;
        for (const o of u.oars) {                       // pull, or peak the oars when fast
          const rowing = u.mode !== 'fast';
          o.pivot.rotation.y = rowing ? Math.sin(t * 5.5) * 0.45 * o.side : 0;
          o.pivot.rotation.x = rowing ? o.side * 0.3 : -o.side * 0.45;
        }
      }
    },
  };
}
