// The weather: a wind that rises and falls of its own accord, and squalls that
// come up out of the horizon.
//
// A squall is visible as a dark line before it arrives -- five to twenty
// minutes, and less at night. It brings a sudden jump of two or three forces
// for ten to thirty minutes, and often shifts the wind with it.
const MINUTE = 60, HOUR = 3600;
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

export function makeWeather(baseFrom, baseForce) {
  let clock = 0;
  let squall = null;
  let nextSquall = rand(18, 40) * MINUTE;

  // She never blows quite steady: two slow swells in the force, hours apart.
  const steady = () => baseForce
    + 1.25 * Math.sin(clock / (2.6 * HOUR))
    + 0.65 * Math.sin(clock / (1.15 * HOUR));

  function raise(night) {
    return {
      bearing: baseFrom + rand(-35, 35),        // she comes up out of the weather quarter
      warning: (night ? rand(3, 8) : rand(5, 20)) * MINUTE,
      blow: rand(10, 30) * MINUTE,
      jump: rand(2, 3),
      shift: Math.random() < 0.7 ? rand(10, 40) * (Math.random() < 0.5 ? -1 : 1) : 0,
      age: 0
    };
  }

  // 0 while she is still coming on, 1 while she is over you, back to 0 after.
  function strength(s) {
    const over = s.age - s.warning;
    if (over < 0) return 0;
    if (over < MINUTE) return over / MINUTE;                          // she strikes
    if (over < s.warning + s.blow) return 1;
    const past = over - s.blow;
    return Math.max(0, 1 - past / (3 * MINUTE));                      // and passes off
  }

  return {
    tick(gameDt, hourOfDay) {
      clock += gameDt;
      if (squall) {
        squall.age += gameDt;
        if (squall.age > squall.warning + squall.blow + 4 * MINUTE) {
          squall = null;
          nextSquall = clock + rand(25, 70) * MINUTE;
        }
      } else if (clock > nextSquall) {
        squall = raise(hourOfDay < 5 || hourOfDay >= 19);
      }
    },

    // What she is blowing now, and from where.
    get force() {
      const s = squall ? strength(squall) : 0;
      return Math.max(0, Math.min(9, steady() + (squall ? squall.jump * s : 0)));
    },
    get windFrom() {
      const s = squall ? strength(squall) : 0;
      return baseFrom + (squall ? squall.shift * s : 0);
    },

    // What the lookout can see of her: null, or how far off and from where.
    get warning() {
      if (!squall) return null;
      const left = squall.warning - squall.age;
      return {
        bearing: squall.bearing,
        minutes: Math.max(0, left / MINUTE),
        nearness: Math.max(0, Math.min(1, 1 - left / squall.warning)),
        here: left <= 0 && strength(squall) > 0.02,
        strength: strength(squall)
      };
    }
  };
}
