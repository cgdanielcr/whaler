// The view: an isometric camera that follows the ship, the sun, and the
// tilt-shift blur that makes the world look like a model on a table.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/addons/shaders/VerticalTiltShiftShader.js';

const LOOK = new THREE.Vector3(-1, 1.3, 1).normalize();   // east shows upper right
const SUN = new THREE.Vector3(-25, 110, -60);             // light from the upper left
const BLUR = 7;                                           // tilt-shift strength

// A little more colour, and the corners darkened.
const Grade = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.15 }, vig: { value: 0.45 } },
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat; uniform float vig; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, sat);
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - vig * dot(d, d) * 2.0;
      gl_FragColor = c;
    }`,
};

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.id = 'view';
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d3a52);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
  const focus = new THREE.Vector3();
  let viewH = 52, first = true;

  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x16384a, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);

  const composer = new EffectComposer(renderer);
  composer.renderTarget1.samples = 4;
  composer.renderTarget2.samples = 4;
  composer.addPass(new RenderPass(scene, camera));
  const hBlur = new ShaderPass(HorizontalTiltShiftShader);
  const vBlur = new ShaderPass(VerticalTiltShiftShader);
  composer.addPass(hBlur);
  composer.addPass(vBlur);
  composer.addPass(new ShaderPass(Grade));
  composer.addPass(new OutputPass());

  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h;
    Object.assign(camera, { left: -viewH * a / 2, right: viewH * a / 2, top: viewH / 2, bottom: -viewH / 2 });
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    hBlur.uniforms.h.value = BLUR / w;
    vBlur.uniforms.v.value = BLUR / h;
    hBlur.uniforms.r.value = vBlur.uniforms.r.value = 0.5;
  }
  resize();

  function follow(p, dt) {
    if (first) { focus.copy(p); first = false; }
    focus.lerp(p, 1 - Math.exp(-dt * 2.5));
    camera.position.copy(focus).addScaledVector(LOOK, 500);
    camera.lookAt(focus);
    sun.position.copy(focus).add(SUN);
    sun.target.position.copy(focus);
  }

  function zoom(delta) {
    viewH = THREE.MathUtils.clamp(viewH * (1 + delta * 0.001), 28, 150);
    resize();
  }

  // Where on the sea the pointer is.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function pick(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit);
  }

  return { renderer, scene, canvas: renderer.domElement, resize, follow, zoom, pick, render: () => composer.render() };
}
