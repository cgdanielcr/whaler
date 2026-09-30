// The ship view: the camera closes in and her three decks rise out of the
// hull to hang over the sea. The deck in hand is full size; the others stand
// above and below it, shrunk and dimmed, and a carousel brings any of them
// forward. The crew bar runs down the left, the roster down the right; carry a
// man from either, or off the deck, to where he should work. Let time run,
// slowly, to watch the watches change.
import * as THREE from 'three';
import { makeDecks } from './decks.js';
import { makeStage } from './shipstage.js';
import { DECKS } from './stations.js';
import { placeAll, LADDERS } from './watches.js';
import { makeRoster } from './roster.js';
import { makeCrewFigures } from './crewfig.js';
import { makeCrewBar } from './crewbar.js';
import { makeDeckMarks } from './deckmarks.js';
import { makeDrag } from './drag.js';
import { makePlacing } from './placing.js';
import { mood, spiritsOf } from './morale.js';

const RISE_TIME = 1.1;                   // seconds for her decks to rise out of the sea, or sink back
const WALK = 2.2;                        // how fast the men walk about the decks
const SLOW = 8;                          // with time let run, it goes this many times slower than at sea
const ROSTER_PX = 380, BAR_PX = 180;     // the roster's width on the right, the crew bar's on the left
const MONTHS = 'January February March April May June July August September October November December'.split(' ');

export function makeShipView({ view, voyage, company, crews, ship, helm }) {
  const stage = makeStage({ view, helm, ship }), d = makeDecks();
  view.scene.add(d.root);
  d.root.visible = false;
  const figs = makeCrewFigures(view.scene, company.men.length);
  const marks = makeDeckMarks({ company, stage, layers: d.layers, onStation: (id) => roster.showStation(id) });

  let chosen = null;
  const refresh = () => { voyage.refresh(); marks.relabel(); roster.render(); bar.render(); };
  function choose(id) { chosen = id; bar.choose(id); if (id != null) roster.showMan(id); }
  const roster = makeRoster({ company, crews, voyage, onChange: () => { marks.relabel(); bar.render(); }, onSelect: (id) => { chosen = id; bar.choose(id); } });
  const placing = makePlacing({ company, crews, done: refresh });
  const drag = makeDrag({ company, preview: placing.preview, drop: placing.drop, choose });
  const bar = makeCrewBar({ company, drag });

  let want = false, k = 0, running = false, sel = 0, at = 0, lastWatch = null, said = 0;
  const where = new Map();                 // each man: { deck, p, key, route }
  const v3 = new THREE.Vector3();
  const tabs = document.getElementById('deckTabs');
  DECKS.forEach((deck, i) => { const b = document.createElement('button'); b.textContent = deck.name; b.onclick = () => select(i); tabs.append(b); });
  const runBtn = document.getElementById('runTime'), watchLine = document.getElementById('watchLine');
  function setRun(on) { running = on; runBtn.textContent = on ? 'Hold time' : 'Let time run'; }
  runBtn.onclick = () => setRun(!running);

  function select(i) {
    sel = (i + DECKS.length) % DECKS.length;
    [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === sel));
    document.getElementById('deckName').textContent = DECKS[sel].name;
    roster.setDeck(DECKS[sel].id);
  }
  function show() {
    if (want) return;
    want = true;
    document.body.classList.add('inship');
    stage.open(ROSTER_PX, BAR_PX); d.setHold(voyage.v); figs.dress(company.men); marks.relabel(); bar.render(); select(sel);
  }
  function hide() {
    if (!want) return;
    want = false; chosen = null; setRun(false);
    document.body.classList.remove('inship');
    stage.close();
  }
  addEventListener('resize', () => { if (want) stage.resize(ROSTER_PX, BAR_PX); });
  document.getElementById('openShip').onclick = show;
  document.getElementById('closeShip').onclick = hide;
  document.getElementById('prevDeck').onclick = () => select(sel - 1);
  document.getElementById('nextDeck').onclick = () => select(sel + 1);
  addEventListener('keydown', (e) => {
    if (!want) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(sel - 1);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(sel + 1);
  });

  // A press on a man on deck picks him up (or, if he is not moved, chooses him);
  // a click on a station's plate shows the station.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, stage.camera);
    return ray.intersectObjects([...figs.pickables(), ...d.platesOn(sel)], false)[0];
  }
  function press(e) {
    const h = hit(e.clientX, e.clientY);
    if (!h || h.object.userData.station) return false;
    drag.begin(company.men[h.instanceId].id, e);
    return true;
  }
  function click(cx, cy) {
    const h = hit(cx, cy);
    if (h && h.object.userData.station) roster.showStation(h.object.userData.station);
  }

  // Each man makes his way to where he should be: across his deck, or to the
  // ladder, up or down it, and on. While the view is shut he is simply there.
  function walk(id, goal, dt) {
    if (!goal) { where.delete(id); return null; }
    let s = where.get(id);
    const key = `${goal.deck}|${goal.p.join()}`;
    if (!s || k < 1) { s = { deck: goal.deck, p: [...goal.p], key, route: [], pose: goal.pose, face: goal.face }; where.set(id, s); return s; }
    if (s.key !== key) {
      const ladder = LADDERS[goal.berth] || LADDERS.steerage;
      s.route = s.deck === goal.deck ? [goal] : [{ deck: s.deck, p: ladder }, { deck: goal.deck, p: ladder, climb: true }, goal];
      s.key = key;
    }
    const next = s.route[0];
    if (!next) { s.pose = goal.pose; s.face = goal.face; return s; }       // arrived: turned to his work
    if (next.climb) { s.deck = next.deck; s.p = [...next.p]; s.route.shift(); return s; }
    const dx = next.p[0] - s.p[0], dz = next.p[2] - s.p[2], dist = Math.hypot(dx, dz), step = WALK * dt;
    s.pose = 'walk'; if (dist > 0.01) s.face = Math.atan2(-dz, dx);        // facing the way he goes
    if (dist <= step) { s.p = [...next.p]; s.deck = next.deck; s.route.shift(); }
    else { s.p[0] += (dx / dist) * step; s.p[2] += (dz / dist) * step; s.p[1] += (next.p[1] - s.p[1]) * Math.min(1, step / dist); }
    return s;
  }

  // The top bar: the date, the watch and the bells, and how the men are.
  function tellWatch(w, dt) {
    if (lastWatch !== null && w.index !== lastWatch && want) {
      said = 3; watchLine.textContent = `Eight bells! The ${w.onDeck} watch comes on deck, and the other goes below.`;
      roster.render(); bar.render();
    }
    lastWatch = w.index;
    const v = voyage.v, s = spiritsOf(company);
    document.getElementById('shipDate').textContent = `${v.date.getDate()} ${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`;
    document.getElementById('shipMood').textContent = `Spirits: ${mood(s).toLowerCase()}`;
    if ((said -= dt) > 0) return;
    watchLine.textContent = `${w.bells} bell${w.bells > 1 ? 's' : ''} in the ${w.name}. The ${w.onDeck} watch has the deck${w.day ? '' : '; the idlers are asleep'}.`;
  }

  function update(dt) {
    // She comes apart out of the sea, or goes back together into it.
    k = Math.min(1, Math.max(0, k + (want ? dt : -dt) / RISE_TIME));
    const e = k * k * (3 - 2 * k);
    d.root.visible = k > 0.001;
    if (!d.root.visible) { stage.place(d.root, d.layers, 0, at); for (let i = 0; i < company.men.length; i++) figs.place(i, null, null, 0, false); figs.done(); marks.update(-1, false, null); return; }

    at += (sel - at) * Math.min(1, dt * 6);                // the carousel turns
    stage.place(d.root, d.layers, e, at);
    d.root.updateMatrixWorld(true);

    const w = voyage.watch;
    tellWatch(w, dt);
    const places = placeAll(company, w);
    let mine = null;
    company.men.forEach((m, i) => {
      const p = walk(m.id, places.get(m.id), dt), g = p && d.layers[p.deck].group;
      figs.place(i, m, p ? v3.set(...p.p).applyMatrix4(g.matrixWorld) : null, p ? g.scale.x : 0, m.id === chosen, p && p.face, p && p.pose, d.root.quaternion);
      if (p && m.id === chosen) mine = { name: m.name, deck: p.deck, p: p.p };
    });
    figs.done();
    marks.update(sel, want && k >= 1 && Math.abs(at - sel) < 0.05, mine);
  }

  return {
    update, show, hide, click, press, stage,
    look: (sea) => stage.look(sea, k * k * (3 - 2 * k)),   // where the camera should look
    get busy() { return want || k > 0; },                  // the world stands still while she is open
    get open() { return want; },
    get slow() { return running ? 1 / SLOW : 0; },         // how fast the world goes while she is open
  };
}
