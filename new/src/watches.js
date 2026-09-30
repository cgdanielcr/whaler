// The watches, and where each man is at a given hour. The larboard and
// starboard watches keep the deck turn about, four hours on and four below,
// with the two short dog watches in the evening so that the turns shift each
// day. The idlers work by day and sleep by night. A man is at his station if
// it is his watch or his work; about the deck if his watch has the deck and he
// has no station there; otherwise below in his berth.
import { DECKS, BERTHS, slotStation, slotSpot } from './stations.js';

const PERIODS = [[0, 'middle watch'], [4, 'morning watch'], [8, 'forenoon watch'], [12, 'afternoon watch'],
  [16, 'first dog watch'], [18, 'last dog watch'], [20, 'first watch']];
const WAIST = [[1.0, 0, -1.0], [-0.8, 0, 0.9], [4.4, 0, 0.7], [-2.9, 0, 0.5], [5.4, 0, -0.4], [3.2, 0, 0.95],
  [-1.3, 0, -0.3], [0.2, 0, 1.0], [4.6, 0, -0.6], [-4.0, 0, -1.2], [-0.4, 0, -1.1], [3.0, 0, -0.95]];
const QUARTERDECK = [-3.2, 0, -0.6];
const deckIndex = (id) => DECKS.findIndex((d) => d.id === id);

// The way below from each berth, as [x, y, z] on both decks: the forecastle
// scuttle forward, the main hatch amidships, the companionway in the after house.
export const LADDERS = { forecastle: [5.0, 0, 0], steerage: [1.2, 0, 0.3], cabin: [-4.3, 0, -0.3] };

// The watch at a given day and hour: its name, the bells struck, who has the deck, and whether it is day.
export function watchAt(days, hours) {
  let i = PERIODS.length - 1;
  while (hours < PERIODS[i][0]) i--;
  const n = days * PERIODS.length + i, since = hours - PERIODS[i][0];
  return { index: n, name: PERIODS[i][1], bells: Math.min(8, Math.floor(since * 2) + 1),
    onDeck: n % 2 ? 'starboard' : 'larboard', day: hours >= 6 && hours < 18 };
}

// A Map from each living man's id to { deck (0 upper, 1 'tween, 2 hold), p: [x, y, z], berth }.
// watch: as from watchAt, with `trying` true while a whale is being tried out.
export function placeAll(company, watch) {
  const out = new Map(), used = { forecastle: 0, steerage: 0, cabin: 0, waist: 0 };
  const mark = watch.onDeck === 'larboard' ? 'L' : 'S';
  const put = (m, deck, p) => out.set(m.id, { deck, p, berth: m.berth });
  for (const m of company.alive()) {
    const key = company.stationOf(m.id), st = key && slotStation(key);
    // Gangs work only while trying out; watch stations only in their watch; the rest (the idlers' trades) by day.
    const working = st && (st.gang ? watch.trying : st.watch ? key.endsWith(`:${mark}`) : watch.day);
    if (working) { put(m, deckIndex(st.deck), slotSpot(key)); continue; }
    if (m.watch === watch.onDeck) { put(m, 0, WAIST[used.waist++ % WAIST.length]); continue; }
    if (m.title === (watch.onDeck === 'larboard' ? 'First mate' : 'Second mate')) { put(m, 0, QUARTERDECK); continue; }
    const beds = BERTHS[m.berth], i = used[m.berth]++, p = beds[i % beds.length];
    put(m, 1, i < beds.length ? p : [p[0] + 0.35, p[1], p[2] * 0.8]);   // doubled up if there are more men than berths
  }
  return out;
}
