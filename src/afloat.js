// Things in the water near her: the boats when they are down, and the whale.
//
// She never moves in the scene -- she sits at the origin and the sea streams
// past her -- so anything floating has to be carried astern by hand at the
// speed she is making, and swung round her as she alters course. Everything
// here is kept in her own frame: x to larboard, z forward.
import * as THREE from 'three';
import { HUE } from './palette.js';

const WHALE = new THREE.MeshLambertMaterial({ color: HUE.whale, flatShading: true });
const PALE  = new THREE.MeshLambertMaterial({ color: HUE.furled, flatShading: true });

// A sperm whale: one third of him is that blunt square head, which is the
// case of spermaceti that the whole trade was after.
export function makeWhale() {
  const g = new THREE.Group();
  const L = 16;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 0.42, L * 0.62, 9, 1), WHALE);
  body.rotation.z = Math.PI / 2;
  body.position.x = -L * 0.19;
  g.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(L * 0.36, 3.3, 2.9), WHALE);
  head.position.x = L * 0.30;
  g.add(head);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(L * 0.30, 0.4, 0.5), PALE);
  jaw.position.set(L * 0.26, -1.5, 0);
  g.add(jaw);

  for (const s of [-1, 1]) {
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 2.6), WHALE);
    fluke.position.set(-L * 0.50, 0.1, s * 1.5);
    fluke.rotation.y = s * 0.35;
    g.add(fluke);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.9), WHALE);
    fin.position.set(L * 0.10, -1.0, s * 1.9);
    g.add(fin);
  }
  g.userData.length = L;
  return g;
}

export function makeAfloat(scene) {
  const held = [];      // { obj, x, z, bob }

  return {
    // Put a thing in the water at a place in her own frame.
    add(obj, x, z) {
      obj.position.set(x, 0, z);
      scene.add(obj);
      held.push({ obj, x, z, bob: Math.random() * 6.28 });
      return obj;
    },

    // Move a thing toward a place, at so many metres a second.
    steer(obj, toX, toZ, rate, dt) {
      const it = held.find((h) => h.obj === obj);
      if (!it) return 0;
      const dx = toX - it.x, dz = toZ - it.z;
      const gap = Math.hypot(dx, dz);
      if (gap < 0.5) return 0;
      const step = Math.min(gap, rate * dt);
      it.x += (dx / gap) * step;
      it.z += (dz / gap) * step;
      return gap;
    },

    where(obj) {
      const it = held.find((h) => h.obj === obj);
      return it ? { x: it.x, z: it.z } : null;
    },

    drop(obj) {
      const i = held.findIndex((h) => h.obj === obj);
      if (i < 0) return;
      scene.remove(obj);
      held.splice(i, 1);
    },

    clear() { for (const h of [...held]) this.drop(h.obj); },

    // Her run carries them astern, and her turning swings them round her.
    tick(metres, turnedDegrees, shown) {
      const a = -turnedDegrees * Math.PI / 180;
      const c = Math.cos(a), s = Math.sin(a);
      for (const h of held) {
        const x = h.x * c + h.z * s;
        const z = -h.x * s + h.z * c;
        h.x = x;
        h.z = z - metres;
        h.obj.position.set(h.x, 0.25 + 0.35 * Math.sin(shown * 0.9 + h.bob), h.z);
      }
    }
  };
}
