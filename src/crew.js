// The crew, and the orders they are working through.
//
// An order is no longer a number of men: it is named men in named places. When
// one is given, the mate picks who goes where -- the best seamen out on the
// yards, the strongest on the ropes -- and how long the work takes depends on
// who he sent. A yard full of green hands is slow, and in a gale it is worse
// than slow.

import { manThePosts } from './stations.js';

const TIRES_IN = 6 * 3600;    // game seconds of all hands on deck to wear them out
const RESTS_IN = 8 * 3600;

const WEARINESS = [[0.15, 'fresh'], [0.4, 'willing'], [0.7, 'tiring'], [0.9, 'weary'], [2, 'spent']];

// A green hand on a yard in a hard blow may lose his hold. The chances are
// inferred, and deliberately small: falls were rare, and remembered for years.
const FALL = { 7: 0.05, 8: 0.10, 9: 0.16 };

export function makeCrew(company) {
  let allHands = false;
  let fatigue = 0;
  let watchUp = 'starboard';    // which watch has the deck, from the ship's clock
  let force = 3;
  const running = [], waiting = [];

  // Every sound man who could be called on this minute.
  const muster = () => company.all.filter((m) =>
    m.health === 'sound' && !m.inBoat && (allHands || m.watch === watchUp));
  const idle = () => muster().filter((m) => !m.employed);

  function start(order) {
    const took = manThePosts(order.name, idle());
    order.posted = took ? took.manned : [];
    for (const post of order.posted) for (const m of post.men) m.employed = order.name;

    // Weary men take longer, and so do poor hands in the wrong places.
    order.seconds = order.minutes * 60 * (1 + 0.6 * fatigue) * (took ? took.factor : 1);
    order.elapsed = 0;
    running.push(order);
    if (order.onStart) order.onStart();
  }

  // Let the men go, and see whether the weather took one of them.
  function release(order, onHurt) {
    for (const post of order.posted || []) {
      for (const m of post.men) {
        m.employed = null;
        if (!post.aloft || m.rate !== 'green hand') continue;
        const risk = FALL[Math.min(9, Math.round(force))];
        if (risk && Math.random() < risk) {
          m.health = Math.random() < 0.2 ? 'lost' : 'hurt';
          if (onHurt) onHurt(m, post.at);
        }
      }
    }
  }

  return {
    running, waiting,

    get allHands() { return allHands; },
    get free() { return idle().length; },
    get onDeck() { return muster().length; },
    get fatigue() { return fatigue; },
    get weariness() { return WEARINESS.find(([at]) => fatigue < at)[1]; },

    call(yes) { allHands = yes; },

    // An order already given for the same work is not given twice.
    issue(order) {
      if ([...running, ...waiting].some((o) => o.tier && o.tier === order.tier)) return false;
      waiting.push(order);
      return true;
    },

    // Whether the hands now on deck could ever man a piece of work. Reefing
    // topsails and tacking ship want more than one watch can find, which is
    // why both were called for all hands.
    wantsAllHands: (n) => n > company.watchStrength,

    // onHurt is called with the man and the place, when one of them falls.
    tick(gameSeconds, onDeckWatch, atForce, onHurt) {
      if (onDeckWatch) watchUp = onDeckWatch;
      if (atForce !== undefined) force = atForce;

      fatigue = Math.max(0, Math.min(1, fatigue +
        gameSeconds * (allHands ? 1 / TIRES_IN : -1 / RESTS_IN)));

      for (let i = running.length - 1; i >= 0; i--) {
        const order = running[i];
        order.elapsed += gameSeconds;
        if (order.elapsed >= order.seconds) {
          running.splice(i, 1);
          release(order, onHurt);
          if (order.onDone) order.onDone();
        } else if (order.onProgress) {
          order.onProgress(order.elapsed / order.seconds);
        }
      }

      // Set the waiting orders going as hands come free, oldest first.
      for (let i = 0; i < waiting.length; i++) {
        const order = waiting[i];
        if (order.hands > this.free) continue;
        if (running.some((o) => o.tier && o.tier === order.tier)) continue;
        waiting.splice(i--, 1);
        start(order);
      }
    },

    // Minutes of her own time left to run on an order.
    remaining: (order) => Math.ceil((order.seconds - order.elapsed) / 60)
  };
}
