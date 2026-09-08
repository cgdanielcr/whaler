// What she may carry, and what happens when you carry more.
//
// The table is the one in the spec: at each force there is a limit to the
// canvas she can stand. Beyond it the strain tells, and something carries away.
const ALL_SET = { course: 'set', topsail: 'set', topgallant: 'set', royal: 'set', spanker: 'set', headsail: 'set' };

export const ALLOWS = [
  ALL_SET,                                              // calm
  ALL_SET,                                              // light airs
  ALL_SET,                                              // light breeze
  ALL_SET,                                              // moderate breeze -- her best sailing
  { ...ALL_SET, royal: 'furled' },                      // fresh breeze: royals in
  { ...ALL_SET, royal: 'furled', topgallant: 'furled' },// strong breeze: topgallants in
  { course: 'furled', topsail: '1st reef',      topgallant: 'furled', royal: 'furled', spanker: '1st reef', headsail: 'set' },
  { course: 'furled', topsail: '2nd reef',      topgallant: 'furled', royal: 'furled', spanker: '2nd reef', headsail: 'furled' },
  { course: 'furled', topsail: 'close-reefed',  topgallant: 'furled', royal: 'furled', spanker: 'furled',   headsail: 'furled' },
  { course: 'furled', topsail: 'furled',        topgallant: 'furled', royal: 'furled', spanker: 'furled',   headsail: 'furled' }
];

// Cheapest first, as the spec has it. How far down you go is how far over you
// were carrying when she let go.
const LADDER = ['split sail', 'sprung yard', 'sprung topmast', 'broach'];

const BREAKING = 10;   // strain at which something carries away

export function makeDamage(rig, onBreak) {
  let strain = 0;

  return {
    // Returns how many steps over she is carrying, for the mate to grumble at.
    tick(gameDt, force) {
      const allow = ALLOWS[Math.max(0, Math.min(9, Math.round(force)))];

      let worst = 0, victims = [];
      for (const s of rig.sails) {
        if (s.gone) continue;
        const limit = s.ladder.indexOf(allow[s.tier]);
        const now = s.ladder.indexOf(s.state);
        if (limit < 0 || now < 0) continue;
        const over = limit - now;
        if (over > worst) { worst = over; victims = [s]; }
        else if (over === worst && over > 0) victims.push(s);
      }

      if (worst <= 0) {
        strain = Math.max(0, strain - gameDt / 60);
        return 0;
      }

      // One step over is risky; two is very likely to break something.
      strain += Math.pow(worst, 1.7) * gameDt / 60;
      if (strain >= BREAKING) {
        strain = 0;
        onBreak(victims[Math.floor(Math.random() * victims.length)],
                LADDER[Math.min(LADDER.length - 1, worst - 1)]);
      }
      return worst;
    }
  };
}
