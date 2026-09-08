// The crew, and the orders they are working through.
//
// She carries thirty hands, divided into two watches, four hours on and four
// off, so about fifteen are on deck at any moment. Calling all hands gets you
// thirty -- and tires them, which makes every evolution slower.

const TIRES_IN = 6 * 3600;    // game seconds of all hands on deck to wear them out
const RESTS_IN = 8 * 3600;

const WEARINESS = [[0.15, 'fresh'], [0.4, 'willing'], [0.7, 'tiring'], [0.9, 'weary'], [2, 'spent']];

// How many she can muster comes from the company itself now: one watch of
// twelve, or every sound hand aboard when all hands are called.
export function makeCrew(company) {
  let allHands = false;
  let fatigue = 0;
  const running = [], waiting = [];

  const busy = () => running.reduce((n, o) => n + o.hands, 0);
  const onDeck = () => (allHands ? company.allHands : company.watchStrength);

  function start(order) {
    // Weary men take longer over the same work.
    order.seconds = order.minutes * 60 * (1 + 0.6 * fatigue);
    order.elapsed = 0;
    running.push(order);
    if (order.onStart) order.onStart();
  }

  return {
    running, waiting,

    get allHands() { return allHands; },
    get free() { return onDeck() - busy(); },
    get onDeck() { return onDeck(); },
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

    tick(gameSeconds) {
      fatigue = Math.max(0, Math.min(1, fatigue +
        gameSeconds * (allHands ? 1 / TIRES_IN : -1 / RESTS_IN)));

      for (let i = running.length - 1; i >= 0; i--) {
        const order = running[i];
        order.elapsed += gameSeconds;
        if (order.elapsed >= order.seconds) {
          running.splice(i, 1);
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
