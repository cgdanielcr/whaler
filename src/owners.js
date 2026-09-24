// The owners, and the master's name among them.
//
// A master was as good as his last voyage. Bring a ship home greasy and the
// owners gave you the next one, on a shorter lay; bring her home clean and you
// took whatever old hulk nobody else would, or went home to the farm. And the
// men who had sailed with a lucky master shipped with him again.
//
// Kept in the browser, one entry: your record as a master, and nothing else.

import { reckon } from './lay.js';

const KEY = 'whaler.career';
export const WORDS = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

// The ships the owners may give you. Invented, not any real vessel.
export const SHIPS = [
  { name: 'Hector', capacity: 1400, boats: 3, hull: 1, lay: 18,
    about: 'forty years old, slow, and wet, and her seams already weeping. The owners of the Hector will take any master.' },
  { name: 'Lydia', capacity: 2000, boats: 4, hull: 0, lay: 15,
    about: 'a ship of three hundred and fifty tons, three years old, with four boats and room below for two thousand barrels.' },
  { name: 'Eliza Ann', capacity: 2400, boats: 4, hull: 0, lay: 13,
    about: 'new off the ways, copper-fastened, and the finest ship out of New Bedford this year. Room for two thousand four hundred barrels.' }
];

export function career() {
  try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { return fresh(); }
}
const fresh = () => ({ standing: 1, voyages: [], veterans: [] });
function keep(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* remembered by you */ } }
export function retire() { try { localStorage.removeItem(KEY); } catch (e) { /* already gone */ } }

export const shipFor = (c) => ({ ...SHIPS[Math.max(0, Math.min(2, c.standing))] });

// The letter that opens a voyage.
export function ownersLetter(l, c) {
  const last = c.voyages[c.voyages.length - 1];
  const opening = !last
    ? 'You are to proceed round Cape Horn to the Pacific, and there take sperm whales until your casks are full.'
    : last.verdict === 'greasy'
      ? `Your last voyage brought home ${last.barrels} barrels, and we are glad to give you a better ship for it.`
      : last.verdict === 'paid'
        ? `Your last voyage paid its way, and no more. We give you a ship on the same terms, and we look for better.`
        : `Your last voyage came home all but clean. We cannot give you one of our own ships; the ${l.ship.name} is what there is.`;
  return [
    'New Bedford, in September.',
    `Sir — ${opening} You have the ${l.ship.name}: ${l.ship.about}`,
    `Your lay is one barrel in ${l.ship.lay}. You will water at Fayal. The Offshore Ground is sperm-whale ` +
    'water the year round; the Japan Ground is richer, but only in the northern summer. We do not ' +
    'expect to hear from you for three years, and we expect to hear good news when we do.',
    (c.veterans.length ? `${WORDS[c.veterans.length]} of your old people have shipped with you again.` : ''),
    'We are, sir, your obedient servants.'
  ].filter(Boolean);
}

// The voyage paid off: the owners judge it, and remember.
export function payOff(l) {
  const c = career();
  const sperm = l.sperm + l.shipped;
  const whale = l.whale + (l.shippedWhale || 0);
  const pay = reckon(l.men, sperm, l.month * 30,
    { whale, outlays: l.outlays, ambergris: l.ambergris, master: l.ship.lay });
  const worth = (sperm + whale * 0.36) / l.ship.capacity;
  const verdict = worth >= 0.6 ? 'greasy' : worth >= 0.25 ? 'paid' : 'broken';
  const lost = l.men.filter((m) => m.health === 'lost').length;
  const ran = l.men.filter((m) => m.health === 'ran').length;

  c.standing = Math.min(2, c.standing + { greasy: 1, paid: 0, broken: -1 }[verdict]);
  c.voyages.push({ ship: l.ship.name, barrels: sperm, whale, months: l.month, lost, ran, verdict,
    master: Math.round(pay.master.share) });

  // Men who came home sound, and did well by it, ship again a step up.
  const willing = l.men.filter((m) => m.health === 'sound' && m.berth === 'Foremast hand' &&
    pay.shares[l.men.indexOf(m)].due > 0);
  const up = { 'green hand': 'ordinary seaman', 'ordinary seaman': 'able seaman', 'able seaman': 'able seaman' };
  c.veterans = verdict === 'broken' ? [] : willing.sort(() => Math.random() - 0.5).slice(0, 6)
    .map((m) => ({ name: m.name, age: m.age, strength: m.strength, berth: 'Foremast hand',
      rate: up[m.rate] || m.rate, voyages: (m.veteran || 0) + 1 }));
  keep(c);
  return { pay, verdict, lost, ran, sperm, whale, career: c, over: c.standing < 0 };
}

export const VERDICT = {
  greasy: 'A greasy voyage. The owners shake your hand on the wharf.',
  paid: 'She paid her way, and not much more. The owners are civil.',
  broken: 'A broken voyage. The owners do not come down to the wharf.'
};
