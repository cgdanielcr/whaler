// The voyage: fitting out, the clock, the lookout, the ice, the return home,
// the loss of the ship, and the owners' reckoning.
import { BERTH, wrap } from './world.js';
import { describe } from './species.js';
import { HOLD, CREW, BOATS, FITS, PER_DAY, REPAIR, NEW_SHIP, worth, daysHome, verdict, money } from './stores.js';
import { makeSeason, dayOfYear, LAST_FIT } from './season.js';
import { makeChase } from './chase.js';
import { makeTrying } from './trying.js';
import { offer, draw } from './orders.js';
import { hud } from './hud.js';

const HOURS_PER_SECOND = 4;     // a day passes in six seconds
const DAY = 24 / HOURS_PER_SECOND;
const SIGHT = 95;               // how far the masthead can see a spout
const MAKE_OUT = 50;            // how near before the kind of whale can be told
const WAYPOINT = { x: BERTH.x - 26, z: BERTH.z + 5 };   // stand in from here, clear of the wharf's head
const MONTHS = 'January February March April May June July August September October November December'.split(' ');

export function makeVoyage({ scene, helm, whales, boats, ship, start }) {
  const v = {
    phase: 'port', fitted: false, paused: false, date: new Date(start), days: 0, hours: 0,
    stores: 0, whale: 0, sperm: 0, crew: CREW, boats: BOATS, hull: 100, taken: 0, lost: 0, boatsLost: 0,
    voyages: 0, landed: 0, leg: 0, told: {},
  };
  const season = makeSeason();
  const chase = makeChase({ v, whales, boats, helm });
  const trying = makeTrying(scene, { v, whales, helm });
  const far = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  const tell = (key, text) => { if (!v.told[key]) { v.told[key] = true; hud.toast(text); } };
  const dateText = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  function bearing(p) {
    const rel = wrap(Math.atan2(p.z - helm.pos.z, p.x - helm.pos.x) - helm.heading), a = Math.abs(rel);
    const side = rel > 0 ? 'starboard' : 'larboard';
    if (a < 0.3) return 'Dead ahead';
    if (a < 1.2) return `Off the ${side} bow`;
    if (a < 1.95) return `On the ${side} beam`;
    if (a < 2.85) return `Off the ${side} quarter`;
    return 'Right astern';
  }

  function fitOut(first) {
    let intro = '';
    if (!first) v.date.setDate(v.date.getDate() + 7);             // a week to discharge and refit
    if (dayOfYear(v.date) > LAST_FIT) {
      v.date = new Date(v.date.getFullYear() + 1, 4, 1);
      intro = 'Too late in the year for another voyage: she lay up for the winter. ';
    }
    intro += `It is ${dateText(v.date)}. ${season.advice(v.date)}`;
    season.calm();
    hud.fitOut(FITS.map((f) => ({ ...f, room: HOLD - f.days * PER_DAY })), (f) => {
      Object.assign(v, { stores: f.days, crew: CREW, boats: BOATS, hull: 100, fitted: true });
      hud.toast(`${f.days} days' provisions stowed. The hands are aboard.`);
    }, intro);
  }
  function berth() {
    helm.pos.set(BERTH.x, 0, BERTH.z); helm.heading = Math.PI; helm.speed = 0; helm.target = null; helm.set = false;
  }
  function reset() {
    trying.castOff(); chase.clear();
    Object.assign(v, { whale: 0, sperm: 0, days: 0, hours: 0, taken: 0, lost: 0, boatsLost: 0, told: {}, phase: 'port', fitted: false });
  }

  const acts = {
    setSail() {
      v.phase = 'sea'; helm.set = true;
      helm.steer(BERTH.x - 40, BERTH.z + 10);
      hud.toast('Cast off! She stands out from the wharf.');
    },
    lower(w, n) { v.phase = 'hunt'; helm.target = null; chase.start(w, n); },
    alongside(c) { v.phase = 'trying'; trying.alongside(c); },
    castOff() { trying.castOff('The carcass is cast adrift.'); v.phase = 'sea'; helm.set = true; },
    dock() {
      v.phase = 'docking';
      v.leg = far(helm.pos, WAYPOINT) < 6 ? 1 : 0;
      const to = v.leg ? BERTH : WAYPOINT;
      helm.steer(to.x, to.z);
    },
  };

  function arrive() {
    v.phase = 'ended'; helm.set = false; helm.target = null;
    const repairs = Math.round(100 - v.hull) * REPAIR, net = worth(v) - repairs;
    const lines = [
      `Made fast at the wharf after <b>${v.days}</b> days at sea, with <b>${v.taken}</b> whales taken.`,
      `Whale oil: <b>${v.whale}</b> barrels. Sperm oil: <b>${v.sperm}</b> barrels. Together they fetch <b>${money(worth(v))}</b>.`,
    ];
    if (repairs > 0) lines.push(`Repairs to her hull: <b>${money(repairs)}</b>, leaving <b>${money(net)}</b>.`);
    if (v.lost || v.boatsLost) lines.push(`Lost: <b>${v.lost}</b> men and <b>${v.boatsLost}</b> boats.`);
    lines.push(verdict(net));
    hud.ended('The voyage is made', lines, () => { v.landed += net; v.voyages++; reset(); fitOut(false); });
  }

  function lose(how) {
    v.phase = 'lost';
    const lines = [
      `${how} The Mastiff goes down with <b>${v.whale + v.sperm}</b> barrels of oil in her.`,
      'The crew take to the boats and are picked up and brought home.',
      `The owners must buy another ship: <b>${money(NEW_SHIP)}</b>.`,
    ];
    hud.ended('The ship is lost', lines, () => {
      v.landed -= NEW_SHIP; v.voyages++; berth(); reset(); fitOut(false);
    });
  }

  function newDay() {
    v.days++;
    v.date.setDate(v.date.getDate() + 1);
    season.newDay(v.date);
    trying.newDay(season.gale);
    if (v.stores > 0) v.stores--;
    else if (v.crew > 0) { v.crew--; v.lost++; hud.toast('Scurvy. Another man is sewn into his hammock.'); }
    if (v.stores === 0) tell('out', 'The provisions are out. The men will sicken.');
    const home = daysHome(helm.pos);
    if (v.phase !== 'docking' && v.stores > 0 && v.stores <= home + 3) {
      tell('turn', `The mate reckons ${home} days' sail home, and there are ${v.stores} days' provisions left.`);
    }
  }

  // The ice: slow going in the pack, beset deep in it, and the hull suffers.
  function ice(dt) {
    const inside = season.edge - helm.pos.z;
    helm.slow = inside > 35 ? 0 : Math.min(1, Math.max(0.12, 1 - inside / 12));
    if (inside > 35) tell('beset', 'She is beset! The ice has her fast.');
    else if (inside > 0) tell('pack', 'She is into the pack. The ice grinds along her sides.');
    if (helm.bump > 0) tell('struck', 'She strikes the ice! Every blow opens her seams a little more.');
    let harm = helm.bump;
    if (inside > 0) harm += (dt / DAY) * (2 + inside * 0.3);
    if (season.wind === 'whole gale') harm += (dt / DAY) * 3;
    helm.bump = 0;
    v.hull = Math.max(0, v.hull - harm);
    if (v.hull < 30) tell('hull', 'She is leaking badly. The pumps are going day and night.');
    if (v.hull <= 0) lose(inside > 0 ? 'The ice crushes her like an egg.' : 'Her seams open and she fills.');
  }

  function tick(dt) {
    season.update(v.date, v.hours);
    if (v.phase === 'port' || v.phase === 'ended' || v.phase === 'lost') return offer(ctx);
    v.hours += dt * HOURS_PER_SECOND;
    while (v.hours >= 24) { v.hours -= 24; newDay(); }
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
      if (chase.over && boats.aboard) { chase.clear(); v.phase = trying.whale ? 'trying' : 'sea'; }
    }
    trying.tick(dt, v.phase === 'trying' && !season.gale);
    if (v.phase === 'trying' && !trying.whale) { v.phase = 'sea'; helm.set = true; }
    if (v.phase === 'docking') {
      if (v.leg === 0 && far(helm.pos, WAYPOINT) < 5) { v.leg = 1; helm.steer(BERTH.x, BERTH.z); }
      if (v.leg === 1 && far(helm.pos, BERTH) < 4) arrive();
    }
    ice(dt);
    ship.boats(v.boats, boats.out);
    offer(ctx);
  }

  // Once made fast, warp her in alongside the wharf.
  function settle(dt) {
    if (v.phase !== 'ended') return;
    const k = Math.min(1, dt);
    helm.pos.x += (BERTH.x - helm.pos.x) * k;
    helm.pos.z += (BERTH.z - helm.pos.z) * k;
    helm.heading += wrap((Math.abs(wrap(helm.heading)) < Math.PI / 2 ? 0 : Math.PI) - helm.heading) * k;
  }

  function click(x, z) {
    if (v.paused || !['port', 'sea', 'docking'].includes(v.phase) || (v.phase === 'port' && !v.fitted)) return;
    if (v.phase === 'port') acts.setSail();
    if (v.phase === 'docking') v.phase = 'sea';
    helm.steer(x, z);
  }

  const ctx = { v, helm, whales, boats, trying, season, chase, acts };
  hud.toast('The Mastiff lies at the wharf, to be fitted out for a whaling voyage.');
  fitOut(true);
  return {
    v, season, click, draw: () => draw(ctx),
    tick(dt) { tick(dt); settle(dt); },
    get quarry() { return chase.whale || trying.whale; },
  };
}
