// The passage: where she is on the round world, and how she came by it.
//
// She used to be reckoned in metres east and north of where she sailed, which
// is fine for a morning in the bay and quite wrong for a voyage round the
// Horn, where a degree of longitude is fifty-two sea miles at New Bedford and
// thirty-four off Cape Horn. So she is reckoned in latitude and longitude now,
// and worked the way her master worked her: plane sailing on the middle
// latitude, which is what a log line and a compass actually give you and what
// he did on a slate every noon.
//
// A voyage's legs may be given either as a bearing and a distance -- good for
// a mark seven miles off -- or as a real latitude and longitude, which is how
// the passage round the Horn is written.
import { compassPoint, wrap } from './wind.js';

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const R_NM = 3440.065;      // the earth's radius in sea miles
const KNOT_NM = 1 / 3600;   // sea miles run in a second at one knot
const LANDFALL = 1;         // near enough to call a mark fetched

export const DESTINATION = { bearing: 225, miles: 60 };

function spellTime(seconds) {
  const whole = Math.floor(seconds / 3600);
  const days = Math.floor(whole / 24), hours = whole % 24;
  const minutes = Math.round((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (!days && minutes) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  return parts.join(', ').replace(/, ([^,]*)$/, ' and $1') || 'no time at all';
}

// How far apart two places are, round the curve of the earth.
export function apart(a, b) {
  const dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// What course to steer to raise a place.
export function bearingTo(a, b) {
  const p1 = a.lat * RAD, p2 = b.lat * RAD, dLon = (b.lon - a.lon) * RAD;
  const y = Math.sin(dLon) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  return wrap(Math.atan2(y, x) * DEG);
}

// Sailing a distance on a course, by the middle latitude.
function sail(from, course, miles) {
  const lat = from.lat + (miles * Math.cos(course * RAD)) / 60;
  const mid = ((from.lat + lat) / 2) * RAD;
  const dLon = (miles * Math.sin(course * RAD)) / (60 * Math.max(0.03, Math.cos(mid)));
  return { lat: Math.max(-85, Math.min(85, lat)), lon: from.lon + dLon };
}

export function makePassage(rig, plan = [DESTINATION], from = { lat: 41.63, lon: -70.93 }) {
  // Every leg becomes a real place, whether it was written as one or as a
  // bearing and a distance from the last.
  const legs = [];
  let walk = { lat: from.lat, lon: from.lon };
  for (const l of plan) {
    const to = l.lat !== undefined ? { lat: l.lat, lon: l.lon } : sail(walk, l.bearing, l.miles);
    legs.push({
      from: walk, lat: to.lat, lon: to.lon,
      miles: l.miles !== undefined ? l.miles : apart(walk, to),
      near: l.near || LANDFALL, then: l.then,
      said: l.said || 'her destination'
    });
    walk = to;
  }

  let leg = 0;
  let at = { lat: from.lat, lon: from.lon };
  let sailed = 0;             // sea miles through the water
  let elapsed = 0;
  let most = 0;
  let arrived = null;
  let legBegan = 0, legSailed = 0;

  const mark = () => legs[Math.min(leg, legs.length - 1)];
  const toRun = () => apart(at, mark());

  return {
    // Her reckoning runs on her own clock, not on your eye.
    run(gameDt, knots, courseRad, onLeg) {
      if (arrived) return;
      elapsed += gameDt;
      if (knots > most) most = knots;

      const miles = knots * KNOT_NM * gameDt;
      sailed += miles;
      if (miles > 0) at = sail(at, wrap(courseRad * DEG), miles);

      if (toRun() > mark().near) return;

      const done = mark();
      done.took = spellTime(elapsed - legBegan);
      done.through = sailed - legSailed;
      legBegan = elapsed;
      legSailed = sailed;

      if (leg < legs.length - 1) {
        leg += 1;
        if (onLeg) onLeg(done, mark());
        return;
      }

      const straight = legs.reduce((n, l) => n + l.miles, 0);
      arrived = {
        elapsed,
        took: spellTime(elapsed),
        sailed,
        made: this.made,
        average: elapsed > 0 ? sailed / (elapsed / 3600) : 0,
        // How much of every mile through the water counted. Beating to
        // windward is where this is spent.
        worth: sailed > 0 ? Math.min(1, straight / sailed) : 1,
        lost: rig.hurt()
      };
    },

    get leg() { return leg; },
    get where() { return at; },
    get marks() { return legs.map((l) => ({ lat: l.lat, lon: l.lon, said: l.said })); },
    get toRun() { return toRun(); },
    get sailed() { return sailed; },
    get most() { return most; },
    get legs() { return legs.filter((l) => l.took); },
    get total() { return Math.round(mark().miles); },
    get legSaid() { return mark().said; },
    // Distance made good along the leg she is on.
    get made() {
      return Math.max(0, apart(mark().from, mark()) - toRun());
    },
    get bearing() { return bearingTo(at, mark()); },
    get bearingSaid() { return compassPoint(this.bearing); },
    get arrived() { return arrived; }
  };
}
