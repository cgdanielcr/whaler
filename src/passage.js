// The passage: the water she has to cross, and an account of how she came by
// it. A voyage may be one leg out, as the run down to the cruising ground is,
// or out and home again, as a morning in the bay is.
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

// plan is a list of legs, each reckoned from where the last one ended, so
// { bearing: 45, miles: 7 } then { bearing: 225, miles: 7 } brings her home.
export function makePassage(rig, plan = [DESTINATION]) {
  const legs = [];
  let px = 0, pz = 0;
  for (const l of plan) {
    const from = { x: px, z: pz };
    const b = l.bearing * Math.PI / 180;
    px += Math.sin(b) * l.miles * NM;
    pz += Math.cos(b) * l.miles * NM;
    legs.push({ from, x: px, z: pz, miles: l.miles, then: l.then,
                near: l.near || LANDFALL,
                said: l.said || 'her destination' });
  }

  let leg = 0;              // which one she is on
  let x = 0, z = 0;         // where she is, in metres from where she began
  let sailed = 0;           // through the water
  let elapsed = 0;
  let most = 0;             // her best speed of the voyage
  let arrived = null;

  const at = () => legs[Math.min(leg, legs.length - 1)];
  const toRun = () => Math.hypot(at().x - x, at().z - z) / NM;

  return {
    // Her reckoning runs on her own clock, not on your eye. onLeg is called
    // when she fetches a mark with another leg still to run.
    run(gameDt, knots, courseRad, onLeg) {
      if (arrived) return;
      elapsed += gameDt;
      if (knots > most) most = knots;
      const metres = knots * KNOT * gameDt;
      sailed += metres;
      x += Math.sin(courseRad) * metres;
      z += Math.cos(courseRad) * metres;

      if (toRun() > at().near) return;

      if (leg < legs.length - 1) {
        const fetched = at();
        leg += 1;
        if (onLeg) onLeg(fetched, at());
        return;
      }

      const hours = elapsed / 3600;
      const run = sailed / NM;
      const straight = legs.reduce((n, l) => n + l.miles, 0);
      arrived = {
        elapsed,
        took: spellTime(elapsed),
        sailed: run,
        made: this.made,
        average: hours > 0 ? run / hours : 0,
        // How much of every mile through the water counted towards where she
        // was going. Beating to windward is where this is spent.
        worth: run > 0 ? Math.min(1, straight / run) : 1,
        lost: rig.hurt()
      };
    },

    get toRun() { return toRun(); },
    get sailed() { return sailed / NM; },
    get most() { return most; },
    // The leg she is on: how long it is, and what lies at the end of it.
    get total() { return at().miles; },
    get legSaid() { return at().said; },
    // Distance made good: how far she has come along the line she meant to sail.
    get made() {
      const l = at();
      const dx = l.x - l.from.x, dz = l.z - l.from.z;
      const len = Math.hypot(dx, dz);
      return Math.max(0, ((x - l.from.x) * dx + (z - l.from.z) * dz) / len / NM);
    },
    get bearing() { return wrap(Math.atan2(at().x - x, at().z - z) * 180 / Math.PI); },
    get bearingSaid() { return compassPoint(this.bearing); },
    get arrived() { return arrived; }
  };
}
