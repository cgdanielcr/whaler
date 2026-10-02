// Crises: when trouble comes, the world stands still and the ship opens up.
// Each trouble has its place aboard and a meter. A man dropped on it walks
// there, by the ladders if need be, and works it once he has arrived. It
// starts held, so the owner can think; Space lets it run. The watch on deck is
// to hand at once; the watch below is asleep until all hands are called.
import { CRISES, FORCE, MUSTER } from './troubles.js';
import { DECKS } from './stations.js';
import { placeAll } from './watches.js';
import { cheer } from './morale.js';
import { hud } from './hud.js';

const AT_SEA = ['sea', 'docking', 'trying'];
const deckIndex = (id) => DECKS.findIndex((d) => d.id === id);

export function makeCrisis({ voyage, company }) {
  let c = null, wasGale = false, pending = false, sailsLost = 0, day = -1;
  const v = () => voyage.v;

  function say(text) { c.line = text; }                 // shown in the crisis banner
  const find = (id) => c.troubles.find((t) => t.id === id);
  const ready = (m) => m.alive && (c.allHands || c.up.has(m.id));
  const hurt = (m, n) => { m.health = Math.max(5, m.health - n); c.hurt.add(m.name); };

  function start(kind) {
    const def = CRISES[kind], season = voyage.season, w = voyage.watch;
    const places = placeAll(company, w);
    const force = FORCE[season.wind] || 1;
    c = { def, force, t: 0, lasts: def.lasts(force), paused: true, allHands: false, line: '', hull: v().hull,
      up: new Set([...places].filter(([, p]) => p.deck === 0).map(([id]) => id)), arrived: new Set(), hurt: new Set(), broaches: 0, lost: [],
      troubles: def.troubles.map((t) => ({ ...t, p: 0, s: 0, m: t.start || 0, state: t.from ? 'waiting' : 'open', men: [] })) };
    v().paused = true; wasGale = season.gale; pending = false;
    const helmsman = company.man(`wheel:${w.onDeck === 'larboard' ? 'L' : 'S'}`);   // the man at the wheel stays there
    if (helmsman && c.up.has(helmsman.id) && find('wheel')) find('wheel').men.push(helmsman.id);
    say(def.opening(season.wind));
  }

  // What a man would make of a trouble, said while he is held over it.
  function preview(id, tid) {
    const m = company.byId(id), t = find(tid);
    if (!ready(m)) return 'Below, asleep. Call all hands first';
    if (!t.men.includes(id) && t.men.length >= t.hands) return `${t.name}: ${t.hands} hands already`;
    return `${t.name}: ${company.score(m, t).toFixed(1)}`;
  }
  function assign(id, tid) {
    const m = company.byId(id), t = find(tid);
    if (!ready(m)) return `${m.name} is below, asleep. Call all hands to have the watch below on deck.`;
    if (t.men.includes(id)) return `${m.name} is at it already.`;
    if (t.men.length >= t.hands) return `There is no room for another man at ${t.name.toLowerCase()}.`;
    for (const o of c.troubles) o.men = o.men.filter((x) => x !== id);
    t.men.push(id); c.arrived.delete(id);              // he has to get there first
    return `${m.name} goes to ${t.name.toLowerCase()}.`;
  }

  function callAll() {
    if (!c || c.allHands) return;
    c.allHands = true;
    cheer(company, -2, company.alive().filter((m) => !c.up.has(m.id)));      // their sleep broken
    say('All hands! The watch below tumbles up, half dressed.');
  }

  // Where each man should be: at his trouble, or mustered on deck if called up from below.
  function place(places) {
    if (!c) return;
    let i = 0;
    for (const m of company.alive()) {
      const t = c.troubles.find((x) => x.state === 'open' && x.men.includes(m.id));
      if (t) {
        const k = t.men.indexOf(m.id);
        places.set(m.id, { deck: deckIndex(t.deck), p: t.spots[k % t.spots.length], berth: m.berth, pose: t.pose, face: t.face });
      } else if (c.allHands && places.get(m.id)?.deck !== 0) {
        places.set(m.id, { deck: 0, p: MUSTER[i++ % MUSTER.length], berth: m.berth, pose: 'idle', face: -Math.PI / 2 });
      }
    }
  }
  function arrive(id, yes) { if (c) { if (yes) c.arrived.add(id); else c.arrived.delete(id); } }

  const working = (t) => t.men.map(company.byId).filter((m) => m.alive && c.arrived.has(m.id));
  const work = (t) => working(t).reduce((a, m) => a + company.score(m, t), 0);

  // What happens when a trouble gets the better of the men.
  function failed(t) {
    t.state = 'failed'; say(t.fail);
    c.lost.push(t.name.toLowerCase()); sailsLost++;
    const aloft = working(t);
    if (aloft.length) hurt(aloft[Math.floor(Math.random() * aloft.length)], 15);
  }
  function broach(t) {
    c.broaches++; t.m = 0.4; v().hull = Math.max(1, v().hull - 6);
    const onDeck = company.alive().filter((m) => ready(m)).sort(() => Math.random() - 0.5).slice(0, 2);
    onDeck.forEach((m) => hurt(m, 20));
    say(`She broaches to! A green sea sweeps the deck${onDeck.length ? ` and ${onDeck.map((m) => m.name).join(' and ')} ${onDeck.length > 1 ? 'are' : 'is'} hurt` : ''}.`);
  }

  function run(dt) {
    c.t += dt;
    const leak = find('leak'), leaking = leak && leak.state === 'open';
    for (const t of c.troubles) {
      if (t.state === 'waiting' && c.t >= t.from) { t.state = 'open'; say(t.appears); }
      if (t.state !== 'open') continue;
      if (t.type === 'task') {
        t.p = Math.min(1, t.p + (work(t) / t.work) * dt);
        if (t.p >= 1) { t.state = 'done'; say(t.done); continue; }
        if (t.strain && (t.s += dt / t.strain) >= 1) failed(t);
        continue;
      }
      const grow = (t.grow + (t.leak && leaking ? t.leak : 0)) * c.force;
      t.m = Math.max(0, Math.min(1, t.m + (grow - work(t) / t.work) * dt));
      if (t.id === 'wheel' && t.m >= 1) broach(t);
      if (t.id === 'pumps' && t.m > 0.5) v().hull = Math.max(1, v().hull - (t.m - 0.5) * 1.6 * dt);
    }
    const unsettled = c.troubles.some((t) => t.strain && (t.state === 'open' || t.state === 'waiting'));
    if (c.t >= c.lasts && !unsettled) end();
  }

  // The account of it, and what it did to the men's spirits.
  function end() {
    const lines = [c.def.over];
    const leak = find('leak');
    if (leak && leak.state === 'open') { v().hull = Math.max(1, v().hull - 8); lines.push('The leak was never stopped. The carpenter gets at it when the sea goes down, but she is badly strained.'); }
    lines.push(c.lost.length ? `Lost: the ${c.lost.join(' and the ')}. She will be slower until new canvas is bent.` : 'Her canvas was all saved.');
    if (c.broaches) lines.push(`She broached to ${c.broaches === 1 ? 'once' : `${c.broaches} times`}.`);
    if (c.hurt.size) lines.push(`Hurt: ${[...c.hurt].join(', ')}.`);
    lines.push(`Her hull: ${Math.ceil(c.hull)}% before, ${Math.ceil(v().hull)}% now.`);
    const clean = !c.lost.length && !c.broaches && v().hull >= c.hull - 3;
    cheer(company, clean ? 3 : -2 * (c.lost.length + c.broaches));
    lines.push(clean ? 'The men are proud of her, and of themselves.' : 'The men are shaken.');
    const title = c.def.title(voyage.season.wind);
    c = null;
    hud.account(title, lines, () => { v().paused = false; });
  }

  function tick(dt) {
    const s = voyage.season, phase = v().phase;
    if (s.gale && !wasGale) pending = true;
    if (!s.gale) pending = false;
    wasGale = s.gale;
    if (!AT_SEA.includes(phase) && phase !== 'hunt') sailsLost = 0;             // at the wharf, new canvas
    if (v().days !== day) {                                                      // a new topsail bent each day
      if (day >= 0 && sailsLost && !c) { sailsLost--; hud.toast('A new topsail is bent on. She can carry her canvas again.'); }
      day = v().days;
    }
    if (pending && !c && !v().paused && AT_SEA.includes(phase)) start('gale');
    if (c && !c.paused) run(dt);
  }

  // A line under a trouble's bar: the hands at it, and how long it has.
  function status(t) {
    const at = working(t).length, coming = t.men.length - at;
    let s = `${at} of ${t.hands} hands${coming ? `, ${coming} coming` : ''}`;
    if (t.strain) s += ` · blows out in ${Math.ceil(t.strain * (1 - t.s))}s`;
    if (t.gauge) s = `${t.gauge} · ${s}`;
    return s;
  }

  addEventListener('keydown', (e) => { if (c && e.code === 'Space') { e.preventDefault(); toggle(); } });
  function toggle() { if (c) c.paused = !c.paused; }

  return {
    start, tick, preview, assign, callAll, toggle, place, arrive, status,
    get now() { return c; },
    get wind() { return voyage.season.wind; },
    get speed() { return Math.max(0.5, 1 - 0.15 * sailsLost); },      // with canvas lost, she sails slower
  };
}
