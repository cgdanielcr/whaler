// The passage: sixty miles of open water to the south-west, and an account of
// how she came by them.
import { compassPoint, wrap } from './wind.js';

const NM = 1852;          // metres in a nautical mile
const KNOT = 0.5144;
const LANDFALL = 1;       // nautical miles: near enough to call it arrived

export const DESTINATION = { bearing: 225, miles: 60 };

function spellTime(seconds) {
  const whole = Math.floor(seconds / 3600);
  const days = Math.floor(whole / 24), hours = whole % 24;
  const minutes = Math.round((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  return parts.join(', ').replace(/, ([^,]*)$/, ' and $1') || 'no time at all';
}

export function makePassage(rig) {
  const b = DESTINATION.bearing * Math.PI / 180;
  const to = { x: Math.sin(b) * DESTINATION.miles * NM, z: Math.cos(b) * DESTINATION.miles * NM };

  let x = 0, z = 0;         // where she is, in metres from where she began
  let sailed = 0;           // through the water
  let elapsed = 0;
  let arrived = null;

  const toRun = () => Math.hypot(to.x - x, to.z - z) / NM;

  return {
    // Her reckoning runs on her own clock, not on your eye.
    run(gameDt, knots, courseRad) {
      if (arrived) return;
      elapsed += gameDt;
      const metres = knots * KNOT * gameDt;
      sailed += metres;
      x += Math.sin(courseRad) * metres;
      z += Math.cos(courseRad) * metres;

      if (toRun() <= LANDFALL) {
        const hours = elapsed / 3600;
        const run = sailed / NM;
        const made = this.made;
        arrived = {
          elapsed,
          took: spellTime(elapsed),
          sailed: run,
          made,
          average: hours > 0 ? run / hours : 0,
          // How much of every mile through the water counted towards her
          // destination. Beating to windward is where this is spent.
          worth: run > 0 ? Math.min(1, made / run) : 1,
          lost: rig.hurt()
        };
      }
    },

    get toRun() { return toRun(); },
    get sailed() { return sailed / NM; },
    // Distance made good: how far she has come along the line she meant to sail.
    get made() {
      const len = Math.hypot(to.x, to.z);
      return Math.max(0, (x * to.x + z * to.z) / len / NM);
    },
    get bearing() { return wrap(Math.atan2(to.x - x, to.z - z) * 180 / Math.PI); },
    get bearingSaid() { return compassPoint(this.bearing); },
    get arrived() { return arrived; }
  };
}
