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

// Where she sails from. Every voyage in this file begins off New Bedford,
// because that is where she was built and where her owners were, and the
// chart puts her on the real sea from it.
export const NEW_BEDFORD = { lat: 41.63, lon: -70.93, said: 'New Bedford' };

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
      'Sir — you have the feel of her now. Today you learn what it costs to go ' +
      'where the wind comes from. The mark lies six miles to the north-west, ' +
      'and so does the wind.',
      'Coming home you will have it behind you, and you may judge the ' +
      'difference for yourself. Your mate will show you the way of it.',
      'We are, sir, your obedient servants.'
    ],

    task: 'Beat six miles up to the mark to the north-west, and run home again.',

    wind: { from: 315, force: 3.5 },
    // Well off the wind to begin with, so that coming up to close-hauled is
    // something the master does rather than something already done for him.
    heading: 200,
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

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre'],

    steps: [
      {
        say: 'The mark bears north-west. So does the wind — look at the pennant. ' +
             'She cannot be steered at it, because no square-rigged ship will lie ' +
             'closer than six points to the wind, and six points is a long way off.',
        vane: true, board: 'clock-board',
        how: (s) => `The wind is out of the ${s.windSaid}, and the mark bears ${s.bearSaid}.`,
        acts: [{ said: 'I see it', key: 'PilotOn' }],
        done: (s) => s.acked,
        well: 'So we cannot go straight there. We go at it sideways instead.'
      },
      {
        say: 'Bring her as near the wind as she will lie. Put your helm over ' +
             'little by little, and stop the moment the board says close-hauled — ' +
             'go a hair further and she is taken aback and stops dead.',
        board: 'clock-board',
        how: (s) => (s.offWind < 67
          ? 'Too near — she is taken aback. Bear away.'
          : `${Math.round(s.offWind)}° off the wind. She wants sixty-seven.`),
        acts: [
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' }
        ],
        done: (s) => s.offWind >= 67 && s.offWind <= 82,
        well: 'Close-hauled. That is as near as she lies, and no ship of her rig does better.'
      },
      {
        say: 'Now stand on and watch the two bottom figures on your orders ' +
             'board. Sailed is how far she has gone through the water. Made ' +
             'good is how far that has carried you toward the mark. They are ' +
             'about to part company.',
        board: 'voyage-board',
        how: (s) => `Sailed ${s.sailed.toFixed(1)} miles. ${s.toRun.toFixed(1)} still to run.`,
        acts: [{ said: 'Run her clock on', key: 'Equal' }],
        done: (s) => s.sailed > 1.6,
        well: 'A little over half a mile made good in every mile sailed. That is what windward costs.'
      },
      {
        say: 'You have stood far enough on this board. Put her about — call all ' +
             'hands first, because a watch of thirteen cannot bring a ship of ' +
             'this burthen round. Tacking carries her head through the wind and ' +
             'is quick, but below four knots she may miss stays and hang there.',
        board: 'orders-board',
        how: (s) => (s.allHands
          ? `All hands on deck. She is making ${s.knots.toFixed(1)} knots — ${s.knots >= 4 ? 'fast enough to stay' : 'too slow to trust her; wear instead'}.`
          : 'The watch below is still below. Call all hands.'),
        acts: [
          { said: 'Call all hands', key: 'KeyH' },
          { said: 'Tack her', key: 'KeyT' },
          { said: 'Wear her round', key: 'KeyW' }
        ],
        done: (s) => s.windSide < 0 && s.offWind < 95,
        well: 'She is round and standing on the other board. That is a leg of the staircase.'
      },
      {
        say: 'Now do it again, and again, until the mark is under her bow. Stand ' +
             'as close as she lies on each board, and put her about when you have ' +
             'run far enough. The mate will not hold your hand for this part.',
        board: 'voyage-board',
        how: (s) => `${s.toRun.toFixed(1)} miles to the mark, and ${s.sailed.toFixed(1)} sailed to get this far.`,
        acts: [
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: 'Call all hands', key: 'KeyH' },
          { said: 'Tack her', key: 'KeyT' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.leg > 0,
        well: 'The mark is fetched, and it cost you nearly twice the miles.'
      },
      {
        say: 'Home lies south-east, and the wind is behind you the whole way. ' +
             'Put her before it and see how different the same six miles are.',
        board: 'voyage-board', gauge: 12,
        how: (s) => `Home bears ${s.bearSaid}. She is making ${s.knots.toFixed(1)} knots.`,
        acts: [
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.toRun < 2.5,
        well: 'Read the account when she is in. The same six miles, and not the same at all.'
      }
    ]
  },

  {
    key: 'shorten',
    n: 3,
    title: 'Shortening down',
    teaches: 'What she may carry at each force, and how little warning a squall gives.',

    letter: [
      'New Bedford, the nineteenth day of October, 1841.',
      'Sir — a fresh breeze this morning and the glass falling. You have the ' +
      'last of it to learn before we send you round the Horn: what she may ' +
      'carry, and what it costs to carry more.',
      'She lies under all plain sail, which is already more than this wind will ' +
      'bear. Run fourteen miles south to the mark and bring her there with ' +
      'every sail whole. Your mate has been through a good many squalls.',
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

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre'],

    steps: [
      {
        say: 'Before anything else: she is carrying more canvas than this wind ' +
             'will bear, and the orders board has been telling you so since you ' +
             'sailed. Get her royals off her — the topmost sails, the first to ' +
             'come in and the last to go out.',
        mark: { tier: 'royal' }, board: 'orders-board',
        how: (s) => `A ${s.forceSaid.toLowerCase()}, and she is over-pressed.`,
        acts: [{ said: 'Take in the royals', key: 'Digit4' }],
        done: (s) => s.stateOf('royal') === 'furled',
        well: 'Royals in, and the board has stopped complaining.'
      },
      {
        say: 'The glass is falling and it will freshen. Take the topgallants in ' +
             'too, before you need to. Canvas comes off her from the top down and ' +
             'never out of that order — royals, topgallants, then a reef in the ' +
             'topsails, then the courses.',
        mark: { tier: 'topgallant' }, board: 'canvas-board',
        how: (s) => `${s.forceSaid}. She is making ${s.knots.toFixed(1)} knots.`,
        acts: [{ said: 'Take in the topgallants', key: 'Digit3' }],
        done: (s) => s.stateOf('topgallant') === 'furled',
        well: 'Snug enough for what she has now. Keep your eye to windward.'
      },
      {
        say: 'Watch the horizon on your weather side. A squall shows as a dark ' +
             'line before it reaches you, and the compass will say how far off ' +
             'it is. Run her clock on and wait for it.',
        board: 'rose',
        how: (s) => (s.squall
          ? `A squall, ${Math.max(1, Math.round(s.squall.minutes))} minutes off.`
          : 'Nothing in sight yet.'),
        acts: [{ said: 'Run her clock on', key: 'Equal' }],
        done: (s) => !!s.squall,
        well: 'There it is. Now you have minutes, not hours, and a choice to make.'
      },
      {
        say: 'Reefing her topsails takes twelve minutes and all hands. You have ' +
             'less warning than that, so you cannot get everything off her — you ' +
             'must choose. Call all hands and put a reef in the topsails now.',
        mark: { tier: 'topsail' }, board: 'orders-board',
        how: (s) => (s.squall && !s.squall.here
          ? `${Math.max(1, Math.round(s.squall.minutes))} minutes before it strikes.`
          : `${s.forceSaid}. ${s.allHands ? 'All hands on deck.' : 'Call all hands.'}`),
        acts: [
          { said: 'Call all hands', key: 'KeyH' },
          { said: 'Reef the topsails', key: 'Digit2' }
        ],
        done: (s) => s.stateOf('topsail') !== 'set',
        well: 'A reef in her. Now find out whether it was enough.'
      },
      {
        say: 'Ride it out and run her down to the mark. If the board says she is ' +
             'dangerously over-pressed, take more off her — a split sail or a ' +
             'sprung yard is what carrying too much costs, and there is no ' +
             'mending it on this voyage.',
        board: 'voyage-board', gauge: 12,
        how: (s) => (s.hurt
          ? `${s.hurt} thing${s.hurt > 1 ? 's have' : ' has'} carried away. ${s.toRun.toFixed(1)} miles to run.`
          : `Whole so far. ${s.toRun.toFixed(1)} miles to run.`),
        acts: [
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: 'Reef her further', key: 'Digit2' },
          { said: 'Furl the courses', key: 'Digit1' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.toRun < 2.5,
        well: 'The mark is under her bow, and the worst of it is behind you.'
      }
    ]
  },

  {
    key: 'watch',
    n: 4,
    title: 'Watch and watch',
    teaches: 'Why she is worked in two halves, and what it costs to keep them all on deck.',

    letter: [
      'New Bedford, the second day of November, 1841.',
      'Sir — a longer run today, and the lesson is your people rather than your ' +
      'canvas. There is weather about and you will want every hand more than ' +
      'once.',
      'Run thirty miles to the south-west, and bring your people in with ' +
      'something left in them.',
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

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre'],

    steps: [
      {
        say: 'A long run today, and the lesson is your people rather than your ' +
             'canvas. Press b and look at the bill: seven-and-twenty of them keep ' +
             'watches, half on deck and half below, four hours about. Look at ' +
             'their ages while you are there — most of them are boys.',
        board: 'orders-board',
        how: (s) => `The company is ${s.weariness}. ${s.knots.toFixed(1)} knots, ${s.toRun.toFixed(1)} miles to run.`,
        acts: [{ said: 'I have seen the bill', key: 'PilotOn' }],
        done: (s) => s.acked,
        well: 'Half of them are asleep. That is not idleness — it is how a ship lasts three years.'
      },
      {
        say: 'There is weather about, and you will want every hand more than ' +
             'once. Run her on until the first squall shows, then call all hands ' +
             'and get her canvas off her.',
        board: 'rose',
        how: (s) => (s.squall
          ? `A squall, ${Math.max(1, Math.round(s.squall.minutes))} minutes off. The company is ${s.weariness}.`
          : `Nothing in sight. The company is ${s.weariness}.`),
        acts: [
          { said: 'Run her clock on', key: 'Equal' },
          { said: 'Call all hands', key: 'KeyH' },
          { said: 'Shorten all round', key: 'KeyF' }
        ],
        done: (s) => s.allHands && !!s.squall,
        well: 'Every man aboard is on deck. Now they are awake, and they are tiring.'
      },
      {
        say: 'When it has blown through, send them below again. Men on deck are ' +
             'men not sleeping, and a tired crew is a slow one — the same reef ' +
             'that takes twelve minutes from a fresh watch takes half as long ' +
             'again from a spent one. Press the same key to let them go.',
        board: 'orders-board',
        how: (s) => `The company is ${s.weariness}${s.allHands ? ', and all of them on deck' : ', and the watch below is below'}.`,
        acts: [
          { said: 'Send the watch below', key: 'KeyH' },
          { said: 'Make sail again', key: 'KeyA' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => !s.allHands,
        well: 'Rested men. They will thank you at the third squall, and so will you.'
      },
      {
        say: 'Two more squalls before the mark. Call them up when you need them, ' +
             'send them below the moment you do not, and bring your people in ' +
             'with something left in them.',
        board: 'voyage-board', gauge: 14,
        how: (s) => `${s.toRun.toFixed(1)} miles to run. The company is ${s.weariness}.`,
        acts: [
          { said: 'Call all hands / send below', key: 'KeyH' },
          { said: 'Shorten all round', key: 'KeyF' },
          { said: 'Make sail all round', key: 'KeyA' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.toRun < 2.5,
        well: 'In, and your people still on their feet. That is the whole of it.'
      }
    ]
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
      'A ship that far from home mends herself or does without. Sixteen miles ' +
      'to the south-west, and bring her in whole.',
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

    allow: ['sail', 'helm', 'clock', 'look', 'allhands', 'manoeuvre', 'mend'],

    steps: [
      {
        say: 'She sailed hurt. Her fore topsail split from head to foot on ' +
             'Tuesday and nobody has bent a new one. Look at the canvas board — ' +
             'the sail is drawn torn, and the orders board names what is wrong ' +
             'with her.',
        mark: { tier: 'topsail' }, board: 'orders-board',
        how: (s) => (s.hurt
          ? `${s.hurt} thing${s.hurt > 1 ? 's' : ''} carried away, and she is the slower for it.`
          : 'Nothing wrong with her.'),
        acts: [{ said: 'I see it', key: 'PilotOn' }],
        done: (s) => s.acked,
        well: 'A ship three years from home mends herself or does without.'
      },
      {
        say: 'Look at your stores board first — spare canvas in bolts, spare ' +
             'spars on the skids, coils of cordage. That is everything she has, ' +
             'and when it is gone she does without it. A split sail costs one ' +
             'bolt of canvas.',
        board: 'stores-board',
        how: () => 'Five bolts, three spars, six coils. No more until she is home.',
        acts: [{ said: 'I have seen the locker', key: 'PilotOn' }],
        done: (s) => s.acked,
        well: 'Now spend one of them.'
      },
      {
        say: 'Set the hands to mend her. Eight of them will be three hours ' +
             'unbending the old sail and bending a new one out of the locker — ' +
             'this is a seaman’s job and wants no carpenter. Watch the canvas go ' +
             'from five bolts to four as they do it.',
        board: 'stores-board',
        how: (s) => (s.hurt ? 'Still torn. Set them on it.' : 'A new sail bent, and she has her canvas again.'),
        acts: [
          { said: 'Set the hands to mend', key: 'KeyM' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.hurt === 0,
        well: 'Whole again, and a bolt of canvas the poorer. That is the trade.'
      },
      {
        say: 'Now make all sail and run her in. She will go better than she did ' +
             'this morning, and you will feel the difference the mended sail ' +
             'makes.',
        board: 'voyage-board', gauge: 12,
        how: (s) => `${s.toRun.toFixed(1)} miles to run at ${s.knots.toFixed(1)} knots.`,
        acts: [
          { said: 'Make sail all round', key: 'KeyA' },
          { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
          { said: 'Helm a-starboard ▶', hold: 'ArrowRight' },
          { said: 'Run her clock on', key: 'Equal' }
        ],
        done: (s) => s.toRun < 2.5,
        well: 'In, and whole. That is the last of your five voyages — the ground is next.'
      }
    ]
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
