// Studies: other ways the picture might be finished, kept to be looked at and
// chosen between, not yet part of the game. Add ?look=engraved or ?look=inked
// to the address to see one. Each is a single pass over the drawn scene.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const VERT = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const COMMON = `uniform sampler2D tDiffuse; uniform vec2 px; uniform vec2 size; varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 seen(vec2 uv) { vec3 c = texture2D(tDiffuse, uv).rgb; return pow(clamp(c / (0.55 + c), 0.0, 1.0), vec3(0.6)); }   // as the eye would see it
  float edge(float w) {                                    // how sharply the picture changes here
    float a = lum(seen(vUv + vec2(-w, -w) * px)), b = lum(seen(vUv + vec2(w, -w) * px)), c = lum(seen(vUv + vec2(-w, w) * px)), d = lum(seen(vUv + vec2(w, w) * px));
    return abs(a - d) + abs(b - c);
  }`;

const LOOKS = {
  // A steel engraving of the 1840s: ink lines on paper, the tones built from hatching, a thin wash of colour.
  engraved: `${COMMON}
    void main() {
      vec3 c = seen(vUv); float l = lum(c); vec2 p = vUv * size;
      float sway = sin(p.y * 0.02) * 2.0;
      float a = 0.5 + 0.5 * sin((p.x + p.y + sway) * 1.05), b = 0.5 + 0.5 * sin((p.x - p.y) * 1.05), d = 0.5 + 0.5 * sin(p.y * 1.5 + sin(p.x * 0.03) * 3.0);
      float ink = smoothstep(0.0, 0.14, a - l * 1.5);                       // one set of lines, swelling in the shadows
      ink = max(ink, smoothstep(0.0, 0.14, b - (l * 2.4 + 0.12)));          // crossed in the darks
      ink = max(ink, 0.8 * smoothstep(0.0, 0.2, d - (l * 1.15 + 0.45)));    // and ruled across in the half-tones
      ink = max(ink, smoothstep(0.1, 0.24, edge(1.0)));                     // every outline drawn
      vec3 paper = vec3(0.925, 0.88, 0.77) * (0.96 + 0.06 * hash(floor(p * 0.5)));
      vec3 wash = mix(paper, paper * (0.45 + c * 0.95), 0.5);               // a tint laid over the print by hand
      vec2 e = vUv - 0.5;
      gl_FragColor = vec4(mix(wash, vec3(0.14, 0.11, 0.09), ink * 0.9) * (1.0 - 0.5 * dot(e, e)), 1.0);
    }`,
  // Ink and flat colour, as in a picture book: a firm dark line round everything, and a few flat tones inside it.
  inked: `${COMMON}
    void main() {
      vec3 c = seen(vUv); float l = max(lum(c), 0.001);
      float q = (floor(l * 4.0) + 0.6) / 4.0;                               // four flat tones
      c = c * (q / l);
      c = mix(vec3(lum(c)), c, 1.35);
      vec2 p = vUv * size;
      c *= 0.97 + 0.05 * hash(floor(p * 0.6));                              // the tooth of the paper
      float line = smoothstep(0.09, 0.2, edge(1.2));
      gl_FragColor = vec4(mix(c, vec3(0.07, 0.09, 0.14), line), 1.0);
    }`,
};

export const isStudy = (name) => name in LOOKS;

export function makeStudy(renderer, name) {
  const drawn = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const mat = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: drawn.texture }, px: { value: new THREE.Vector2() }, size: { value: new THREE.Vector2() } },
    vertexShader: VERT, fragmentShader: LOOKS[name] });
  const quad = new FullScreenQuad(mat);
  return {
    setSize(w, h) { drawn.setSize(w, h); mat.uniforms.px.value.set(1 / w, 1 / h); mat.uniforms.size.value.set(w, h); },
    render(scene, camera) { renderer.setRenderTarget(drawn); renderer.render(scene, camera); renderer.setRenderTarget(null); quad.render(renderer); },
  };
}
