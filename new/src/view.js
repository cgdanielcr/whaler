// The view: an isometric camera that follows the ship, the sun, and the
// tilt-shift blur (switchable) that makes the world look like a model on a table.
import * as THREE from 'three';
import { makePost } from './post.js';
import { makePaint } from './paint.js';
import { makeStudy, isStudy } from './studies.js';

const LOOK = new THREE.Vector3(-1, 1.3, 1).normalize();   // east shows upper right
const SUN = new THREE.Vector3(-25, 110, -60);             // light from the upper left; the weather may move it
// How the picture is finished: 'painted' (as an oil painting, the usual way), 'plain' (as drawn,
// the cheapest), or 'fine' (sharp, with the model-on-a-table blur, the costliest). Chosen on the title page.
let picture = 'painted';
try { picture = localStorage.getItem('whaler-picture') || 'painted'; } catch { /* no storage */ }
picture = new URLSearchParams(location.search).get('look') || picture;      // ?look= in the address shows a finish for this visit only
const fine = picture === 'fine';

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ antialias: picture === 'plain' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, fine ? 2 : 1));   // sharper screens cost too much on a laptop's graphics
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.id = 'view';
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d3a52);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
  const focus = new THREE.Vector3();
  let viewH = 52, wantH = 52, first = true;       // how many units of the world show top to bottom

  const sky = new THREE.HemisphereLight(0xd8ecff, 0x16384a, 1.25);
  scene.add(sky);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);

  const post = fine ? makePost(renderer) : picture === 'painted' ? makePaint(renderer) : isStudy(picture) ? makeStudy(renderer, picture) : null;

  function project() {
    const a = innerWidth / innerHeight;
    Object.assign(camera, { left: -viewH * a / 2, right: viewH * a / 2, top: viewH / 2, bottom: -viewH / 2 });
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = innerWidth, h = innerHeight;
    project();
    renderer.setSize(w, h);
    if (post) post.setSize(w, h);
  }
  resize();

  const jolt = new THREE.Vector3();
  function follow(p, dt, shake = 0) {
    if (first) { focus.copy(p); first = false; }
    focus.lerp(p, 1 - Math.exp(-dt * 2.5));
    if (Math.abs(wantH - viewH) > 0.01) { viewH += (wantH - viewH) * (1 - Math.exp(-dt * 4)); project(); }
    camera.position.copy(focus).addScaledVector(LOOK, 500);
    camera.lookAt(focus);
    if (shake > 0.01) camera.position.add(jolt.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(shake));   // a jolt, when something strikes
    sun.position.copy(focus).add(SUN);
    sun.target.position.copy(focus);
  }

  function zoom(delta) { wantH = THREE.MathUtils.clamp(wantH * (1 + delta * 0.001), 28, 150); }
  // For the ship view: glide to a given height of view, or back to where it was.
  const height = (h) => { const was = wantH; if (h) wantH = h; return was; };

  // Where on the sea the pointer is.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function pick(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit);
  }

  return { renderer, scene, camera, sun, sky, sunFrom: SUN, canvas: renderer.domElement, resize, follow, zoom, height, pick, render: () => (post ? post.render(scene, camera) : renderer.render(scene, camera)) };
}
