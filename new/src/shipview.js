// The ship view: a screen of its own. The sea fades out and the ship stands
// alone on a dark stage, her three decks lifted apart. The deck in hand is
// large and near; the others stand off above and below it, and a carousel
// brings any of them forward. The roster beside it names every man; click a
// man or a station plate. Let time run, slowly, to watch the watches change.
import * as THREE from 'three';
import { makeDecks } from './decks.js';
import { makeStage } from './shipstage.js';
import { DECKS, STATIONS, SLOTS, LABELS, slotStation } from './stations.js';
import { placeAll, LADDERS } from './watches.js';
import { makeRoster } from './roster.js';
import { makeCrewFigures } from './crewfig.js';
import { mood, spiritsOf } from './morale.js';

const FADE = 0.3;                        // seconds to fade to black, and back
const WALK = 2.2;                        // how fast the men walk about the decks
const SLOW = 8;                          // with time let run, it goes this many times slower than at sea
const ROSTER_PX = 380;                   // the roster's width, on the right
const MONTHS = 'January February March April May June July August September October November December'.split(' ');

export function makeShipView({ view, voyage, company, crews }) {
  const stage = makeStage(view.renderer), d = makeDecks();
  stage.scene.add(d.root);
  d.layers.forEach((l) => l.fade(1));

  // The men, each dressed from his own look.
  const figs = makeCrewFigures(stage.scene, company.men.length);
  let chosen = null;

  // Names on the deck in hand; station plates carry who works them.
  const box = document.getElementById('labels');
  const labels = [...STATIONS.map((s) => ({ deck: s.deck, text: s.name, at: [s.at[0], s.at[1] + 1.1, s.at[2]], station: s.id })), ...LABELS]
    .map((l) => { const el = document.createElement('div'); el.className = l.station ? 'label station' : 'label'; box.append(el); return { ...l, el, deck: DECKS.findIndex((x) => x.id === l.deck) }; });
  function relabel() {
    for (const l of labels) {
      const who = l.station && SLOTS.filter((k) => slotStation(k).id === l.station).map((k) => { const m = company.man(k); return m ? `${m.name[0]}. ${m.name.split(' ').pop()}` : '—'; });
      l.el.textContent = who ? `${l.text}: ${who.join(' / ')}` : l.text;
      l.el.classList.toggle('empty', !!who && who.includes('—'));      // a station with no one at it shows red
    }
  }

  const roster = makeRoster({ company, crews, voyage, onChange: relabel, onSelect: (id) => { chosen = id; } });
  let want = false, showing = false, black = 0, running = false, sel = 0, at = 0, lastWatch = null, said = 0;
  const where = new Map();                 // each man: { deck, p, key, route }
  const v3 = new THREE.Vector3();
  const tabs = document.getElementById('deckTabs'), fade = document.getElementById('fade');
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
  const show = () => { want = true; };
  const hide = () => { want = false; chosen = null; setRun(false); };
  addEventListener('resize', () => stage.resize(ROSTER_PX));
  document.getElementById('openShip').onclick = show;
  document.getElementById('closeShip').onclick = hide;
  document.getElementById('prevDeck').onclick = () => select(sel - 1);
  document.getElementById('nextDeck').onclick = () => select(sel + 1);
  addEventListener('keydown', (e) => {
    if (!showing) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(sel - 1);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(sel + 1);
  });

  // A click on a man shows his card; a click on a station's plate shows the station.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function click(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, stage.camera);
    const hit = ray.intersectObjects([...figs.pickables(), ...d.platesOn(sel)], false)[0];
    if (!hit) return;
    if (hit.object.userData.station) roster.showStation(hit.object.userData.station);
    else roster.showMan(company.men[hit.instanceId].id);
  }

  // Each man makes his way to where he should be: across his deck, or to the
  // ladder, up or down it, and on. While the view is shut he is simply there.
  function walk(id, goal, dt) {
    if (!goal) { where.delete(id); return null; }
    let s = where.get(id);
    const key = `${goal.deck}|${goal.p.join()}`;
    if (!s || !showing) { s = { deck: goal.deck, p: [...goal.p], key, route: [] }; where.set(id, s); return s; }
    if (s.key !== key) {
      const ladder = LADDERS[goal.berth] || LADDERS.steerage;
      s.route = s.deck === goal.deck ? [goal] : [{ deck: s.deck, p: ladder }, { deck: goal.deck, p: ladder, climb: true }, goal];
      s.key = key;
    }
    const next = s.route[0];
    if (!next) return s;
    if (next.climb) { s.deck = next.deck; s.p = [...next.p]; s.route.shift(); return s; }
    const dx = next.p[0] - s.p[0], dz = next.p[2] - s.p[2], dist = Math.hypot(dx, dz), step = WALK * dt;
    if (dist <= step) { s.p = [...next.p]; s.deck = next.deck; s.route.shift(); }
    else { s.p[0] += (dx / dist) * step; s.p[2] += (dz / dist) * step; s.p[1] += (next.p[1] - s.p[1]) * Math.min(1, step / dist); }
    return s;
  }

  // The top bar: the date, the watch and the bells, and how the men are.
  function tellWatch(w, dt) {
    if (lastWatch !== null && w.index !== lastWatch && showing) {
      said = 3; watchLine.textContent = `Eight bells! The ${w.onDeck} watch comes on deck, and the other goes below.`;
      roster.render();
    }
    lastWatch = w.index;
    const v = voyage.v, s = spiritsOf(company);
    document.getElementById('shipDate').textContent = `${v.date.getDate()} ${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`;
    document.getElementById('shipMood').textContent = `Spirits: ${mood(s).toLowerCase()}`;
    if ((said -= dt) > 0) return;
    watchLine.textContent = `${w.bells} bell${w.bells > 1 ? 's' : ''} in the ${w.name}. The ${w.onDeck} watch has the deck${w.day ? '' : '; the idlers are asleep'}.`;
  }

  function update(dt) {
    // Fade to black, change screens, fade back.
    const target = want !== showing ? 1 : 0;
    black = Math.min(1, Math.max(0, black + (target ? dt : -dt) / FADE));
    if (black >= 1 && want !== showing) {
      showing = want;
      document.body.classList.toggle('inship', showing);
      if (showing) { stage.resize(ROSTER_PX); d.setHold(voyage.v); figs.dress(company.men); relabel(); select(sel); }
    }
    fade.style.opacity = black;
    fade.style.pointerEvents = black > 0.05 ? 'auto' : 'none';
    if (!showing) return;

    at += (sel - at) * Math.min(1, dt * 6);                // the carousel turns
    stage.place(d.layers, at);
    d.root.updateMatrixWorld(true);

    const w = voyage.watch;
    tellWatch(w, dt);
    const places = placeAll(company, w);
    company.men.forEach((m, i) => {
      const p = walk(m.id, places.get(m.id), dt), g = p && d.layers[p.deck].group;
      figs.place(i, m, p ? v3.set(...p.p).applyMatrix4(g.matrixWorld) : null, p ? g.scale.x : 0, m.id === chosen);
    });
    figs.done();

    for (const l of labels) {
      const on = l.deck === sel && Math.abs(at - sel) < 0.05;
      l.el.hidden = !on;
      if (!on) continue;
      v3.set(...l.at).applyMatrix4(d.layers[l.deck].group.matrixWorld).project(stage.camera);
      l.el.style.left = `${((v3.x + 1) / 2) * innerWidth}px`;
      l.el.style.top = `${((1 - v3.y) / 2) * innerHeight}px`;
    }
  }

  return {
    update, show, hide, click, stage,
    render: () => stage.render(),
    get showing() { return showing; },                     // the ship screen is up: draw it, not the sea
    get busy() { return want || showing; },                // the world stands still while she is open
    get open() { return showing && want; },
    get slow() { return running ? 1 / SLOW : 0; },         // how fast the world goes while she is open
  };
}
