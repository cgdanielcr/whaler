// What she carries below: the spare gear a ship must have if she is to mend
// herself at sea, and the provisions that keep the company alive.
//
// A ship three years from home cannot send ashore for anything. She sails with
// spare canvas in bolts, spare spars lashed on the skids, and cordage, and
// when they are gone she does without. The quantities below are inferred: no
// period figure for a 350-ton whaler's outfit is to hand, and they are set at
// what makes a passage interesting rather than what makes it safe.

const START = {
  canvas: 5,        // bolts of sailcloth, enough for one new sail each
  spars:  3,        // spare yards and topmasts on the skids
  cordage: 6,       // coils of rope
  provisions: 210,  // days of salt beef, pork and bread for the company
  water: 120        // days of water, the shorter of the two, as it always was
};

const SAID = {
  canvas: 'Spare canvas', spars: 'Spare spars', cordage: 'Cordage',
  provisions: 'Provisions', water: 'Water'
};

const UNIT = {
  canvas: (n) => `${n} bolt${n === 1 ? '' : 's'}`,
  spars: (n) => `${n} spar${n === 1 ? '' : 's'}`,
  cordage: (n) => `${n} coil${n === 1 ? '' : 's'}`,
  provisions: (n) => `${Math.floor(n)} days`,
  water: (n) => `${Math.floor(n)} days`
};

// A voyage may fill her deeper than usual: a ship bound round the Horn topped
// her water casks to the brim, and often again at Fayal or the Cape Verdes.
export function makeStores(over = {}) {
  const have = { ...START, ...over };

  return {
    get all() {
      return Object.keys(START).map((k) => ({
        key: k, said: SAID[k], amount: have[k], reads: UNIT[k](have[k]),
        // Spare gear is short when there is one left; victuals when there is
        // a fortnight in her.
        low: k === 'provisions' || k === 'water' ? have[k] < 14 : have[k] <= 1,
        out: have[k] <= 0
      }));
    },

    has(what, n = 1) { return have[what] >= n; },

    // Nothing is taken out of her unless there is enough of it.
    take(what, n = 1) {
      if (have[what] < n) return false;
      have[what] -= n;
      return true;
    },

    // A day's victuals go every day, whatever else happens.
    tick(gameSeconds) {
      const days = gameSeconds / 86400;
      have.provisions = Math.max(0, have.provisions - days);
      have.water = Math.max(0, have.water - days);
    },

    // What the mate would say about the state of her stores, or nothing.
    get word() {
      if (have.water <= 0) return 'The water is out.';
      if (have.provisions <= 0) return 'The provisions are gone.';
      if (have.water < 14) return 'The water is running short.';
      return '';
    }
  };
}
