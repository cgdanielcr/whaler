// The weather: a wind that rises and falls of its own accord, and squalls that
// come up out of the horizon.
//
// A squall is visible as a dark line before it arrives -- five to twenty
// minutes, and less at night. It brings a sudden jump of two or three forces
// for ten to thirty minutes, and often shifts the wind with it.
const MINUTE = 60, HOUR = 3600;
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// swing is how far the force wanders of its own accord: one for the open sea,
// less for a quiet morning in home water.
// every is how often she may throw a squall, in minutes. Half an hour suits a
// morning in the bay; on a trade-wind passage of three months it wants to be
// days, which is also what the sailing directions say.
export function makeWeather(baseFrom, baseForce, swing = 1, every = [18, 40]) {
  /* eslint-disable no-param-reassign */    // the belts move her base wind about
  let clock = 0;
  let squall = null;
  let nextSquall = rand(every[0], every[1]) * MINUTE;
  let held = null;      // the wind set by hand, while you have the glass

  // She never blows quite steady: two slow swells in the force, hours apart.
  const steady = () => baseForce
    + swing * 1.25 * Math.sin(clock / (2.6 * HOUR))
    + swing * 0.65 * Math.sin(clock / (1.15 * HOUR));

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
    // The world's wind belts move under her as she runs south. She does not
    // go from the trades to the westerlies in an afternoon: it comes on over
    // days, so the base she blows from eases toward wherever she now is.
    settle(gameDt, from, force) {
      const k = 1 - Math.exp(-gameDt / 43200);      // half a day to come round
      const turn = ((from - baseFrom + 540) % 360) - 180;
      baseFrom = (baseFrom + turn * k + 360) % 360;
      baseForce += (force - baseForce) * k;
    },

    // Hold the weather quiet a while. The tutorial wants the first squall on
    // its own cue, not the weather's.
    quiet(minutes) { nextSquall = Math.max(nextSquall, clock + minutes * MINUTE); },

    // Raise one now, with a warning of your choosing.
    summon(warningMinutes) {
      if (squall) return false;
      squall = raise(false);
      squall.warning = warningMinutes * MINUTE;
      nextSquall = clock + 90 * MINUTE;
      return true;
    },

    tick(gameDt, hourOfDay) {
      clock += gameDt;
      if (squall) {
        squall.age += gameDt;
        if (squall.age > squall.warning + squall.blow + 4 * MINUTE) {
          squall = null;
          nextSquall = clock + rand(every[0] * 1.4, every[1] * 1.75) * MINUTE;
        }
      } else if (clock > nextSquall) {
        squall = raise(hourOfDay < 5 || hourOfDay >= 19);
      }
    },

    // Set the wind by hand, or give it back to the weather. While it is held
    // the squalls still come up and still darken the day, but they no longer
    // move the wind, so you can look at one sea for as long as you like.
    hold(force, from) { held = { force, from }; },
    release() { held = null; },
    get held() { return !!held; },
    get base() { return { force: baseForce, from: baseFrom }; },

    // What she is blowing now, and from where.
    get force() {
      if (held) return held.force;
      const s = squall ? strength(squall) : 0;
      return Math.max(0, Math.min(9, steady() + (squall ? squall.jump * s : 0)));
    },
    get windFrom() {
      if (held) return held.from;
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
