// The chase: from lowering the boats to hoisting them in again. Most go to
// plan, but a whale may stove a boat, sound and run out the line, sink when
// dead, or simply be too fast. A dead whale is left floating, to be cut in.
import { describe } from './species.js';
import { hud } from './hud.js';

const CHASE = 9;          // seconds two boats must hang on to kill her
const GIVE_UP = 15;       // seconds of pulling before the boats give up on a whale they cannot reach
const rand = Math.random;
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

export function makeChase({ v, whales, boats, helm, company }) {
  let c = null;

  function start(w, n) {
    const sp = w.sp;
    c = { w, n, t: 0, progress: 0, over: false, events: [] };
    // What will go wrong is settled now, and happens as the chase goes on.
    if (rand() < sp.sound) c.events.push({ at: 0.3 + rand() * 0.4, kind: 'sound' });
    if (rand() < sp.stove * (n === 1 ? 1.3 : 1)) c.events.push({ at: 0.1 + rand() * 0.75, kind: 'stove' });
    whales.hunt(w);
    boats.launch(helm.pos, helm.heading, n);
    hud.toast(`Lower away! ${n === 1 ? 'One boat pulls' : 'The boats pull'} for the ${describe(w)}.`);
  }

  function end(text) { c.over = true; boats.recall(); if (text) hud.toast(text); }
  function escape(text) { whales.escape(c.w); end(text); }

  function stove() {
    const side = boats.stove(), alone = boats.out === 0;
    const drowned = alone ? between(1, 4) : between(0, 2);   // the other boat picks up who it can
    const names = company.lose(drowned);
    v.crew = company.count; v.lost += drowned; v.boats -= 1; v.boatsLost += 1;
    const men = drowned === 0 ? 'All hands picked up.' : `${names.join(' and ')} ${drowned === 1 ? 'is' : 'are'} drowned.`;
    if (alone) escape(`She stoves the ${side} boat! ${men} She is away.`);
    else { c.n = boats.out; hud.toast(`She stoves the ${side} boat! ${men}`); }
  }

  function sound() {
    v.paused = true;
    hud.decide('She sounds! The line smokes round the loggerhead as she takes it down.', [
      ['Hold on', () => {
        v.paused = false;
        if (rand() < 0.65) hud.toast('She comes up again. Still fast!');
        else escape('The line runs out to the end. She is gone, and the line with her.');
      }],
      ['Cut the line', () => { v.paused = false; escape('Cut! The boats are safe, and she is away.'); }],
    ]);
  }

  function finish() {
    const w = c.w, sinks = rand() < w.sp.sink;
    whales.kill(w, sinks);
    if (sinks) return end(`She is dead, and she sinks! All her oil goes to the bottom.`);
    v.taken += 1;
    w.left = w.barrels;
    end(`She rolls fin out, about ${w.barrels} barrels in her. Bring her alongside before the sharks have her.`);
  }

  function tick(dt) {
    if (!c || c.over) return;
    c.t += dt;
    if (!boats.fast) {
      if (c.w.sp.tooFast && c.t > GIVE_UP) escape('She is a finback, too fast for any boat. The men give up the chase.');
      return;
    }
    c.progress = Math.min(1, c.progress + dt / (CHASE * (c.n === 1 ? 1.6 : 1)));
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
      return [boats.fast ? 'Fast to her! The boats hang on…' : 'The boats are pulling for her', c.progress];
    },
    clear() { c = null; },
  };
}
