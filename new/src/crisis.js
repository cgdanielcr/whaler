// Crises: when trouble comes, the world stands still and the ship opens up.
// Each trouble has its place aboard and a meter. A man dropped on it walks
// there, by the ladders if need be, and works it once he has arrived. It
// starts held, so the owner can think; Space lets it run. The watch on deck is
// to hand at once; the watch below is asleep until all hands are called. How
// the hands were stationed is remembered as her station bill, and can be
// called again next time, less whoever is dead, hurt, or asleep.
import { CRISES, FORCE, MUSTER } from './troubles.js';
import { DECKS } from './stations.js';
import { placeAll } from './watches.js';
import { cheer } from './morale.js';
import { makeAlarms } from './alarms.js';
import { sound } from './sound.js';
import { hud } from './hud.js';

const deckIndex = (id) => DECKS.findIndex((d) => d.id === id);

export function makeCrisis({ voyage, company, career, helm }) {
  let c = null;
  const v = () => voyage.v;
  const alarms = makeAlarms({ voyage, company, helm });

  function say(text) { if (c) c.line = text; }           // shown in the crisis banner
  const find = (id) => c.troubles.find((t) => t.id === id);
  const ready = (m) => m.alive && m !== c.who && (c.allHands || c.up.has(m.id));
  const hurt = (m, n) => { m.health = Math.max(5, m.health - n); c.hurt.add(m.name); };
  // What a crisis may do to the ship and her people.
  const means = () => ({ v: v(), c, sail: voyage.sail, helm, season: voyage.season, say, hurt,
    cheer: (n) => cheer(company, n),
    drown: (m) => { company.lose(1, [m]); v().lost++; v().crew = company.count; },
    sweep: (n, by = 20) => { const men = company.alive().filter(ready).sort(() => Math.random() - 0.5).slice(0, n); men.forEach((m) => hurt(m, by)); return men.map((m) => m.name); } });

  function start(kind, who = null) {
    const def = CRISES[kind], season = voyage.season, w = voyage.watch;
    const places = placeAll(company, w);
    const force = FORCE[season.wind] || 1;
    c = { kind, def, force, who, t: 0, lasts: def.lasts ? def.lasts(force) : null, paused: true, allHands: voyage.sail.hands.all, line: '', hull: v().hull,
      up: new Set([...places].filter(([, p]) => p.deck === 0).map(([id]) => id)), arrived: new Set(), hurt: new Set(), broaches: 0, lost: [],
      troubles: def.troubles.map((t) => ({ ...t, p: 0, s: 0, m: t.start || 0, state: t.from ? 'waiting' : 'open', men: [] })) };
    v().paused = true; v().held = false; v().fast = false;
    const helmsman = company.man(`wheel:${w.onDeck === 'larboard' ? 'L' : 'S'}`);   // the man at the wheel stays there
    if (helmsman && c.up.has(helmsman.id) && find('wheel')) find('wheel').men.push(helmsman.id);
    say(def.opening(season.wind, c));
    if (def.begin) def.begin(means(), c);
    sound.alarm();
  }

  // What a man would make of a trouble, said while he is held over it.
  function preview(id, tid) {
    const m = company.byId(id), t = find(tid);
    if (m === c.who) return 'He is in the sea';
    if (!ready(m)) return 'Below, asleep. Call all hands first';
    if (!t.men.includes(id) && t.men.length >= t.hands) return `${t.name}: ${t.hands} hands already`;
    return `${t.name}: ${company.score(m, t).toFixed(1)}`;
  }
  function assign(id, tid) {
    const m = company.byId(id), t = find(tid);
    if (m === c.who) return `${m.name} is in the sea.`;
    if (!ready(m)) return `${m.name} is below, asleep. Call all hands to have the watch below on deck.`;
    if (t.men.includes(id)) return `${m.name} is at it already.`;
    if (t.men.length >= t.hands) return `There is no room for another man at ${t.name.toLowerCase()}.`;
    for (const o of c.troubles) o.men = o.men.filter((x) => x !== id);
    t.men.push(id); c.arrived.delete(id);              // he has to get there first
    return `${m.name} goes to ${t.name.toLowerCase()}.`;
  }

  // A click on a trouble sends the best man to hand; with Shift, takes the last one off it.
  function sendBest(tid, off) {
    const t = find(tid);
    if (off) { const id = t.men.pop(); return say(id ? `${company.byId(id).name} is taken off ${t.name.toLowerCase()}.` : `No one is at ${t.name.toLowerCase()}.`); }
    const free = company.alive().filter((m) => ready(m) && !c.troubles.some((o) => o.men.includes(m.id))).sort((a, b) => company.score(b, t) - company.score(a, t))[0];
    say(free ? assign(free.id, tid) : c.allHands ? 'Every hand is at a station already.' : 'No hand of the watch on deck is free. Call all hands.');
  }

  function callAll() {
    if (!c || c.allHands) return;
    c.allHands = true;
    voyage.sail.hands.roused(company.alive().filter((m) => !c.up.has(m.id)));      // their sleep broken
    say('All hands! The watch below tumbles up, half dressed.');
    sound.pipe();
  }

  // The station bill: every man to the place he had the last time this trouble came.
  const bill = () => (c && career.bill[c.kind]) || null;
  function callBill() {
    const b = bill();
    if (!b) return;
    let sent = 0, wanting = 0;
    for (const t of c.troubles) {
      if (t.state === 'done' || t.state === 'failed') continue;
      for (const id of b[t.id] || []) {
        const m = company.byId(id);
        if (t.men.includes(id)) continue;
        if (m && ready(m) && t.men.length < t.hands && !c.troubles.some((o) => o.men.includes(id))) { t.men.push(id); sent++; } else wanting++;
      }
    }
    say(`The station bill is called: ${sent} ${sent === 1 ? 'man goes' : 'men go'} to ${sent === 1 ? 'his station' : 'their stations'}${wanting ? `, and ${wanting} ${wanting === 1 ? 'place is' : 'places are'} wanting. Fill them by hand, or call all hands` : ''}.`);
  }

  // Where each man should be: at his trouble, or mustered on deck if called up from below.
  function place(places) {
    if (!c) return;
    let i = 0;
    for (const m of company.alive()) {
      const t = c.troubles.find((x) => x.state === 'open' && x.men.includes(m.id));
      if (m === c.who) places.delete(m.id);
      else if (t) {
        const k = t.men.indexOf(m.id);
        places.set(m.id, { deck: deckIndex(t.deck), p: t.spots[k % t.spots.length], berth: m.berth, pose: t.pose, face: t.face });
      } else if (c.allHands && places.get(m.id)?.deck !== 0) {
        places.set(m.id, { deck: 0, p: MUSTER[i++ % MUSTER.length], berth: m.berth, pose: 'idle', face: -Math.PI / 2 });
      }
    }
  }
  function arrive(id, yes) { if (c) { if (yes) c.arrived.add(id); else c.arrived.delete(id); } }

  const working = (t) => t.men.map(company.byId).filter((m) => m && m.alive && c.arrived.has(m.id));
  const work = (t) => working(t).reduce((a, m) => a + company.score(m, t), 0);

  function failed(t) {
    t.state = 'failed'; say(t.fail); c.lost.push(t.name.toLowerCase());
    if (t.failed) t.failed(means(), t);
    const at = working(t);
    if (at.length) hurt(at[Math.floor(Math.random() * at.length)], 15);
    sound.crack();
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
      if (t.m >= 1 && t.full) { t.full(means(), t); sound.crack(); }
      if (t.m > 0.5 && t.high) t.high(means(), t, dt);
      if (t.quench && t.m <= 0) { t.state = 'done'; say('The fire is beaten down to steam and stink.'); }
    }
    const tasks = c.troubles.filter((t) => t.type === 'task'), open = (t) => t.state === 'open' || t.state === 'waiting';
    const over = c.lasts != null ? c.t >= c.lasts && !tasks.some((t) => t.strain && open(t))
      : c.troubles.filter((t) => t.quench).every((t) => !open(t)) && (c.def.troubles.some((t) => t.quench) ? !tasks.some((t) => t.strain && open(t)) : !tasks.some(open));
    if (over) end();
  }

  // The account of it, what it did to the men's spirits, and the bill as it stood.
  function end() {
    const lines = c.def.over ? [c.def.over] : [], a = means();
    if (c.def.finish) c.def.finish(a, c, lines);
    if (c.lost.length) lines.push(`Lost: the ${c.lost.join(' and the ')}.`);
    if (c.broaches) lines.push(`She broached to ${c.broaches === 1 ? 'once' : `${c.broaches} times`}.`);
    if (c.hurt.size) lines.push(`Hurt: ${[...c.hurt].join(', ')}.`);
    if (Math.ceil(c.hull) !== Math.ceil(v().hull)) lines.push(`Her hull: ${Math.ceil(c.hull)}% before, ${Math.ceil(v().hull)}% now.`);
    const clean = c.clean ?? (!c.lost.length && !c.broaches && v().hull >= c.hull - 3);
    if (c.clean == null) cheer(company, clean ? 3 : -2 * (c.lost.length + c.broaches));
    lines.push(clean ? 'The men are proud of her, and of themselves.' : 'The men are shaken.');
    lines.push('<i>How you stationed the hands is written into her station bill.</i>');
    career.bill[c.kind] = Object.fromEntries(c.troubles.map((t) => [t.id, [...t.men]]));
    const title = c.def.title(voyage.season.wind);
    c = null; v().crew = company.count;
    hud.account(title, lines, () => { v().paused = false; });
  }

  function tick(dt) {
    if (!c) { const kind = alarms.tick(dt); if (kind) start(kind.kind, kind.who); }
    if (c && !c.paused) run(dt);
  }

  // A line under a trouble's bar: the hands at it, and how long it has.
  function status(t) {
    const at = working(t).length, coming = t.men.length - at;
    let s = `${at} of ${t.hands} hands${coming ? `, ${coming} coming` : ''}`;
    if (t.strain) s += ` · ${Math.ceil(t.strain * (1 - t.s))}s left`;
    if (t.gauge) s = `${t.gauge} · ${s}`;
    return s;
  }

  addEventListener('keydown', (e) => { if (c && e.code === 'Space') { e.preventDefault(); toggle(); } });
  function toggle() { if (c) c.paused = !c.paused; }

  return {
    start, tick, preview, assign, sendBest, callAll, callBill, toggle, place, arrive, status,
    get now() { return c; },
    get hasBill() { return !!bill(); },
    get wind() { return voyage.season.wind; },
  };
}
