// What each man wants from the voyage, and how he may be rated up.
//
// After *Heat Signature*: a man you are attached to is a man who wants
// something. Most of these are what the logbooks and the memoirs say men
// shipped for: a boatsteerer's berth and its shorter lay, a debt to clear, a
// wife not heard from. And some shipped only to be carried to the Pacific and
// run -- which a master found out when they were gone.

import { note } from './ledger.js';

const chance = (p) => Math.random() < p;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function giveWants(men) {
  for (const m of men) {
    if (m.want !== undefined) continue;
    const r = Math.random();
    if (m.berth === 'Cabin boy') m.want = 'home';
    else if (m.rate === 'mate') m.want = r < 0.4 ? 'debt' : null;
    else if (m.rate === 'boatsteerer') m.want = r < 0.5 ? 'mate' : r < 0.7 ? 'letters' : null;
    else if (m.rate === 'tradesman') m.want = r < 0.4 ? 'debt' : r < 0.7 ? 'letters' : null;
    else if (m.rate === 'green hand') {
      m.want = r < 0.3 ? 'boats' : r < 0.5 ? pick(['run:talcahuano', 'run:honolulu']) : r < 0.7 ? 'debt' : null;
    } else {
      m.want = r < 0.35 ? 'boatsteerer' : r < 0.5 ? pick(['run:talcahuano', 'run:honolulu'])
        : r < 0.65 ? 'debt' : r < 0.8 ? 'letters' : null;
    }
    if (m.want === 'debt') m.debt = 30 + 10 * Math.floor(Math.random() * 10);
    m.wantSeen = !(m.want || '').startsWith('run:');
  }
}

// What he wants, as his card says it.
export function wantSaid(m) {
  if (!m.want) return null;
  if (m.wanted) return m.wanted;
  if (!m.wantSeen) return 'keeps his own counsel';
  const port = (m.want.split(':')[1] || '');
  return {
    home: 'wants to see his mother again',
    debt: `shipped to clear a debt of $${m.debt} ashore`,
    mate: 'means to be a mate before he is thirty',
    letters: 'has a wife at home he has not heard from',
    boats: 'wants to go in the boats, not keep ship',
    boatsteerer: 'wants to make boatsteerer'
  }[m.want] || `means to run at ${port[0].toUpperCase()}${port.slice(1)}`;
}

// A want met. Recorded in his own words, so the account can say so.
export function met(m, said) {
  m.wanted = said;
  note(m, said);
}

// Who may be rated up this month, and to what.
export function promotions(l) {
  const sound = l.men.filter((m) => m.health === 'sound');
  const out = [];
  const steerers = sound.filter((m) => m.rate === 'boatsteerer').length;
  const mates = sound.filter((m) => m.rate === 'mate').length;
  for (const m of sound) {
    const months = l.month - m.joined;
    if (m.rate === 'boatsteerer' && mates < 3) out.push({ man: m, to: 'mate', lay: 50 });
    if (/seaman/.test(m.rate) && steerers < 4) out.push({ man: m, to: 'boatsteerer', lay: 80 });
    if (m.rate === 'green hand' && m.berth === 'Foremast hand' && months >= 10) {
      out.push({ man: m, to: 'ordinary seaman', lay: 170 });
    }
    if (m.rate === 'ordinary seaman' && months >= 18) out.push({ man: m, to: 'able seaman', lay: 150 });
  }
  return out;
}

export function promote(l, m, to) {
  const was = m.rate;
  m.rate = to;
  if (to === 'boatsteerer') m.berth = 'Boatsteerer';
  if (to === 'mate') m.berth = l.men.some((x) => x.berth === 'Third mate' && x.health === 'sound')
    ? 'Second mate' : 'Third mate';
  note(m, `rated ${to} from ${was}`);
  if ((to === 'boatsteerer' && m.want === 'boatsteerer') || (to === 'mate' && m.want === 'mate')) {
    met(m, `made ${to}, as he wanted`);
  }
}

// The runners this port: a man who means to run here runs, unless he is
// watched; the rest weigh it up.
export function runsHere(m, port, liberty) {
  if (m.want === `run:${port}` && !m.wanted) return liberty ? true : chance(0.5);
  return false;
}
