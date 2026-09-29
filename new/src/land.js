// The coast to the east: shingle at the water, rock on the steep faces, snow
// on the tops, pines in the valleys, and a flat patch of ground for the town.
import * as THREE from 'three';
import { shoreX, EDGE, seeded } from './world.js';

// How much a point belongs to the town's flat ground, 0 to 1.
export function townness(z, d) {
  const a = Math.min(1, Math.max(0, 1 - (Math.abs(z) - 32) / 14));
  const b = Math.min(1, Math.max(0, 1 - (d - 42) / 14));
  return a * b;
}

// Height of the ground at a point; below the waterline off the coast.
export function groundHeight(x, z) {
  const d = x - shoreX(z);
  if (d < 0) return Math.max(-7, d * 0.5) - 0.6;
  const hills = 4 * Math.sin(x * 0.05 + z * 0.03) + 3 * Math.sin(z * 0.08 - x * 0.02) + 2 * Math.sin(x * 0.13 + z * 0.11);
  const h = 0.5 + Math.min(1, d / 12) * Math.max(1.2, 6 + hills + Math.max(0, d - 30) * 0.14);
  const town = townness(z, d);
  return h + (1.5 - h) * town;
}

export function makeLand(scene) {
  const rand = seeded(5);
  const x0 = 40, x1 = EDGE + 30, z0 = -EDGE - 30, z1 = EDGE + 30;
  const sx = 95, sz = 200;
  let geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, sx, sz);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = geo.attributes.position, jx = (x1 - x0) / sx * 0.35, jz = (z1 - z0) / sz * 0.35;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (rand() - 0.5) * 2 * jx, z = p.getZ(i) + (rand() - 0.5) * 2 * jz;
    p.setXYZ(i, x, groundHeight(x, z), z);
  }
  geo = geo.toNonIndexed();

  // One colour per facet, chosen by height and steepness.
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3();
  const SNOW = new THREE.Color(0xeef3f8), ROCK = new THREE.Color(0x5b6572), SHINGLE = new THREE.Color(0x4d585b);
  const TROD = new THREE.Color(0xc4cace), tint = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    n.subVectors(b, a).cross(e.subVectors(c, a)).normalize();
    const h = (a.y + b.y + c.y) / 3, cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3;
    let base = h < 0.35 ? SHINGLE : Math.abs(n.y) < 0.8 ? ROCK : SNOW;
    if (base === SNOW && townness(cz, cx - shoreX(cz)) > 0.6) base = TROD;
    tint.copy(base).multiplyScalar(0.93 + rand() * 0.1);
    for (let k = 0; k < 3; k++) col.set([tint.r, tint.g, tint.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();

  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  land.receiveShadow = true;
  land.castShadow = true;
  scene.add(land);
  scene.add(pines(rand));
}

// Pines in clumps: a dark lower cone and a paler top, drawn many at once.
function pines(rand) {
  const low = new THREE.ConeGeometry(1, 2.8, 6).translate(0, 1.4, 0);
  const top = new THREE.ConeGeometry(0.7, 2, 6).translate(0, 2.9, 0);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
  const N = 480, a = new THREE.InstancedMesh(low, mat(0x264b37), N), b = new THREE.InstancedMesh(top, mat(0x44705a), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let count = 0;
  for (let tries = 0; tries < 6000 && count < N; tries++) {
    const x = 96 + rand() * (EDGE - 80), z = (rand() * 2 - 1) * EDGE;
    const d = x - shoreX(z);
    if (d < 5 || townness(z, d) > 0.05) continue;
    if (Math.sin(x * 0.09) * Math.sin(z * 0.07) < -0.15) continue;      // clearings between clumps
    const h = groundHeight(x, z);
    if (h > 26) continue;
    const slope = Math.abs(groundHeight(x + 1, z) - groundHeight(x - 1, z)) + Math.abs(groundHeight(x, z + 1) - groundHeight(x, z - 1));
    if (slope > 1.8) continue;
    const k = 0.8 + rand() * 0.9;
    m.compose(v.set(x, h - 0.2, z), q.setFromAxisAngle(up, rand() * 6.3), s.set(k, k * (0.9 + rand() * 0.4), k));
    a.setMatrixAt(count, m); b.setMatrixAt(count, m); count++;
  }
  a.count = b.count = count;
  a.castShadow = b.castShadow = true;
  const g = new THREE.Group(); g.add(a, b);
  return g;
}
