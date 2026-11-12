// The voyage: fitting out, the clock, the day's reckoning, the ice, the
// return home and the loss of the ship. The sailing of her, the chase, the
// trying out and the chances of the sea each have a file of their own.
import { BERTH } from './world.js';
import { effects } from './effects.js';
import { makeLookout } from './lookout.js';
import { watchAt } from './watches.js';
import { dailySpirits, cheer, willLower, makeKindness } from './morale.js';
import { HOLD, FITS, PER_DAY, daysHome } from './stores.js';
import { makeSeason, dayOfYear, LAST_FIT } from './season.js';
import { makeChase } from './chase.js';
import { makeTrying } from './trying.js';
import { makeSailing } from './sailing.js';
import { makeEvents } from './events.js';
import { gearEffects } from './outfit.js';
import { settle, shipLost } from './reckoning.js';
import { fitOutCard } from './fitout.js';
import { offer, draw } from './orders.js';
import { hud } from './hud.js';

const HOURS_PER_SECOND = 3;     // a day passes in eight seconds
const DAY = 24 / HOURS_PER_SECOND;
const WAYPOINT = { x: BERTH.x - 26, z: BERTH.z + 5 };   // stand in from here, clear of the wharf's head

export function makeVoyage({ scene, helm, whales, boats, ship, start, company, crews, career, remember }) {
  const v = {
    phase: 'port', fitted: false, paused: false, held: false, fast: false, date: new Date(start), days: 0, hours: 0,
    stores: 0, eat: 0, whale: 0, sperm: 0, crew: company.count, boats: crews.afloat, hull: 100, taken: 0, lost: 0, boatsLost: 0,
    leg: 0, told: {}, gear: {}, report: null,
  };
  const season = makeSeason();
  const sail = makeSailing({ helm, ship, season, company });
  const chase = makeChase({ v, whales, boats, helm, company, crews, career });
  const lookout = makeLookout({ helm, whales, onCry: () => { v.fast = false; } });
  let watch = watchAt(0, 0);             // the watch now on deck
  const reckonFx = () => gearEffects(effects(company, watch.onDeck), v.gear);
  let fx = reckonFx();                   // what the men at their stations do for her
  const trying = makeTrying(scene, { v, whales, helm });
  const kind = makeKindness({ v, company, atSea: () => v.phase === 'sea' || v.phase === 'trying' });
  const far = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  const tell = (key, text) => { if (!v.told[key]) { v.told[key] = true; hud.toast(text); } };

  function fitOut(first) {
    let intro = '';
    if (!first) v.date.setDate(v.date.getDate() + 7);             // a week to discharge and refit
    if (dayOfYear(v.date) > LAST_FIT) {
      v.date = new Date(v.date.getFullYear() + 1, 4, 1);
      intro = 'Too late in the year for another voyage: she lay up for the winter. ';
    }
    company.refit(); crews.refit();
    remember(v.date);                                              // the career is written down at the wharf
    season.calm(); sail.fitOut();
    v.report = season.report(v.date);
    whales.restock(v.report.bias, season.edge);
    fitOutCard({ v, career, season, intro, fits: FITS.map((f) => ({ ...f, room: HOLD - f.days * PER_DAY })) }, (f, gear) => {
      v.gear = gear; crews.refit(gear.boat ? 3 : 2); fx = reckonFx();
      sail.canvas.spare = !!gear.canvas;
      Object.assign(v, { stores: f.days, eat: 0, crew: company.count, boats: crews.afloat, hull: 100, fitted: true });
      hud.toast(`${f.days} days' provisions stowed. The hands are aboard.`);
    });
  }
  function berth() {
    helm.pos.set(BERTH.x, 0, BERTH.z); helm.heading = Math.PI; helm.speed = 0; helm.target = null; helm.set = false;
  }
  function reset() {
    trying.castOff(); chase.clear();
    Object.assign(v, { whale: 0, sperm: 0, days: 0, hours: 0, taken: 0, lost: 0, boatsLost: 0, told: {}, phase: 'port', fitted: false, held: false });
  }

  const acts = {
    setSail() {
      v.phase = 'sea'; helm.set = true;
      helm.steer(BERTH.x - 40, BERTH.z + 10);
      hud.toast('Cast off! She stands out from the wharf.');
    },
    lower(w, ids, quiet) {
      if (!willLower(company)) return hud.toast('The men will not lower! They hang back by the davits, muttering about short rations and a hard ship.');
      v.phase = 'hunt'; helm.target = null; chase.start(w, ids, quiet);
    },
    alongside(c) { v.phase = 'trying'; trying.alongside(c); },
    castOff() { trying.castOff('The carcass is cast adrift.'); v.phase = 'sea'; helm.set = true; },
    dock() {
      v.phase = 'docking';
      v.leg = far(helm.pos, WAYPOINT) < 6 ? 1 : 0;
      const to = v.leg ? BERTH : WAYPOINT;
      helm.steer(to.x, to.z);
    },
  };

  const again = () => { reset(); fitOut(false); };
  function arrive() { v.phase = 'ended'; helm.set = false; helm.target = null; settle({ v, company, career }, again); }
  function lose(how) { v.phase = 'lost'; shipLost({ v, career }, how, () => { berth(); again(); }); }

  function newDay() {
    v.days++;
    v.date.setDate(v.date.getDate() + 1);
    season.newDay(v.date, v.days);
    sail.newDay();
    trying.newDay(season.gale);
    fx = reckonFx();
    v.eat += fx.eat;                                           // a good cook makes the provisions go further
    if (v.stores > 0 && Math.random() < fx.spoil) { v.eat += 1; hud.toast('A cask of beef is broached and found spoiled. A better cooper would have caught it.'); }
    while (v.eat >= 1 && v.stores > 0) { v.eat -= 1; v.stores--; }
    if (!season.gale && helm.slow === 1) v.hull = Math.min(100, v.hull + fx.repair);
    crews.newDay(fx.scores.carpenter); v.boats = crews.afloat;
    const sick = company.newDay({ trying: v.phase === 'trying', heal: v.stores > 0 ? fx.care : 0,
      sicken: (v.stores === 0 ? 12 * fx.scurvy : 0) + (helm.slow === 0 ? 3 : 0) });
    if (sick.said.length > 2) hud.toast(`${sick.said.length} men have grown handier at their stations.`);
    else sick.said.forEach((s) => hud.toast(s));
    for (const name of sick.died) { v.lost++; hud.toast(`${name} is dead of ${v.stores === 0 ? 'scurvy' : 'the cold'}, and sewn into his hammock.`); }
    dailySpirits(company, { cook: fx.scores.cook, starving: v.stores === 0, days: v.days });
    if (v.gear.tobacco) cheer(company, 0.4);
    if (sick.died.length) cheer(company, -5 * sick.died.length);  // a burial at sea weighs on every man
    v.crew = company.count;
    if (v.stores === 0) tell('out', 'The provisions are out. The men will sicken.');
    const home = daysHome(helm.pos);
    if (v.phase !== 'docking' && v.stores > 0 && v.stores <= home + 3) {
      tell('turn', `The mate reckons ${home} days' sail home, and there are ${v.stores} days' provisions left.`);
    }
    if (v.phase === 'sea') events.newDay();
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
    harm *= fx.iceHarm;                                        // a good helmsman takes the ice more kindly
    if (season.wind === 'whole gale') harm += (dt / DAY) * 3;
    helm.bump = 0;
    v.hull = Math.max(0, v.hull - harm);
    if (v.hull < 30) tell('hull', 'She is leaking badly. The pumps are going day and night.');
    if (v.hull <= 0) lose(inside > 0 ? 'The ice crushes her like an egg.' : 'Her seams open and she fills.');
    else if (company.count < 6 && v.phase !== 'lost') lose('Too few hands are left alive to work her, and she drives ashore.');
  }

  function tick(dt) {
    season.update(v.date, v.hours);
    if (v.phase === 'port' || v.phase === 'ended' || v.phase === 'lost') return offer(ctx);
    v.hours += dt * HOURS_PER_SECOND;
    while (v.hours >= 24) { v.hours -= 24; newDay(); }
    const w = watchAt(v.days, v.hours);
    if (w.index !== watch.index) { watch = w; fx = reckonFx(); }   // the watch changes
    sail.tick(dt, dt * HOURS_PER_SECOND, watch.onDeck, fx, true);
    helm.hands = Math.min(1, Math.max(0.35, v.crew / 18)) * fx.speed;
    lookout.tick(fx.sight, v.phase === 'sea');
    if (v.phase === 'hunt') {
      chase.tick(dt);
      if (chase.over && boats.aboard) { chase.clear(); v.phase = trying.whale ? 'trying' : 'sea'; }
    }
    trying.tick(dt, v.phase === 'trying' && !season.gale, fx);
    if (v.phase === 'trying' && !trying.whale) { v.phase = 'sea'; helm.set = true; }
    if (v.phase === 'docking') {
      if (v.leg === 0 && far(helm.pos, WAYPOINT) < 5) { v.leg = 1; helm.steer(BERTH.x, BERTH.z); }
      if (v.leg === 1 && far(helm.pos, BERTH) < 4) arrive();
    }
    ice(dt);
    ship.showBoats(crews.lost.map((gone, b) => !gone && !boats.isOut(b)));
    offer(ctx);
  }

  // Once made fast, warp her in alongside the wharf.
  function settleIn(dt) {
    if (v.phase !== 'ended') return;
    const k = Math.min(1, dt);
    helm.pos.x += (BERTH.x - helm.pos.x) * k;
    helm.pos.z += (BERTH.z - helm.pos.z) * k;
    helm.heading += Math.atan2(Math.sin(Math.PI - helm.heading), Math.cos(Math.PI - helm.heading)) * k;
  }

  function click(x, z) {
    if (v.paused || !['port', 'sea', 'docking'].includes(v.phase) || (v.phase === 'port' && !v.fitted)) return;
    if (v.phase === 'port') acts.setSail();
    if (v.phase === 'docking') v.phase = 'sea';
    helm.steer(x, z);
  }

  const ctx = { v, helm, whales, boats, trying, season, chase, acts, company, crews, kind, sail, career };
  const events = makeEvents(ctx);
  const atSea = () => ['sea', 'hunt', 'trying', 'docking'].includes(v.phase);
  return {
    v, season, sail, chase, trying, click, atSea, draw: () => draw(ctx),
    begin(date) { if (date) v.date = new Date(date); hud.toast('The Mastiff lies at the wharf, to be fitted out for a whaling voyage.'); fitOut(true); },
    hold() { if (atSea() && !v.paused) { v.held = !v.held; v.fast = false; } },
    // Pass the time: the glass runs three times as fast on a quiet passage, until anything happens.
    runOn() { if (v.phase === 'sea' && !v.paused) { v.fast = !v.fast; v.held = false; if (v.fast && !helm.target) { v.fast = false; hud.toast('Lay a course first: click the sea.'); } } },
    get fx() { return fx; },
    get watch() { return { ...watch, trying: v.phase === 'trying' }; },
    refresh() { fx = reckonFx(); },      // after the owner moves men about
    tick(dt) { tick(dt); settleIn(dt); },
    get quarry() { return chase.whale || trying.whale; },
  };
}
