// The light on the point north of the harbour: a white tower with a red
// lantern, and a beam that sweeps round. It is the mark for home.
import * as THREE from 'three';
import { shoreX } from './world.js';
import { groundHeight } from './land.js';

export const LIGHT = { z: -46 };

export function makeLighthouse(scene) {
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, ...o });
  const x = shoreX(LIGHT.z) + 5, y = groundHeight(x, LIGHT.z), g = new THREE.Group();
  const add = (geo, m, h) => { const o = new THREE.Mesh(geo, m); o.position.y = h; o.castShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(2.2, 2.6, 1.2, 8), mat(0x6f7780), 0.6);
  add(new THREE.CylinderGeometry(1.1, 1.7, 9, 8), mat(0xf4f1ea), 5.7);
  add(new THREE.CylinderGeometry(1.2, 1.25, 0.9, 8), mat(0xb5392c), 6.2);                  // a red band
  add(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 8), mat(0x2b2d30), 10.3);
  add(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 8), mat(0xffe9a8, { emissive: 0xffc04a, emissiveIntensity: 2 }), 11.1);
  add(new THREE.ConeGeometry(1.2, 1.2, 8), mat(0xb5392c), 12.35);
  const keeper = add(new THREE.BoxGeometry(4, 2.6, 3.2), mat(0xe8e2d6), 1.3); keeper.position.x = 4;
  const roof = add(new THREE.ConeGeometry(3.1, 1.6, 4), mat(0xb5392c), 3.4); roof.position.x = 4; roof.rotation.y = Math.PI / 4;
  g.position.set(x, y, LIGHT.z);
  scene.add(g);

  // The beam: two long pale wedges of light, turning.
  const wedge = new THREE.BufferGeometry();
  wedge.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 55, 1.5, -7, 55, 1.5, 7, 0, 0, 0, -55, 1.5, 7, -55, 1.5, -7], 3));
  const beam = new THREE.Mesh(wedge, new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.12, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(x, y + 11.1, LIGHT.z); beam.renderOrder = 3;
  scene.add(beam);

  return {
    // dim: how thick or dark the weather is, 0 to 1. The thicker, the brighter the beam shows.
    update(t, dim) { beam.rotation.y = t * 0.5; beam.material.opacity = 0.07 + 0.2 * dim; },
  };
}
