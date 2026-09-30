// The ship view: the camera swoops in, the world stands still, and the ship
// comes apart into her three decks, lifted clear of the sea. The carousel
// brings one deck to the fore; the decks above it fade so you can look in.
// The roster beside it names every man; click a man or a station plate.
// Let time run, slowly, and the men go to and fro as the watches change.
import * as THREE from 'three';
import { makeDecks } from './decks.js';
import { DECKS, STATIONS, SLOTS, LABELS, slotStation } from './stations.js';
import { placeAll, LADDERS } from './watches.js';
import { makeRoster } from './roster.js';

const BASE = 3, GAP = 7;                 // heights of the hold, 'tween deck and upper deck when apart
const SHUT = [0.9, -0.1, -1.1];          // their heights when she is whole
const TIME = 1.1;                        // seconds to come apart or go back together
const SHOW = Math.PI / 4;                // bow to the right of the screen, as a ship's plan is drawn
const ZOOM = 21;                         // how much of the world shows when looking at a deck
const WALK = 2.2;                        // how fast the men walk about the decks
const SLOW = 8;                          // with time let run, it goes this many times slower than at sea
const ROSTER_PX = 360;                   // the roster's width: the ship is drawn to the left of it
const RIGHT = new THREE.Vector3(1, 0, 1).normalize();     // the screen's right, on the sea
const COLOR = { larboard: new THREE.Color(0x2b3550), starboard: new THREE.Color(0x7a3b2a),
  idler: new THREE.Color(0x6b5a3a), officer: new THREE.Color(0x161616), chosen: new THREE.Color(0xf0c96a) };

export function makeShipView({ scene, view, ship, helm, voyage, company, crews }) {
  const d = makeDecks();
  d.root.visible = false;
  scene.add(d.root);

  // The men, drawn all at once: bodies and heads, one of each per man.
  const N = company.men.length;
  const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.18, 0.75, 6),
    new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), N);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a27b, flatShading: true }), N);
  bodies.castShadow = heads.castShadow = true;
  d.root.add(bodies, heads);
  let chosen = null;
  const colorOf = (m) => (m.id === chosen ? COLOR.chosen : m.officer ? COLOR.officer : m.watch ? COLOR[m.watch] : COLOR.idler);

  // Names on the deck in view; station plates carry who works them.
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
  let open = false, running = false, k = 0, sel = 0, from = 0, wasH = null, lastWatch = null, said = 0;
  const where = new Map();                 // each man: { deck, p, key, route }
  const heights = [0, 0, 0], m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), focus = new THREE.Vector3();
  const tabs = document.getElementById('deckTabs');
  DECKS.forEach((deck, i) => { const b = document.createElement('button'); b.textContent = deck.name; b.onclick = () => select(i); tabs.append(b); });

  const runBtn = document.getElementById('runTime'), watchLine = document.getElementById('watchLine');
  function setRun(on) { running = on; runBtn.textContent = on ? 'Hold time' : 'Let time run'; }
  runBtn.onclick = () => setRun(!running);

  function select(i) {
    sel = (i + DECKS.length) % DECKS.length;
    [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === sel));
    roster.setDeck(DECKS[sel].id);
  }
  function show() {
    if (open) return;
    open = true; from = helm.heading; wasH = view.height(ZOOM);
    d.setHold(voyage.v); relabel();
    document.body.classList.add('inship');
    select(0);
  }
  function hide() {
    if (!open) return;
    open = false; view.height(wasH); chosen = null; setRun(false);
    document.body.classList.remove('inship');
  }
  document.getElementById('openShip').onclick = show;
  document.getElementById('closeShip').onclick = hide;
  document.getElementById('prevDeck').onclick = () => select(sel - 1);
  document.getElementById('nextDeck').onclick = () => select(sel + 1);
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') select(sel - 1);
    if (e.key === 'ArrowRight') select(sel + 1);
  });

  // A click on a man shows his card; a click on a station's plate shows the station.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function click(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, view.camera);
    const hit = ray.intersectObjects([bodies, heads, ...d.platesOn(sel)], false)[0];
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
    if (!s || !open) { s = { deck: goal.deck, p: [...goal.p], key, route: [] }; where.set(id, s); return s; }
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

  // The watch, the bells, and a word when the watches change.
  function tellWatch(w, dt) {
    if (lastWatch !== null && w.index !== lastWatch && open) {
      said = 3; watchLine.textContent = `Eight bells! The ${w.onDeck} watch comes on deck, and the other goes below.`;
      roster.render();
    }
    lastWatch = w.index;
    if ((said -= dt) > 0) return;
    watchLine.textContent = `${w.bells} bell${w.bells > 1 ? 's' : ''} in the ${w.name}. The ${w.onDeck} watch has the deck${w.day ? '' : '; the idlers are asleep'}.`;
  }

  function update(dt) {
    k = Math.min(1, Math.max(0, k + (open ? dt : -dt) / TIME));
    const e = k * k * (3 - 2 * k);
    d.root.visible = k > 0.001;
    ship.group.visible = k < 0.02;
    if (!d.root.visible) return;

    d.root.position.set(helm.pos.x, 0, helm.pos.z);
    const turn = Math.atan2(Math.sin(SHOW - from), Math.cos(SHOW - from));
    d.root.rotation.y = -(from + turn * e);
    d.layers.forEach((l, i) => {
      const apart = BASE + GAP * (DECKS.length - 1 - i);
      heights[i] = SHUT[i] + (apart - SHUT[i]) * e;
      l.group.position.y = heights[i];
      l.fade(i < sel ? 1 - 0.88 * e : 1);                  // decks above the one in view fade away
    });
    const w = voyage.watch;
    tellWatch(w, dt);
    const at = placeAll(company, w);
    company.men.forEach((m, i) => {
      const p = walk(m.id, at.get(m.id), dt), hidden = !p || (p.deck < sel && e > 0.3);
      const s = hidden ? 0.0001 : 1, y = p ? heights[p.deck] + p.p[1] : 0, [x, , z] = p ? p.p : [0, 0, 0];
      bodies.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, y + 0.375, z));
      heads.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, y + 0.86, z));
      bodies.setColorAt(i, colorOf(m));
    });
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = bodies.instanceColor.needsUpdate = true;
    bodies.computeBoundingSphere(); heads.computeBoundingSphere();     // they have moved: for clicking, and so they are not culled

    d.root.updateMatrixWorld(true);
    for (const l of labels) {
      const on = open && e > 0.95 && l.deck === sel;
      l.el.hidden = !on;
      if (!on) continue;
      v3.set(l.at[0], heights[l.deck] + l.at[1], l.at[2]);
      d.root.localToWorld(v3).project(view.camera);
      l.el.style.left = `${((v3.x + 1) / 2) * innerWidth}px`;
      l.el.style.top = `${((1 - v3.y) / 2) * innerHeight}px`;
    }
  }

  // Where the camera should look: the ship at sea, or the deck in view (set off to the left of the roster).
  function look(sea) {
    const e = k * k * (3 - 2 * k), shift = innerWidth > 760 ? ((ROSTER_PX / 2) * ZOOM) / innerHeight : 0;
    focus.set(helm.pos.x, heights[sel] || 0, helm.pos.z).addScaledVector(RIGHT, shift);
    return focus.lerp(sea, 1 - e);
  }

  return {
    update, look, show, hide, click,
    get busy() { return k > 0; },     // the world stands still while she is open or opening
    get open() { return open; },
    get slow() { return running ? 1 / SLOW : 0; },   // how fast the world goes while she is open
  };
}
