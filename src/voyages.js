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
    wellSailed: 0.9,      // a reach: he expects you to hold her on it

    plan: [
      { bearing: 45, miles: 7, said: 'the mark', near: 1.5,
        then: 'The mark is fetched. Put your helm over and bring her home — to ' +
              'starboard, and keep her clear of the wind’s eye.' },
      { bearing: 225, miles: 7, said: 'home', near: 1.5 }
    ],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands']
  },

  {
    key: 'windward',
    n: 2,
    title: 'Working to windward',
    teaches: 'What it costs to go where the wind comes from, and how to tack.',

    letter: [
      'New Bedford, the eleventh day of October, 1841.',
      'Sir — you have the feel of her now. Today we would have you learn what ' +
      'it costs to go where the wind comes from. The mark lies six miles to ' +
      'the north-west, and the wind is out of the north-west, so she cannot be ' +
      'steered at it. No square-rigged ship will lie closer than six points to ' +
      'the wind; try to point her nearer and she will stop and be taken aback.',
      'What you must do is beat. Stand as close to the wind as she will lie on ' +
      'one tack, then put her about and stand as close on the other, making a ' +
      'staircase of it up to the mark. Every mile she sails will gain you a ' +
      'little over half a mile toward it, and the board will show you both ' +
      'figures so that you may see the difference.',
      'She comes about one of two ways. Tacking carries her head through the ' +
      'wind: it is quick, and it can fail, and a ship that misses stays hangs ' +
      'in irons and loses all her way. Wearing carries her stern through ' +
      'instead: it never fails, but it is slower and it throws away ground to ' +
      'leeward. Below four knots, do not trust her to stay.',
      'Either way it is all hands. A watch of twelve cannot bring a ship of ' +
      'this burthen round, and never could; call your people up before you ' +
      'put her about.',
      'Coming home you will have the wind behind you, and you may judge the ' +
      'difference for yourself.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Beat six miles up to the mark to the north-west, and run home again.',

    wind: { from: 315, force: 3.5 },
    heading: 245,         // close-hauled on the larboard tack, already standing toward it
    swing: 0.5,
    fair: true,
    ground: false,
    // Beating gains a little over half a mile in every mile even when it is
    // well done, so she is not judged against a reach.
    wellSailed: 0.6,

    plan: [
      { bearing: 315, miles: 6, said: 'the mark', near: 1.5,
        then: 'The mark is fetched, and the worst of it is behind you. Put her ' +
              'before the wind and run home.' },
      { bearing: 135, miles: 6, said: 'home', near: 1.5 }
    ],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre']
  },

  {
    key: 'shorten',
    n: 3,
    title: 'Shortening down',
    teaches: 'What she may carry at each force, and how little warning a squall gives.',

    letter: [
      'New Bedford, the nineteenth day of October, 1841.',
      'Sir — there is a fresh breeze this morning and the glass is falling, so ' +
      'we would have you learn the last of it before you go: what she may carry, ' +
      'and what it costs to carry more.',
      'She lies at her moorings under all plain sail, and that is already more ' +
      'than this wind will bear. Canvas comes off her from the top down — the ' +
      'royals first, then the topgallants, then a reef in the topsails, then ' +
      'the courses. Take it off in that order and never out of it. The board ' +
      'will tell you when she is over-pressed, and it will tell you when she ' +
      'is dangerously so.',
      'Carry more than the wind will bear and the strain tells: a sail splits ' +
      'from head to foot, a yard springs, a topmast goes by the board. It does ' +
      'not happen at once, which is what tempts a young master to leave it a ' +
      'little longer.',
      'Watch the horizon to windward. A squall shows as a dark line before it ' +
      'reaches you, and you will have minutes and not hours. You cannot get it ' +
      'all off her in the time; you must choose what comes off first. Run ' +
      'fourteen miles south to the mark, and bring her there with every sail ' +
      'whole.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Run fourteen miles south to the mark, and bring her there with every sail whole.',

    wind: { from: 315, force: 4.0 },   // a fresh breeze: her royals should be in already
    heading: 180,                      // pointed at the mark, on a broad reach
    swing: 0.9,                        // and it freshens as the morning goes on
    fair: true,                        // no squall but the one she is given
    ground: false,
    wellSailed: 0.9,

    // One squall, on cue, with more warning than a whole reef takes and less
    // than the whole of shortening down. That gap is the game.
    squallAt: 20 * 60,                 // her own seconds after she sails
    squallWarning: 10,                 // minutes of warning from the horizon

    plan: [{ bearing: 180, miles: 14, said: 'the mark', near: 1.5 }],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre']
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
