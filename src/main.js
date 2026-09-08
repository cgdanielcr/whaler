// Ship -- M6: a passage of sixty miles, and an account of how she came by it.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeSky, HORIZON_COLOUR } from './sky.js';
import { makeSea, waveHeight } from './sea.js';
import { makeHull } from './hull.js';
import { makeRig } from './rig.js';
import { makeWake } from './wake.js';
import { makeCrew } from './crew.js';
import { makeBoards } from './boards.js';
import { bindOrders } from './orders.js';
import { makeInstruments } from './instruments.js';
import { MANOEUVRES } from './evolutions.js';
import { GAME_SECONDS_PER_SECOND, readClock } from './clock.js';
import { speed, pointOfSail, signedDiff, wrap } from './wind.js';
import { makeWeather } from './weather.js';
import { makeSquall } from './squall.js';
import { makeDamage } from './damage.js';
import { makePassage } from './passage.js';
import { makeGlossary } from './glossary.js';

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
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.enablePan = false;

scene.add(makeSky());
const sea = makeSea();
scene.add(sea);
const wake = makeWake();
scene.add(wake);

const ship = new THREE.Group();
const hull = makeHull();
const rig = makeRig();
hull.add(rig.group);
ship.add(hull);
scene.add(ship);

const squallLine = makeSquall();
scene.add(squallLine);

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

const TURN = 9;                // degrees a second of your time, helm hard over
const KNOT = 0.5144;
const WAY = 90;                // game seconds for her to gather or lose her way

let heading = 170;
let runX = 0, runZ = 0;
let knots = 0;
let gameSeconds = 8 * 3600;    // she begins at eight in the morning
let swing = null;              // a tack or a wear in progress
let over = 0;                  // steps of canvas she is carrying beyond the force

const weather = makeWeather(315, 3.3);   // a moderate breeze out of the north-west

// You may run her on during a quiet stretch, but not with a squall in sight.
const PACES = [1, 2, 4, 8];
let paceStep = 0, hoveTo = false;
const heldBack = () => !!weather.warning;
const time = {
  toggle: () => { hoveTo = !hoveTo; },
  faster: () => { if (!heldBack()) paceStep = Math.min(PACES.length - 1, paceStep + 1); },
  slower: () => { paceStep = Math.max(0, paceStep - 1); },
  get pace() { return hoveTo ? 0 : PACES[heldBack() ? 0 : paceStep]; }
};

const held = new Set();
const helm = { hold: (code) => held.add(code), release: (code) => held.delete(code) };

const crew = makeCrew();
const boards = makeBoards(rig, crew);
const readOut = makeInstruments();
const passage = makePassage(rig);
makeGlossary(rig);


// --- tacking and wearing -----------------------------------------------------

// She comes round either through the wind, which is quick and can fail, or
// away from it through her stern, which is slow, sure, and loses her ground.
function manoeuvre(which) {
  if (swing || [...crew.running, ...crew.waiting].some((o) => o.swing)) {
    boards.say('She is already coming round.');
    return;
  }
  const off = Math.abs(signedDiff(weather.windFrom, heading));
  if (which === 'tack' && off > 95) {
    boards.say('She lies too far off the wind to stay. Bring her by the wind, or wear her round.');
    return;
  }
  if (which === 'tack' && off < 67) {
    boards.say('She is inside six points already. Wear her round.');
    return;
  }

  const e = MANOEUVRES[which];
  crew.issue({
    name: e.name, hands: e.hands, minutes: e.minutes, swing: true,
    onStart() {
      const rel = signedDiff(weather.windFrom, heading);
      const side = Math.sign(rel) || 1;
      let delta;
      if (which === 'tack') {
        // Below four knots she is very apt to miss stays and hang in irons.
        const risk = knots >= 4 ? 0.05 : 0.05 + 0.9 * Math.pow((4 - knots) / 4, 1.5);
        this.missed = Math.random() < risk;
        delta = this.missed ? rel : 2 * rel;    // missing stays leaves her head to wind
      } else {
        delta = Math.abs(rel) < 67 ? rel - side * 115 : 2 * rel - 360 * side;
      }
      swing = { from: heading, delta, knots0: knots, missed: this.missed };
    },
    onProgress(p) { if (swing) heading = wrap(swing.from + swing.delta * p); },
    onDone() {
      const missed = swing && swing.missed;
      if (swing) heading = wrap(swing.from + swing.delta);
      swing = null;
      if (!missed) return;

      knots = 0;
      boards.say('She missed stays, and lies in irons.');
      // Five to ten minutes hanging there before she pays off on the old tack.
      const back = -Math.sign(signedDiff(weather.windFrom, heading) || 1) * 75;
      crew.issue({
        name: 'In irons, waiting for her to pay off', hands: 0,
        minutes: 5 + Math.random() * 5, swing: true,
        onStart() { swing = { from: heading, delta: signedDiff(weather.windFrom, heading) - back, knots0: 0 }; },
        onProgress(p) { if (swing) heading = wrap(swing.from + swing.delta * p); },
        onDone() { if (swing) heading = wrap(swing.from + swing.delta); swing = null; }
      });
    }
  });
}

bindOrders({ rig, crew, time, manoeuvre, helm });

// --- what carries away --------------------------------------------------------

const SAID = {
  'split sail': (names) => `${names[0]} has split from head to foot.`,
  'sprung yard': (names) => `The ${names[0].toLowerCase()} yard is sprung.`,
  'sprung topmast': (names) => `The ${names[0].split(' ')[0].toLowerCase()} topmast has gone by the board.`,
  broach: () => 'She has broached to, and lies over on her beam ends.'
};

const damage = makeDamage(rig, (sail, kind) => {
  if (kind === 'broach') {
    // Thrown broadside to the sea: her head flies up across the wind and she
    // loses every knot she had.
    const rel = signedDiff(weather.windFrom, heading) || 1;
    swing = { from: heading, delta: signedDiff(weather.windFrom, heading) - Math.sign(rel) * 90, knots0: 0 };
    knots = 0;
    crew.issue({
      name: 'Broached to — getting her before the wind again', hands: 20, minutes: 12,
      swing: true,
      onProgress(p) { if (swing) heading = wrap(swing.from + swing.delta * p); },
      onDone() { if (swing) heading = wrap(swing.from + swing.delta); swing = null; }
    });
    boards.say(SAID.broach());
    return;
  }
  boards.say(SAID[kind](rig.damage(sail, kind)));
});

// --- the working of her -------------------------------------------------------

function rideTheSwell(t) {
  const c = Math.cos(heading * Math.PI / 180), s = Math.sin(heading * Math.PI / 180);
  const at = (dx, dz) => waveHeight(runX + dx * c + dz * s, runZ - dx * s + dz * c, t);
  const bow = at(0, 15), stern = at(0, -15), larboard = at(-4, 0), starboard = at(4, 0);
  ship.position.y = (bow + stern + larboard + starboard) / 4 - 0.15;
  hull.rotation.x = -Math.atan2(bow - stern, 30) * 1.5;
  hull.rotation.z = Math.atan2(starboard - larboard, 8) * 1.4;
}

function sail(seen, gameDt, t) {
  const relative = signedDiff(weather.windFrom, heading);
  const off = Math.abs(relative);
  const side = relative >= 0 ? 1 : -1;
  const point = pointOfSail(off);

  // She does not gather or lose her way in an instant, and she carries some of
  // it round with her through a tack.
  let want = speed(off, rig.canvas(), weather.force);
  if (swing) want = Math.max(want, swing.knots0 * 0.6);
  knots += (want - knots) * (1 - Math.exp(-gameDt / WAY));

  rig.trim(off, side);

  // The helm is not yours while she is coming round.
  if (!swing) {
    const authority = Math.min(1, knots / 3);
    if (held.has('ArrowLeft')) heading = wrap(heading - TURN * authority * seen);
    if (held.has('ArrowRight')) heading = wrap(heading + TURN * authority * seen);
  }
  ship.rotation.y = heading * Math.PI / 180;

  const course = (heading - side * point.leeway) * Math.PI / 180;
  const metres = knots * KNOT * seen;
  runX += Math.sin(course) * metres;
  runZ += Math.cos(course) * metres;

  sea.userData.update(t, runX, runZ);
  wake.userData.update(t, runX, runZ, course, knots);

  // What your eye sees runs at life speed; her reckoning runs on her own clock.
  passage.run(gameDt, knots, course);

  readOut({
    heading, windFrom: weather.windFrom, force: weather.force,
    point: point.name, knots, squall: weather.warning
  });
}

// When a squall comes over her the light goes out of the day.
const CLEAR_FOG = HORIZON_COLOUR.clone();
const DARK_FOG = new THREE.Color('#5e6a6d');
const CLEAR_SEA = new THREE.Color('#1c4257');
const DARK_SEA = new THREE.Color('#14303e');

function darken(strength) {
  scene.fog.color.copy(CLEAR_FOG).lerp(DARK_FOG, strength);
  sea.material.color.copy(CLEAR_SEA).lerp(DARK_SEA, strength);
  sun.intensity = 2.4 * (1 - 0.78 * strength);
  renderer.toneMappingExposure = 1.05 * (1 - 0.3 * strength);
  scene.fog.far = 660 - 300 * strength;
}

let shown = 0;
let told = false;
let last = performance.now();

function frame(now) {
  const real = Math.min((now - last) / 1000, 0.1);
  last = now;
  // Once she is in, the clock stops and only the sea keeps moving.
  const pace = passage.arrived ? 0 : time.pace;
  const seen = real * (passage.arrived ? 1 : pace);   // what your eye sees
  const gameDt = pace * real * GAME_SECONDS_PER_SECOND;   // what her clock counts

  shown += seen;
  gameSeconds += gameDt;

  weather.tick(gameDt, (gameSeconds / 3600) % 24);
  const warning = weather.warning;
  squallLine.userData.update(warning);
  darken(warning ? warning.strength : 0);
  over = damage.tick(gameDt, weather.force);

  crew.tick(gameDt);
  sail(seen, gameDt, shown);
  rideTheSwell(shown);
  boards.update(gameSeconds, pace, { over, held: !!warning }, passage);


  if (passage.arrived && !told) {
    told = true;
    boards.account(passage.arrived, readClock(gameSeconds).time);
  }

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


