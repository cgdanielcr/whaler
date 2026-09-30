// The chase: from lowering the boats to hoisting them in again, decided now
// by the men in them. The oarsmen's strength gets a boat up to the whale; the
// boatsteerer's eye puts the iron in her, or misses and frightens her off; the
// headsman's nerve lances her and holds on when she sounds, and his seamanship
// keeps the boat out from under her flukes. A dead whale is left floating.
import { describe } from './species.js';
import { BOATS, SEATS } from './boatcrews.js';
import { hud } from './hud.js';

const CHASE = 9;          // seconds two ordinary boats must hang on to kill her
const GIVE_UP = 15;       // seconds of pulling before the boats give up on a whale they cannot reach
const GALLIED = 0.3;      // chance a missed dart frightens her clean away
const rand = Math.random;
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
const boatName = (b) => BOATS[b].name.toLowerCase();

export function makeChase({ v, whales, boats, helm, company, crews }) {
  let c = null;

  function start(w, ids) {
    const sp = w.sp, q = ids.map((b) => crews.quality(b));
    const steady = q.reduce((a, x) => a + x.steady, 0) / q.length;
    c = { w, ids, t: 0, progress: 0, over: false, struck: false, events: [] };
    // What will go wrong is settled now, and happens as the chase goes on.
    if (rand() < sp.sound) c.events.push({ at: 0.3 + rand() * 0.4, kind: 'sound' });
    if (rand() < sp.stove * steady * (ids.length === 1 ? 1.3 : 1)) c.events.push({ at: 0.1 + rand() * 0.75, kind: 'stove' });
    whales.hunt(w);
    boats.launch(helm.pos, helm.heading, ids.map((b, i) => ({ crew: b, pull: q[i].pull })));
    hud.toast(`Lower away! The ${ids.map(boatName).join(' and the ')} pull${ids.length === 1 ? 's' : ''} for the ${describe(w)}.`);
  }

  // Every man who went in the boats learns something, whatever came of it.
  function end(text) {
    c.over = true; boats.recall();
    for (const b of c.ids) SEATS.forEach((seat, s) => { const m = crews.who(b, s); if (m) m.xp[`boat-${seat.id}`] = (m.xp[`boat-${seat.id}`] || 0) + 2; });
    if (text) hud.toast(text);
  }
  function escape(text) { whales.escape(c.w); end(text); }

  // A boat has come up with her: the boatsteerer stands and darts.
  boats.onReach((b) => {
    if (!c || c.over) return false;
    const who = crews.who(b, 1)?.name || 'The boatsteerer';
    if (rand() < crews.quality(b).dart) { if (!c.struck) hud.toast(`${who} darts. Fast to her!`); c.struck = true; return true; }
    if (rand() < GALLIED) escape(`${who} darts, and misses! She is gallied, and off like the wind.`);
    else hud.toast(`${who} darts, and misses! The line is coiled down for another try.`);
    return false;
  });

  function stove() {
    const { crew: b } = boats.stove(), alone = boats.out === 0, crew = crews.crewOf(b);
    const strong = crew.reduce((a, m) => a + m.stats.strength, 0) / Math.max(1, crew.length) >= 4;   // strong men hold on to the wreck
    const n = Math.max(0, (alone ? between(1, 4) : between(0, 2)) - (strong ? 1 : 0));
    const names = company.lose(n, crew);
    for (const m of crew) if (m.alive) m.health = Math.max(5, m.health - 25);                       // the rest are hurt
    crews.lose(b);
    v.crew = company.count; v.lost += n; v.boatsLost += 1; v.boats = crews.afloat;
    const men = n === 0 ? 'All hands picked up.' : `${names.join(' and ')} ${n === 1 ? 'is' : 'are'} drowned.`;
    if (alone) escape(`She stoves the ${boatName(b)}! ${men} She is away.`);
    else hud.toast(`She stoves the ${boatName(b)}! ${men}`);
  }

  function sound() {
    v.paused = true;
    const nerve = Math.max(...c.ids.map((b) => crews.score(crews.who(b, 0), 0)));
    const odds = Math.min(0.9, 0.35 + 0.1 * nerve);
    hud.decide(`She sounds! The line smokes round the loggerhead as she takes it down. Your best headsman reckons ${Math.round(odds * 10)} chances in 10 she comes up again still fast.`, [
      ['Hold on', () => {
        v.paused = false;
        if (rand() < odds) hud.toast('She comes up again. Still fast!');
        else escape('The line runs out to the end. She is gone, and the line with her.');
      }],
      ['Cut the line', () => { v.paused = false; escape('Cut! The boats are safe, and she is away.'); }],
    ]);
  }

  function finish() {
    const w = c.w, sinks = rand() < w.sp.sink;
    whales.kill(w, sinks);
    if (sinks) return end('She is dead, and she sinks! All her oil goes to the bottom.');
    v.taken += 1;
    w.left = w.barrels;
    end(`She rolls fin out, about ${w.barrels} barrels in her. Bring her alongside before the sharks have her.`);
  }

  function tick(dt) {
    if (!c || c.over) return;
    c.t += dt;
    const fast = boats.fastCrews();
    if (!fast.length) {
      if (c.w.sp.tooFast && c.t > GIVE_UP) escape('She is a finback, too fast for any boat. The men give up the chase.');
      return;
    }
    const lance = fast.reduce((a, b) => a + crews.quality(b).lance, 0);        // every boat fast to her lances
    c.progress = Math.min(1, c.progress + (dt / CHASE) * (lance / 2) * (c.ids.length === 1 ? 1.25 : 1));
    const e = c.events.find((x) => !x.done && x.at <= c.progress);
    if (e) { e.done = true; return e.kind === 'stove' ? stove() : sound(); }
    if (c.progress >= 1) finish();
  }

  return {
    start,
    tick,
    get whale() { return c && c.w; },
    get over() { return !c || c.over; },
    // The line shown over the progress bar, and how full the bar is (null for no bar).
    get status() {
      if (!c) return [null, null];
      if (c.over) return ['Hoisting in the boats', null];
      return [boats.fastCrews().length ? 'Fast to her! The headsmen lance…' : 'The boats are pulling for her', c.progress];
    },
    clear() { c = null; },
  };
}
