// Ice: flat floes and a few tall bergs scattered over the sea. The ship
// cannot sail through them.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { shoreX, EDGE, BERTH, seeded } from './world.js';
import { bake } from './bake.js';

export function makeIce(scene) {
  const rand = seeded(11), floes = [], all = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f8fb, flatShading: true, roughness: 0.55 });
  const blue = new THREE.MeshStandardMaterial({ color: 0xd6ebf3, flatShading: true, roughness: 0.55 });

  for (let tries = 0; floes.length < 85 && tries < 3000; tries++) {
    const z = (rand() * 2 - 1) * (EDGE - 20);
    const x = -EDGE + 20 + rand() * (shoreX(z) - 14 + EDGE - 20);
    if (Math.hypot(x - BERTH.x, z - BERTH.z) < 55) continue;          // keep the harbour clear
    const berg = rand() < 0.15;
    const r = berg ? 5 + rand() * 6 : 1.5 + rand() * rand() * 8;
    if (floes.some((f) => Math.hypot(f.x - x, f.z - z) < f.r + r + 4)) continue;

    let geo = new THREE.IcosahedronGeometry(r, 1);
    geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * (0.8 + rand() * 0.4), p.getY(i) * (0.8 + rand() * 0.4), p.getZ(i) * (0.8 + rand() * 0.4));
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, berg ? white : blue);
    mesh.scale.y = berg ? 0.9 : 0.22;
    mesh.position.set(x, berg ? 0.4 : 0.05, z);
    mesh.rotation.y = rand() * 6.3;
    all.add(mesh);
    floes.push({ x, z, r });
  }
  scene.add(bake(all));        // all the ice drawn as two shapes

  return {
    floes,
    // Shove a point out of any floe it has run into. True if it hit one.
    push(pos, radius) {
      let hit = false;
      for (const f of floes) {
        const dx = pos.x - f.x, dz = pos.z - f.z, d = Math.hypot(dx, dz), min = f.r * 0.9 + radius;
        if (d < min && d > 0.001) {
          pos.x = f.x + (dx / d) * min;
          pos.z = f.z + (dz / d) * min;
          hit = true;
        }
      }
      return hit;
    },
  };
}
