// Crises: the moments of the voyage you may take into your own hands, sailed
// in the ship itself rather than drawn from a table. A voyage on the chart
// hands over to one of these, and takes back what came of it.
//
// Each is built from wherever the voyage has got to: her position, the time
// of year, and the men she has left.

import { load, save, log, note, byId } from './ledger.js';
import { STOPS } from './stops.js';
import { lower } from './months.js';

const EVERYTHING = ['sail', 'helm', 'clock', 'look', 'manoeuvre', 'allhands', 'mend', 'whale'];

export function crisisVoyage(key) {
  if (!key.startsWith('crisis-')) return null;
  const l = load();
  if (!l || !l.crisis) return null;
  const s = STOPS[l.at];
  const from = { lat: s.lat, lon: s.lon, said: s.said };
  const off = s.said.replace(/^The /, 'the ');
  const common = { key, n: null, from, fair: false, wellSailed: 0.7, allow: EVERYTHING,
    teaches: 'A crisis from the whole voyage.' };

  if (l.crisis.kind === 'lowering') {
    return { ...common, crisis: 'lowering', title: 'Lowering',
      letter: [
        `On ${off}, from the masthead: there she blows.`,
        'Lower with <b>l</b>. Eighteen men go in the boats, and you keep the ship with the ' +
        'shipkeepers: the cooper, the cook, the steward, the boy, and a hand or two. Keep her ' +
        'handy, and watch the weather: the wind is making.',
        'When the boats are back aboard, the chart is waiting for you.'
      ],
      task: 'Lower for the whale, and keep the ship until the boats are back.',
      wind: { from: 60, force: 3.6 }, heading: 150, swing: 1.4, ground: true,
      squallEvery: [2400, 5400],
      plan: [{ bearing: 150, miles: 500, said: 'the ground' }] };
  }
  return { ...common, crisis: 'squall', title: 'A blow',
    letter: [
      `Off ${off}: the glass is falling fast.`,
      'She is under all plain sail, and the first squall will be on her in minutes. Get the ' +
      'canvas off her from the top down, and bring her through with every spar whole.',
      'When the blow is past, the chart is waiting for you.'
    ],
    task: 'Shorten sail before the squalls strike, and run ten miles with every spar whole.',
    wind: { from: 250, force: 4.4 }, heading: 160, swing: 1.2, ground: false,
    squalls: [{ at: 6 * 60, warning: 12 }, { at: 45 * 60, warning: 10 }],
    plan: [{ bearing: 160, miles: 10, said: 'the end of the blow', near: 1.5 }],
    allow: EVERYTHING.filter((g) => g !== 'whale') };
}

// Hand over to the ship: keep the card, and go.
export function launch(l, card, kind) {
  l.crisis = { kind, card };
  save(l);
  location.hash = `crisis-${kind}`;
  location.reload();
}

// Take back what came of it. If the crisis was left unfinished, it is drawn
// from the table as if the mate had handled it.
export function takeBack(l) {
  const c = l.crisis;
  if (!c) return;
  l.crisis = null;
  const r = c.result;
  if (!r) {
    if (c.kind === 'lowering') {
      const out = lower(l);
      l.cards.unshift({ key: 'said', head: 'The mate lowered', text: `${out.said} ${out.lines.join(' ')}` });
    } else {
      l.weary = Math.min(100, l.weary + 10);
      l.cards.unshift({ key: 'said', head: 'The mate had the deck', text: 'He hove her to, and she rode it out.' });
    }
    return;
  }

  const lines = [];
  const struck = { hurt: [], lost: [] };
  for (const h of r.men) {
    const m = byId(l, h.id);
    if (!m) continue;
    if (h.health !== 'sound' && m.health === 'sound') {
      m.health = h.health === 'lost' ? 'lost' : 'hurt';
      struck[m.health].push(m.name);
    }
    for (const d of h.deeds) note(m, d);
  }
  if (struck.hurt.length) lines.push(`${struck.hurt.join(', ')} ${struck.hurt.length > 1 ? 'were' : 'was'} hurt.`);
  if (struck.lost.length) lines.push(`${struck.lost.join(', ')} ${struck.lost.length > 1 ? 'were' : 'was'} lost.`);
  if (r.damage >= 2) { l.hull = Math.min(2, l.hull + 1); lines.push('She was strained by what carried away.'); }
  else if (r.damage) lines.push('Something carried away, but her hull is sound.');
  if (r.stove) { l.boats = Math.max(0, l.boats - 1); lines.push(`A boat was stove. ${l.boats} left.`); }
  if (r.barrels) {
    const took = Math.min(r.barrels, l.ship.capacity - l.sperm - l.whale);
    l.sperm += took;
    l.weary = Math.min(100, l.weary + 12);
    lines.push(`Cut in and tried out: ${took} barrels of sperm oil stowed down.`);
  }
  if (c.kind === 'squall') l.weary = Math.min(100, l.weary + 8);
  if (!lines.length) lines.push(c.kind === 'lowering' ? 'The boats came back with nothing.' : 'She came through whole.');
  log(l, `${c.kind === 'lowering' ? 'Lowered, and kept the ship yourself.' : 'Worked her through a blow yourself.'} ${lines.join(' ')}`);
  l.cards.unshift({ key: 'said', head: c.kind === 'lowering' ? 'The boats are back' : 'The blow is past', text: lines.join(' ') });
}
