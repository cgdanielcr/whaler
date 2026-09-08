// What each order costs in hands and in minutes.
//
// The figures marked (Dana) come from the table in the spec, inferred from the
// procedures in Richard Henry Dana Jr., The Seaman's Friend (1841). The ones
// marked (inferred) fill gaps the table does not cover; the relative costs are
// what matter, and they can be tuned.

const TAKE_IN = {
  royal:      { name: 'Take in the royals',        hands: 4,  minutes: 3 },   // Dana
  topgallant: { name: 'Take in the topgallants',   hands: 6,  minutes: 5 },   // Dana
  course:     { name: 'Furl the courses',          hands: 8,  minutes: 10 },  // Dana
  spanker:    { name: 'Brail in the spanker',      hands: 6,  minutes: 4 },   // inferred
  headsail:   { name: 'Haul down the jibs',        hands: 4,  minutes: 3 }    // inferred
};

const LET_OUT = {
  royal:      { name: 'Set the royals',            hands: 4,  minutes: 3 },   // inferred
  topgallant: { name: 'Set the topgallants',       hands: 6,  minutes: 4 },   // inferred
  course:     { name: 'Set the courses',           hands: 8,  minutes: 8 },   // Dana
  spanker:    { name: 'Set the spanker',           hands: 6,  minutes: 5 },   // inferred
  headsail:   { name: 'Set the jibs',              hands: 4,  minutes: 4 }    // inferred
};

// The topsails are the heart of it, and the only sails she reefs.
const TOPSAIL = {
  'set>1st reef':          { name: 'Single-reef the topsails', hands: 14, minutes: 12 },  // Dana
  '1st reef>2nd reef':     { name: 'Second reef the topsails', hands: 14, minutes: 15 },  // Dana
  '2nd reef>close-reefed': { name: 'Close-reef the topsails',  hands: 16, minutes: 20 },  // Dana
  'close-reefed>furled':   { name: 'Furl the topsails',        hands: 14, minutes: 14 },  // inferred
  'furled>close-reefed':   { name: 'Set the topsails',         hands: 12, minutes: 12 },  // inferred
  'close-reefed>2nd reef': { name: 'Shake out a reef',         hands: 10, minutes: 8 },   // Dana
  '2nd reef>1st reef':     { name: 'Shake out a reef',         hands: 10, minutes: 8 },   // Dana
  '1st reef>set':          { name: 'Shake out a reef',         hands: 10, minutes: 8 }    // Dana
};

const SPANKER_REEF = { name: 'Reef the spanker', hands: 8, minutes: 7 };      // inferred
const SPANKER_SHAKE = { name: 'Shake out the spanker', hands: 6, minutes: 5 }; // inferred

export const MANOEUVRES = {
  tack: { name: 'Tack ship', hands: 16, minutes: 4 },   // Dana
  wear: { name: 'Wear ship', hands: 12, minutes: 9 }    // Dana
};

// dir is +1 to reduce canvas, -1 to make more.
export function evolution(tier, from, to, dir) {
  if (tier === 'topsail') return TOPSAIL[`${from}>${to}`];
  if (tier === 'spanker' && from !== 'set' && to !== 'furled' && from !== 'furled') {
    return dir > 0 ? SPANKER_REEF : SPANKER_SHAKE;
  }
  if (tier === 'spanker' && to === 'furled') return TAKE_IN.spanker;
  if (tier === 'spanker' && from === 'furled') return LET_OUT.spanker;
  if (tier === 'spanker') return dir > 0 ? SPANKER_REEF : SPANKER_SHAKE;
  return (dir > 0 ? TAKE_IN : LET_OUT)[tier];
}
