// The ship's ledger: everything about a voyage that has to outlast a page.
//
// A whaling voyage was three or four years, and nobody plays one in a sitting,
// so this is kept in the browser: one entry, the voyage you are on, and
// nothing about you. It goes when the voyage is paid off.

import { makeCompany } from './company.js';
import { giveWants } from './wants.js';
import { dated } from './stops.js';

const KEY = 'whaler.voyage';

// How worn the men are, from nothing to all in. The words are the ones the
// crew board has always used.
const WEARY = [[15, 'fresh'], [35, 'willing'], [60, 'tiring'], [85, 'weary'], [999, 'spent']];
export const wearySaid = (n) => WEARY.find(([top]) => n < top)[1];
export const HULL = ['sound', 'strained', 'leaking'];

export function newVoyage(ship, veterans = []) {
  const company = makeCompany();
  const men = company.all.map((m) => ({
    id: m.id, name: m.name, berth: m.berth, rate: m.rate, age: m.age,
    strength: m.strength, health: 'sound', deeds: [], joined: 0
  }));

  // Men who sailed with you before take the places of strangers, a step up.
  for (const v of veterans) {
    const slot = men.find((m) => !m.veteran && m.berth === v.berth &&
      (m.berth !== 'Foremast hand' || m.rate === v.rate));
    if (!slot) continue;
    Object.assign(slot, { name: v.name, age: v.age + 4, strength: v.strength,
      veteran: v.voyages, deeds: [`his ${ordinal(v.voyages + 1)} voyage with you`] });
  }
  giveWants(men);

  return {
    v: 1, ship, month: 0, at: 'newbedford',
    water: 10, provisions: 30, fresh: 0, weary: 0,
    hull: ship.hull || 0, boats: ship.boats,
    sperm: 0, whale: 0, shipped: 0, ambergris: 0, outlays: 0,
    men, grounds: {}, news: {}, flags: {}, cards: [], log: [], over: null,
    nextId: men.length
  };
}

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
}
export function save(l) {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { /* she sails on */ }
}
export function forget() {
  try { localStorage.removeItem(KEY); } catch (e) { /* nothing to forget */ }
}

// A line in the log, under the month it happened.
export function log(l, text) {
  l.log.push({ when: dated(l.month), text });
  if (l.log.length > 120) l.log.shift();
}

// A line in one man's record. Kept short: a record of three is a life.
export function note(man, text) {
  if (!man || man.deeds.includes(text)) return;
  man.deeds.push(text);
  if (man.deeds.length > 5) man.deeds.splice(1, 1);
}

export const aboard = (l) => l.men.filter((m) => m.health !== 'lost' && m.health !== 'ran');
export const sound = (l) => l.men.filter((m) => m.health === 'sound');
export const byId = (l, id) => l.men.find((m) => m.id === id);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Who can go in a boat, and how many boats can be manned. A boat wants a mate
// or a boatsteerer to head her, a boatsteerer to strike, and four at the oars.
export function boatsCanLower(l) {
  const s = sound(l);
  const heads = s.filter((m) => m.rate === 'mate').length;
  const steer = s.filter((m) => m.rate === 'boatsteerer').length;
  const oars = s.filter((m) => /seaman|green/.test(m.rate) && m.berth === 'Foremast hand').length;
  return Math.max(0, Math.min(3, l.boats, heads, steer, Math.floor(oars / 4)));
}

// Ship a new hand into the company.
export function shipHand(l, name, rate, from) {
  const man = { id: l.nextId++, name, berth: 'Foremast hand', rate, age: 17 + Math.floor(Math.random() * 10),
    strength: pick(['middling', 'strong', 'weak']), health: 'sound', joined: l.month,
    deeds: [`shipped at ${from}`] };
  l.men.push(man);
  return man;
}

const ordinal = (n) => ['', 'first', 'second', 'third', 'fourth', 'fifth'][n] || `${n}th`;
