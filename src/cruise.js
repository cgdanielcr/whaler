// The voyage: the run out to the ground, the cruise on it, and the account of
// the whole when she turns for home.
//
// A whaling voyage was reckoned in barrels, not in miles. Three or four years
// out of New Bedford, and what she was worth when she came home was what was
// stowed down in her hold. The rest -- the passage, the weather, the men --
// was what it cost to get it.
//
// She cruises until her water runs short, which is what really turned these
// ships for home more often than a full hold did.

const DAY = 86400;
const WATER_TURNS_HER = 12;      // days of water left when she must give it up
const GROUND_DAYS = 60;          // a leg of a cruise, not a whole voyage

export function makeCruise({ company, stores }) {
  let onGround = false;
  let began = 0;                 // her clock when she raised the ground
  let barrels = 0;
  let whales = 0;
  let lowered = 0;
  let over = null;

  return {
    get onGround() { return onGround; },
    get barrels() { return barrels; },
    get whales() { return whales; },
    get over() { return over; },
    days(gameSeconds) { return onGround ? (gameSeconds - began) / DAY : 0; },

    // She has run her distance and is on the cruising ground.
    raise(gameSeconds) {
      if (onGround) return;
      onGround = true;
      began = gameSeconds;
    },

    // A whale cut in and tried out, and the oil stowed down.
    stow(n) { barrels += n; whales += 1; },
    lower() { lowered += 1; },

    tick(gameSeconds) {
      if (!onGround || over) return null;
      const days = this.days(gameSeconds);
      const water = stores.all.find((s) => s.key === 'water');
      const why = water.amount <= WATER_TURNS_HER ? 'her water is down to a fortnight'
        : days >= GROUND_DAYS ? 'her time on the ground is up' : null;
      if (!why) return null;

      over = { days, barrels, whales, lowered, why, at: gameSeconds };
      return over;
    },

    // What became of every man, in his own line. This is the part worth
    // reading: the game does not tell you a story, it writes down what
    // happened and lets you find one in it.
    muster() {
      return company.all.map((m) => ({
        name: m.name,
        berth: m.berth,
        health: m.health,
        deeds: m.deeds && m.deeds.length ? m.deeds : null
      }));
    }
  };
}

// A short line in a man's record. Kept few and kept plain: a record of forty
// entries is a list, and a record of three is a life.
export function remember(man, what) {
  if (!man) return;
  if (!man.deeds) man.deeds = [];
  if (man.deeds.includes(what)) return;
  if (man.deeds.length >= 4) return;
  man.deeds.push(what);
}
