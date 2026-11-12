// The picture as an oil painting. The scene is drawn small, then laid down
// again in flat dabs the way a loaded brush leaves them (each point takes the
// colour of the calmest patch beside it, which keeps edges and loses fuss),
// and last brought up to the screen with the weave of the canvas, the ridges
// of the paint catching the light, a richer and warmer palette, and old
// varnish darkening the corners. Three passes; the first two are small.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const SMALL = 0.85;                   // the scene is drawn at this share of the screen's size
const VERT = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const NOISE = `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }`;

// The brush: of the four patches about each point, keep the mean of the one that varies least.
const DAB = `uniform sampler2D tDiffuse; uniform vec2 px; varying vec2 vUv;
  ${NOISE}
  void quarter(vec2 uv, vec2 dir, out vec3 mean, out float vary) {
    vec3 m = vec3(0.0), s = vec3(0.0);
    for (int j = 0; j <= 2; j++) for (int i = 0; i <= 2; i++) {
      vec3 c = texture2D(tDiffuse, uv + vec2(float(i), float(j)) * dir * px).rgb; m += c; s += c * c; }
    mean = m / 9.0; vec3 v = s / 9.0 - mean * mean; vary = v.r + v.g + v.b;
  }
  void main() {
    // The hand is not a ruler: every edge wanders a little.
    vec2 uv = vUv + (vec2(noise(vUv * 90.0), noise(vUv * 90.0 + 31.0)) - 0.5) * px * 2.4;
    vec3 best, m; float least, v;
    quarter(uv, vec2(-1.0, -1.0), best, least);
    quarter(uv, vec2(1.0, -1.0), m, v); if (v < least) { least = v; best = m; }
    quarter(uv, vec2(1.0, 1.0), m, v); if (v < least) { least = v; best = m; }
    quarter(uv, vec2(-1.0, 1.0), m, v); if (v < least) { least = v; best = m; }
    gl_FragColor = vec4(best, 1.0);
  }`;

// The canvas, the ridges of the paint, the palette and the varnish.
const FINISH = `uniform sampler2D tDiffuse; uniform vec2 px; uniform vec2 size; varying vec2 vUv;
  ${NOISE}
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    // Thick paint stands up from the canvas and takes the light from the upper left.
    float ridge = lum(texture2D(tDiffuse, vUv + vec2(-1.2, 1.2) * px).rgb) - lum(texture2D(tDiffuse, vUv + vec2(1.2, -1.2) * px).rgb);
    vec2 p = vUv * size;
    float bristle = noise(vec2(p.x * 0.55 + p.y * 0.35, p.y * 0.07 - p.x * 0.04)) - 0.5;      // long streaks left by the hairs of the brush
    float weave = sin(p.x * 1.6) * sin(p.y * 1.6);                                             // the threads of the canvas under it
    c *= 1.0 + clamp(ridge, -0.22, 0.22) * 1.1 + bristle * 0.12 + weave * 0.03;
    // An oil palette: deeper, richer, a little warm, under old varnish.
    float l = lum(c);
    c = mix(vec3(l), c, 1.24);
    vec3 k = clamp(c, 0.0, 1.0);                       // lamps and lit windows are brighter than paint; leave what is over
    c = mix(c, k * k * (3.0 - 2.0 * k) + (c - k), 0.28);
    c *= vec3(1.05, 1.0, 0.91);
    vec2 e = vUv - 0.5;
    c *= 1.0 - 0.75 * dot(e, e);
    c += vec3(0.035, 0.02, 0.0) * dot(e, e);
    gl_FragColor = vec4(max(c, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function makePaint(renderer) {
  const drawn = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const dabbed = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const dab = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: drawn.texture }, px: { value: new THREE.Vector2() } }, vertexShader: VERT, fragmentShader: DAB });
  const finish = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: dabbed.texture }, px: { value: new THREE.Vector2() }, size: { value: new THREE.Vector2() } },
    vertexShader: VERT, fragmentShader: FINISH });
  const dabQuad = new FullScreenQuad(dab), finishQuad = new FullScreenQuad(finish);

  return {
    setSize(w, h) {
      const sw = Math.round(w * SMALL), sh = Math.round(h * SMALL);
      drawn.setSize(sw, sh); dabbed.setSize(sw, sh);
      dab.uniforms.px.value.set(1 / sw, 1 / sh);
      finish.uniforms.px.value.set(1 / sw, 1 / sh);
      finish.uniforms.size.value.set(w, h);
    },
    render(scene, camera) {
      renderer.setRenderTarget(drawn);
      renderer.render(scene, camera);
      renderer.setRenderTarget(dabbed);
      dabQuad.render(renderer);
      renderer.setRenderTarget(null);
      finishQuad.render(renderer);
    },
  };
}
