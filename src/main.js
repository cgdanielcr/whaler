// Ship -- M6: a passage of sixty miles, and an account of how she came by it.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeSky, HORIZON_COLOUR } from './sky.js';
import { makeSea, waveHeight } from './sea.js';
import { makeHull, deckAt } from './hull.js';
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
import { makeCompany } from './company.js';
import { makeWatchBill } from './watchbill.js';
import { makeStores } from './stores.js';
import { makeRepairs } from './repairs.js';
import { makeHands } from './hands.js';
import { makeWhalerDeck } from './whaler.js';
import { makeLookouts } from './lookouts.js';
import { makeHunt } from './hunt.js';
import { makeAfloat, makeWhale } from './afloat.js';
import { makeCruise, remember } from './cruise.js';
import { makeWorkUp } from './workup.js';

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

// Where you stand. From the quarterdeck you see the whole sail plan and the
// horizon; on deck you are among the rigging, with the shrouds going up past
// you from the rail. c shifts your station.
let station = 'quarterdeck';

function stand(where) {
  station = where;
  // A wider angle on deck, because standing among it you take in far more of
  // her at once than you do looking at her from off her quarter.
  camera.fov = where === 'deck' ? 70 : 48;
  camera.updateProjectionMatrix();

  if (where === 'quarterdeck') {
    controls.minDistance = 22;
    controls.maxDistance = 300;
    controls.target.set(0, 13, 0);
    camera.position.set(74, 22, 64);
  } else {
    // Forward on the forecastle, and always on the weather side -- which is
    // where the officer of the watch keeps, and also the side her canvas is
    // not bellying into. The spanker fills the after end of her, so there is
    // nowhere to stand right aft.
    const side = Math.sign(signedDiff(weather.windFrom, heading)) || 1;
    controls.minDistance = 3;
    controls.maxDistance = 56;
    controls.target.set(0, deckAt(0) + 8.0, -1.0);
    camera.position.set(-side * 1.9, deckAt(14) + 2.5, 14.0);
  }
  controls.update();
}

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if (e.target.isContentEditable) return;
  if (e.key === 'c' || e.key === 'C') {
    stand(station === 'deck' ? 'quarterdeck' : 'deck');
    e.preventDefault();
  }
});

scene.add(makeSky());
const sea = makeSea();
scene.add(sea);
const wake = makeWake();
scene.add(wake);

const ship = new THREE.Group();
const hull = makeHull();
const rig = makeRig();
hull.add(rig.group);
const whaler = makeWhalerDeck();
hull.add(whaler.group);
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

// The sea needs to know which way the light is travelling, to know when you
// are looking at a wave with the sun behind it.
sea.userData.sun(new THREE.Vector3().copy(sun.position).multiplyScalar(-1));

// --- her state ---------------------------------------------------------------

const TURN = 9;                // degrees a second of your time, helm hard over
const KNOT = 0.5144;
const WAY = 90;                // game seconds for her to gather or lose her way

let heading = 170;
let lastHeading = 170;
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

const company = makeCompany();
const crew = makeCrew(company);
const stores = makeStores();
const lookouts = makeLookouts(company);
const boards = makeBoards(rig, crew, company);
const readOut = makeInstruments();
const passage = makePassage(rig);

const watchBill = makeWatchBill(company);
const hands = makeHands(company, crew, rig, hull, camera, renderer.domElement);
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

const repairs = makeRepairs({ rig, crew, stores, company, say: boards.say });

// --- the boats ----------------------------------------------------------------

// The whale and the boats swim in her own frame, and are carried astern by
// her run. The boats she lowers are taken off her davits and put in the water.
const afloat = makeAfloat(scene);
let whaleInSight = null;
const boatsAfloat = [];

function onScene(what, howMany) {
  if (what === 'down') {
    const keys = Object.keys(whaler.boats).slice(0, howMany);
    keys.forEach((key, i) => {
      const b = whaler.boats[key];
      b.boat.visible = false;
      const copy = b.boat.clone();
      copy.visible = true;
      copy.rotation.y = 0.2 - i * 0.2;
      afloat.add(copy, b.side * (10 + i * 6), -4 + i * 9);
      boatsAfloat.push({ copy, key });
    });
    if (!whaleInSight) {
      whaleInSight = afloat.add(makeWhale(), hunt.whale.side.startsWith('lar') ? 190 : -170, 260);
    }
  }
  if (what === 'aboard') {
    for (const b of boatsAfloat) { afloat.drop(b.copy); whaler.boats[b.key].boat.visible = true; }
    boatsAfloat.length = 0;
    if (whaleInSight && !hunt.barrels) { afloat.drop(whaleInSight); whaleInSight = null; }
  }
  if (what === 'gone' && whaleInSight) { afloat.drop(whaleInSight); whaleInSight = null; }
}

const cruise = makeCruise({ company, stores });
const hunt = makeHunt({ company, crew, stores, say: boards.say, onScene });
const workUp = makeWorkUp({
  crew, hunt, cruise, stores, say: boards.say,
  onFire: (lit) => { whaler.smoke.visible = lit; }
});
bindOrders({ rig, crew, time, manoeuvre, helm, say: boards.say, repairs, hunt, workUp });

// A man off a yard in a hard blow. It was rare, and it was remembered.
function fell(man, where) {
  const day = Math.floor(gameSeconds / 86400) + 1;
  remember(man, man.health === 'lost'
    ? `lost off ${where} on the ${day}th day`
    : `hurt off ${where} on the ${day}th day`);
  boards.say(man.health === 'lost'
    ? `${man.name} is gone from ${where}, and nothing to be done for him.`
    : `${man.name} has come down off ${where} badly hurt.`);
}

// What the men did, written down as they do it. Kept to a few lines a man,
// because a record of forty entries is a list and a record of three is a life.
function noteWork(order) {
  if (weather.force < 6) return;
  const gale = weather.force >= 8 ? 'the whole gale' : weather.force >= 7 ? 'the strong gale' : 'the gale';
  for (const post of order.posted || []) {
    if (!post.aloft) continue;
    for (const m of post.men) remember(m, `was out on ${post.at} in ${gale}`);
  }
}

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
  // She is a deep, stiff, three-hundred-and-fifty-ton ship, not a dinghy. A
  // big sea lifts her more than it heels her, so both are held inside what a
  // hull of her burthen would really do.
  const hold = (v, most) => Math.max(-most, Math.min(most, v));
  hull.rotation.x = hold(-Math.atan2(bow - stern, 30) * 0.85, 0.21);
  hull.rotation.z = hold(Math.atan2(starboard - larboard, 8) * 0.55, 0.30);
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

  sea.userData.update(t, runX, runZ, weather.force);
  wake.userData.update(t, runX, runZ, course, knots);

  // Her run carries the boats and the whale astern; her turning swings them
  // round her, since she is the one thing in the scene that never moves.
  afloat.tick(metres, heading - lastHeading, t);
  lastHeading = heading;
  if (whaleInSight && hunt.state === 'alongside') {
    // Made fast alongside on the starboard side, under the cutting stage.
    const put = afloat.where(whaleInSight);
    if (put) { put.x = -9.5; put.z = 0; }
    whaleInSight.rotation.y = Math.PI / 2;
  }
  for (const b of boatsAfloat) {
    if (hunt.state === 'down' || hunt.state === 'chasing') {
      afloat.steer(b.copy, whaleInSight ? afloat.where(whaleInSight).x : 120,
                   whaleInSight ? afloat.where(whaleInSight).z : 160, 2.2, seen);
    } else if (hunt.state === 'back') {
      afloat.steer(b.copy, 0, 0, 2.6, seen);
    }
  }

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
const CLEAR_SEA = new THREE.Color('#ffffff');   // the sea paints itself now; this only dims it
const DARK_SEA = new THREE.Color('#5a6d76');

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
  const pace = cruise.over ? 0 : time.pace;
  const seen = real * (cruise.over ? 1 : pace);   // what your eye sees
  const gameDt = pace * real * GAME_SECONDS_PER_SECOND;   // what her clock counts

  shown += seen;
  gameSeconds += gameDt;

  weather.tick(gameDt, (gameSeconds / 3600) % 24);
  const warning = weather.warning;
  squallLine.userData.update(warning);
  darken(warning ? warning.strength : 0);
  over = damage.tick(gameDt, weather.force);

  hunt.tick(gameDt, (gameSeconds / 3600) % 24);
  lookouts.tick(gameSeconds, readClock(gameSeconds).onDeck);
  crew.tick(gameDt, readClock(gameSeconds).onDeck, weather.force, fell, noteWork);
  sail(seen, gameDt, shown);
  rideTheSwell(shown);
  stores.tick(gameDt);
  boards.update(gameSeconds, pace, { over, held: !!warning }, passage, stores,
                lookouts, hunt, cruise, workUp);
  watchBill(gameSeconds);
  hands(seen);
  whaler.smoke.userData.update(shown);

  // She runs her distance, and then she is on the ground and the cruise
  // begins. It ends when her water will not stretch any further.
  if (passage.arrived && !told) {
    told = true;
    cruise.raise(gameSeconds);
    boards.say('She has raised the cruising ground. Keep a good lookout.');
  }
  const ended = cruise.tick(gameSeconds);
  if (ended) boards.account(ended, cruise, passage.arrived, readClock(gameSeconds).time);

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


