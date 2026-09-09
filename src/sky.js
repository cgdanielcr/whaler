// The sky: a gradient dome with two sheets of cloud drifting across it.
//
// The cloud is projected as though it lay on a flat ceiling far overhead, so
// it piles up and converges toward the horizon the way real cloud does,
// instead of sitting on the dome like wallpaper. Both sheets fade out near
// the horizon, where the projection stretches to nothing and would otherwise
// tear into stripes.
//
// It costs two texture lookups a pixel. The noise that made the cloud was
// worked out once, at load, on the processor.
import * as THREE from 'three';
import { cloudSheet } from './clouds.js';

export const HORIZON_COLOUR = new THREE.Color('#b9c4c0');

const ZENITH = new THREE.Color('#4d7fa6');
const HAZE   = new THREE.Color('#8fa6ae');

export function makeSky() {
  const uniforms = {
    zenith:  { value: ZENITH.clone() },
    haze:    { value: HAZE.clone() },
    horizon: { value: HORIZON_COLOUR.clone() },
    // The low sheet is broken and hard-edged; the high one is thin and soft.
    low:     { value: cloudSheet({ seed: 3, cover: 0.50, edge: 0.26, billow: true }) },
    high:    { value: cloudSheet({ seed: 11, cover: 0.62, edge: 0.42, billow: false, octaves: 3 }) },
    drift:   { value: new THREE.Vector2() },
    // How much cloud there is, and how dark it has gone.
    cover:   { value: 1.0 },
    gloom:   { value: 0.0 },
    lit:     { value: new THREE.Color('#eef0ea') },
    shade:   { value: new THREE.Color('#5d666b') }
  };

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 zenith;
      uniform vec3 haze;
      uniform vec3 horizon;
      uniform sampler2D low;
      uniform sampler2D high;
      uniform vec2 drift;
      uniform float cover;
      uniform float gloom;
      uniform vec3 lit;
      uniform vec3 shade;
      varying vec3 vPos;

      void main() {
        vec3 d = normalize(vPos);
        float h = clamp(d.y, -1.0, 1.0);

        vec3 sky = mix(horizon, haze, smoothstep(0.0, 0.18, h));
        sky = mix(sky, zenith, smoothstep(0.12, 0.75, h));
        sky = mix(sky, horizon, smoothstep(0.02, -0.08, h));

        // The cloud lies on a ceiling overhead, so looking level along the sea
        // you look through miles of it and it closes up at the horizon.
        // Clamping how far the projection may stretch keeps the cloud from
        // tearing into stripes at the horizon, so it can come right down to it.
        float up = max(h, 0.115);
        vec2 ceiling = d.xz / up;
        float a = texture2D(low,  ceiling * 0.055 + drift).a;
        float b = texture2D(high, ceiling * 0.021 + drift * 0.55 + 0.37).a;

        // Nothing survives right down at the horizon, where the projection
        // stretches out and there is nothing left to read.
        float near = smoothstep(-0.01, 0.055, h);
        a *= near; b *= near;

        // The thin sheet first, then the heavy one over it.
        vec3 thin  = mix(lit, shade, 0.30 + 0.55 * gloom);
        vec3 heavy = mix(lit, shade, 0.62 + 0.38 * gloom);
        vec3 col = mix(sky, thin, b * cover * 0.75);
        col = mix(col, heavy, a * cover);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });

  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 40, 24), material);
  sky.frustumCulled = false;

  // The cloud goes with the wind, and rather faster than she does.
  sky.userData.update = (t, windFrom, dim) => {
    const a = (windFrom + 180) * Math.PI / 180;
    uniforms.drift.value.set(Math.sin(a) * t * 0.0016, Math.cos(a) * t * 0.0016);
    uniforms.gloom.value = dim;
  };
  sky.userData.sky = uniforms;
  return sky;
}
