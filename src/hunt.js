// Raising a whale, lowering for him, and what becomes of the boats.
//
// The chase is watched, not played. Once the boats are down, what happens out
// there is out of your hands: you have the ship, and eleven men to work her.
// The outcomes below are the things that really happened, in something like
// the proportions they happened in. The weights are inferred and tunable; the
// list is not.
//
// She hunts the sperm whale, which is what a ship in the Pacific in 1841 was
// there for, and whose oil was the prize.

const RAISE_CHANCE = 1 / (3.5 * 3600);   // per game second of daylight
const SOUNDS_OFF = 25 * 60;              // he will not wait for ever
const BOATS_DOWN = 3;                    // the fourth is kept as a spare

// Drawn once, when the boats get up to him. Minutes are of her own time.
const ENDINGS = [
  { weight: 30, key: 'killed', minutes: [70, 150],
    say: 'Fast, and killed. The boats are towing him back to the ship.', barrels: [28, 55] },
  { weight: 14, key: 'sleigh', minutes: [150, 260],
    say: 'He has taken the line and run with it. The boats are being towed to windward, and going out of sight.',
    then: 'killed', barrels: [34, 70] },
  { weight: 18, key: 'sounded', minutes: [50, 100],
    say: 'He sounded, and took the line down with him. They have cut loose and are pulling back empty.' },
  { weight: 13, key: 'drew', minutes: [45, 90],
    say: 'The iron drew. He is gone, and the harpoon with him.', costs: { cordage: 1 } },
  { weight: 12, key: 'parted', minutes: [45, 90],
    say: 'The line parted. He is away, and there is a tub of line gone with him.', costs: { cordage: 2 } },
  { weight: 10, key: 'stove', minutes: [60, 120],
    say: 'A boat is stove. The men are in the water and the others are picking them up.', stove: true },
  { weight: 3, key: 'lost', minutes: [70, 130],
    say: 'A boat is stove, and they cannot find all of them.', stove: true, drowns: true }
];

const roll = (a, b) => a + Math.random() * (b - a);
const draw = () => {
  const total = ENDINGS.reduce((n, e) => n + e.weight, 0);
  let r = Math.random() * total;
  return ENDINGS.find((e) => (r -= e.weight) < 0) || ENDINGS[0];
};

export function makeHunt({ company, crew, stores, say, onScene }) {
  let state = 'none';        // none | raised | down | chasing | back | alongside
  let whale = null;          // { bearing, miles }
  let clock = 0;             // game seconds left in the present state
  let ending = null;
  let crews = [];            // the men in the boats
  let barrels = 0;

  const shipkeepers = () => company.all.filter((m) => m.health === 'sound' && !m.inBoat).length;

  function manTheBoats() {
    const mates = company.all.filter((m) => m.rate === 'mate' && m.health === 'sound');
    const steerers = company.all.filter((m) => m.rate === 'boatsteerer' && m.health === 'sound');
    const oars = company.all.filter((m) =>
      m.health === 'sound' && !m.idler && m.rate !== 'mate' && m.rate !== 'boatsteerer');

    crews = [];
    for (let b = 0; b < BOATS_DOWN; b++) {
      const boat = [];
      if (mates[b]) boat.push(mates[b]);
      if (steerers[b]) boat.push(steerers[b]);
      while (boat.length < 6 && oars.length) boat.push(oars.shift());
      for (const m of boat) { m.inBoat = b + 1; m.employed = 'in the boats'; }   // 1-based: boat 0 would read as false
      crews.push(boat);
    }
  }

  function allAboard() {
    for (const boat of crews) for (const m of boat) { m.inBoat = null; m.employed = null; }
    crews = [];
  }

  return {
    get state() { return state; },
    get whale() { return whale; },
    get barrels() { return barrels; },
    get down() { return crews.length > 0; },
    get boatCrews() { return crews; },

    // What the boards should say about it.
    get said() {
      if (state === 'raised') {
        return `There she blows &mdash; a sperm whale ${whale.miles.toFixed(1)} miles off, ` +
               `broad on the ${whale.side}. <b>l</b> to lower.`;
      }
      if (state === 'down') return 'The boats are going down.';
      if (state === 'chasing') return ending ? ending.say : 'The boats are pulling for him.';
      if (state === 'back') return 'The boats are pulling back for the ship.';
      if (state === 'alongside') return `A whale alongside &mdash; ${barrels} barrels in him.`;
      return '';
    },

    // Lower away. Three boats, six men in each, and the ship is left with
    // whoever is not in them.
    lower() {
      if (state !== 'raised') {
        say(state === 'none' ? 'There is nothing in sight to lower for.'
                             : 'The boats are already away.');
        return false;
      }
      manTheBoats();
      state = 'down';
      clock = 8 * 60;
      say(`Boats away. ${shipkeepers()} hands left aboard to work her.`);
      if (onScene) onScene('down', crews.length);
      return true;
    },

    tick(gameDt, hour) {
      if (state === 'none') {
        const daylight = hour >= 5.5 && hour < 18.5;
        if (daylight && Math.random() < RAISE_CHANCE * gameDt) {
          whale = {
            miles: roll(0.8, 3.0),
            side: Math.random() < 0.5 ? 'larboard bow' : 'starboard beam'
          };
          state = 'raised';
          clock = SOUNDS_OFF;
          say('There she blows! A sperm whale, and the mastheads have him.');
        }
        return;
      }

      clock -= gameDt;
      if (clock > 0) return;

      if (state === 'raised') {                    // you left him too long
        state = 'none'; whale = null;
        say('He has sounded, and gone. Nothing more of him.');
        return;
      }

      if (state === 'down') {                      // pulled up to him
        ending = draw();
        state = 'chasing';
        clock = roll(...ending.minutes) * 60;
        say(ending.say);
        return;
      }

      if (state === 'chasing') {
        // What it cost her in gear, and in men.
        if (ending.costs) for (const k in ending.costs) stores.take(k, ending.costs[k]);
        if (ending.stove) {
          const boat = crews[Math.floor(Math.random() * crews.length)] || [];
          const man = boat[Math.floor(Math.random() * boat.length)];
          if (man) {
            man.health = ending.drowns ? 'lost' : 'hurt';
            say(ending.drowns
              ? `${man.name} is drowned, and they could not come at him in time.`
              : `${man.name} is hauled out of the water badly hurt.`);
          }
        }
        if (ending.key === 'killed' || ending.then === 'killed') {
          barrels = Math.round(roll(...ending.barrels));
        }
        state = 'back';
        clock = roll(35, 85) * 60;
        return;
      }

      if (state === 'back') {
        allAboard();
        if (onScene) onScene('aboard', 0);
        if (barrels) {
          state = 'alongside';
          clock = Infinity;
          say(`The whale is alongside, and a fluke chain on him. ${barrels} barrels by the look of him.`);
        } else {
          state = 'none'; whale = null;
          say('The boats are hoisted, and nothing to show for it.');
        }
        return;
      }
    },

    // Once he is cut in and tried out, she is looking for the next one.
    finished() {
      state = 'none'; whale = null; barrels = 0;
      if (onScene) onScene('gone', 0);
    }
  };
}
