// The troubles a crisis brings, and where aboard each one breaks out. Places
// are [x along her, bow forward; height above that deck; z across her], in the
// ship's own units as in stations.js; `spots` are where each hand stands to it.
// A 'task' is done once enough work goes into it, and fails if its `strain`
// (seconds) runs out first. A 'meter' rises by itself (`grow` a second) and
// must be kept down by the men at it (`work`: how much a man's skill wears it
// down). A crisis with `lasts` blows through in that many seconds; one without
// goes on until its tasks are settled and every meter marked `quench` is down.
// Each crisis says what its failures cost in `fail`, `full` and `finish`, which
// are handed the means to do it: a.v (the voyage), a.sail, a.helm, a.season, a.hurt, a.say.
const H = Math.PI / 2;

// How hard it blows, by the name of the wind.
export const FORCE = { 'fresh gale': 1, 'strong gale': 1.25, 'whole gale': 1.5 };

const topsail = (id, name, x, strain, fail) => ({ id, type: 'task', deck: 'upper', name, uses: 'seamanship', hands: 2, work: 70, strain,
  at: [x, 2.9, 0], spots: [[x, 2.9, 0.55], [x, 2.9, -0.55]], pose: 'spade', face: -H, done: `The ${name.toLowerCase()} is taken in and furled.`, fail,
  failed: (a) => a.sail.canvas.lose() });
const wheel = (grow) => ({ id: 'wheel', type: 'meter', deck: 'upper', name: 'The wheel', gauge: 'Off her course', uses: 'seamanship', hands: 2, work: 120,
  grow, start: 0.2, at: [-6.1, 0, 0.1], spots: [[-6.1, 0, 0.45], [-6.1, 0, -0.25]], pose: 'wheel', face: Math.PI,
  full: (a, t) => { t.m = 0.4; a.v.hull = Math.max(1, a.v.hull - 6); a.c.broaches++; const men = a.sweep(2);
    a.say(`She broaches to! A green sea sweeps the deck${men.length ? ` and ${men.join(' and ')} ${men.length > 1 ? 'are' : 'is'} hurt` : ''}.`); } });

export const CRISES = {
  gale: {
    title: (wind) => `A ${wind}`, lasts: (force) => 45 + 25 * force, over: 'The worst of the gale is past.',
    opening: (wind) => `It comes on to blow: a ${wind}! Get the topsails in before they blow away, keep good men at the wheel, and mind the pumps.`,
    // Snugged down beforehand, the topsails are half in already.
    begin: (a, c) => { if (a.sail.canvas.at > 1.5) { for (const t of c.troubles) if (t.strain) { t.p = 0.55; t.strain *= 1.5; } a.say('It comes on to blow, and finds her snugged down already. Finish furling the topsails, keep good men at the wheel, and mind the pumps.'); } },
    troubles: [
      topsail('foreTopsail', 'Fore topsail', 3.9, 28, 'The fore topsail blows out of its bolt-ropes with a crack like a gun!'),
      topsail('mainTopsail', 'Main topsail', 0.3, 38, 'The main topsail splits from head to foot and flogs itself to rags!'),
      wheel(0.035),
      { id: 'pumps', type: 'meter', deck: 'upper', name: 'The pumps', gauge: 'Water in the hold', uses: 'strength', hands: 3, work: 420,
        grow: 0.003, leak: 0.016, at: [-0.55, 0, 0], spots: [[-0.4, 0, 0.55], [-0.4, 0, -0.55], [-0.85, 0, 0.55]], pose: 'stir', face: -H,
        high: (a, t, dt) => { a.v.hull = Math.max(1, a.v.hull - (t.m - 0.5) * 1.6 * dt); } },
      { id: 'leak', type: 'task', deck: 'hold', name: 'A leak', uses: 'carpentry', hands: 2, work: 90, from: 10,
        at: [-0.8, 0, -0.75], spots: [[-0.8, 0, -0.75], [-1.25, 0, -0.55]], pose: 'hammer', face: H,
        appears: 'She has sprung a leak! The water is coming into the hold. Send the carpenter below to find it.', done: 'The leak is found and stopped.' },
    ],
    finish: (a, c, lines) => {
      const leak = c.troubles.find((t) => t.id === 'leak');
      if (leak.state === 'open') { a.v.hull = Math.max(1, a.v.hull - 8); lines.push('The leak was never stopped. The carpenter gets at it when the sea goes down, but she is badly strained.'); }
      a.sail.canvas.set(Math.max(2, Math.round(a.sail.canvas.at)));
      lines.push('She lies under close-reefed topsails. Make sail again when it moderates.');
    },
  },

  squall: {
    title: () => 'A squall', lasts: () => 24, over: 'The squall is gone to leeward as fast as it came.',
    opening: () => 'A white squall, and no time to think! Let fly the topgallant halyards, clew up the main topsail, and hold her head off the wind.',
    begin: (a, c) => { if (a.sail.canvas.at > 0.6) { c.troubles[0].state = 'done'; a.say('A white squall! The topgallants are in already, thank God. Clew up the main topsail and hold her head off the wind.'); } },
    troubles: [
      { ...topsail('halyards', 'Topgallant halyards', 3.6, 11, 'The fore topgallant goes, sail and yard together, before a hand can reach the halyards!'), at: [3.3, 0, 0], spots: [[3.3, 0, 0.9], [3.3, 0, -0.9]], pose: 'stir', work: 26, done: 'The topgallant halyards are let fly, and the sails come down by the run.' },
      { ...topsail('mainTopsail', 'Main topsail', 0.3, 19, 'The main topsail splits from head to foot and flogs itself to rags!'), hands: 3, spots: [[0.3, 2.9, 0.6], [0.3, 2.9, -0.6], [0.3, 2.9, 0]], work: 60, done: 'The main topsail is clewed up.' },
      wheel(0.06),
    ],
    finish: (a, c, lines) => { a.sail.wind.shift((Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.8)); lines.push('It has brought the wind round with it.'); },
  },

  fire: {
    title: () => 'Fire at the tryworks', over: 'The fire is out. The deck about the tryworks is charred black.',
    opening: () => 'A pot has boiled over, and the tryworks are ablaze! Pass buckets to the fire, batten the main hatch before it gets below to the oil, and wet down the foresail.',
    troubles: [
      { id: 'fire', type: 'meter', quench: true, deck: 'upper', name: 'The fire', gauge: 'The blaze', uses: 'strength', hands: 4, work: 230, grow: 0.05, start: 0.35,
        at: [2.4, 0, 0], spots: [[2.4, 0, -1.35], [2.4, 0, 1.35], [3.3, 0, -0.9], [3.3, 0, 0.9]], pose: 'stir', face: 0,
        full: (a, t) => { t.m = 0.6; a.v.hull = Math.max(1, a.v.hull - 10); const men = a.sweep(2, 18); a.say(`The deck itself takes fire${men.length ? `, and ${men.join(' and ')} ${men.length > 1 ? 'are' : 'is'} burnt` : ''}!`); } },
      { id: 'hatch', type: 'task', deck: 'upper', name: 'Main hatch', uses: 'seamanship', hands: 2, work: 40, strain: 22, at: [1.2, 0, 0], spots: [[1.2, 0, 0.5], [1.2, 0, -0.5]], pose: 'hammer', face: 0,
        done: 'The main hatch is battened down and a wet sail hauled over it.', fail: 'Burning oil runs down the main hatch, and the blubber room is alight!',
        failed: (a) => { const n = Math.round((a.v.whale + a.v.sperm) * 0.25); a.v.whale = Math.round(a.v.whale * 0.75); a.v.sperm = Math.round(a.v.sperm * 0.75); a.c.burnt = n; } },
      { id: 'foresail', type: 'task', deck: 'upper', name: 'The foresail', uses: 'strength', hands: 2, work: 45, strain: 30, at: [4.3, 0, 0], spots: [[4.3, 0, 0.8], [4.3, 0, -0.8]], pose: 'stir', face: 0,
        done: 'The foresail is wetted down, and the sparks die on it.', fail: 'Sparks catch the foresail, and it goes up like paper!', failed: (a) => a.sail.canvas.lose() },
    ],
    finish: (a, c, lines) => { if (c.burnt) lines.push(`About ${c.burnt} barrels of oil burned below before it was got under.`); },
  },

  overboard: {
    title: () => 'Man overboard', over: '',
    opening: (wind, c) => `${c.who.name} is gone from the yard into the sea! Heave her to with the main braces and get the stern boat down. He will not last long in this water.`,
    begin: (a, c) => { const s = 15 + c.who.stats.strength * 2 + (a.season.edge - a.helm.pos.z > -120 ? -4 : 0); for (const t of c.troubles) t.strain = s; },
    troubles: [
      { id: 'braces', type: 'task', deck: 'upper', name: 'Main braces', uses: 'seamanship', hands: 3, work: 80, strain: 20, at: [-1.6, 0, 0], spots: [[-1.6, 0, 1.3], [-1.6, 0, -1.3], [-2.2, 0, 1.3]], pose: 'stir', face: 0,
        done: 'The main topsail is laid aback, and she loses her way.', fail: 'She is half a mile on before her way is off her.' },
      { id: 'boat', type: 'task', deck: 'upper', name: 'Stern boat', uses: 'strength', hands: 4, work: 110, strain: 20, at: [-4.3, 0, 1.6], spots: [[-4.0, 0, 1.4], [-4.6, 0, 1.4], [-3.6, 0, 1.0], [-5.0, 0, 1.0]], pose: 'stir', face: -H,
        done: 'The stern boat is down and pulling back along the wake.', fail: 'The boat is too long getting down.' },
    ],
    finish: (a, c, lines) => {
      if (c.troubles.every((t) => t.state === 'done')) { c.who.health = Math.max(10, c.who.health - 35); a.cheer(4); c.clean = true; lines.push(`${c.who.name} is hauled into the boat, blue and speechless, and lives.`); }
      else { a.drown(c.who); a.cheer(-6); lines.push(`The boat pulls about for an hour among the seas. ${c.who.name} is not seen again.`); }
    },
  },

  beset: {
    title: () => 'Beset in the ice', over: 'She is hove clear, a fathom at a time, into the open lead.',
    opening: () => 'The ice has her fast, and it is tightening. Lay out an ice anchor and heave her clear at the windlass, and keep the floes off her quarter with poles and saws.',
    troubles: [
      { id: 'windlass', type: 'task', deck: 'upper', name: 'The windlass', uses: 'strength', hands: 6, work: 380, at: [6.1, 0, 0],
        spots: [[6.1, 0, 0.7], [6.1, 0, -0.7], [5.6, 0, 0.7], [5.6, 0, -0.7], [6.6, 0, 0.5], [6.6, 0, -0.5]], pose: 'stir', face: 0, done: 'Clear! She slides out into open water.' },
      { id: 'nip', type: 'meter', deck: 'upper', name: 'Ice on her quarter', gauge: 'The nip', uses: 'strength', hands: 4, work: 150, grow: 0.034, start: 0.3, at: [-4.2, 0, -1.5],
        spots: [[-3.6, 0, -1.4], [-4.4, 0, -1.4], [-5.2, 0, -1.3], [-2.8, 0, -1.4]], pose: 'spade', face: H,
        full: (a, t) => { t.m = 0.5; a.v.hull = Math.max(1, a.v.hull - 9); a.say('A floe rafts up against her quarter, and her timbers cry out!'); } },
    ],
    finish: (a) => { a.helm.pos.z = a.season.edge + 16; a.helm.slow = 1; a.cheer(2); },
  },
};

// Where the watch below muster on deck when all hands are called.
export const MUSTER = [[2.0, 0, 0.8], [1.6, 0, -0.8], [-1.4, 0, 0.9], [-1.8, 0, -0.9], [4.6, 0, 0.5], [4.6, 0, -0.5],
  [-2.6, 0, 0.4], [2.8, 0, 0.1], [-1.0, 0, 0.2], [3.4, 0, -0.7], [-3.0, 0, -0.5], [2.4, 0, -0.3]];
