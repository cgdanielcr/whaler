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

    // Short, on purpose. The pilot below teaches the working of her one step
    // at a time; a letter that listed every key would be the tutorial that
    // was thrown out after M6, which named things you could not find.
    letter: [
      'New Bedford, the fourth day of October, 1841.',
      'Sir — before we send you round the Horn we would have you and your ' +
      'people shake down together. Take her out this morning, fetch the mark ' +
      'seven miles to the north-east, and bring her home again.',
      'She is under her topsails only. Your first mate will see you through ' +
      'the rest of it.',
      'We are, sir, your obedient servants.'
    ],

    // She lies under her topsails, which is how a ship gets under way: the
    // working canvas first, and the rest made afterwards.
    canvas: { course: 'furled', topgallant: 'furled', royal: 'furled',
              spanker: 'furled', headsail: 'furled' },

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

    allow: ['sail', 'helm', 'clock', 'look', 'allhands'],

    // The first mate at your elbow. Each step names one thing, gives you the
    // button that does it, and waits for the ship herself to say it is done.
    steps: [
      {
        say: 'First, the wind. Look aloft at the pennant on the main masthead — ' +
             'the red streamer at the very top. It streams away from the wind, ' +
             'so it points where the wind is going. The blue arrow on the compass ' +
             'below says the same thing.',
        vane: true, board: 'clock-board',
        how: (s) => `The wind is out of the ${s.windSaid}, and light.`,
        acts: [{ said: 'I see it', key: 'PilotOn' }],
        done: (s) => s.acked,
        well: 'Good. Everything she does today comes off that.'
      },
      {
        say: 'She lies under her topsails, which is barely enough to move her. ' +
             'Set her courses — the great lowest sails — and she will begin to ' +
             'walk. Eight hands will be eight minutes about it, and you will see ' +
             'them at work in the orders board.',
        mark: { tier: 'course' }, board: 'canvas-board',
        how: (s) => (s.working('course')
          ? 'The hands are on the sheets and tacks now.'
          : `She is making ${s.knots.toFixed(1)} knots.`),
        acts: [{ said: 'Set the courses', key: 'Digit1', shift: true }],
        done: (s) => s.stateOf('course') === 'set',
        well: 'Her courses are set, and you can feel her take hold of it.'
      },
      {
        say: 'Now put your head where you are going. The mark bears north-east, ' +
             'and she is heading east — four points to larboard of it. Hold the ' +
             'helm over to larboard until her head comes round onto the mark.',
        board: 'voyage-board', gauge: 6,
        how: (s) => `${s.headSaid}. She is making ${s.knots.toFixed(1)} knots.`,
        acts: [
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' }
        ],
        done: (s) => Math.abs(s.offMark) < 6,
        well: 'That is the mark, right under her bowsprit. Now she is going somewhere.'
      },
      {
        say: 'More canvas will carry you there sooner. Set the topgallants — ' +
             'the third tier up — and then the royals above them. Canvas goes ' +
             'on from the bottom up and comes off from the top down; that is the ' +
             'whole rule.',
        mark: { tier: 'topgallant' }, board: 'canvas-board',
        how: (s) => `She is making ${s.knots.toFixed(1)} knots.`,
        acts: [
          { said: 'Set the topgallants', key: 'Digit3', shift: true },
          { said: 'Set the royals', key: 'Digit4', shift: true }
        ],
        done: (s) => s.stateOf('topgallant') === 'set' && s.stateOf('royal') === 'set',
        well: 'Every stitch she owns. Watch her speed — that is what canvas buys you.'
      },
      {
        say: 'Now run her down to the mark. Keep her head on it, and if she ' +
             'wanders use the helm. You may run her clock on with the = key to ' +
             'pass the time, and she will come back to her own time the moment ' +
             'you touch the helm.',
        board: 'voyage-board', gauge: 10,
        how: (s) => `${s.toRun.toFixed(1)} miles to run. ${s.headSaid}.`,
        acts: [
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.leg > 0,
        well: 'The mark is fetched.'
      },
      {
        say: 'Home again, and home lies the other way. Bring her round to ' +
             'starboard — the long way round, away from the wind. Take her the ' +
             'short way and you will steer straight into the wind’s eye, where ' +
             'no square-rigged ship can go, and she will stop dead.',
        board: 'voyage-board', gauge: 8,
        how: (s) => `Home bears ${s.bearSaid}. ${s.headSaid}.`,
        acts: [
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' }
        ],
        done: (s) => Math.abs(s.offMark) < 8,
        well: 'She is pointed at home. Run her in, and that is your first voyage.'
      }
    ]
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
    squalls: [{ at: 20 * 60, warning: 10 }],

    plan: [{ bearing: 180, miles: 14, said: 'the mark', near: 1.5 }],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre']
  },

  {
    key: 'watch',
    n: 4,
    title: 'Watch and watch',
    teaches: 'Why she is worked in two halves, and what it costs to keep them all on deck.',

    letter: [
      'New Bedford, the second day of November, 1841.',
      'Sir — a longer run today, and a lesson in your people rather than in ' +
      'your canvas. Seven-and-twenty of them keep watches, four hours on deck ' +
      'and four below. That is not a kindness. It is the ' +
      'only way a ship is worked for three years together without her company ' +
      'being used up in the first six months.',
      'Calling all hands turns out every man aboard, the watch below with the ' +
      'rest, and there is work that cannot be done without it — reefing her ' +
      'topsails, and bringing her about. But men on deck are men not sleeping, ' +
      'and a tired crew is a slow one: the same reef that takes twelve minutes ' +
      'from a fresh watch will take you half as long again from a spent one. ' +
      'The board will tell you how they are.',
      'Call them up when you need them and send them below the moment you do ' +
      'not. There is weather about today and you will need them more than ' +
      'once. Run thirty miles to the south-west, and bring your people in ' +
      'with something left in them.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Run thirty miles south-west, and bring your people in with something left in them.',

    wind: { from: 315, force: 3.8 },
    heading: 225,          // a close reach, and she will hold it all day
    swing: 0.8,
    fair: true,            // no weather but the three she is given
    ground: false,
    wellSailed: 0.88,

    // Three of them, spread across the run, so the crew must be spent and
    // rested and spent again rather than simply held on deck throughout.
    squalls: [
      { at: 35 * 60, warning: 12 },
      { at: 95 * 60, warning: 9 },
      { at: 195 * 60, warning: 7 }
    ],

    plan: [{ bearing: 225, miles: 30, said: 'the mark', near: 1.5 }],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre']
  },

  {
    key: 'mend',
    n: 5,
    title: 'Something carried away',
    teaches: 'What she carries below, and how a ship puts herself to rights at sea.',

    letter: [
      'New Bedford, the ninth day of November, 1841.',
      'Sir — she came in on Tuesday with her fore topsail split from head to ' +
      'foot, and we have not sent a sailmaker down to her. You will mend her ' +
      'yourself, at sea, as you will have to do for three years once you are ' +
      'round the Horn.',
      'A ship that far from home mends herself or does without. She carries ' +
      'spare canvas in bolts, spare spars on the skids, and coils of cordage, ' +
      'and when they are gone she does without them. A split sail is unbent ' +
      'and a new one bent in its place out of the locker. A sprung yard is ' +
      'fished — splinted with a spare spar and woolded round with rope — and ' +
      'that is the carpenter’s work, not a seaman’s. Set your hands to it and ' +
      'watch the stores board as they go.',
      'Sixteen miles to the south-west, and bring her in whole.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Mend what has carried away, and run sixteen miles south-west to the mark.',

    // Kept below a fresh breeze on purpose: the lesson is mending what is
    // already broken, not breaking more of it.
    wind: { from: 315, force: 2.9 },
    heading: 225,
    swing: 0.3,
    fair: true,
    ground: false,
    wellSailed: 0.88,

    // She begins the voyage already hurt, so the lesson is certain rather
    // than left to the weather's humour.
    damaged: [{ name: 'Fore topsail', kind: 'split sail' }],

    plan: [{ bearing: 225, miles: 16, said: 'the mark', near: 1.5 }],

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre', 'mend']
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
// choice made in the shipping office is remembered across a reload and
// nothing has to be taken apart and built again while she is afloat.
const keyed = () => VOYAGES.find((v) => v.key === (location.hash || '').replace('#', ''));

export const chosen = () => keyed() || VOYAGES[0];
export const picked = () => !!keyed();      // false means the office, not a voyage

export function choose(key) {
  location.hash = key;
  location.reload();
}

// Which voyages you have sailed through to the end. One small entry in the
// browser's own store: no account, no login, and nothing else remembered,
// because a voyage is short enough to finish in a sitting. A browser that
// will not remember is no reason not to sail.
const LEDGER = 'whaler.sailed';

export function sailed() {
  try { return JSON.parse(localStorage.getItem(LEDGER)) || []; } catch (e) { return []; }
}

export function logSailed(key) {
  try {
    const done = sailed();
    if (!done.includes(key)) localStorage.setItem(LEDGER, JSON.stringify([...done, key]));
  } catch (e) { /* she sailed it all the same */ }
}
