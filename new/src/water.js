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
  const deep = new THREE.Color(0x147f9e), shallow = new THREE.Color(0x5fd6cb), foam = new THREE.Color(0xe9fbf8), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (rand() - 0.5) * step * 0.7;
    const z = p.getZ(i) + (rand() - 0.5) * step * 0.7;
    p.setX(i, x); p.setZ(i, z);
    const t = Math.max(0, Math.min(1, 1 - (shoreX(z) - x) / 45));
    c.copy(deep).lerp(shallow, t * t).multiplyScalar(0.9 + rand() * 0.18);
    if (t > 0.86) c.lerp(foam, Math.min(0.75, (t - 0.86) * 5 * rand()));       // surf along the shore
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

  const uTime = { value: 0 }, uAmp = { value: 1 }, uDir = { value: new THREE.Vector2(1, 0) }, uCaps = { value: 0.3 };
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.32, metalness: 0.05,
    transparent: true, opacity: 0.86,
  });
  // The swell is worked out on the graphics card, so the whole sea can move.
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uTime, uAmp, uDir, uCaps });
    // The swell runs down the wind, with a cross sea over it; the crests catch the light and, when it blows, break white.
    shader.vertexShader = 'uniform float uTime;\nuniform float uAmp;\nuniform vec2 uDir;\nvarying float vCrest;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = vec3(position);
       float along = dot(position.xz, uDir), across = dot(position.xz, vec2(-uDir.y, uDir.x));
       float w = 0.24 * sin(along * 0.33 - uTime * 1.3) + 0.17 * sin(across * 0.27 + along * 0.11 - uTime * 0.9)
               + 0.10 * sin((along + across) * 0.71 - uTime * 2.1);
       transformed.y += uAmp * w;
       vCrest = w / 0.51;`);
    shader.fragmentShader = 'uniform float uCaps;\nvarying float vCrest;\n' + shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       diffuseColor.rgb += vec3(0.07, 0.15, 0.14) * smoothstep(0.0, 0.9, vCrest);
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.98, 0.97), uCaps * smoothstep(0.72, 0.98, vCrest));
       diffuseColor.rgb *= 1.0 - 0.2 * smoothstep(-0.05, -0.9, vCrest);`);
  };

  const sea = new THREE.Mesh(geo, mat);
  sea.receiveShadow = true;
  sea.renderOrder = -1;       // drawn before foam and spouts, so they sit on top
  scene.add(sea);

  // The bottom, seen dimly through the water.
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x0c4a63 }));
  bed.position.y = -8;
  scene.add(bed);

  // amp: how heavy the swell is; 1 in fair weather, more in a gale.
  // from: where the wind blows from; blow: how hard, by its drive.
  return {
    update(t, amp = 1, from = Math.PI, blow = 0.5) {
      uTime.value = t; uAmp.value = amp;
      uDir.value.set(-Math.cos(from), -Math.sin(from));
      uCaps.value += (Math.max(0, Math.min(0.85, (blow - 0.6) * 1.5)) - uCaps.value) * 0.02;
    },
  };
}
