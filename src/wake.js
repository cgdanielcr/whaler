// The wake: a pale wedge of disturbed water trailing astern along the course
// she is actually making good, which is not quite the course she is steering.
import * as THREE from 'three';
import { waveHeight } from './sea.js';

const LENGTH = 130;   // metres astern
const ROWS = 26;

// Across the wake: nothing at the edges, most of it down the middle, so she
// has no hard rim where the disturbed water meets the sea.
const ACROSS = [-1, -0.62, -0.24, 0.24, 0.62, 1];
const SIDEWAYS = [0, 0.55, 1, 1, 0.55, 0];

export function makeWake() {
  const positions = [], colours = [], indices = [];
  for (let r = 0; r <= ROWS; r++) {
    const v = r / ROWS;
    const z = -17 - LENGTH * v;
    const halfWidth = 3.5 + 8.5 * Math.pow(v, 0.7);
    const fade = Math.pow(1 - v, 1.8) * Math.min(1, v * 5);
    for (let c = 0; c < ACROSS.length; c++) {
      positions.push(ACROSS[c] * halfWidth, 0, z);
      colours.push(0.86, 0.91, 0.93, fade * SIDEWAYS[c]);
    }
  }
  const wide = ACROSS.length;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < wide - 1; c++) {
      const a = r * wide + c, b = a + wide;
      indices.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 4));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
  }));
  mesh.renderOrder = 1;

  const position = geometry.attributes.position;

  // She lies on the water, so she has to ride the same swell the sea does.
  mesh.userData.update = (t, ox, oz, courseRad, knots) => {
    mesh.rotation.y = courseRad;
    // Bolder than she was. With the camera fixed on her and an open sea all
    // round, the wake is the one thing that says she is moving at all.
    mesh.material.opacity = Math.min(0.62, 0.06 + knots * 0.105);
    if (mesh.material.opacity < 0.01) return;
    const sin = Math.sin(courseRad), cos = Math.cos(courseRad);
    for (let i = 0; i < position.count; i++) {
      const lx = position.getX(i), lz = position.getZ(i);
      const wx = lx * cos + lz * sin + ox;      // where this scrap of wake lies on the sea
      const wz = -lx * sin + lz * cos + oz;
      position.setY(i, waveHeight(wx, wz, t) + 0.12);
    }
    position.needsUpdate = true;
  };

  return mesh;
}
