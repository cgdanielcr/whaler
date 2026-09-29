// The pack ice: a sheet of snow-covered ice across the north, with a fringe
// of loose floes along its southern edge. The whole of it slides north and
// south with the season.
import * as THREE from 'three';
import { EDGE, seeded } from './world.js';

export function makePack(scene) {
  const rand = seeded(21), g = new THREE.Group();
  const W = EDGE * 2 + 240, D = 900;

  const sheet = new THREE.PlaneGeometry(W, D, 70, 70);
  sheet.rotateX(-Math.PI / 2);
  sheet.translate(0, 0.3, -D / 2 - 10);
  const p = sheet.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, 0.3 + rand() * 0.6);        // a hummocky surface
  const sheetMesh = new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ color: 0xe6eef3, flatShading: true, roughness: 0.8 }));
  sheetMesh.receiveShadow = true;
  g.add(sheetMesh);

  // Loose floes, thickest near the sheet and thinning southward.
  const N = 520, floe = new THREE.IcosahedronGeometry(1, 0);
  const floes = new THREE.InstancedMesh(floe, new THREE.MeshStandardMaterial({ color: 0xd9eaf2, flatShading: true, roughness: 0.6 }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const r = 1.5 + rand() * 3.5;
    m.compose(v.set((rand() * 2 - 1) * (W / 2), 0.1, 8 - Math.pow(rand(), 1.6) * 34),
      q.setFromAxisAngle(up, rand() * 6.3), s.set(r, r * 0.3, r * (0.7 + rand() * 0.6)));
    floes.setMatrixAt(i, m);
  }
  floes.receiveShadow = true;
  g.add(floes);
  scene.add(g);

  return {
    update(edge) {
      g.position.z = edge;
      g.visible = edge > -EDGE - 50;
    },
  };
}
