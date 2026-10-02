// Where a man put down by hand goes, and what he would make of it. Dropped on
// a station's badge he takes the place for his own watch, or an empty place,
// or the place of the weakest man there. Dropped on a row in the roster or a
// seat in a boat, he goes exactly there, if he may.
import { SLOTS, slotStation, station } from './stations.js';
import { BOATS, SEATS } from './boatcrews.js';
import { hud } from './hud.js';

export function makePlacing({ company, crews, crisis, done }) {
  const keysOf = (id) => SLOTS.filter((k) => slotStation(k).id === id);

  function why(m, st) {
    if (st.id === 'cutting') return 'Only the mates cut in.';
    if (m.officer) return 'The master and mates keep no station but the cutting stage.';
    if (st.watch && !m.watch) return `${m.title}s stand no watch.`;
    return 'He cannot work there.';
  }

  // The best place for him at a station: where he is already, else an empty place, else the weakest man's.
  function slotAt(m, stationId) {
    const keys = keysOf(stationId).filter((k) => company.fits(m, k));
    if (!keys.length) return null;
    return keys.find((k) => company.slots[k] === m.id) || keys.find((k) => !company.man(k))
      || keys.sort((a, b) => company.scoreAt(a) - company.scoreAt(b))[0];
  }

  // What to say over a target while a man is held above it.
  function preview(id, t) {
    if (t.trouble) return crisis.preview(id, t.trouble);
    const m = company.byId(id);
    if (t.seat) {
      const [b, s] = t.seat;
      if (!crews.candidates(b, s).includes(m)) return s === 0 ? 'Only an officer or a boatsteerer heads a boat' : 'An officer does not pull an oar';
      const made = s === 0 && !m.officer ? ', made mate' : s === 1 && (m.rank === 'able' || m.rank === 'green') ? ', made boatsteerer' : '';
      return `${SEATS[s].name}: ${crews.score(m, s).toFixed(1)}${made}`;
    }
    const key = t.slot || slotAt(m, t.station), st = key ? slotStation(key) : station(t.station);
    if (!key || !company.fits(m, key)) return why(m, st);
    const was = company.man(key);
    return `${st.name}: ${company.score(m, st).toFixed(1)}${was && was !== m ? `, in place of ${was.name.split(' ').pop()}` : ''}`;
  }

  function drop(id, t) {
    if (t.trouble) { hud.toast(crisis.assign(id, t.trouble)); return done(); }
    const m = company.byId(id);
    if (t.seat) {
      const [b, s] = t.seat;
      if (!crews.candidates(b, s).includes(m)) return hud.toast(preview(id, t) + '.');
      crews.assign(b, s, id);
      hud.toast(`${m.name} takes the ${SEATS[s].name.toLowerCase()} of the ${BOATS[b].name.toLowerCase()}.`);
    } else {
      const key = t.slot || slotAt(m, t.station);
      if (!key || !company.fits(m, key)) return hud.toast(why(m, key ? slotStation(key) : station(t.station)));
      company.assign(key, id);
      hud.toast(`${m.name} goes to the ${slotStation(key).name.toLowerCase()}.`);
    }
    done();
  }

  return { preview, drop };
}
