// The ship view: the camera swoops in, the world stands still, and the ship
// comes apart into her three decks, lifted clear of the sea. The carousel
// brings one deck to the fore; the decks above it fade so you can look in.
// The roster beside it names every man; click a man or a station plate.
import * as THREE from 'three';
import { makeDecks } from './decks.js';
import { DECKS, STATIONS, SLOTS, LABELS, slotStation } from './stations.js';
import { placeAll } from './watches.js';
import { makeRoster } from './roster.js';

const BASE = 3, GAP = 7;                 // heights of the hold, 'tween deck and upper deck when apart
const SHUT = [0.9, -0.1, -1.1];          // their heights when she is whole
const TIME = 1.1;                        // seconds to come apart or go back together
const SHOW = Math.PI / 4;                // bow to the right of the screen, as a ship's plan is drawn
const ZOOM = 21;                         // how much of the world shows when looking at a deck
const ROSTER_PX = 360;                   // the roster's width: the ship is drawn to the left of it
const RIGHT = new THREE.Vector3(1, 0, 1).normalize();     // the screen's right, on the sea
const COLOR = { larboard: new THREE.Color(0x2b3550), starboard: new THREE.Color(0x7a3b2a),
  idler: new THREE.Color(0x6b5a3a), officer: new THREE.Color(0x161616), chosen: new THREE.Color(0xf0c96a) };

export function makeShipView({ scene, view, ship, helm, voyage, company }) {
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

  const roster = makeRoster({ company, voyage, onChange: relabel, onSelect: (id) => { chosen = id; } });
  let open = false, k = 0, sel = 0, from = 0, wasH = null;
  const heights = [0, 0, 0], m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), focus = new THREE.Vector3();
  const tabs = document.getElementById('deckTabs');
  DECKS.forEach((deck, i) => { const b = document.createElement('button'); b.textContent = deck.name; b.onclick = () => select(i); tabs.append(b); });

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
    open = false; view.height(wasH); chosen = null;
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
    const at = placeAll(company);
    company.men.forEach((m, i) => {
      const p = at.get(m.id), hidden = !p || (p.deck < sel && e > 0.3);
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
  };
}
