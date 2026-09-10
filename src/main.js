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
import { makeTrim } from './trim.js';
import { chosen, picked, logSailed } from './voyages.js';
import { makeInstructions, headSaid } from './instructions.js';
import { makeOffice } from './office.js';
import { makePilot } from './pilot.js';
import { makeVane } from './vane.js';
import { makeDrift } from './drift.js';
import { HUE, weather as weather2, gloomFor } from './palette.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// No shadows and no tone mapping. She is drawn, not photographed: a colour
// must come out of the screen as the colour that was written down, and the
// reference casts no shadows at all. Both are also the two largest things we
// can simply stop paying for.
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(HORIZON_COLOUR, 240, 660);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 8000);
camera.position.set(74, 29, -58);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 19, 0);
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
    controls.target.set(0, 19, 0);
    camera.position.set(74, 29, -58);
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

const sky = makeSky();
scene.add(sky);
let sea = makeSea();
scene.add(sea);
const wake = makeWake();
scene.add(wake);
// Weed on the water: the only fixed things in sight, and so the only things
// the eye can read her motion off.
const drift = makeDrift();
scene.add(drift);

const ship = new THREE.Group();
const hull = makeHull();
const rig = makeRig();
hull.add(rig.group);
const whaler = makeWhalerDeck();
hull.add(whaler.group);
// The pennant at the main truck: the wind, where your eye already is.
const vane = makeVane();
hull.add(vane);
ship.add(hull);
scene.add(ship);

const squallLine = makeSquall();
scene.add(squallLine);

// One sun to tell one face of a thing from another, and a good deal of
// ambient so the shaded side is a flat mid tone rather than black.
const sun = new THREE.DirectionalLight('#fff4de', 1.35);
sun.position.set(72, 52, 26);
scene.add(sun);
const hemi = new THREE.HemisphereLight('#dfeaf0', '#4a6a7a', 2.5);
scene.add(hemi);

// Both the sea and the sky want the way from the water toward the sun.
const towardSun = () => new THREE.Vector3().copy(sun.position).normalize();
sea.userData.sun(towardSun());
sky.userData.sun(towardSun());

// --- her state ---------------------------------------------------------------

const TURN = 9;                // degrees a second of your time, helm hard over
const KNOT = 0.5144;
const WAY = 90;                // game seconds for her to gather or lose her way
const PAY_OFF = 2.2;           // degrees a second she falls off when caught in the wind's eye

// Which voyage she is sailing, and what it allows her to do. Everything below
// reads from this rather than from a constant, so a short morning in the bay
// and a three-year cruise are the same ship with different orders.
const V = chosen();
const allows = (group) => V.allow.includes(group);

let heading = V.heading;
let lastHeading = V.heading;
let runX = 0, runZ = 0;
let knots = 0;
let gameSeconds = 8 * 3600;    // she begins at eight in the morning
let swing = null;              // a tack or a wear in progress
let over = 0;                  // steps of canvas she is carrying beyond the force
let air = null;                // what the compass worked out for the boards
let warnedInIrons = false;     // the mate says it once, not every frame

// How grey the day is. The whole palette walks from a bright day to a heavy
// one on this one figure, so the sea, the sky, her canvas and her paint all
// move together instead of being dimmed one at a time. The glass may take it
// out of the weather's hands.
let byHand = null;
const holdLook = (g) => { byHand = g; };   // null gives it back to the weather
const greyness = (force, squall) => byHand === null ? gloomFor(force, squall) : byHand;

const weather = makeWeather(V.wind.from, V.wind.force, V.swing);

const held = new Set();
const helm = { hold: (code) => held.add(code), release: (code) => held.delete(code) };

// You may run her on during a quiet stretch, but not with a squall in sight,
// and not with your helm over. Her clock carries the helm with it: at eight
// times, a touch on the arrow swings her half round before you can take your
// finger off. So while you are conning her she comes back to her own time.
const PACES = [1, 2, 4, 8];
// She lies hove to behind the owners' letter until it has been read.
let paceStep = 0, hoveTo = true;
const heldBack = () => !!weather.warning || held.size > 0;
const time = {
  begin: () => { hoveTo = false; },
  toggle: () => { hoveTo = !hoveTo; },
  faster: () => { if (!weather.warning) paceStep = Math.min(PACES.length - 1, paceStep + 1); },
  slower: () => { paceStep = Math.max(0, paceStep - 1); },
  slowest: () => { paceStep = 0; },
  get pace() { return hoveTo ? 0 : PACES[heldBack() ? 0 : paceStep]; }
};

const company = makeCompany();
const crew = makeCrew(company);
const stores = makeStores();
const lookouts = makeLookouts(company);
const boards = makeBoards(rig, crew, company, allows, !V.steps);
const readOut = makeInstruments();
const passage = makePassage(rig, V.plan);

const watchBill = makeWatchBill(company, crew);
const hands = makeHands(company, crew, rig, hull, camera, renderer.domElement);
const trim = makeTrim({
  weather, sun,
  aim: () => { sea.userData.sun(towardSun()); sky.userData.sun(towardSun()); },
  look: holdLook,
  // A finer or coarser sea means a new grid, so the old one is thrown away
  // and a new one put in its place.
  facets: (n) => {
    scene.remove(sea);
    sea.geometry.dispose();
    sea = makeSea(n);
    scene.add(sea);
    sea.userData.sun(towardSun());
  }
});
// The letter first, so that every sea term in it is marked by the glossary
// along with the boards. With no voyage chosen she lies in the shipping
// office instead, and the letter waits behind it.
let underway = false;      // the letter has been read and she is away
let acked = false;         // a step the pilot needs you only to look at
const instructions = makeInstructions(V, {
  begin: () => { time.begin(); underway = true; },
  letterFirst: picked()
});
if (!picked()) makeOffice();

// The first mate at your elbow, on a voyage that carries steps. He presses
// the same keys you would, so there is nothing he can do that you cannot.
// He points at what he is naming: the canvas lights up on the ship herself,
// the pennant swells and pales, and the board carrying the figure is ringed.
let litBoard = null;

function unpoint() {
  rig.unmark();
  vane.userData.show(false);
  if (litBoard) { litBoard.classList.remove('lit'); litBoard = null; }
}

function point(step) {
  unpoint();
  // Each step asks for its own nod, so a voyage may have more than one.
  acked = false;
  if (step.mark) rig.mark(step.mark);
  if (step.vane) vane.userData.show(true);
  if (step.board) {
    litBoard = document.getElementById(step.board);
    if (litBoard) litBoard.classList.add('lit');
  }
}

const pilot = V.steps ? makePilot(V.steps, {
  helm, point, unpoint,
  press(key, shift) {
    if (key === 'PilotOn') { acked = true; return; }
    window.dispatchEvent(new KeyboardEvent('keydown',
      { code: key, key, shiftKey: !!shift, bubbles: true }));
  }
}) : null;

// Everything a step might want to look at, in the words the boards use.
const conning = () => {
  const rel = signedDiff(weather.windFrom, heading);
  return {
    acked,
    knots,
    leg: passage.leg,
    toRun: passage.toRun,
    sailed: passage.sailed,
    offMark: signedDiff(passage.bearing, heading),
    headSaid: `Her head is ${headSaid(passage.bearing, heading)}`,
    bearSaid: passage.bearingSaid,
    windSaid: air ? air.from : '',
    forceSaid: air ? air.force : '',
    // How she lies to the wind, and which board she is on. A tack carries her
    // from one side to the other, which is how the pilot knows she came round.
    offWind: Math.abs(rel),
    windSide: Math.sign(rel) || 1,
    squall: weather.warning,
    allHands: crew.allHands,
    weariness: crew.weariness,
    hurt: rig.hurt().length,
    stateOf: (tier) => rig.stateOf(tier),
    working: (tier) => rig.working(tier)
  };
};
makeGlossary(rig, allows);
if (V.fair) weather.quiet(24 * 60);      // nothing in the weather today

// A voyage may begin with something already carried away, so that mending it
// is the lesson rather than a thing the weather may or may not hand you.
for (const d of V.damaged || []) {
  const s = rig.sails.find((x) => x.name === d.name);
  if (s) rig.damage(s, d.kind);
}

// And it may begin under less than all plain sail, so that making sail is
// something you do rather than something already done for you.
for (const [tier, state] of Object.entries(V.canvas || {})) {
  rig.begin(tier, state);
  rig.finish(tier);
}


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
  // Tacking and wearing both want more hands than a watch of twelve can find.
  // Without this the order goes into the queue and waits there for ever, with
  // nothing to tell you why she will not come round.
  if (!crew.allHands && crew.wantsAllHands(e.hands)) {
    boards.say(`${e.name} wants ${e.hands} hands, and the watch has ${crew.onDeck}. Call all hands.`);
    return;
  }
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
bindOrders({ rig, crew, time, manoeuvre, helm, say: boards.say, repairs, hunt, workUp, allows });

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
    // She can only be broached to once at a time. Without this she stacks
    // them, and four men's worth of orders all try to steer her at once.
    if ([...crew.running, ...crew.waiting].some((o) => o.broach)) return;

    // Thrown broadside to the sea: her head flies up across the wind and she
    // loses every knot she had.
    const rel = signedDiff(weather.windFrom, heading) || 1;
    swing = { from: heading, delta: signedDiff(weather.windFrom, heading) - Math.sign(rel) * 90, knots0: 0 };
    knots = 0;
    crew.issue({
      name: 'Broached to — getting her before the wind again', hands: 20, minutes: 12,
      swing: true, broach: true,
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

    // She will not lie in the wind's eye. Steer her up inside six points and
    // she loses her way, the helm goes dead, and the wind on her bows pushes
    // her head round until her sails fill again. Without this you could steer
    // her into irons and stay there, since a ship with no way on does not
    // answer her rudder at all.
    if (off < 67 && knots < 1) {
      heading = wrap(heading - side * PAY_OFF * seen);
      if (!warnedInIrons) {
        warnedInIrons = true;
        boards.say('She is inside six points and taken aback. She is falling off of herself.');
      }
    } else if (off > 80) warnedInIrons = false;
  }
  ship.rotation.y = heading * Math.PI / 180;

  const course = (heading - side * point.leeway) * Math.PI / 180;
  const metres = knots * KNOT * seen;
  runX += Math.sin(course) * metres;
  runZ += Math.cos(course) * metres;

  sea.userData.update(t, runX, runZ, weather.force);
  wake.userData.update(t, runX, runZ, course, knots);
  drift.userData.update(t, runX, runZ, course);

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
  passage.run(gameDt, knots, course, (fetched) => {
    // Fetching a mark is a moment to decide something, so her clock comes
    // back to her own time rather than running away with you.
    time.slowest();
    if (fetched.then) boards.say(fetched.then);
  });

  air = readOut({
    heading, windFrom: weather.windFrom, force: weather.force,
    point: point.name, knots, squall: weather.warning
  });
}

function weatherLook(force, squall) {
  const g = greyness(force, squall);
  if (!weather2(g)) return;           // nothing to repaint
  scene.fog.color.copy(HUE.skyLow);
  sun.intensity = 1.35 * (1 - 0.45 * g);
  hemi.intensity = 2.5 * (1 - 0.2 * g);
  scene.fog.far = 660 - 240 * g;
}



let shown = 0;
let told = false;
let last = performance.now();
const BEGAN = gameSeconds;     // her clock when she sailed

function frame(now) {
  const real = Math.min((now - last) / 1000, 0.1);
  last = now;
  // Once she is in, the clock stops and only the sea keeps moving.
  const home = cruise.over || (!V.ground && passage.arrived);
  const pace = home ? 0 : time.pace;
  const seen = real * (home ? 1 : pace);   // what your eye sees
  const gameDt = pace * real * GAME_SECONDS_PER_SECOND;   // what her clock counts

  shown += seen;
  gameSeconds += gameDt;

  weather.tick(gameDt, (gameSeconds / 3600) % 24);

  // A voyage may be given squalls of its own, on cue, rather than waiting on
  // the weather's humour.
  for (const s of V.squalls || []) {
    if (!s.came && gameSeconds - BEGAN >= s.at) s.came = weather.summon(s.warning);
  }

  const warning = weather.warning;
  squallLine.userData.update(warning);
  weatherLook(weather.force, warning ? warning.strength : 0);
  sky.userData.update(shown, weather.windFrom, greyness(weather.force, warning ? warning.strength : 0));
  over = damage.tick(gameDt, weather.force);

  // Whales and mastheads belong to the cruising ground. A morning in home
  // water has neither.
  if (V.ground) {
    hunt.tick(gameDt, (gameSeconds / 3600) % 24);
    lookouts.tick(gameSeconds, readClock(gameSeconds).onDeck);
  }
  crew.tick(gameDt, readClock(gameSeconds).onDeck, weather.force, fell, noteWork);
  sail(seen, gameDt, shown);
  rideTheSwell(shown);
  stores.tick(gameDt);
  boards.update(gameSeconds, pace, { over, held: !!warning }, passage, stores,
                lookouts, hunt, cruise, workUp, air);
  instructions.update(passage, heading);
  if (pilot && underway) pilot.tick(real, conning());
  watchBill(gameSeconds);
  hands(seen);
  trim();
  whaler.smoke.userData.update(shown);
  vane.userData.update(shown, weather.windFrom, heading);

  // A short voyage ends when she has run her legs and is home again. The
  // cruise runs her distance first, and then she is on the ground: it ends
  // when her water will not stretch any further.
  if (passage.arrived && !told) {
    told = true;
    if (V.ground) {
      cruise.raise(gameSeconds);
      boards.say('She has raised the cruising ground. Keep a good lookout.');
    } else {
      logSailed(V.key);
      instructions.account(passage, readClock(gameSeconds).time);
    }
  }
  if (V.ground) {
    const ended = cruise.tick(gameSeconds);
    if (ended) {
      logSailed(V.key);
      boards.account(ended, cruise, passage.arrived, readClock(gameSeconds).time);
    }
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


