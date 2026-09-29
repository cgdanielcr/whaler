// The finishing of each frame: the scene is drawn once with smoothed edges,
// then blurred toward the top and bottom of the screen (the tilt-shift that
// makes it look like a model), given a little more colour, and put on screen.
// Two passes over the screen in all, which the laptop's graphics can afford.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const BLUR = 7;                       // how far, in pixels, the edges of the screen smear

const VERT = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Nine samples along one direction, spread wider the farther from the middle band.
const BLUR_GLSL = `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
  vec4 blur() {
    vec2 d = dir * abs(0.5 - vUv.y);
    vec4 s = texture2D(tDiffuse, vUv) * 0.1633;
    s += (texture2D(tDiffuse, vUv - 4.0 * d) + texture2D(tDiffuse, vUv + 4.0 * d)) * 0.0510;
    s += (texture2D(tDiffuse, vUv - 3.0 * d) + texture2D(tDiffuse, vUv + 3.0 * d)) * 0.0918;
    s += (texture2D(tDiffuse, vUv - 2.0 * d) + texture2D(tDiffuse, vUv + 2.0 * d)) * 0.12245;
    s += (texture2D(tDiffuse, vUv - 1.0 * d) + texture2D(tDiffuse, vUv + 1.0 * d)) * 0.1531;
    return s;
  }`;

export function makePost(renderer) {
  const drawn = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const across = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });

  const hMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: drawn.texture }, dir: { value: new THREE.Vector2() } },
    vertexShader: VERT,
    fragmentShader: `${BLUR_GLSL}
      void main() { gl_FragColor = blur(); }`,
  });
  const vMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: across.texture }, dir: { value: new THREE.Vector2() },
      sat: { value: 1.15 }, vig: { value: 0.45 } },
    vertexShader: VERT,
    fragmentShader: `${BLUR_GLSL}
      uniform float sat; uniform float vig;
      void main() {
        vec4 c = blur();
        float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        c.rgb = mix(vec3(l), c.rgb, sat);
        vec2 e = vUv - 0.5;
        c.rgb *= 1.0 - vig * dot(e, e) * 2.0;
        gl_FragColor = c;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const hQuad = new FullScreenQuad(hMat), vQuad = new FullScreenQuad(vMat);

  return {
    setSize(w, h) {
      const pr = renderer.getPixelRatio();
      drawn.setSize(Math.round(w * pr), Math.round(h * pr));
      across.setSize(Math.round(w * pr), Math.round(h * pr));
      hMat.uniforms.dir.value.set(BLUR / w, 0);
      vMat.uniforms.dir.value.set(0, BLUR / h);
    },
    render(scene, camera) {
      renderer.setRenderTarget(drawn);
      renderer.render(scene, camera);
      renderer.setRenderTarget(across);
      hQuad.render(renderer);
      renderer.setRenderTarget(null);
      vQuad.render(renderer);
    },
  };
}
