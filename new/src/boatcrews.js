// The boats' crews. Every whaleship's boats had names and headsmen by custom:
// the master's starboard boat, the first mate's larboard boat, the second
// mate's waist boat, the third mate's bow boat. Six to a boat: the headsman at
// the steering oar, the boatsteerer (the harpooner) pulling the bow oar until
// he darts, and four oarsmen. The idlers stay aboard as shipkeepers.
import { hud } from './hud.js';

// In the order of her davits (see DAVITS in ship.js).
export const BOATS = [
  { name: 'Waist boat', head: 'Second mate' }, { name: 'Starboard boat', head: 'Master' },
  { name: 'Bow boat', head: 'Third mate' }, { name: 'Larboard boat', head: 'First mate' },
];
export const SEATS = [
  { id: 'head', name: 'Headsman', uses: 'nerve' }, { id: 'steerer', name: 'Boatsteerer', uses: 'eye' },
  { id: 'bow', name: 'Bow oar', uses: 'strength' }, { id: 'midship', name: 'Midship oar', uses: 'strength' },
  { id: 'tub', name: 'Tub oar', uses: 'strength' }, { id: 'after', name: 'After oar', uses: 'strength' },
];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const SPARES = 2;
const IDLERS = ['cooper', 'carpenter', 'cook', 'steward', 'boy'];    // shipkeepers: they stay aboard

export function makeBoatCrews(company) {
  const seats = BOATS.map(() => SEATS.map(() => null));        // seats[boat][seat] = man id
  const lost = BOATS.map(() => false), lower = BOATS.map(() => true);
  let spares = SPARES, fitting = 0;

  const who = (b, s) => { const m = seats[b][s] != null && company.byId(seats[b][s]); return m && m.alive ? m : null; };
  const seatOf = (id) => { for (let b = 0; b < BOATS.length; b++) { const s = seats[b].indexOf(id); if (s >= 0) return [b, s]; } return null; };
  const score = (m, s) => (m ? company.score(m, { id: `boat-${SEATS[s].id}`, uses: SEATS[s].uses }) : 0);

  // Who may sit where: officers head the boats; boatsteerers dart; anyone
  // but an officer may pull an oar. A boatsteerer put at the steering oar is
  // promoted mate; a seaman put in the bow is made boatsteerer.
  function fits(m, s) {
    if (!m.alive) return false;
    if (s === 0) return m.officer || m.rank === 'boatsteerer';
    return !m.officer;
  }
  const candidates = (b, s) => company.alive().filter((m) => fits(m, s)).sort((x, y) => score(y, s) - score(x, s));

  function assign(b, s, id) {
    if (id != null) {
      const was = seatOf(id); if (was) seats[was[0]][was[1]] = null;
      const m = company.byId(id);
      if (s === 0 && !m.officer) company.promote(m, 'mate');
      if (s === 1 && (m.rank === 'able' || m.rank === 'green')) company.promote(m, 'boatsteerer');
    }
    seats[b][s] = id;
  }

  // Fill empty seats: headsmen by custom first, then the best men for each seat.
  function fillEmpty() {
    BOATS.forEach((boat, b) => {
      if (!who(b, 0)) { const m = company.alive().find((x) => x.title === boat.head && !seatOf(x.id)); if (m) seats[b][0] = m.id; }
    });
    const free = (x) => !seatOf(x.id) && !IDLERS.includes(x.rank);
    for (let s = 1; s < SEATS.length; s++) {
      for (let b = 0; b < BOATS.length; b++) {
        if (who(b, s)) continue;
        const m = s === 1 ? company.alive().find((x) => x.rank === 'boatsteerer' && free(x))
          : candidates(b, s).find((x) => free(x) && x.rank !== 'boatsteerer');
        seats[b][s] = m ? m.id : null;
      }
    }
  }
  fillEmpty();

  // What a boat's crew makes of a chase: how fast she pulls, how sure the dart,
  // how quick the lancing, and how steady she is when the whale turns on her.
  function quality(b) {
    const rowers = [1, 2, 3, 4, 5].map((s) => score(who(b, s), 2));
    return {
      pull: clamp(0.75 + 0.083 * (rowers.reduce((a, n) => a + n, 0) / 5), 0.75, 1.25),
      dart: clamp(0.45 + 0.1 * score(who(b, 1), 1), 0.3, 0.97),
      lance: clamp(0.6 + 0.13 * score(who(b, 0), 0), 0.6, 1.4),
      steady: clamp(1.3 - 0.1 * (who(b, 0) ? company.score(who(b, 0), { id: 'boat-head', uses: 'seamanship' }) : 0), 0.7, 1.3),
    };
  }
  const manned = (b) => who(b, 0) && who(b, 1) && [2, 3, 4, 5].filter((s) => who(b, s)).length >= 2;
  const ready = () => BOATS.map((_, b) => b).filter((b) => !lost[b] && lower[b] && manned(b))
    .sort((x, y) => { const a = quality(x), c = quality(y); return (c.pull + c.dart + c.lance) - (a.pull + a.dart + a.lance); });

  return {
    seats, lost, lower, who, seatOf, candidates, assign, quality, manned, ready, score,
    get spares() { return spares; },
    get afloat() { return lost.filter((x) => !x).length; },
    crewOf: (b) => seats[b].map((_, s) => who(b, s)).filter(Boolean),

    // The whale has stove boat b: she is gone, and the carpenter will rig a spare.
    lose(b) { lost[b] = true; },

    // Each day the carpenter works at rigging a spare boat, if one is needed and one is left.
    newDay(carpenter) {
      const b = lost.indexOf(true);
      if (b < 0 || spares === 0) return;
      fitting += 0.25 + 0.1 * carpenter;
      if (fitting >= 1) {
        fitting = 0; spares--; lost[b] = false;
        hud.toast(`The carpenter has a spare boat rigged on the davits for the ${BOATS[b].name.toLowerCase()}.`);
      }
    },

    // At the wharf: new boats for lost ones, spares on the skids, seats filled.
    refit() { lost.fill(false); spares = SPARES; fitting = 0; fillEmpty(); },
  };
}
