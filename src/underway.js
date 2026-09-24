// The first voyage: getting under way, from nothing.
//
// A crew fresh aboard, nobody yet on the station bill, and the ship riding to
// her anchor in the outer harbour. The mate shows you her papers, you give the
// men their stations, and then the three things that get any square-rigger to
// sea: heave up the anchor, loose the topsails, and give her a course.
//
// She lies tide-rode -- held by the ebb with her head across the wind rather
// than into it -- which is the kindest way there is to get a ship under way,
// since her topsails fill the moment they are sheeted home instead of lying
// aback. The bill is the bare bones: topmen, waisters and a helmsman. The
// afterguard and the rest of her canvas come in the voyages after.

const OK = { said: 'I see it', key: 'PilotOn' };
const HELM = [
  { said: '◀ Helm a-larboard', hold: 'ArrowLeft' },
  { said: 'Helm a-starboard ▶', hold: 'ArrowRight' }
];
const CLOCK = { said: 'Run her clock on', key: 'Equal' };
const ABOVE = { said: 'Look down on her (v)', key: 'v' };

export const UNDERWAY = {
  key: 'underway',
  n: 1,
  title: 'Getting under way',
  teaches: 'Her papers, her station bill, and how a ship leaves her anchorage.',

  letter: [
    'New Bedford, the third day of October, 1841.',
    'Sir — your people came aboard yesterday, and not one of them yet knows ' +
    'his place in her. She lies to her anchor in the outer harbour with every ' +
    'sail furled.',
    'Draw up her station bill, heave up, and take her out to the offing, five ' +
    'miles to the south. Your first mate will show you every part of it.',
    'We are, sir, your obedient servants.'
  ],

  canvas: { course: 'furled', topsail: 'furled', topgallant: 'furled', royal: 'furled',
            spanker: 'furled', headsail: 'furled' },
  anchored: true,
  unstationed: true,
  byBill: true,
  allHands: true,

  task: 'Draw up the station bill, weigh anchor, and take her out to the offing.',
  wind: { from: 315, force: 2.6 },
  heading: 200,         // tide-rode, two points off the course she will steer
  swing: 0.3,
  fair: true,
  ground: false,
  wellSailed: 0.85,
  plan: [{ bearing: 180, miles: 5, said: 'the offing', near: 0.8 }],
  allow: ['sail', 'helm', 'clock', 'look', 'anchor'],

  steps: [
    {
      say: 'Good morning, sir. Her papers first. Top left is the canvas board: every ' +
           'sail she owns, lowest at the bottom, in three columns for her three ' +
           'masts — fore, main and mizzen. Each little drawing shows how that sail ' +
           'stands. Every one of them is furled: rolled up on its yard and made fast.',
      board: 'canvas-board',
      how: () => 'Nothing is set. She could not move if she wanted to.',
      acts: [OK], done: (s) => s.acked,
      well: 'That board tells you what she is wearing at a glance.'
    },
    {
      say: 'Top right, her clock. Time at sea is kept in watches of four hours, and ' +
           'struck in bells — one more every half hour. Under it, the wind: where it ' +
           'comes from and how hard it blows, in words, never numbers. The red ' +
           'pennant at her main masthead streams away from the wind, and so does the ' +
           'blue arrow on the compass.',
      board: 'clock-board', vane: true,
      how: (s) => `The wind is out of the ${s.windSaid}.`,
      acts: [OK], done: (s) => s.acked,
      well: 'The wind is abaft her beam — from behind her side. A square-rigger ' +
            'likes nothing better.'
    },
    {
      say: 'Bottom left, the orders board: every piece of work in hand, the men at ' +
           'it by name, and how long it has to run. Under it, how many hands are ' +
           'free. Every man is on deck this morning: getting under way is always ' +
           'all hands.',
      board: 'orders-board',
      how: (s) => `${s.free} hands free, and no work in hand.`,
      acts: [OK], done: (s) => s.acked,
      well: 'When you give an order, that is where you watch it being done.'
    },
    {
      say: 'Along the bottom, the command bar. Every order you can give is a button ' +
           'there, with its key in the corner, so the buttons will teach you the ' +
           'keys if you let them. Shortening sail on the top row, making sail on ' +
           'the second, and the ship herself on the third.',
      board: 'command',
      acts: [OK], done: (s) => s.acked,
      well: 'You need not remember a single key.'
    },
    {
      say: 'Now the men. When a crew comes aboard the mates draw up the station ' +
           'bill, a sheet posted aft that gives every man his place for every piece ' +
           'of work. A man who is not on it does not know where to go when an order ' +
           'is given — and so nothing is done. Open it.',
      acts: [{ said: 'Open the station bill', key: 'KeyS' }],
      done: (s) => s.billOpen,
      well: 'There is her bill, and it is empty. Every hand in the list is waiting ' +
            'to be told.'
    },
    {
      say: 'Topmen first. They go aloft — up the rigging and out along the yards — ' +
           'to loose the sails, reef them and furl them. It wants the best seamen and ' +
           'the youngest: boatsteerers and able seamen are surest up there. A green ' +
           'hand is slow aloft, and in a blow he may fall. The Topmen row is picked; ' +
           'click six men in the list to put them on it.',
      bill: 'topman', board: 'station-bill',
      how: (s) => `${s.bill('topman')} of 6 topmen.`,
      done: (s) => s.bill('topman') >= 6,
      well: 'Six topmen. They will lay aloft when there is canvas to loose.'
    },
    {
      say: 'Now the waisters, who work in the waist — the middle of her deck. They ' +
           'man the windlass to heave up the anchor, and tail on to the halyards ' +
           'that hoist the yards. Hauling wants weight more than seamanship, so this ' +
           'is where the strong men and the green hands went. Put six on the bill.',
      bill: 'waister', board: 'station-bill',
      how: (s) => `${s.bill('waister')} of 6 waisters.`,
      done: (s) => s.bill('waister') >= 6,
      well: 'Six waisters.'
    },
    {
      say: 'Last, somebody must steer. A man stood a trick of two hours at the ' +
           'wheel, and it wanted an older, steady hand who would not let her wander. ' +
           'Put one man at the wheel. The afterguard can wait: they tend the braces, ' +
           'and today the mate will trim her yards himself.',
      bill: 'helmsman', board: 'station-bill',
      how: (s) => `${s.bill('helmsman')} of 1 at the wheel.`,
      done: (s) => s.bill('helmsman') >= 1,
      well: 'That is the bare bones of a bill: men enough to get her to sea.'
    },
    {
      say: 'Heave up the anchor. Your waisters go forward to the windlass and work ' +
           'its bars up and down like a pump, bringing the cable in a link at a ' +
           'time — a quarter of an hour of hard work. Look down on her from above ' +
           'and you can watch them at it.',
      shutBill: true, board: 'orders-board',
      acts: [{ said: 'Weigh anchor', key: 'KeyU' }, ABOVE],
      done: (s) => s.inHand('anchor') || !s.anchored,
      well: 'They are at the windlass. The orders board has them by name.'
    },
    {
      say: 'While they heave, loose the topsails — the second tier up, and the sails ' +
           'that do most of her work. The topmen lay aloft and cast off the gaskets ' +
           'that hold each sail furled; the halyards then hoist the yard and spread ' +
           'it. But your halyards are manned by the waisters, and they are at the ' +
           'windlass — so this order will wait until they are free. Men, not orders, ' +
           'are what a ship runs short of.',
      mark: { tier: 'topsail' }, board: 'canvas-board',
      acts: [{ said: 'Set the topsails', key: 'Digit2', shift: true }],
      done: (s) => s.inHand('topsail') || s.stateOf('topsail') !== 'furled',
      well: 'The order is given. Watch it wait in the orders board, and then go.'
    },
    {
      say: 'Now let them work. You may run her clock on, and she comes back to her ' +
           'own time the moment you touch the helm. Once the anchor is up she is free ' +
           'of the ground; once the topsails are set she has something to move her.',
      board: 'orders-board',
      how: (s) => `${s.anchored ? 'The anchor is still down' : 'The anchor is aweigh'}, ` +
                  `and the topsails are ${s.stateOf('topsail')}.`,
      acts: [CLOCK, ABOVE],
      done: (s) => !s.anchored && s.stateOf('topsail') !== 'furled' && !s.inHand('topsail'),
      well: 'Anchor aweigh, and canvas on her.'
    },
    {
      say: 'She has way on her now, and so she answers her helm. The offing — open ' +
           'water — lies to the south. Your man at the wheel does the steering; you ' +
           'tell him which way. Hold the helm over until the needle closes.',
      board: 'voyage-board', gauge: 8,
      how: (s) => `${s.headSaid}. She is making ${s.knots.toFixed(1)} knots.`,
      acts: HELM,
      done: (s) => Math.abs(s.offMark) < 8 && s.knots > 0.5,
      well: 'Her head is on the offing.'
    },
    {
      say: 'She was furled in harbour with her reefs tied in, as a careful mate leaves ' +
           'her. A reef is a band of the sail tied up to the yard to make it smaller. ' +
           'Shake them out one at a time: the topmen lay aloft to cast off the reef ' +
           'points, and the waisters hoist the yard a little higher each time. Keep ' +
           'her head on the offing while they work.',
      mark: { tier: 'topsail' }, board: 'canvas-board', gauge: 10,
      how: (s) => `The topsails are ${s.stateOf('topsail')}. She is making ` +
                  `${s.knots.toFixed(1)} knots.`,
      acts: [{ said: 'Shake out a reef', key: 'Digit2', shift: true }, ...HELM],
      done: (s) => s.stateOf('topsail') === 'set',
      well: 'Full topsails. That is her working canvas.'
    },
    {
      say: 'Run her out to the offing. The next voyage gives you her courses, her ' +
           'topgallants and her royals — and the rest of her company to go with them.',
      board: 'voyage-board', gauge: 10,
      how: (s) => `${s.toRun.toFixed(1)} miles to run. ${s.headSaid}.`,
      acts: [...HELM, CLOCK],
      done: (s) => s.leg > 0,
      well: 'She is at sea, sir. That is getting under way.'
    }
  ]
};
