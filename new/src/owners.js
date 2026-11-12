// The owners, and the master's standing with them. Each voyage they look for
// a sum; bring home more and they think better of him, less and they think
// worse, and when they have thought ill of him long enough the ship is given
// to another man. The master's own lay goes into his purse, to be laid out on
// the next fitting-out. Remembered between visits to the page.
import { money, NEW_SHIP } from './stores.js';

const KEY = 'whaler-new-career';
const STANDING = ['', 'On your last chance', 'Under a cloud', 'On trial', 'Well thought of', 'The owners’ favourite'];

export function makeCareer() {
  const c = { voyages: 0, landed: 0, purse: 150, standing: 3, best: 0, whales: 0, over: null, learned: {}, bill: {} };

  c.word = () => STANDING[Math.max(1, Math.min(5, c.standing))];
  // What the owners look for from the coming voyage, clear of charges and lays.
  c.expect = () => 1400 + 250 * Math.min(c.voyages, 5);

  // A voyage made: net is what the owners keep, lay the master's own share. Returns what is said.
  c.settle = (net, lay, taken) => {
    const e = c.expect(), lines = [];
    c.voyages++; c.landed += net; c.whales += taken; c.best = Math.max(c.best, net);
    c.purse += Math.max(0, Math.round(lay));
    const was = c.standing;
    if (net >= e * 1.5) { c.standing = Math.min(5, c.standing + 1); lines.push(`A greasy voyage! The owners looked for ${money(e)} and are delighted.`); }
    else if (net >= e) { if (c.standing < 3) c.standing++; lines.push(`A good voyage. The owners looked for ${money(e)} and are pleased.`); }
    else if (net >= e * 0.5) lines.push(`A middling voyage. The owners looked for ${money(e)}, and say little.`);
    else { c.standing--; lines.push(`A broken voyage. The owners looked for ${money(e)}, and will not soon forget it.`); }
    if (c.standing !== was && c.standing > 0) lines.push(`Your standing with them: <b>${c.word()}</b>.`);
    if (c.standing <= 0) c.over = 'The owners have had enough of broken voyages. The Mastiff is given to another man.';
    lines.push(`Your own lay comes to <b>${money(lay)}</b>. In your purse: <b>${money(c.purse)}</b>.`);
    return lines;
  };
  c.shipLost = () => {
    c.voyages++; c.landed -= NEW_SHIP; c.standing -= 2;
    c.over = c.standing <= 0 ? 'A master who loses his ship is not given another. Your whaling is done.' : null;
    return c.over ? [] : [`The owners find you another ship, and do not forgive it. Your standing: <b>${c.word()}</b>.`];
  };
  c.summary = () => `<b>${c.voyages}</b> voyage${c.voyages === 1 ? '' : 's'}, <b>${c.whales}</b> whales, <b>${money(c.landed)}</b> landed for the owners.`;

  // Remembering: the career, the company and the boats' crews, kept in the browser.
  c.save = (extra) => {
    try { localStorage.setItem(KEY, JSON.stringify({ career: { ...c }, ...extra })); } catch { /* no storage: nothing is remembered */ }
  };
  c.load = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (!d || d.career.over) return null;
      Object.assign(c, d.career);
      return d;
    } catch { return null; }
  };
  c.peek = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); return d && !d.career.over ? d.career : null; } catch { return null; } };
  c.forget = () => { try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ } };
  return c;
}
