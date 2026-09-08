// The dictionary of sea terms.
//
// Every word here appears somewhere on the boards. Hovering it gives the
// meaning, and where there is something on the ship to point at, that part
// lights up.
//
// The definitions are written in plain modern English, in my own words. They
// follow the standard meanings a reader will find in Richard Henry Dana Jr.,
// The Seaman's Friend (1841), and in Falconer's Universal Dictionary of the
// Marine (1769). Nothing here is quoted from either. There are no page
// citations and no wording attributed to Dana, because none of it can be
// verified from inside this file, and the spec forbids inventing citations.
//
// Terms marked // check are the ones worth a second look against the sources.
//
// A term may name a `part` of the ship to light: a tier of sails, the yards,
// the masts, or one side of her. Or it may name a `board`, which flashes the
// panel being spoken of.

export const TERMS = {
  // --- the sails, from the deck up ------------------------------------------

  'course': {
    say: 'The lowest and largest square sail on a mast. The foresail and the ' +
         'mainsail are her courses; the mizzen carries none.',
    part: { tier: 'course' }
  },
  'topsail': {
    say: 'The sail above the course. The most useful sail she has, and the ' +
         'only one she reefs, so she keeps her topsails longest in a blow.',
    part: { tier: 'topsail' }
  },
  'topgallant': {
    say: 'The sail above the topsail, said "t\'gallant". Light weather canvas: ' +
         'the second thing to come off her as the wind gets up.',
    part: { tier: 'topgallant' }
  },
  'royal': {
    say: 'The highest sail she sets, above the topgallant. The first canvas to ' +
         'come in when it freshens, being small, high, and full of leverage.',
    part: { tier: 'royal' }
  },
  'spanker': {
    say: 'The fore-and-aft sail abaft the mizzen mast, on a gaff above and a ' +
         'boom below. It helps her steer and holds her head up to the wind.',
    part: { tier: 'spanker' }
  },
  'headsail': {
    say: 'The triangular sails forward, hung on the stays that run down to the ' +
         'bowsprit. Hers are the fore topmast staysail, the jib and the flying jib.',
    part: { tier: 'headsail' }
  },
  'jib': {
    say: 'A triangular headsail set on a stay forward of the foremast. She ' +
         'carries a jib and, outside it, a flying jib.',
    part: { tier: 'headsail' }
  },
  'staysail': {
    say: 'A triangular sail set on one of the stays that hold the masts up.',
    part: { tier: 'headsail' }
  },

  // --- spars and masts -------------------------------------------------------

  'yard': {
    say: 'A spar crossing a mast horizontally, from which a square sail hangs. ' +
         'Horizontal spars are yards; the upright ones are masts.',
    part: { yards: true }
  },
  'yardarm': {
    say: 'Either end of a yard, beyond the sail. Where a man works who has laid ' +
         'out along the yard.',
    part: { yards: true }
  },
  'mast': {
    say: 'An upright spar. She is ship-rigged: three masts, square-rigged on ' +
         'all three. From forward, the fore, the main and the mizzen.',
    part: { masts: true }
  },
  'foremast': { say: 'The forward mast of the three.', part: { mast: 'fore' } },
  'mainmast': { say: 'The middle mast, and the tallest.', part: { mast: 'main' } },
  'mizzen': {
    say: 'The aftermost mast, and the smallest. She carries the spanker ' +
         'behind it.',
    part: { mast: 'mizzen' }
  },
  'topmast': {
    say: 'The second length of a mast, set above the lower mast and overlapping ' +
         'it. Above that again comes the topgallant mast.',
    part: { masts: true }
  },
  'bowsprit': {
    say: 'The spar running forward from her bows, to which the headsail stays ' +
         'are set up.',
    part: { rigging: 'stays' }
  },

  // --- the standing rigging --------------------------------------------------

  'standing rigging': {
    say: 'All the cordage that holds the masts up and never moves: shrouds, ' +
         'stays and backstays. The ropes that work the sails are the running rigging.',
    part: { rigging: 'all' }
  },
  'shroud': {
    say: 'One of the ropes running from a masthead down to the side of the ' +
         'ship, holding the mast against falling sideways. They are crossed by ' +
         'ratlines to make a ladder aloft.',
    part: { rigging: 'shrouds' }
  },
  'ratline': {
    say: 'A light line seized across the shrouds, about fifteen inches above ' +
         'the last, so that the shrouds become a ladder. Said "ratlin".',
    part: { rigging: 'ratlines' }
  },
  'stay': {
    say: 'A heavy rope leading forward and down from a masthead, holding the ' +
         'mast against falling aft. The headsails are set on the fore stays.',
    part: { rigging: 'stays' }
  },
  'forestay': {
    say: 'The stay leading from the foremast head down to her stem.',
    part: { rigging: 'stays' }
  },
  'backstay': {
    say: 'A rope from an upper masthead down and aft to her side, holding the ' +
         'topmast and topgallant mast against falling forward.',
    part: { rigging: 'backstays' }
  },
  'futtock shrouds': {
    say: 'The short shrouds slanting from the rim of the top down and inward ' +
         'to the lower mast. A man going aloft climbs them leaning backwards, ' +
         'which is the part that frightens green hands.',
    part: { rigging: 'shrouds' }
  },
  'top': {
    say: 'The platform at the lower masthead, where the topmast rigging is ' +
         'set up and a man can stand.'
  },
  'crosstrees': {
    say: 'The light frame at the topmast head, above the top, spreading the ' +
         'topgallant rigging.'
  },
  'channel': {
    say: 'A ledge bolted outside her rail, spreading the shrouds clear of it ' +
         'so they get a wider hold on the mast.',
    part: { rigging: 'shrouds' }
  },
  'aloft': { say: 'Up in the masts and rigging, as opposed to on deck.' },
  'lay aloft': { say: 'The order to go up the rigging.' },
  'gaff': {
    say: 'The spar along the head of the spanker, angled up from the mast.',
    part: { tier: 'spanker' }
  },
  'boom': {
    say: 'The spar along the foot of the spanker, swinging out over the stern.',
    part: { tier: 'spanker' }
  },

  // --- what state a sail is in ----------------------------------------------

  'set': { say: 'Spread to the wind and drawing. A sail is set, never opened.' },
  'reef': {
    say: 'To reduce a sail by gathering part of it in and tying it down, rather ' +
         'than taking the whole sail off her. Only the topsails and the spanker reef.',
    part: { tier: 'topsail' }
  },
  'reefed': {
    say: 'Reduced by a reef. Her topsails go set, first reef, second reef, ' +
         'close-reefed, furled.',
    part: { tier: 'topsail' }
  },
  '1st reef': {
    say: 'One reef taken in: the first and largest step down from a full topsail.',
    part: { tier: 'topsail' }
  },
  '2nd reef': {
    say: 'Two reefs taken in. Roughly half the topsail is gone.',
    part: { tier: 'topsail' }
  },
  'close-reefed': {
    say: 'Every reef taken in, and the smallest a sail can be made without ' +
         'furling it altogether. What she shows in a whole gale.',
    part: { tier: 'topsail' }
  },
  'shake out': { say: 'To let a reef out again and give the sail back its area.' },
  'furled': {
    say: 'Rolled up on the yard and tied there. The sail is off her, but ready ' +
         'to be set again.'
  },
  'furl': { say: 'To roll a sail up on its yard and secure it there.' },
  'take in': { say: 'To get a sail off her, as opposed to reefing it.' },
  'brail in': {
    say: 'To haul the spanker in to the mast by its brails, gathering it up ' +
         'without lowering it.',
    part: { tier: 'spanker' }
  },
  'haul down': {
    say: 'To bring a headsail down its stay. Headsails are hauled down, not ' +
         'reefed or furled.',
    part: { tier: 'headsail' }
  },
  'make sail': { say: 'To set more canvas than she is carrying.' },
  'shorten sail': { say: 'To take canvas off her. Always from the top down.' },
  'plain sail': {
    say: 'Her ordinary working canvas, courses to royals, with nothing extra ' +
         'set for light weather.'
  },
  'canvas': { say: 'The sail she is carrying, taken all together.' },

  // --- the crew and their work ----------------------------------------------

  'hands': {
    say: 'The men. She ships thirty, and an order needs a stated number of them ' +
         'before it can begin.'
  },
  'watch': {
    say: 'Half the crew, and the four hours they keep the deck. Starboard and ' +
         'larboard watches relieve each other, so about fifteen hands are up at once.'
  },
  'all hands': {
    say: 'Both watches on deck at once — thirty men instead of fifteen. It gets ' +
         'the work done in half the time and wears the crew out.'
  },
  'watch bill': {
    say: 'The list dividing the company into two watches, and setting down what ' +
         'each man is rated and where he goes when the hands are called.'
  },
  'mate': {
    say: 'One of her three officers under you. The first mate runs the deck and ' +
         'the crew; each mate also heads a whaleboat when she is on the ground.'
  },
  'boatsteerer': {
    say: 'The harpooner. Rated the best seaman aboard, berthed apart from the ' +
         'foremast hands, and the man who darts the iron and then changes ends ' +
         'with the mate to steer while he lances.'
  },
  'able seaman': {
    say: 'A trained sailor who can hand, reef and steer, and be trusted on a ' +
         'yard in a blow. Three or four years at sea makes one.'
  },
  'ordinary seaman': {
    say: 'A sailor with a year or two in him. He knows the ropes but is not yet ' +
         'trusted with the worst of the work aloft.'
  },
  'green hand': {
    say: 'A man who has never been to sea. A whaleship shipped a great many of ' +
         'them, and half the voyage was spent making sailors out of them.'
  },
  'foremast hand': {
    say: 'A common sailor, berthed in the forecastle forward. The bulk of the crew.'
  },
  'tradesman': {
    say: 'The cooper, carpenter, cook and steward. They work at their trades by ' +
         'day rather than keeping the deck, but turn out with the rest when all ' +
         'hands are called.'
  },
  'cooper': {
    say: 'He makes and mends the casks the oil is stowed in. On a whaler he is ' +
         'as necessary as the mate, since a leaking cask is a lost whale.'
  },
  'carpenter': {
    say: 'He fishes a sprung spar, plugs a shot boat and keeps her tight. Often ' +
         'the cooper doubles the office.'
  },
  'steward': { say: 'He keeps the cabin and serves the master and mates.' },
  'topman': {
    say: 'A hand stationed aloft when the watch is called to work ship. The ' +
         'young and active go up; the work on the yards is theirs.'
  },
  'afterguard': {
    say: 'The hands stationed aft on deck, at the braces and the wheel. Older ' +
         'and steadier men, and no climbing.'
  },
  'waister': {
    say: 'A hand stationed in the waist, amidships, to haul on whatever wants ' +
         'hauling. Where the green hands go until they are worth more.'
  },
  'middle watch': { say: 'Midnight to four in the morning.' },
  'morning watch': { say: 'Four to eight in the morning.' },
  'forenoon watch': { say: 'Eight to noon.' },
  'afternoon watch': { say: 'Noon to four.' },
  'first dog watch': {
    say: 'Four to six in the evening. The evening watch is split in two so the ' +
         'same men do not keep the same hours every night.'
  },
  'last dog watch': { say: 'Six to eight in the evening, the second short watch.' },
  'first watch': { say: 'Eight at night to midnight.' },
  'bell': {
    say: 'Time is struck in bells, one for each half hour of a watch, up to ' +
         'eight. Eight bells ends the watch.'
  },
  'bells': {
    say: 'Time is struck in bells, one for each half hour of a watch, up to ' +
         'eight. Eight bells ends the watch.'
  },

  // --- steering and points of sail ------------------------------------------

  'larboard': {
    say: 'Her left side, looking forward. The word for it in 1841; the Royal ' +
         'Navy did not order "port" in its place until 1844.',
    part: { side: -1 }
  },
  'starboard': { say: 'Her right side, looking forward.', part: { side: 1 } },
  'windward': { say: 'The side the wind comes from, and the direction it comes from.' },
  'to weather': { say: 'To windward: up toward where the wind is coming from.' },
  'leeward': {
    say: 'The side away from the wind, and the direction it blows toward. ' +
         'Said "loo-ard".'
  },
  'helm': { say: 'The tiller or wheel, and the act of steering by it.' },
  'point': {
    say: 'A thirty-second part of the compass, eleven and a quarter degrees. ' +
         'She cannot sail closer than six points to the wind.'
  },
  'points': {
    say: 'Thirty-seconds of the compass, eleven and a quarter degrees each. ' +
         'Six points is the closest a square-rigged ship will lie to the wind.'
  },
  'point of sail': { say: 'Her angle to the wind, and what she can do at it.' },
  'in irons': {
    say: 'Head to the wind with no way on her and the sails aback. She cannot ' +
         'steer, and must be worn round to get out of it.'
  },
  'close-hauled': {
    say: 'As near the wind as she will lie, six points off it, with the yards ' +
         'braced sharp up. Slow, wet, and the only way to make ground to windward.'
  },
  'close reach': { say: 'The wind forward of the beam, but not so far forward as close-hauled.' },
  'beam reach': { say: 'The wind square on her side. Fast and comfortable.' },
  'broad reach': {
    say: 'The wind abaft the beam but not astern. The best point of sail for a ' +
         'square-rigged ship.'
  },
  'running': {
    say: 'The wind astern, or nearly so. Not her fastest point, and she rolls badly.'
  },
  'leeway': {
    say: 'The distance she is pushed sideways to leeward instead of forward. ' +
         'Worst when close-hauled.'
  },
  'tack': {
    say: 'To turn her head through the wind onto the other side. Quick, but a ' +
         'square-rigger may fail to come round and be caught in irons.'
  },
  'wear': {
    say: 'To turn her the other way, stern through the wind. Slower, and it ' +
         'costs ground to leeward, but it never fails.'
  },
  'miss stays': { say: 'To fail to come round when tacking, and fall back in irons.' },
  'hove to': {
    say: 'Stopped, with her canvas set against itself so she lies quiet. Here, ' +
         'the game is paused.'
  },
  'knot': { say: 'One nautical mile in an hour. Her best is about nine.' },
  'knots': { say: 'Nautical miles in an hour. Her best is about nine.' },
  'bearing': { say: 'The compass direction of a place from where she now is.', board: 'track-board' },
  'made good': {
    say: 'The distance actually gained toward the destination, which is always ' +
         'less than the distance sailed through the water.',
    board: 'track-board'
  },

  // --- weather ---------------------------------------------------------------

  'calm': { say: 'No wind at all. She has no steerage way and will not answer her helm.' },
  'light airs': { say: 'The least wind that will move her. All plain sail, and slow.' },
  'light breeze': { say: 'Still light. She carries everything she has.' },
  'moderate breeze': { say: 'Her best sailing weather. All plain sail, and she goes well.' },
  'fresh breeze': { say: 'Getting up. Time the royals came in.' },
  'strong breeze': { say: 'Topgallants in. She is working now.' },
  'fresh gale': { say: 'Topsails single-reefed and the courses in.' },
  'strong gale': { say: 'Topsails double-reefed. Hard work aloft, and dangerous.' },
  'whole gale': { say: 'Close-reefed main topsail and nothing else. She is surviving, not sailing.' },
  'storm': { say: 'Storm staysails, or run before it and hope. The worst she will meet.' },
  'squall': {
    say: 'A sudden hard blow, seen first as a dark line on the horizon. It ' +
         'jumps the wind two or three forces for ten to thirty minutes, often ' +
         'with a shift, and you never have time to get all your canvas off.'
  },

  // --- damage ----------------------------------------------------------------

  'split sail': { say: 'A sail blown out of its bolt-ropes. That sail is gone until it can be replaced.' },
  'sprung yard': { say: 'A yard cracked under the strain. The sail on it cannot be used.' },
  'sprung topmast': {
    say: 'A topmast cracked. Everything above the lower masthead on that mast ' +
         'is lost with it.'
  },
  'broach': {
    say: 'Thrown broadside to the sea against her helm, with the sea breaking ' +
         'over her. The worst that can happen short of foundering.'
  }
};
