// The chase: from lowering the boats to hoisting them in again. The oarsmen's
// strength gets a boat up to the whale; the boatsteerer's eye puts the iron in
// her. Then it is the master's to judge: haul up alongside and lance, which
// kills her, or "Stern all!" and lie off, which keeps the boats whole when she
// rounds on them. She gives a moment's warning before she lashes out, shorter
// for a sperm whale than a right whale; lie off too long and the irons draw.
import { describe } from './species.js';
import { BOATS, SEATS } from './boatcrews.js';
import { hud } from './hud.js';
import { cheer } from './morale.js';
import { sound } from './sound.js';

const CHASE = 9;          // seconds two ordinary boats must lie alongside to kill her
const GIVE_UP = 15;       // seconds of pulling before the boats give up on a whale they cannot reach
const DRAW = 5;           // seconds the boats may lie off before the irons begin to draw
const rand = Math.random;
const between = (a, b) => a + rand() * (b - a);
const boatName = (b) => BOATS[b].name.toLowerCase();

export function makeChase({ v, whales, boats, helm, company, crews }) {
  let c = null;

  // quiet: paddling up, not pulling. Slower, but she is less likely to take fright.
  function start(w, ids, quiet = false) {
    const q = ids.map((b) => crews.quality(b));
    const nerve = Math.max(...ids.map((b) => crews.score(crews.who(b, 0), 0)));
    c = { w, ids, quiet, t: 0, progress: 0, over: false, struck: false, haul: true, mood: 'calm', clock: between(...w.sp.calm), off: 0,
      warn: w.sp.warn * (0.75 + 0.08 * nerve), steady: q.reduce((a, x) => a + x.steady, 0) / q.length,
      soundAt: rand() < w.sp.sound ? 0.3 + rand() * 0.4 : null };
    whales.hunt(w);
    boats.launch(helm.pos, helm.heading, ids.map((b, i) => ({ crew: b, pull: q[i].pull * (quiet ? 0.62 : 1) })));
    hud.toast(`Lower away! The ${ids.map(boatName).join(' and the ')} ${quiet ? 'paddle' : 'pull'}${ids.length === 1 ? 's' : ''} for the ${describe(w)}.`);
    if (!quiet && rand() < w.sp.wary) c.fright = 1.5 + rand() * 2;      // she will hear the oars
  }

  // Every man who went in the boats learns something, whatever came of it.
  function end(text) {
    c.over = true; boats.recall(); boats.lieOff(false);
    for (const b of c.ids) SEATS.forEach((seat, s) => { const m = crews.who(b, s); if (m) m.xp[`boat-${seat.id}`] = (m.xp[`boat-${seat.id}`] || 0) + 2; });
    if (text) hud.toast(text);
  }
  function escape(text) { whales.escape(c.w); end(text); }

  // A boat has come up with her: the boatsteerer stands and darts.
  boats.onReach((b) => {
    if (!c || c.over) return false;
    const who = crews.who(b, 1)?.name || 'The boatsteerer';
    if (rand() < crews.quality(b).dart + (c.quiet ? 0.15 : 0)) { if (!c.struck) hud.toast(`${who} darts. Fast to her!`); c.struck = true; sound.thump(); return true; }
    if (rand() < (c.quiet ? 0.12 : 0.3)) escape(`${who} darts, and misses! She is gallied, and off like the wind.`);
    else hud.toast(`${who} darts, and misses! The line is coiled down for another try.`);
    return false;
  });

  function drown(b, alone) {
    const crew = crews.crewOf(b);
    const strong = crew.reduce((a, m) => a + m.stats.strength, 0) / Math.max(1, crew.length) >= 4;   // strong men hold on to the wreck
    const n = Math.max(0, Math.floor(alone ? between(1, 4.99) : between(0, 2.99)) - (strong ? 1 : 0));
    const names = company.lose(n, crew);
    v.crew = company.count; v.lost += n;
    cheer(company, -5 * n);
    return n === 0 ? 'All hands are picked up.' : `${names.join(' and ')} ${n === 1 ? 'is' : 'are'} drowned.`;
  }
  function stove() {
    const { crew: b } = boats.stove(), alone = boats.out === 0, crew = crews.crewOf(b);
    for (const m of crew) m.health = Math.max(5, m.health - 25);
    crews.lose(b); v.boatsLost += 1; v.boats = crews.afloat;
    cheer(company, -2); cheer(company, -4, crew);              // shaken, and the boat's own crew most of all
    sound.crack();
    if (alone) return escape(`She stoves the ${boatName(b)}! ${drown(b, true)} She is away.`);
    v.paused = true;
    hud.decide(`Her flukes come down across the ${boatName(b)} and stave her to splinters. Six men are in the water, and the other boat is still fast to the whale.`, [
      ['Cut, and pick them up', () => { v.paused = false; escape('Cut! The line goes, and the boat pulls for the men in the water. All hands are picked up. The whale is away.'); }, 'The whale is lost. Every man is saved.'],
      ['Hold on to the whale', () => { v.paused = false; hud.toast(`The boat holds on. ${drown(b, false)}`); }, 'The men in the water take their chance.'],
    ], 'A boat is stove');
  }

  function sounds() {
    v.paused = true;
    const nerve = Math.max(...c.ids.map((b) => crews.score(crews.who(b, 0), 0)));
    const odds = Math.min(0.92, 0.35 + 0.1 * nerve + (v.gear.line ? 0.15 : 0));
    hud.decide(`She sounds! The line smokes round the loggerhead as she takes it down. Your best headsman reckons ${Math.round(odds * 10)} chances in 10 she comes up again still fast.`, [
      ['Hold on', () => {
        v.paused = false;
        if (rand() < odds) hud.toast('She comes up again. Still fast!');
        else escape('The line runs out to the end. She is gone, and the line with her.');
      }],
      ['Cut the line', () => { v.paused = false; escape('Cut! The boats are safe, and she is away.'); }],
    ], 'She sounds');
  }

  function finish() {
    const w = c.w, sinks = rand() < w.sp.sink;
    whales.kill(w, sinks);
    if (sinks) { cheer(company, -2); return end('She is dead, and she sinks! All her oil goes to the bottom.'); }
    v.taken += 1;
    cheer(company, 4);                                                // greasy luck: every man's lay is the fatter
    sound.cheer();
    w.left = w.barrels;
    end(`She spouts blood and rolls fin out: about ${w.barrels} barrels in her. Bring her alongside before the sharks have her.`);
  }

  // Her temper: quiet, then a moment's warning, then she lashes out at whatever is alongside.
  function temper(dt) {
    if ((c.clock -= dt) > 0) return;
    if (c.mood === 'calm') { c.mood = 'warn'; c.clock = c.warn; c.w.angry = true; sound.pipe(); return; }
    c.mood = 'calm'; c.clock = between(...c.w.sp.calm); c.w.angry = false;
    whales.thrash(c.w); sound.splash();
    if (!c.haul) return hud.toast('Her flukes come down like a falling mast, on empty water.');
    if (rand() < Math.min(0.85, c.w.sp.stove * 2.4 * c.steady)) stove();
    else hud.toast('Her flukes sweep over the boats, a hand’s breadth clear. The headsman’s steering saved them.');
  }

  function tick(dt) {
    if (!c || c.over) return;
    c.t += dt;
    const fast = boats.fastCrews();
    if (!fast.length) {
      if (c.fright && c.t > c.fright) return escape('She hears the oars, and is off before a boat can come up with her.');
      if (c.w.sp.tooFast && c.t > GIVE_UP) escape('She is a finback, too fast for any boat. The men give up the chase.');
      return;
    }
    boats.lieOff(!c.haul);
    temper(dt);
    if (c.over || v.paused) return;
    if (!c.haul) {
      if ((c.off += dt) > DRAW && rand() < dt * 0.14) escape('The boats lie off too long. The irons draw, and she is away.');
      return;
    }
    c.off = 0;
    const lance = fast.reduce((a, b) => a + crews.quality(b).lance, 0);        // every boat fast to her lances
    c.progress = Math.min(1, c.progress + (dt / CHASE) * (lance / 2) * (c.ids.length === 1 ? 1.25 : 1));
    if (c.soundAt != null && c.progress >= c.soundAt) { c.soundAt = null; return sounds(); }
    if (c.progress >= 1) finish();
  }

  addEventListener('keydown', (e) => { if (c && !c.over && e.code === 'KeyS' && boats.fastCrews().length) c.haul = !c.haul; });

  return {
    start,
    tick,
    get whale() { return c && c.w; },
    get over() { return !c || c.over; },
    // The order the master may give now: [label, what it does], or null.
    get order() {
      if (!c || c.over || !boats.fastCrews().length) return null;
      return c.haul ? ['Stern all! Lie off (S)', () => { c.haul = false; hud.toast('"Stern all!" The boats back away and lie off.'); }]
        : ['Haul up and lance (S)', () => { c.haul = true; hud.toast('"Haul up!" The boats are hauled in on the line.'); }];
    },
    // The line shown over the progress bar, how full the bar is (null for no bar), and whether there is danger.
    get status() {
      if (!c) return [null, null, false];
      if (c.over) return ['Hoisting in the boats', null, false];
      if (!boats.fastCrews().length) return [c.quiet ? 'The boats are paddling up on her' : 'The boats are pulling for her', c.progress, false];
      if (c.mood === 'warn') return [c.haul ? 'She is rounding on the boats! Stern all!' : 'She lashes the water white. The boats lie clear.', c.progress, c.haul];
      if (!c.haul) return [c.off > DRAW ? 'Lying off. The irons are drawing: haul up!' : 'Lying off, clear of her flukes', c.progress, c.off > DRAW];
      return ['Hauled up alongside. The headsmen lance…', c.progress, false];
    },
    clear() { c = null; },
  };
}
