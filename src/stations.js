// Where the hands go, for each piece of work.
//
// An order is not a number of men; it is a number of men in particular places.
// Reefing topsails puts most of the watch out on the yards and the rest on
// deck at the ropes that gather the sail up to them, and one man stays at the
// wheel throughout, because somebody has to steer.
//
// The split of each evolution into posts is inferred from the sequence of
// orders in Dana and in Lever. The totals match the manning figures in
// evolutions.js exactly. Posts marked aloft are worked in the rigging, which
// is where rating tells and where a man can fall.

export const POSTS = {
  'Take in the royals': [
    { at: 'the royal yards', n: 4, aloft: true }
  ],
  'Set the royals': [
    { at: 'the royal yards', n: 3, aloft: true },
    { at: 'the halyards', n: 1 }
  ],
  'Take in the topgallants': [
    { at: 'the topgallant yards', n: 4, aloft: true },
    { at: 'the clewlines and buntlines', n: 2 }
  ],
  'Set the topgallants': [
    { at: 'the topgallant yards', n: 3, aloft: true },
    { at: 'the halyards and sheets', n: 3 }
  ],

  'Furl the courses': [
    { at: 'the course yards', n: 6, aloft: true },
    { at: 'the clew garnets and buntlines', n: 2 }
  ],
  'Set the courses': [
    { at: 'the sheets', n: 4 },
    { at: 'the tacks and bowlines', n: 4 }
  ],

  'Single-reef the topsails': [
    { at: 'the topsail yards', n: 8, aloft: true },
    { at: 'the reef tackles and halyards', n: 5 },
    { at: 'the wheel', n: 1 }
  ],
  'Second reef the topsails': [
    { at: 'the topsail yards', n: 8, aloft: true },
    { at: 'the reef tackles and halyards', n: 5 },
    { at: 'the wheel', n: 1 }
  ],
  'Close-reef the topsails': [
    { at: 'the topsail yards', n: 9, aloft: true },
    { at: 'the reef tackles and halyards', n: 6 },
    { at: 'the wheel', n: 1 }
  ],
  'Furl the topsails': [
    { at: 'the topsail yards', n: 9, aloft: true },
    { at: 'the clewlines and buntlines', n: 4 },
    { at: 'the wheel', n: 1 }
  ],
  'Set the topsails': [
    { at: 'the topsail yards', n: 5, aloft: true },
    { at: 'the halyards', n: 6 },
    { at: 'the wheel', n: 1 }
  ],
  'Shake out a reef': [
    { at: 'the topsail yards', n: 6, aloft: true },
    { at: 'the halyards', n: 3 },
    { at: 'the wheel', n: 1 }
  ],

  'Brail in the spanker': [
    { at: 'the brails', n: 4 },
    { at: 'the sheet', n: 2 }
  ],
  'Set the spanker': [
    { at: 'the outhaul', n: 4 },
    { at: 'the sheet', n: 2 }
  ],
  'Reef the spanker': [
    { at: 'the boom', n: 5 },
    { at: 'the peak and throat halyards', n: 3 }
  ],
  'Shake out the spanker': [
    { at: 'the halyards', n: 6 }
  ],

  'Haul down the jibs': [
    { at: 'the jibboom', n: 2, aloft: true },
    { at: 'the downhauls', n: 2 }
  ],
  'Set the jibs': [
    { at: 'the halyards', n: 2 },
    { at: 'the sheets', n: 2 }
  ],

  'Tack ship': [
    { at: 'the head sheets', n: 4 },
    { at: 'the main and crossjack braces', n: 6 },
    { at: 'the fore braces', n: 4 },
    { at: 'the spanker', n: 1 },
    { at: 'the wheel', n: 1 }
  ],
  'Wear ship': [
    { at: 'the braces', n: 6 },
    { at: 'the spanker and head sheets', n: 4 },
    { at: 'the after braces', n: 1 },
    { at: 'the wheel', n: 1 }
  ],

  'Bend a new sail': [
    { at: 'the yard', n: 4, aloft: true },
    { at: 'the whip on deck', n: 4 }
  ],
  'Fish the yard': [
    { at: 'the yard', n: 3, aloft: true },
    { at: 'sending up the spar', n: 3 }
  ],
  'Send up a new topmast': [
    { at: 'the topmast head', n: 5, aloft: true },
    { at: 'the top rope', n: 6 },
    { at: 'the wheel', n: 1 }
  ]
};

// A green hand out on a yard is slow, and in a gale he is in danger. A
// boatsteerer is the best man she has. These weights multiply the time.
const ALOFT = {
  boatsteerer: 0.85, 'able seaman': 0.92, 'ordinary seaman': 1.06,
  'green hand': 1.35, tradesman: 1.15, mate: 1.00
};
const HAULING = { strong: 0.94, middling: 1.00, weak: 1.08 };

// Who to send up first. An officer directs from the deck; he does not lay out
// on a yard, and the tradesmen go up last of anybody.
const ALOFT_ORDER = ['boatsteerer', 'able seaman', 'ordinary seaman', 'green hand', 'tradesman', 'mate'];
const DECK_ORDER = ['mate', 'boatsteerer', 'able seaman', 'ordinary seaman', 'tradesman', 'green hand'];

export const postsFor = (name) => POSTS[name] || null;

// The men are chosen post by post, the best for the work first. Returns what
// was manned and how much longer or shorter the work will take for it.
export function manThePosts(name, pool) {
  const posts = POSTS[name];
  if (!posts) return null;

  const left = [...pool];
  const manned = [];
  let weight = 0, count = 0;

  const STRONGER = { strong: 0, middling: 1, weak: 2 };

  for (const post of posts) {
    // Aloft, seamanship decides who goes. On deck, hauling on a rope, it is
    // mostly a question of weight and muscle.
    left.sort((a, b) => post.aloft
      ? ALOFT_ORDER.indexOf(a.rate) - ALOFT_ORDER.indexOf(b.rate)
      : (STRONGER[a.strength] - STRONGER[b.strength]) ||
        (DECK_ORDER.indexOf(a.rate) - DECK_ORDER.indexOf(b.rate)));
    const took = left.splice(0, post.n);
    for (const m of took) {
      weight += post.aloft ? (ALOFT[m.rate] || 1) : (HAULING[m.strength] || 1);
      count++;
    }
    manned.push({ at: post.at, aloft: !!post.aloft, men: took });
  }

  return { manned, factor: count ? weight / count : 1 };
}
