// The sea: a faceted, moving surface, deep blue offshore and paler over the
// shallows, a little see-through so a sounding whale shows as a dark shape.
import * as THREE from 'three';
import { shoreX, EDGE, seeded } from './world.js';

export function makeWater(scene) {
  const rand = seeded(3);
  const size = EDGE * 2 + 60, seg = 150, step = size / seg;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);

  const p = geo.attributes.position, col = [];
  const deep = new THREE.Color(0x13698a), shallow = new THREE.Color(0x3fb4be), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (rand() - 0.5) * step * 0.7;
    const z = p.getZ(i) + (rand() - 0.5) * step * 0.7;
    p.setX(i, x); p.setZ(i, z);
    const t = Math.max(0, Math.min(1, 1 - (shoreX(z) - x) / 45));
    c.copy(deep).lerp(shallow, t * t).multiplyScalar(0.9 + rand() * 0.18);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

  const uTime = { value: 0 }, uAmp = { value: 1 };
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.32, metalness: 0.05,
    transparent: true, opacity: 0.82,
  });
  // The swell is worked out on the graphics card, so the whole sea can move.
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.uniforms.uAmp = uAmp;
    shader.vertexShader = 'uniform float uTime;\nuniform float uAmp;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = vec3(position);
       transformed.y += uAmp * (0.22 * sin(position.x * 0.31 + uTime * 1.2)
                      + 0.20 * sin(position.z * 0.27 - uTime * 0.9)
                      + 0.10 * sin((position.x - position.z) * 0.7 + uTime * 2.1));`);
  };

  const sea = new THREE.Mesh(geo, mat);
  sea.receiveShadow = true;
  sea.renderOrder = -1;       // drawn before foam and spouts, so they sit on top
  scene.add(sea);

  // The bottom, seen dimly through the water.
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x0b3f56 }));
  bed.position.y = -8;
  scene.add(bed);

  // amp: how heavy the swell is; 1 in fair weather, more in a gale.
  return { update(t, amp = 1) { uTime.value = t; uAmp.value = amp; } };
}
