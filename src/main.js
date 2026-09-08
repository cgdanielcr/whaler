// Ship -- M2: hull, sea, and a full rig whose sails can be set, reefed and furled.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeSky, HORIZON_COLOUR } from './sky.js';
import { makeSea, waveHeight } from './sea.js';
import { makeHull } from './hull.js';
import { makeRig } from './rig.js';
import { bindOrders } from './orders.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(HORIZON_COLOUR, 240, 660);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 8000);
camera.position.set(74, 22, 64);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 13, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 22;
controls.maxDistance = 300;
controls.maxPolarAngle = Math.PI / 2 - 0.04;   // stay above the water
controls.enablePan = false;

scene.add(makeSky());

const sea = makeSea();
scene.add(sea);

const ship = makeHull();
const rig = makeRig();
ship.add(rig.group);
scene.add(ship);
bindOrders(rig);

// Light: a low afternoon sun, plus sky and sea bounce.
const sun = new THREE.DirectionalLight('#ffe9c9', 2.4);
sun.position.set(72, 52, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -46;
sun.shadow.camera.right = 46;
sun.shadow.camera.top = 52;
sun.shadow.camera.bottom = -46;
sun.shadow.camera.near = 20;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0015;
scene.add(sun);
scene.add(new THREE.HemisphereLight('#cfe0e8', '#16303d', 1.5));

// She rides the swell: lifted by the water under her, pitching bow to stern and
// rolling from side to side as the waves pass beneath.
function rideTheSwell(t) {
  const bow    = waveHeight(0, 15, t);
  const stern  = waveHeight(0, -15, t);
  const larb   = waveHeight(-4, 0, t);
  const stbd   = waveHeight(4, 0, t);
  ship.position.y = (bow + stern + larb + stbd) / 4 - 0.15;
  ship.rotation.x = -Math.atan2(bow - stern, 30) * 1.5;
  ship.rotation.z = Math.atan2(stbd - larb, 8) * 1.4;
}

let time = 0;
let last = performance.now();

function frame(now) {
  time += Math.min((now - last) / 1000, 0.1);
  last = now;
  sea.userData.update(time);
  rideTheSwell(time);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

