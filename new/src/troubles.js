// The troubles a crisis brings, and where aboard each one breaks out. Places
// are [x along her, bow forward; height above that deck; z across her], in the
// ship's own units as in stations.js; `spots` are where each hand stands to it.
// A 'task' is done once enough work goes into it, and fails if its `strain`
// (seconds) runs out first. A 'meter' rises by itself (`grow` a second) and
// must be kept down by the men at it (`work`: how much a man's skill wears it
// down) for as long as the crisis lasts.
const H = Math.PI / 2;

// How hard it blows, by the name of the wind.
export const FORCE = { 'fresh gale': 1, 'strong gale': 1.25, 'whole gale': 1.5 };

export const CRISES = {
  gale: {
    title: (wind) => `A ${wind}`,
    opening: (wind) => `It comes on to blow: a ${wind}! Get the topsails in before they blow away, keep good men at the wheel, and mind the pumps.`,
    lasts: (force) => 45 + 25 * force,           // seconds before the worst of it blows through
    over: 'The worst of the gale is past.',
    troubles: [
      { id: 'foreTopsail', type: 'task', deck: 'upper', name: 'Fore topsail', uses: 'seamanship', hands: 2, work: 70, strain: 28,
        at: [3.9, 2.9, 0], spots: [[3.9, 2.9, 0.55], [3.9, 2.9, -0.55]], pose: 'spade', face: -H,
        done: 'The fore topsail is taken in and furled.',
        fail: 'The fore topsail blows out of its bolt-ropes with a crack like a gun!' },
      { id: 'mainTopsail', type: 'task', deck: 'upper', name: 'Main topsail', uses: 'seamanship', hands: 2, work: 70, strain: 38,
        at: [0.3, 2.9, 0], spots: [[0.3, 2.9, 0.55], [0.3, 2.9, -0.55]], pose: 'spade', face: -H,
        done: 'The main topsail is taken in and furled.',
        fail: 'The main topsail splits from head to foot and flogs itself to rags!' },
      { id: 'wheel', type: 'meter', deck: 'upper', name: 'The wheel', gauge: 'Off her course', uses: 'seamanship', hands: 2, work: 120,
        grow: 0.035, start: 0.2, at: [-6.1, 0, 0.1], spots: [[-6.1, 0, 0.45], [-6.1, 0, -0.25]], pose: 'wheel', face: Math.PI },
      { id: 'pumps', type: 'meter', deck: 'upper', name: 'The pumps', gauge: 'Water in the hold', uses: 'strength', hands: 3, work: 420,
        grow: 0.003, leak: 0.016, at: [-0.55, 0, 0], spots: [[-0.4, 0, 0.55], [-0.4, 0, -0.55], [-0.85, 0, 0.55]], pose: 'stir', face: -H },
      { id: 'leak', type: 'task', deck: 'hold', name: 'A leak', uses: 'carpentry', hands: 2, work: 90, from: 10,
        at: [-0.8, 0, -0.75], spots: [[-0.8, 0, -0.75], [-1.25, 0, -0.55]], pose: 'hammer', face: H,
        appears: 'She has sprung a leak! The water is coming into the hold. Send the carpenter below to find it.',
        done: 'The leak is found and stopped.' },
    ],
  },
};

// Where the watch below muster on deck when all hands are called.
export const MUSTER = [[2.0, 0, 0.8], [1.6, 0, -0.8], [-1.4, 0, 0.9], [-1.8, 0, -0.9], [4.6, 0, 0.5], [4.6, 0, -0.5],
  [-2.6, 0, 0.4], [2.8, 0, 0.1], [-1.0, 0, 0.2], [3.4, 0, -0.7], [-3.0, 0, -0.5], [2.4, 0, -0.3]];
