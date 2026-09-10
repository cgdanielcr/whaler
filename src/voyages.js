// The owners' instructions.
//
// A voyage in the 1840s began with a letter from the ship's owners to her
// master, telling him where to go and what they expected of him. That is the
// frame here: each voyage is the same ship on the same sea, with fewer things
// happening at once, and a plain thing to do.
//
// Nothing in this file is new machinery. A voyage is a list of what is
// switched on -- her wind, whether the weather may throw a squall at her,
// which keys are on the board, and where she is to go.
//
// She is not named. If you want her named, put it in the letter below.

// The keys on the board, gathered into groups a voyage can allow or withhold.
export const GROUPS = {
  sail: 'making and shortening sail',
  helm: 'the helm',
  clock: 'her clock',
  look: 'the boards and the glossary',      // always allowed
  manoeuvre: 'tacking and wearing',
  allhands: 'calling all hands',
  mend: 'mending what has carried away',
  whale: 'the boats and the whale'
};

const ALL = ['sail', 'helm', 'clock', 'look', 'manoeuvre', 'allhands', 'mend', 'whale'];

export const VOYAGES = [
  {
    key: 'feel',
    n: 1,
    title: 'Getting the feel of her',
    teaches: 'How she goes, and what the wind has to do with it.',

    // The owners' letter, in their own voice. The keys are not in it; they go
    // underneath, where they do not spoil the year.
    letter: [
      'New Bedford, the fourth day of October, 1841.',
      'Sir — before we send you round the Horn we would have you and your ' +
      'people shake down together. Take her out this morning, in what little ' +
      'wind there is, and fetch the mark seven miles to the north-east. Then ' +
      'bring her home again.',
      'There is nothing in the weather today and nothing to do but sail her. ' +
      'Put your helm over and watch what she makes of it. Keep her off the ' +
      'wind and she goes; bring her too near it and she stops, for no ' +
      'square-rigged ship will lie closer than six points. If you have a mind ' +
      'to, take a sail off her and see how long your people are about it. The ' +
      'topsails want more hands than one watch can find, so call all hands if ' +
      'you would reef them.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Fetch the mark seven miles to the north-east, and bring her home again.',

    wind: { from: 315, force: 2.4 },
    heading: 90,          // she begins heading east, with the mark four points to larboard
    swing: 0.35,          // how much the force wanders. A quiet day.
    fair: true,           // no squalls
    ground: false,        // no whaling: this is home water

    plan: [
      { bearing: 45, miles: 7, said: 'the mark', near: 1.5,
        then: 'The mark is fetched. Put your helm over and bring her home — to ' +
              'starboard, and keep her clear of the wind’s eye.' },
      { bearing: 225, miles: 7, said: 'home', near: 1.5 }
    ],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands']
  },

  {
    key: 'cruise',
    n: null,
    title: 'A cruise',
    teaches: 'The whole of her: weather, damage, the boats, and the oil.',

    letter: [
      'Sixty miles to the south-west lies the ground, and three or four years ' +
      'between you and New Bedford again. Fill her with oil, and bring your ' +
      'people home.'
    ],

    task: 'Run down to the cruising ground, and fill her with oil.',

    wind: { from: 315, force: 3.3 },
    heading: 170,
    swing: 1,
    fair: false,
    ground: true,

    plan: [{ bearing: 225, miles: 60, said: 'the cruising ground' }],

    allow: ALL
  }
];

// Which voyage she is to sail. The page's address chooses it, so that a
// choice made on the letter is remembered across a reload and nothing has to
// be taken apart and built again while she is afloat.
export function chosen() {
  const key = (location.hash || '').replace('#', '');
  return VOYAGES.find((v) => v.key === key) || VOYAGES[0];
}

export function choose(key) {
  location.hash = key;
  location.reload();
}
