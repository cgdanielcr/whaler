// The voyage: fitting out, the clock, the lookout, the return home and the
// owners' reckoning. What she is doing, and what the owner may do next.
import { BERTH, wrap } from './world.js';
import { describe } from './species.js';
import { HOLD, CREW, BOATS, FITS, PER_DAY, room, oil, worth, daysHome, lowerable, verdict, money } from './stores.js';
import { makeChase } from './chase.js';
import { hud } from './hud.js';

const HOURS_PER_SECOND = 4;     // a day passes in six seconds
const SIGHT = 95;               // how far the masthead can see a spout
const MAKE_OUT = 50;            // how near before the kind of whale can be told
const REACH = 28;               // how near a whale must be to lower for her
const WAYPOINT = { x: BERTH.x - 26, z: BERTH.z + 5 };   // stand in from here, clear of the wharf's head

export function makeVoyage({ helm, whales, boats, ship }) {
  const v = {
    phase: 'port', fitted: false, paused: false, date: new Date(1841, 4, 1), days: 0, hours: 0,
    stores: 0, whale: 0, sperm: 0, crew: CREW, boats: BOATS, taken: 0, lost: 0, boatsLost: 0,
    voyages: 0, landed: 0, leg: 0, told: {},
  };
  const chase = makeChase({ v, whales, boats, helm });
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

  function fitOut() {
    hud.fitOut(FITS.map((f) => ({ ...f, room: HOLD - f.days * PER_DAY })), (f) => {
      Object.assign(v, { stores: f.days, crew: CREW, boats: BOATS, fitted: true });
      hud.toast(`${f.days} days' provisions stowed. The hands are aboard.`);
    });
  }
  function setSail() {
    v.phase = 'sea'; helm.set = true;
    helm.steer(BERTH.x - 40, BERTH.z + 10);
    hud.toast('Cast off! She stands out from the wharf.');
  }
  function dock() {
    v.phase = 'docking';
    v.leg = far(helm.pos, WAYPOINT) < 6 ? 1 : 0;
    const to = v.leg ? BERTH : WAYPOINT;
    helm.steer(to.x, to.z);
  }
  function arrive() {
    v.phase = 'ended'; helm.set = false; helm.target = null;
    const lines = [
      `Made fast at the wharf after <b>${v.days}</b> days at sea, with <b>${v.taken}</b> whales taken.`,
      `Whale oil: <b>${v.whale}</b> barrels. Sperm oil: <b>${v.sperm}</b> barrels. Together they fetch <b>${money(worth(v))}</b>.`,
    ];
    if (v.lost || v.boatsLost) lines.push(`Lost: <b>${v.lost}</b> men and <b>${v.boatsLost}</b> boats.`);
    lines.push(verdict(worth(v)));
    hud.ended(lines, () => {
      v.landed += worth(v); v.voyages++;
      Object.assign(v, { whale: 0, sperm: 0, days: 0, hours: 0, taken: 0, lost: 0, boatsLost: 0, told: {}, phase: 'port', fitted: false });
      fitOut();
    });
  }

  function newDay() {
    v.days++;
    v.date.setDate(v.date.getDate() + 1);
    if (v.stores > 0) v.stores--;
    else if (v.crew > 0) { v.crew--; v.lost++; hud.toast('Scurvy. Another man is sewn into his hammock.'); }
    if (v.stores === 0) tell('out', 'The provisions are out. The men will sicken.');
    const home = daysHome(helm.pos);
    if (v.phase !== 'docking' && v.stores > 0 && v.stores <= home + 3) {
      tell('turn', `The mate reckons ${home} days' sail home, and there are ${v.stores} days' provisions left.`);
    }
  }

  function tick(dt) {
    if (v.phase !== 'port' && v.phase !== 'ended') {
      v.hours += dt * HOURS_PER_SECOND;
      while (v.hours >= 24) { v.hours -= 24; newDay(); }
    }
    helm.hands = Math.min(1, Math.max(0.35, v.crew / 18));
    for (const w of whales.within(helm.pos, SIGHT)) {
      if (!w.sighted && w.surfaced) {
        w.sighted = true;
        if (v.phase === 'sea') hud.toast(`There she blows! ${bearing(w.group.position)}.`);
      }
      if (w.sighted && !w.known && far(w.group.position, helm.pos) < MAKE_OUT) {
        w.known = true;
        if (v.phase === 'sea') hud.toast(`A ${describe(w)}. ${w.sp.note}`);
      }
    }
    if (v.phase === 'hunt') {
      chase.tick(dt);
      if (chase.over && boats.aboard) { v.phase = 'sea'; chase.clear(); if (room(v) < 10) tell('full', 'The hold is full. Make for home.'); }
    }
    if (v.phase === 'docking') {
      if (v.leg === 0 && far(helm.pos, WAYPOINT) < 5) { v.leg = 1; helm.steer(BERTH.x, BERTH.z); }
      if (v.leg === 1 && far(helm.pos, BERTH) < 4) arrive();
    }
    if (v.phase === 'ended') {        // warp her in alongside
      const k = Math.min(1, dt);
      helm.pos.x += (BERTH.x - helm.pos.x) * k;
      helm.pos.z += (BERTH.z - helm.pos.z) * k;
      helm.heading += wrap((Math.abs(wrap(helm.heading)) < Math.PI / 2 ? 0 : Math.PI) - helm.heading) * k;
    }
    ship.boats(v.boats, boats.out);
    offer();
  }

  // The one thing the owner may do next, on the big button.
  function offer() {
    if (v.phase === 'port') return hud.action(v.fitted ? 'Set sail' : null, setSail);
    if (v.phase === 'sea') {
      const w = room(v) >= 10 && whales.nearest(helm.pos, REACH), n = lowerable(v);
      if (w && n > 0) {
        return hud.action(`Lower ${n === 1 ? 'a boat' : 'the boats'} for the ${describe(w)}`, () => { v.phase = 'hunt'; helm.target = null; chase.start(w, n); });
      }
      if (far(helm.pos, BERTH) < 70 && v.days > 0) return hud.action('Make fast at the wharf', dock);
    }
    hud.action(null);
  }

  function hint() {
    if (v.phase === 'port') return v.fitted ? 'Press Set sail, or click the sea.' : 'Choose how much provision to take.';
    if (v.phase === 'docking') return 'Standing in for the wharf. Click the sea to haul off.';
    if (v.phase !== 'sea') return '';
    if (room(v) < 10) return 'The hold is full. Make for home: the wharf is the orange mark on the chart.';
    if (v.stores <= daysHome(helm.pos)) return 'There are not provisions enough for the passage home. Turn for home now.';
    if (lowerable(v) === 0) return 'Too few hands or boats left to lower. Make for home.';
    return 'Bowheads keep to the north among the ice, sperm whales to the south, right whales and humpbacks between. Click the sea to set a course.';
  }

  function draw() {
    const full = room(v) < 10;
    hud.ship(v, { room: room(v), home: daysHome(helm.pos), atSea: v.phase !== 'port' && v.phase !== 'ended' });
    hud.where(v.phase === 'port' || v.phase === 'ended' ? 'At the wharf' : helm.pos.x < -60 ? 'On the whaling grounds' : 'At sea');
    const goal = { port: v.fitted ? 'Set sail' : 'Fit out', sea: full ? 'Make for home' : 'Hunt whales', hunt: 'Take the whale',
      docking: 'Come alongside the wharf', ended: 'The voyage is made' }[v.phase];
    hud.objective(goal, [
      ['Fit out and set sail', v.phase !== 'port'],
      [`Fill the hold (${oil(v)} barrels of oil)`, full],
      ['Return to port', v.phase === 'ended'],
    ], hint());
    hud.chase(...(v.phase === 'hunt' ? chase.status : [null, null]));
  }

  function click(x, z) {
    if (v.paused || v.phase === 'hunt' || v.phase === 'ended' || (v.phase === 'port' && !v.fitted)) return;
    if (v.phase === 'port') setSail();
    if (v.phase === 'docking') v.phase = 'sea';
    helm.steer(x, z);
  }

  hud.toast('The Mastiff lies at the wharf, to be fitted out for a whaling voyage.');
  fitOut();
  return { v, tick, draw, click, get quarry() { return chase.whale; } };
}
