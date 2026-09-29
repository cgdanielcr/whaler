// The voyage: the clock, the lookout, and the rules. What she is doing, what
// the owner is offered to do next, and what goes into the hold.
import { BERTH, wrap } from './world.js';
import { hud } from './hud.js';

const CAP = 400, STORES = 60, CREW = 28;
const HOURS_PER_SECOND = 2;     // a day passes in twelve seconds
const SIGHT = 95;               // how far the masthead can see a spout
const REACH = 28;               // how near a whale must be to lower for her
const CHASE = 9;                // seconds the boats must hang on to take her
const WAYPOINT = { x: BERTH.x - 26, z: BERTH.z + 5 };   // stand in from here, clear of the wharf's head

export function makeVoyage({ helm, whales, boats, ship }) {
  const v = {
    phase: 'port', date: new Date(1841, 4, 1), days: 0, hours: 0,
    oil: 0, cap: CAP, stores: STORES, storesMax: STORES, crew: CREW,
    taken: 0, voyages: 0, landed: 0, quarry: null, progress: 0, leg: 0, told: {},
  };
  const far = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  const tell = (key, text) => { if (!v.told[key]) { v.told[key] = true; hud.toast(text); } };

  function bearing(p) {
    const rel = wrap(Math.atan2(p.z - helm.pos.z, p.x - helm.pos.x) - helm.heading), a = Math.abs(rel);
    const side = rel > 0 ? 'starboard' : 'larboard';
    if (a < 0.3) return 'Dead ahead';
    if (a < 1.2) return `Off the ${side} bow`;
    if (a < 1.95) return `On the ${side} beam`;
    if (a < 2.85) return `Off the ${side} quarter`;
    return 'Right astern';
  }

  function setSail() {
    v.phase = 'sea'; helm.set = true;
    helm.steer(BERTH.x - 40, BERTH.z + 10);
    hud.toast('Cast off! She stands out from the wharf.');
  }
  function lower(w) {
    v.phase = 'hunt'; v.quarry = w; v.progress = 0; helm.target = null;
    whales.hunt(w); boats.launch(helm.pos, helm.heading); ship.boatsDown(true);
    hud.toast('Lower away! The boats are after her.');
  }
  function dock() {
    v.phase = 'docking';
    v.leg = far(helm.pos, WAYPOINT) < 6 ? 1 : 0;
    const to = v.leg ? BERTH : WAYPOINT;
    helm.steer(to.x, to.z);
  }
  function arrive() {
    v.phase = 'ended'; helm.set = false; helm.target = null;
    hud.ended([
      `The ship is made fast at the wharf after <b>${v.days}</b> days at sea.`,
      `<b>${v.taken}</b> whales taken, <b>${v.oil}</b> barrels of oil landed.`,
    ], fitOut);
  }
  function fitOut() {
    v.landed += v.oil; v.voyages++;
    Object.assign(v, { oil: 0, stores: STORES, days: 0, hours: 0, taken: 0, told: {}, phase: 'port' });
    hud.toast('Fitted out again. Provisions stowed, the hands aboard.');
  }

  function tick(dt) {
    if (v.phase !== 'port' && v.phase !== 'ended') {
      v.hours += dt * HOURS_PER_SECOND;
      while (v.hours >= 24) {
        v.hours -= 24; v.days++;
        v.date.setDate(v.date.getDate() + 1);
        v.stores = Math.max(0, v.stores - 1);
        if (v.stores === 0) tell('stores', 'The provisions are out. Make for home.');
      }
    }
    for (const w of whales.within(helm.pos, SIGHT)) {
      if (!w.sighted && w.surfaced) {
        w.sighted = true;
        if (v.phase === 'sea') hud.toast(`There she blows! ${bearing(w.group.position)}.`);
      }
    }
    if (v.phase === 'hunt') hunt(dt);
    if (v.phase === 'docking') {
      if (v.leg === 0 && far(helm.pos, WAYPOINT) < 5) { v.leg = 1; helm.steer(BERTH.x, BERTH.z); }
      if (v.leg === 1 && far(helm.pos, BERTH) < 4) arrive();
    }
    if (v.phase === 'ended') {        // warp her in alongside
      const k = Math.min(1, dt);
      helm.pos.x += (BERTH.x - helm.pos.x) * k;
      helm.pos.z += (BERTH.z - helm.pos.z) * k;
      const want = Math.abs(wrap(helm.heading)) < Math.PI / 2 ? 0 : Math.PI;
      helm.heading += wrap(want - helm.heading) * k;
    }
    offer();
  }

  function hunt(dt) {
    const w = v.quarry;
    if (w.state === 'fast') {
      if (boats.fast) v.progress = Math.min(1, v.progress + dt / CHASE);
      if (v.progress >= 1) {
        whales.kill(w);
        const bbl = Math.min(v.cap - v.oil, w.barrels);
        v.oil += bbl; v.taken++;
        boats.recall();
        hud.toast(`She rolls fin out. ${bbl} barrels stowed below.`);
      }
    } else if (boats.aboard) {
      v.phase = 'sea'; v.quarry = null; ship.boatsDown(false);
      if (v.oil >= v.cap) tell('full', 'The hold is full. Make for home.');
    }
  }

  // The one thing the owner may do next, on the big button.
  function offer() {
    if (v.phase === 'port') return hud.action('Set sail', setSail);
    if (v.phase === 'sea') {
      const w = v.oil < v.cap && whales.nearest(helm.pos, REACH);
      if (w) return hud.action('Lower the boats', () => lower(w));
      if (far(helm.pos, BERTH) < 70 && (v.oil > 0 || v.days > 0)) return hud.action('Make fast at the wharf', dock);
    }
    hud.action(null);
  }

  function draw() {
    const full = v.oil >= v.cap;
    hud.ship(v);
    hud.where(v.phase === 'port' || v.phase === 'ended' ? 'At the wharf' : helm.pos.x < -60 ? 'On the whaling grounds' : 'At sea');
    const goal = { port: 'Set sail', sea: full ? 'Make for home' : 'Hunt whales', hunt: 'Take the whale',
      docking: 'Come alongside the wharf', ended: 'The voyage is made' }[v.phase];
    const hint = {
      port: 'She is fitted out and her people are aboard. Press Set sail, or click the sea.',
      sea: full ? 'The wharf lies to the east, the orange mark on the chart. Come near it and make fast.'
        : v.stores === 0 ? 'The provisions are out. Make for home.'
        : 'The whaling grounds lie far to the west, the pale patch on the chart. Click the sea to set a course.',
      hunt: '', docking: 'Standing in for the wharf. Click the sea to haul off.', ended: '',
    }[v.phase];
    hud.objective(goal, [
      ['Set sail', v.phase !== 'port'],
      [`Fill the hold (${v.oil} of ${v.cap} barrels)`, full],
      ['Return to port', v.phase === 'ended'],
    ], hint);
    const w = v.quarry;
    if (v.phase !== 'hunt') hud.chase(null);
    else if (w.state === 'fast') hud.chase(boats.fast ? 'Fast to her! The boats hang on…' : 'The boats are pulling for her', v.progress);
    else hud.chase('Hoisting in the boats', null);
  }

  function click(x, z) {
    if (v.phase === 'hunt' || v.phase === 'ended') return;
    if (v.phase === 'port') setSail();
    if (v.phase === 'docking') v.phase = 'sea';
    helm.steer(x, z);
  }

  hud.toast('The Mastiff lies at the wharf, fitted out for a whaling voyage.');
  return { v, tick, draw, click };
}
