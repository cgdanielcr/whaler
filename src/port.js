// A port, as a page and not a place. She comes to anchor, and you choose
// what to buy and whether to give the men liberty; then you find out, at
// sailing, who did not come back from it.
//
// This is the oldest dilemma of the whale fishery. A ship needed water and
// fresh food and a run ashore for her people, and every run ashore lost her
// men: to the grog-shops, to the hills, to other ships paying better. Every
// dollar spent here comes off the top of the voyage, before anyone's lay.

import { STOPS } from './stops.js';
import { log, note, aboard, shipHand } from './ledger.js';
import { runsHere } from './wants.js';
import { makeCompany } from './company.js';

const PRICES = { fresh: 3, provisions: 500, repair: 500, boat: 150 };  // dollars -- inferred

// What is on offer here, as a list the page can draw.
export function offers(l) {
  const s = STOPS[l.at];
  const men = aboard(l).length;
  const short = Math.max(0, 32 - men);
  const out = [
    { key: 'fresh', said: `Fresh food for the company &mdash; $${PRICES.fresh * men}`, on: true },
    { key: 'provisions', said: `Six months’ salt provisions &mdash; $${PRICES.provisions}`, on: l.provisions < 12 }
  ];
  if (s.repairs && l.hull > 0) {
    out.push({ key: 'repair', said: `Heave her down and repair the hull &mdash; $${PRICES.repair} and a month`, on: l.hull > 1 });
  }
  if (l.at !== 'fayal' && l.boats < l.ship.boats) {
    out.push({ key: 'boat', said: `A new whaleboat &mdash; $${PRICES.boat}`, on: true });
  }
  if (short && s.ships) {
    const n = Math.min(short, s.ships.most);
    out.push({ key: 'ship', n, said: `Ship ${n} ${s.ships.rate}${n > 1 ? 's' : ''} &mdash; $${n * s.ships.advance} advance`, on: true });
  }
  if (s.freight && (l.sperm + l.whale) > 0) {
    out.push({ key: 'freight', said: `Send her ${l.sperm + l.whale} barrels home by freighter &mdash; ` +
      'a tenth of their value, and her hold is empty again', on: false });
  }
  return out;
}

// How likely the men are to run, in words, with and without liberty.
export function risk(l, liberty) {
  const p = chanceOfRunning(l, liberty) * aboard(l).length;
  return p < 0.7 ? 'few if any' : p < 2 ? 'one or two' : p < 4.5 ? 'several' : 'a good many';
}

function chanceOfRunning(l, liberty) {
  const s = STOPS[l.at];
  let p = (s.runs || 0) * (liberty ? 1.6 : 0.4) * (1 + l.weary / 100);
  if (l.flags.flogged) p *= 1.5;
  if (l.flags.promised && l.month - l.flags.promised > 4) p *= 3;
  return p;
}

// A word from the boatsteerers, if a man means to run here.
export function informer(l) {
  const port = l.at;
  const m = aboard(l).find((x) => x.want === `run:${port}` && !x.wantSeen);
  if (!m || l.flags.told === l.month) return null;
  l.flags.told = l.month;
  if (Math.random() < 0.5) return null;
  m.wantSeen = true;
  return `One of the boatsteerers tells you quietly that ${m.name} means to run here.`;
}

// Weigh anchor: pay for what was chosen, and count who is missing.
export function leave(l, chosen, liberty) {
  const s = STOPS[l.at];
  const lines = [];
  l.water = 10;
  if (chosen.fresh) {
    l.outlays += PRICES.fresh * aboard(l).length;
    l.fresh = 0; l.flags.scurvy = false;
    for (const m of l.men) if (m.health === 'sick') m.health = 'sound';
  }
  if (chosen.provisions) { l.outlays += PRICES.provisions; l.provisions = Math.min(30, l.provisions + 6); }
  if (chosen.repair) { l.outlays += PRICES.repair; l.hull = 0; l.month += 1; lines.push('A month hove down on the beach, and her seams are tight again.'); }
  if (chosen.boat) { l.outlays += PRICES.boat; l.boats += 1; }
  if (chosen.freight) {
    const value = l.sperm * 31.5 * 0.94 + l.whale * 31.5 * 0.34;
    l.outlays += Math.round(value * 0.1);
    l.shipped += l.sperm; l.shippedWhale = (l.shippedWhale || 0) + l.whale;
    lines.push(`${l.sperm + l.whale} barrels sent home in the freighter.`);
    l.sperm = 0; l.whale = 0;
  }

  const p = chanceOfRunning(l, liberty);
  const ran = [];
  for (const m of aboard(l)) {
    if (m.health !== 'sound' || !/Foremast|Boatsteerer/.test(m.berth)) continue;
    if (runsHere(m, l.at, liberty) || Math.random() < p) {
      m.health = 'ran'; note(m, `ran at ${s.said}`); ran.push(m.name);
    }
  }
  if (ran.length) lines.push(`${ran.join(', ')} did not come off to the ship. They have run.`);
  else lines.push('Every man came off to the ship.');

  if (chosen.ship && s.ships) {
    const want = Math.min(Math.max(0, 32 - aboard(l).length), s.ships.most);
    const names = makeCompany().all.map((m) => m.name);
    for (let i = 0; i < want; i++) shipHand(l, names[i], s.ships.rate, s.said);
    l.outlays += want * s.ships.advance;
    if (want) lines.push(`${want} new hand${want > 1 ? 's' : ''} shipped as ${s.ships.rate}${want > 1 ? 's' : ''}.`);
  }

  l.weary = liberty ? 0 : Math.max(0, l.weary - 30);
  l.flags.flogged = false;
  l.flags.portDone = true;
  log(l, `Sailed from ${s.said}. ${lines.join(' ')}`);
  l.cards.push({ key: 'said', head: `Leaving ${s.said}`, text: lines.join(' ') });
}

