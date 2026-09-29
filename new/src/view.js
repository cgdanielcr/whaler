// The view: an isometric camera that follows the ship, the sun, and the
// tilt-shift blur (switchable) that makes the world look like a model on a table.
import * as THREE from 'three';
import { makePost } from './post.js';

const LOOK = new THREE.Vector3(-1, 1.3, 1).normalize();   // east shows upper right
const SUN = new THREE.Vector3(-25, 110, -60);             // light from the upper left
const TILT_SHIFT = false;     // the model-on-a-table blur; off for now, it costs too much on this laptop

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ antialias: !TILT_SHIFT });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1));   // sharper screens cost too much here
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
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

  const post = TILT_SHIFT ? makePost(renderer) : null;

  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h;
    Object.assign(camera, { left: -viewH * a / 2, right: viewH * a / 2, top: viewH / 2, bottom: -viewH / 2 });
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (post) post.setSize(w, h);
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

  return { renderer, scene, camera, canvas: renderer.domElement, resize, follow, zoom, pick, render: () => (post ? post.render(scene, camera) : renderer.render(scene, camera)) };
}
