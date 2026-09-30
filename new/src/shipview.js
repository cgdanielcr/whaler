// The ship view: the camera swoops in, the world stands still, and the ship
// comes apart into her three decks, lifted clear of the sea. The carousel
// brings one deck to the fore; the decks above it fade so you can look in.
import * as THREE from 'three';
import { makeDecks } from './decks.js';
import { DECKS, STATIONS, LABELS, BERTHS, station } from './stations.js';

const BASE = 3, GAP = 7;                 // heights of the hold, 'tween deck and upper deck when apart
const SHUT = [0.9, -0.1, -1.1];          // their heights when she is whole
const TIME = 1.1;                        // seconds to come apart or go back together
const SHOW = Math.PI / 4;                // bow to the right of the screen, as a ship's plan is drawn
const ZOOM = 21;                         // how much of the world shows when looking at a deck
const WATCH = { larboard: 0x2b3550, starboard: 0x7a3b2a, idler: 0x6b5a3a, officer: 0x161616 };

// Until the company is named (the next step), men stand where their sort would be.
function placeholders() {
  const men = [], at = (deck, p, kind) => men.push({ deck: DECKS.findIndex((d) => d.id === deck), p, kind });
  for (const id of ['wheel', 'foreMast', 'mainMast']) at('upper', station(id).at, 'larboard');
  for (const p of [[1.0, 0, -1.0], [-0.8, 0, 0.9], [4.4, 0, 0.7], [-2.9, 0, 0.5], [5.4, 0, -0.4]]) at('upper', p, 'larboard');
  for (const p of BERTHS.forecastle) at('tween', p, 'starboard');
  for (const p of BERTHS.steerage.slice(0, 4)) at('tween', p, 'starboard');
  at('upper', station('galley').at, 'idler'); at('upper', station('bench').at, 'idler');
  at('upper', [1.9, 0, 1.0], 'idler'); at('tween', station('pantry').at, 'idler'); at('hold', station('cooper').at, 'idler');
  at('upper', [-3.2, 0, -0.6], 'officer');
  for (const p of BERTHS.cabin.slice(0, 3)) at('tween', p, 'officer');
  return men;
}

export function makeShipView({ scene, view, ship, helm, voyage }) {
  const d = makeDecks();
  d.root.visible = false;
  scene.add(d.root);

  // The men, drawn all at once: bodies and heads.
  const men = placeholders();
  const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.18, 0.75, 6),
    new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), men.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a27b, flatShading: true }), men.length);
  men.forEach((m, i) => bodies.setColorAt(i, new THREE.Color(WATCH[m.kind])));
  bodies.castShadow = heads.castShadow = true;
  d.root.add(bodies, heads);

  // Names on the deck in view.
  const box = document.getElementById('labels');
  const labels = [...STATIONS.map((s) => ({ deck: s.deck, text: s.name, at: [s.at[0], s.at[1] + 1.1, s.at[2]], station: true })), ...LABELS]
    .map((l) => { const el = document.createElement('div'); el.className = l.station ? 'label station' : 'label'; el.textContent = l.text; box.append(el); return { ...l, el, deck: DECKS.findIndex((x) => x.id === l.deck) }; });

  let open = false, k = 0, sel = 0, from = 0, wasH = null;
  const heights = [0, 0, 0], m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), focus = new THREE.Vector3();
  const tabs = document.getElementById('deckTabs');
  DECKS.forEach((deck, i) => { const b = document.createElement('button'); b.textContent = deck.name; b.onclick = () => select(i); tabs.append(b); });

  function select(i) {
    sel = (i + DECKS.length) % DECKS.length;
    [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === sel));
  }
  function show() {
    if (open) return;
    open = true; from = helm.heading; wasH = view.height(ZOOM);
    d.setHold(voyage.v);
    document.body.classList.add('inship');
    select(0);
  }
  function hide() {
    if (!open) return;
    open = false; view.height(wasH);
    document.body.classList.remove('inship');
  }
  document.getElementById('openShip').onclick = show;
  document.getElementById('closeShip').onclick = hide;
  document.getElementById('prevDeck').onclick = () => select(sel - 1);
  document.getElementById('nextDeck').onclick = () => select(sel + 1);
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(sel - 1);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(sel + 1);
  });

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
    men.forEach((m, i) => {
      const hidden = m.deck < sel && e > 0.3;
      const s = hidden ? 0.0001 : 1;
      m4.makeScale(s, s, s).setPosition(m.p[0], heights[m.deck] + m.p[1] + 0.375, m.p[2]);
      bodies.setMatrixAt(i, m4);
      m4.makeScale(s, s, s).setPosition(m.p[0], heights[m.deck] + m.p[1] + 0.86, m.p[2]);
      heads.setMatrixAt(i, m4);
    });
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;

    d.root.updateMatrixWorld(true);
    const cam = view.camera;
    for (const l of labels) {
      const on = open && e > 0.95 && l.deck === sel;
      l.el.hidden = !on;
      if (!on) continue;
      v3.set(l.at[0], heights[l.deck] + l.at[1], l.at[2]);
      d.root.localToWorld(v3).project(cam);
      l.el.style.left = `${((v3.x + 1) / 2) * innerWidth}px`;
      l.el.style.top = `${((1 - v3.y) / 2) * innerHeight}px`;
    }
  }

  // Where the camera should look: the ship at sea, or the deck in view.
  function look(sea) {
    const e = k * k * (3 - 2 * k);
    focus.set(helm.pos.x, heights[sel] || 0, helm.pos.z);
    return focus.lerp(sea, 1 - e);
  }

  return {
    update, look, show, hide,
    get busy() { return k > 0; },     // the world stands still while she is open or opening
    get open() { return open; },
  };
}
