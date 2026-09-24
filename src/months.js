// A month of the voyage: what it costs her, and what it brings.
//
// Time between stops is skipped, not sailed. What is left is the decisions:
// where to go, how hard to drive the men, whether to lower. Every month costs
// water, bread and strength; what a month on a ground brings is drawn from
// what really happened, weighted for play.

import { STOPS } from './stops.js';
import { log, note, sound, pick, boatsCanLower } from './ledger.js';
import { drawEvent } from './events.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const roll = (a, b) => Math.round(a + Math.random() * (b - a));
const chance = (p) => Math.random() < p;

// The month itself, wherever she is.
function pass(l, pace) {
  l.month += 1;
  l.water = Math.max(0, l.water - 1);
  l.provisions = Math.max(0, l.provisions - 1);
  l.fresh += 1;
  l.weary += { passage: -10, hard: 15, easy: -15, port: 0 }[pace] || 0;
  if (l.hull >= 2) l.weary += 10;                    // the pumps, every watch
  if (l.water === 0) {
    l.weary += 15;
    const man = pick(sound(l));
    if (man) { man.health = 'sick'; note(man, 'fell sick when the water ran out'); }
    l.cards.push({ key: 'dry' });
  }
  if (l.provisions === 0) { l.weary += 20; l.cards.push({ key: 'shortAllowance' }); }
  l.weary = clamp(l.weary, 0, 100);

  for (const m of l.men) {
    if (m.health === 'hurt' && chance(0.4)) m.health = 'sound';
    if (m.health === 'sick' && l.fresh > 10 && chance(0.12)) {
      m.health = 'lost';
      note(m, 'died of the scurvy');
      log(l, `${m.name} died of the scurvy, and was buried at sea.`);
    }
  }
  if (l.fresh > 7 && !l.flags.scurvy && chance((l.fresh - 7) * 0.15)) {
    const sick = pick(sound(l).filter((m) => m.berth === 'Foremast hand'));
    if (sick) { sick.health = 'sick'; note(sick, 'took the scurvy'); }
    l.flags.scurvy = true;
    l.cards.push({ key: 'scurvy', man: sick && sick.id });
  }

  for (const g in l.grounds) if (g !== l.at) l.grounds[g] = Math.max(0, l.grounds[g] - 0.08);
}

// A passage from one stop to the next.
export function sail(l, link) {
  const from = STOPS[l.at].said;
  log(l, `Sailed from ${from} for ${STOPS[link.to].said}.`);
  for (let i = 0; i < link.months; i++) {
    pass(l, 'passage');
    if (chance(0.2)) drawEvent(l, 'passage');
  }
  if (link.via === 'horn' && chance(0.6)) l.cards.push({ key: 'horn' });
  l.at = link.to;
  l.flags.portDone = false;
  if (link.to === 'newbedford') {
    l.over = { month: l.month };
    log(l, 'Came to anchor off New Bedford, and the voyage is done.');
    return;
  }
  l.cards.push({ key: 'arrive' });
  log(l, `Raised ${STOPS[link.to].said}.`);
}

// A month on a cruising ground. Hard, the mastheads manned dawn to dusk and
// every spout lowered for; easy, watch and watch, and the men get some sleep.
export function cruise(l, pace) {
  pass(l, pace);
  const g = STOPS[l.at];
  const fished = l.grounds[l.at] || 0;
  const rich = Math.max(0.05, g.rich(l.month) - fished);
  l.grounds[l.at] = Math.min(0.3, fished + 0.03);

  const typhoon = g.typhoons && g.typhoons(l.month);
  if (chance(g.gales + (typhoon ? 0.4 : 0))) l.cards.push({ key: 'gale', typhoon });
  if (chance(0.3)) drawEvent(l, 'ground');

  let raised = 0;
  for (let i = 0; i < (pace === 'hard' ? 3 : 2); i++) {
    if (!chance(rich * (pace === 'hard' ? 1 : 0.5))) continue;
    raised += 1;
    const right = l.at === 'japan' && chance(0.2);
    l.cards.push({ key: 'raised', right });
  }
  if (!raised && !l.cards.length) l.cards.push({ key: 'quiet' });
  log(l, `A month on ${g.said}, cruising ${pace === 'hard' ? 'hard' : 'easy'}. ` +
    `${raised ? `Whales raised ${['', 'once', 'twice', 'three times'][raised]}.` : 'Nothing raised.'}`);
}

// What a boat can bring back. The list is hunt.js's, and so are the weights
// but for the stove boats, which are halved because each boat now draws for
// itself: in a school, every boat goes on to a whale of her own.
const ENDINGS = [
  { w: 36, key: 'killed', said: 'fast, lanced, and killed' },
  { w: 14, key: 'sleigh', said: 'fast, and towed miles to windward on a Nantucket sleigh ride before he tired and died' },
  { w: 18, key: 'sounded', said: 'fast, but he sounded and took the line down; they cut loose' },
  { w: 13, key: 'drew', said: 'fast, but the iron drew' },
  { w: 12, key: 'parted', said: 'fast, but the line parted' },
  { w: 5, key: 'stove', said: 'stove by his flukes; the men picked out of the water' },
  { w: 2, key: 'lost', said: 'stove, and not all of them found' }
];

// The master keeps the ship; the mates head the boats. The first mate's is
// the larboard boat, the second's the waist boat, the third's the bow boat.
const BOATS = ['larboard boat', 'waist boat', 'bow boat'];

function draw(tired, boats) {
  const weights = ENDINGS.map((e) => {
    if (e.key === 'killed' || e.key === 'sleigh') return e.w * (1 - tired * 0.5);
    if (e.key === 'stove' || e.key === 'lost') return e.w * (1 + tired);
    return e.w;
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  return ENDINGS[weights.findIndex((w) => (r -= w) < 0)] || ENDINGS[0];
}

export function lower(l, right = false) {
  const boats = right ? 1 : boatsCanLower(l);
  const tired = l.weary / 100;
  const out = { said: '', barrels: 0, lines: [] };
  const mates = sound(l).filter((m) => m.rate === 'mate');
  const oars = sound(l).filter((m) => m.rate !== 'tradesman' && m.rate !== 'mate' && m.berth !== 'Cabin boy');
  const says = [];
  let took = 0, whales = 0;

  for (let b = 0; b < boats; b++) {
    const end = draw(tired, boats);
    const head = mates[b];
    says.push(`The ${BOATS[b]}${head ? ` (${head.name})` : ''}: ${end.said}.`);
    if (end.key === 'killed' || end.key === 'sleigh') {
      whales += 1;
      took += right ? roll(60, 110) : end.key === 'sleigh' ? roll(40, 80) : roll(30, 65);
      const who = pick(oars.filter((m) => m.rate === 'boatsteerer'));
      if (who) note(who, `struck a ${right ? 'right' : 'sperm'} whale on ${STOPS[l.at].said}`);
      if (!right && chance(1 / 40)) {
        l.ambergris += roll(15, 60) * 100;
        out.lines.push('Cutting in, the cooper found ambergris in one of them: a lump worth more than all his oil.');
      }
    }
    if (end.key === 'stove' || end.key === 'lost') {
      l.boats = Math.max(0, l.boats - 1);
      const man = pick(oars);
      if (man) {
        man.health = end.key === 'lost' ? 'lost' : 'hurt';
        note(man, end.key === 'lost' ? `drowned when the ${BOATS[b]} was stove` : `hurt when the ${BOATS[b]} was stove`);
        out.lines.push(end.key === 'lost' ? `${man.name} was drowned.` : `${man.name} was hauled out badly hurt.`);
      }
      out.lines.push(`The ${BOATS[b]} is past mending. ${l.boats} boats left.`);
    }
  }

  if (whales) {
    const room = l.ship.capacity - l.sperm - l.whale;
    const stowed = Math.min(room, took);
    if (right) l.whale += stowed; else l.sperm += stowed;
    if (stowed < took) out.lines.push(`She is full. ${took - stowed} barrels could not be stowed.`);
    l.weary = clamp(l.weary + 8 * whales, 0, 100);
    out.lines.push(`${whales === 1 ? 'The whale was' : `${whales} whales were`} cut in and tried out: ` +
      `${stowed} barrels of ${right ? 'whale' : 'sperm'} oil stowed down.`);
    out.barrels = stowed;
  }
  out.said = says.join(' ');
  log(l, `Lowered. ${out.said} ${out.lines.join(' ')}`);
  return out;
}
