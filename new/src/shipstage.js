// The stage the ship view is played on: a scene of its own, away from the
// sea, with its own camera, its own light and a dark backdrop. Her decks stand
// on it as a carousel: the deck in hand large and near, the one above it
// raised and set back, the one below it lowered and set back.
import * as THREE from 'three';

const DIR = new THREE.Vector3(0, 0.66, 1).normalize();   // from the deck toward the camera: above and to starboard
const FIT_W = 16, FIT_H = 8.4;                         // the deck in hand must fit this much of the world
const RISE = 4.8, BACK = 6, SHRINK = 0.4;                 // how the other decks stand off from the one in hand

function backdrop() {
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1d3345'); grad.addColorStop(0.55, '#101d29'); grad.addColorStop(1, '#070c11');
  g.fillStyle = grad; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeStage(renderer) {
  const scene = new THREE.Scene();
  scene.background = backdrop();
  scene.fog = new THREE.Fog(0x0c1620, 24, 48);             // decks set back fall into the dark

  scene.add(new THREE.HemisphereLight(0xe3ecf6, 0x2b2016, 1.15));
  const key = new THREE.DirectionalLight(0xffe7c8, 2.4);   // warm lamplight from above and forward
  key.position.set(-7, 16, 11);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0x8fb4ff, 0.8);  // a cool edge from behind, to lift her out of the dark
  rim.position.set(6, 7, -12);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  // right, left: pixels of screen taken by the roster on the right and the crew bar on the left.
  function resize(rightPx, leftPx = 0) {
    const wide = innerWidth > 760, right = wide ? rightPx : 0, left = wide ? leftPx : 0;
    const w = innerWidth, h = innerHeight, free = (w - right - left) / h;
    camera.aspect = w / h;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(FIT_H / 2 / tanV, FIT_W / 2 / (tanV * free));   // near enough to fill, far enough to fit
    camera.position.copy(DIR).multiplyScalar(dist).add(new THREE.Vector3(0, 0.4, 0));
    camera.lookAt(0, 0.4, 0);
    camera.setViewOffset(w, h, (right - left) / 2, 0, w, h);   // centre her in the space between the panels
    camera.updateProjectionMatrix();
  }

  // Stand the decks: `at` is which deck is in hand, eased (it may lie between two).
  function place(layers, at) {
    layers.forEach((l, i) => {
      const o = i - at, a = Math.min(1, Math.abs(o));
      l.group.position.set(0, -o * RISE, -Math.abs(o) * BACK);
      l.group.scale.setScalar(1 - SHRINK * a);
    });
  }

  return { scene, camera, resize, place, render: () => renderer.render(scene, camera) };
}
