// The sky, drawn rather than rendered.
//
// Three flat bands of blue with hard steps between them, a flat sun, and
// cloud cut out of a noise sheet with a hard edge so it reads as paper rather
// than as vapour. Two tones to the cloud: the lit body and the heavier core
// under it.
//
// The cloud lies on a ceiling far overhead, so it piles up and closes toward
// the horizon the way real cloud does. How far that projection may stretch is
// clamped, which is what stops it tearing into stripes at the sea line.
//
// It costs two texture lookups a pixel. The noise that made the cloud was
// worked out once, at load, on the processor.
import * as THREE from 'three';
import { cloudSheet } from './clouds.js';
import { HUE } from './palette.js';
import { INK, PLATE } from './hatch.js';

export const HORIZON_COLOUR = new THREE.Color('#a8c4d4');

export function makeSky() {
  const uniforms = {
    ...INK,
    high:  { value: HUE.skyHigh },
    low:   { value: HUE.skyLow },
    lit:   { value: HUE.cloudLit },
    dim:   { value: HUE.cloudDim },
    sheet: { value: cloudSheet({ seed: 3, cover: 0.46, edge: 0.04, billow: true }) },
    veil:  { value: cloudSheet({ seed: 11, cover: 0.34, edge: 0.05, billow: false, octaves: 3 }) },
    drift: { value: new THREE.Vector2() },
    sun:   { value: new THREE.Vector3(0.76, 0.55, 0.28).normalize() },
    gloom: { value: 0 }
  };

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: PLATE + `
      out vec4 fragOut;

      uniform vec3 high;
      uniform vec3 low;
      uniform vec3 lit;
      uniform vec3 dim;
      uniform sampler2D sheet;
      uniform sampler2D veil;
      uniform vec2 drift;
      uniform vec3 sun;
      uniform float gloom;
      varying vec3 vPos;

      void main() {
        vec3 d = normalize(vPos);
        float h = clamp(d.y, -1.0, 1.0);

        // Three flat bands, with a step between them rather than a fade.
        vec3 col = low;
        col = mix(col, mix(low, high, 0.5), step(0.14, h));
        col = mix(col, high, step(0.42, h));

        // A flat sun, sitting where the light actually comes from. It goes
        // behind the cloud, as it should.
        col = mix(col, lit, step(0.9975, dot(d, sun)) * (1.0 - gloom * 0.6));

        // The cloud, on its ceiling. Where the projection begins to stretch it
        // is faded out rather than clamped: clamping smears one patch of it
        // round the whole horizon and hangs it there in curtains.
        float up = max(h, 0.05);
        vec2 ceiling = d.xz / up;
        float a = texture2D(sheet, ceiling * 0.090 + drift).a;
        float b = texture2D(veil,  ceiling * 0.038 + drift * 0.55 + 0.37).a;
        float near = smoothstep(0.05, 0.24, h);

        // Cut, not faded. Two thresholds on the one sheet give the lit body
        // and the heavier core under it.
        col = mix(col, mix(lit, dim, 0.45), step(0.5, b) * step(0.35, near) * 0.8);
        col = mix(col, lit, step(0.5, a) * step(0.35, near));
        col = mix(col, dim, step(0.78, a) * step(0.35, near));

        if (uInked > 0.5) {
          // An engraved sky is mostly bare paper: a few lines in the blue, a
          // few more in the underside of the cloud, and nothing at all in the
          // lit heads of it. And its ruling is turned across the water's, so
          // the two do not run together at the horizon.
          float value = 0.46 + dot(col, GREY) * 0.60;
          col = mix(col, engraveTurn(col, value, 1.5708), uBite);
        }

        fragOut = linearToOutputTexel(vec4(col, 1.0));
      }
    `
  });

  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 40, 24), material);
  sky.frustumCulled = false;

  // The cloud goes with the wind, and faster than she does.
  sky.userData.update = (t, windFrom, gloom) => {
    const a = (windFrom + 180) * Math.PI / 180;
    uniforms.drift.value.set(Math.sin(a) * t * 0.0016, Math.cos(a) * t * 0.0016);
    uniforms.gloom.value = gloom;
  };
  sky.userData.sun = (v) => uniforms.sun.value.copy(v).normalize();
  return sky;
}
