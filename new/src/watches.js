// Where each man is at a given moment: at his station if it is his watch or
// his work; about the deck if his watch has the deck and he has no station;
// otherwise below in his berth. For now the larboard watch has the deck; the
// watches will turn every four hours in the next step.
import { DECKS, BERTHS, slotStation, slotSpot } from './stations.js';

const WAIST = [[1.0, 0, -1.0], [-0.8, 0, 0.9], [4.4, 0, 0.7], [-2.9, 0, 0.5], [5.4, 0, -0.4], [3.2, 0, 0.95],
  [-1.3, 0, -0.3], [0.2, 0, 1.0], [4.6, 0, -0.6], [-4.0, 0, -1.2], [-0.4, 0, -1.1], [3.0, 0, -0.95]];
const QUARTERDECK = [-3.2, 0, -0.6];
const deckIndex = (id) => DECKS.findIndex((d) => d.id === id);

export const watchOnDeck = () => 'larboard';

// A Map from each living man's id to { deck (0 upper, 1 'tween, 2 hold), p: [x, y, z] }.
export function placeAll(company) {
  const out = new Map(), used = { forecastle: 0, steerage: 0, cabin: 0, waist: 0 };
  const deckWatch = watchOnDeck(), mark = deckWatch === 'larboard' ? 'L' : 'S';
  for (const m of company.alive()) {
    const key = company.stationOf(m.id), st = key && slotStation(key);
    if (st && (!st.watch || key.endsWith(`:${mark}`))) { out.set(m.id, { deck: deckIndex(st.deck), p: slotSpot(key) }); continue; }
    if (m.watch === deckWatch) { out.set(m.id, { deck: 0, p: WAIST[used.waist++ % WAIST.length] }); continue; }
    if (m.title === (deckWatch === 'larboard' ? 'First mate' : 'Second mate')) { out.set(m.id, { deck: 0, p: QUARTERDECK }); continue; }
    const beds = BERTHS[m.berth], i = used[m.berth]++, p = beds[i % beds.length];
    out.set(m.id, { deck: 1, p: i < beds.length ? p : [p[0] + 0.35, p[1], p[2] * 0.8] });   // doubled up if there are more men than berths
  }
  return out;
}
