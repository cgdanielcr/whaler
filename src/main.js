// Ship -- M3: a wind, a heading you steer, and way through the water.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeSky, HORIZON_COLOUR } from './sky.js';
import { makeSea, waveHeight } from './sea.js';
import { makeHull } from './hull.js';
import { makeRig } from './rig.js';
import { makeWake } from './wake.js';
import { bindOrders } from './orders.js';
import { makeInstruments } from './instruments.js';
import { speed, pointOfSail, signedDiff, wrap } from './wind.js';

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

const wake = makeWake();
scene.add(wake);

// She keeps her place at the middle of the scene; the sea runs past her instead.
const ship = new THREE.Group();       // her heading
const hull = makeHull();              // the swell works on her inside her own frame
const rig = makeRig();
hull.add(rig.group);
ship.add(hull);
scene.add(ship);

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

// --- her state ---------------------------------------------------------------

const WIND_FROM = 315;                // the north-west, and steady until M5
const FORCE = 4;                      // a fresh breeze
const TURN = 9;                       // degrees a second with the helm hard over
const KNOT = 0.5144;                  // metres a second

let heading = 170;                    // her head, as a bearing
let runX = 0, runZ = 0;               // how far she has run over the sea, in metres
let knots = 0;

const held = new Set();
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { held.add(e.code); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => held.delete(e.code));

bindOrders(rig);
const readOut = makeInstruments();

// She lifts to the water under her, and pitches and rolls as it passes.
function rideTheSwell(t) {
  const c = Math.cos(heading * Math.PI / 180), s = Math.sin(heading * Math.PI / 180);
  const at = (dx, dz) => waveHeight(runX + dx * c + dz * s, runZ - dx * s + dz * c, t);
  const bow = at(0, 15), stern = at(0, -15), larboard = at(-4, 0), starboard = at(4, 0);
  ship.position.y = (bow + stern + larboard + starboard) / 4 - 0.15;
  hull.rotation.x = -Math.atan2(bow - stern, 30) * 1.5;
  hull.rotation.z = Math.atan2(starboard - larboard, 8) * 1.4;
}

function sail(dt, t) {
  // The wind's bearing relative to her head tells us everything else.
  const relative = signedDiff(WIND_FROM, heading);
  const offWind = Math.abs(relative);
  const side = relative >= 0 ? 1 : -1;          // +1 with the wind over her starboard side
  const point = pointOfSail(offWind);

  knots = speed(offWind, rig.canvas(), FORCE);
  rig.trim(offWind, side);

  // She will not answer her helm without way on, though never quite so little
  // that you cannot get her round again.
  const authority = 0.25 + 0.75 * Math.min(1, knots / 3);
  if (held.has('ArrowLeft')) heading = wrap(heading - TURN * authority * dt);
  if (held.has('ArrowRight')) heading = wrap(heading + TURN * authority * dt);
  ship.rotation.y = heading * Math.PI / 180;

  // Close-hauled she crabs to leeward, so her course is not quite her heading.
  const course = (heading - side * point.leeway) * Math.PI / 180;
  const metres = knots * KNOT * dt;
  runX += Math.sin(course) * metres;
  runZ += Math.cos(course) * metres;

  sea.userData.update(t, runX, runZ);
  wake.userData.update(t, runX, runZ, course, knots);
  readOut({ heading, windFrom: WIND_FROM, force: FORCE, point: point.name, knots });
}

let time = 0;
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  time += dt;
  sail(dt, time);
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
