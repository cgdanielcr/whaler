// A sky dome: a big sphere seen from the inside, painted with a vertical gradient.
// No sun disc, no clouds yet -- just something for the horizon to sit against.
import * as THREE from 'three';

export const HORIZON_COLOUR = new THREE.Color('#b9c4c0');

const ZENITH = new THREE.Color('#4d7fa6');
const HAZE   = new THREE.Color('#8fa6ae');

export function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith:  { value: ZENITH },
      haze:    { value: HAZE },
      horizon: { value: HORIZON_COLOUR }
    },
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
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y, -1.0, 1.0);
        vec3 low = mix(horizon, haze, smoothstep(0.0, 0.18, h));
        vec3 col = mix(low, zenith, smoothstep(0.12, 0.75, h));
        // a little warmth just under the horizon so the sea edge is not a hard line
        col = mix(col, horizon, smoothstep(0.02, -0.08, h));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });

  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 20), material);
  sky.frustumCulled = false;
  return sky;
}
