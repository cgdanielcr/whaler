// The end of a voyage: the oil sold, the charges, every man's lay, what the
// owners keep and what they think of it; or the loss of the ship.
import { reckon, payList } from './lay.js';
import { leavers } from './morale.js';
import { REPAIR, NEW_SHIP, money } from './stores.js';
import { hud } from './hud.js';

// Made fast at the wharf. `next` is called when the owner is ready to fit out again.
export function settle({ v, company, career }, next) {
  const r = reckon(company, v), repairs = Math.round(100 - v.hull) * REPAIR, net = r.owners - repairs;
  for (const s of r.shares) s.m.lastPay = s.dead ? null : s.due;
  const lay = r.shares.find((s) => s.m.rank === 'master')?.due || 0;
  const lines = [
    `Made fast at the wharf after <b>${v.days}</b> days at sea, with <b>${v.taken}</b> whales taken.`,
    `Whale oil: <b>${v.whale}</b> barrels. Sperm oil: <b>${v.sperm}</b> barrels. The oil fetches <b>${money(r.gross)}</b>, less <b>${money(r.charges)}</b> in charges.`,
    `The men's lays come to <b>${money(r.crew)}</b>. The owners keep <b>${money(r.owners)}</b>${repairs > 0 ? `, less <b>${money(repairs)}</b> for repairs to her hull: <b>${money(net)}</b>` : ''}.`,
  ];
  if (r.inDebt) lines.push(`${r.inDebt} ${r.inDebt === 1 ? 'man comes' : 'men come'} home owing the ship for slops.`);
  if (v.lost || v.boatsLost) lines.push(`Lost: <b>${v.lost}</b> men and <b>${v.boatsLost}</b> boats.`);
  const going = leavers(company);                           // the unhappy, and those who owe, will not ship again
  if (going.length) lines.push(`<b>${going.length}</b> will not ship with you again: ${going.map((m) => `${m.name} (${m.title.toLowerCase()})`).join(', ')}.`);
  lines.push(...career.settle(net, lay, v.taken), payList(r));
  company.lose(going.length, going);
  finish('The voyage is made', lines, career, next);
}

// She is gone.
export function shipLost({ v, career }, how, next) {
  const lines = [
    `${how} The Mastiff goes down with <b>${v.whale + v.sperm}</b> barrels of oil in her.`,
    'Those still alive take to the boats, and are picked up and brought home.',
    `The owners must buy another ship: <b>${money(NEW_SHIP)}</b>.`,
    ...career.shipLost(),
  ];
  finish('The ship is lost', lines, career, next);
}

function finish(title, lines, career, next) {
  if (!career.over) return hud.ended(title, lines, next);
  lines.push(`<b>${career.over}</b>`, `Your whaling, all told: ${career.summary()}`);
  career.forget();
  hud.ended(title, lines, () => location.reload(), 'Begin again with a new command');
}
