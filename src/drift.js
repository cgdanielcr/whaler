// Weed on the water, and why it is there.
//
// She is drawn at the centre of the screen and never moves; the sea moves
// under her. But a Gerstner sea is self-similar -- every wave looks like every
// other wave, and the crests run at ten metres a second of their own accord,
// which is four times her speed. So the eye has nothing to hold on to and she
// appears to sit still. That was the complaint, and no amount of wake fixes it
// on its own.
//
// What fixes it is things on the water that do not move: patches of kelp and
// sea wrack, fixed in the world, riding the swell but going nowhere. She runs
// past them, and because they are the only fixed things in sight, the eye
// tracks them and reads her motion off them.
//
// They are kept few and small, and they got smaller again once the swell was
// given a grain of its own: at the size they started they read as islands
// rather than as weed. This is a clean sea and it should stay one.
import * as THREE from 'three';
import { waveHeight } from './sea.js';
import { HUE } from './palette.js';

const COUNT = 30;
const REACH = 155;        // metres: beyond this she has left them behind
const LIFT = 0.45;        // clear of the sea's own displaced surface

// An irregular flat patch, drawn as one polygon so its edge is a line.
function patch(size) {
  const points = [];
  const sides = 7 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const r = size * (0.55 + Math.random() * 0.65);
    points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r * 0.62));
  }
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function makeDrift() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: HUE.weed, transparent: true, opacity: 0.6, depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6
  });
  const wrack = [];

  for (let i = 0; i < COUNT; i++) {
    const mesh = new THREE.Mesh(patch(1.4 + Math.random() * 3.0), material);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.renderOrder = 1;
    group.add(mesh);
    wrack.push({ mesh, x: 0, z: 0, seeded: false });
  }

  // Put one down somewhere she has not been, out at the edge of sight. On the
  // first call they are scattered all round her instead, so the sea is not
  // empty for the first two minutes.
  function sow(w, runX, runZ, courseRad, all) {
    const spread = all ? Math.random() : 0.72 + Math.random() * 0.28;
    const bearing = all
      ? Math.random() * Math.PI * 2
      : courseRad + (Math.random() - 0.5) * Math.PI * 1.1;   // mostly ahead of her
    const r = REACH * spread;
    w.x = runX + Math.sin(bearing) * r;
    w.z = runZ + Math.cos(bearing) * r;
    w.mesh.rotation.y = Math.random() * Math.PI * 2;
  }

  let sown = false;

  group.userData.update = (t, runX, runZ, courseRad) => {
    for (const w of wrack) {
      if (!sown) sow(w, runX, runZ, courseRad, true);

      const lx = w.x - runX, lz = w.z - runZ;
      if (lx * lx + lz * lz > REACH * REACH) {
        sow(w, runX, runZ, courseRad, false);
        continue;                       // let it settle next frame
      }
      w.mesh.position.set(lx, waveHeight(w.x, w.z, t) + LIFT, lz);
    }
    sown = true;
  };

  return group;
}
