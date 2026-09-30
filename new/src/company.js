// The ship's company: twenty-nine men by name, each with his rank, his watch,
// his stats, his health, and what he has learned at each station he has
// worked. A good third of them are boys and young men, as on the real ships
// (MORGAN.md, section 2). Hawaii is "the Sandwich Islands", as it was in 1841.
import { SLOTS, slotStation } from './stations.js';
import { hud } from './hud.js';
import { START, spiritFactor } from './morale.js';

const rand = Math.random;
const pick = (a) => a[Math.floor(rand() * a.length)];
const roll = (a, b) => a + Math.floor(rand() * (b - a + 1));
const clamp = (n) => Math.max(1, Math.min(5, n));

const HOMES = [
  [3, 'Nantucket', ['Obed', 'Tristram', 'Peleg', 'Zenas', 'Silas', 'Reuben', 'Seth', 'Jethro', 'Barzillai', 'Elihu'], ['Coffin', 'Folger', 'Starbuck', 'Macy', 'Gardner', 'Hussey', 'Swain', 'Bunker', 'Coleman']],
  [4, 'New Bedford', ['William', 'John', 'George', 'Thomas', 'James', 'Henry', 'Samuel', 'Joseph', 'Charles', 'Isaiah'], ['Howland', 'Russell', 'Allen', 'Delano', 'Tabor', 'Spooner', 'Cuffe', 'Wood', 'Ricketson']],
  [2, "Martha's Vineyard", ['Ezra', 'Amos', 'Nathaniel', 'Josiah', 'Benjamin'], ['Luce', 'Norton', 'Mayhew', 'Daggett', 'Cleveland']],
  [3, 'the Azores', ['Manuel', 'José', 'António', 'João', 'Francisco'], ['Silva', 'Sousa', 'Medeiros', 'Furtado', 'Ávila', 'Pereira']],
  [2, 'Cape Verde', ['João', 'Pedro', 'António', 'Domingos'], ['Lopes', 'Gomes', 'Fernandes', 'Andrade', 'Brito']],
  [1, 'the Sandwich Islands', ['Keawe', 'Kalani', 'Kanoa', 'Makoa'], ['Kahale', 'Maui', 'Kealoha']],
  [1, 'Ireland', ['Patrick', 'Michael', 'Dennis'], ['Murphy', 'Kelly', 'Sullivan']],
];

// Rank: title, where he berths, his ages, and his stats before chance
// [strength, eye, nerve, seamanship]; idlers bring a trade.
const RANKS = {
  master: { title: 'Master', berth: 'cabin', age: [30, 45], base: [3, 4, 5, 5], officer: true },
  mate: { title: 'Mate', berth: 'cabin', age: [24, 36], base: [3, 4, 4, 4], officer: true },
  boatsteerer: { title: 'Boatsteerer', berth: 'steerage', age: [20, 28], base: [4, 4, 4, 3] },
  able: { title: 'Able seaman', berth: 'forecastle', age: [19, 32], base: [3, 3, 3, 3] },
  green: { title: 'Green hand', berth: 'forecastle', age: [15, 19], base: [3, 2, 2, 1] },
  cooper: { title: 'Cooper', berth: 'steerage', age: [28, 50], base: [3, 2, 2, 2], trade: 'coopering' },
  carpenter: { title: 'Carpenter', berth: 'steerage', age: [28, 50], base: [3, 2, 2, 2], trade: 'carpentry' },
  cook: { title: 'Cook', berth: 'steerage', age: [25, 50], base: [2, 2, 2, 2], trade: 'cooking' },
  steward: { title: 'Steward', berth: 'steerage', age: [22, 45], base: [2, 2, 2, 2], trade: 'stewarding' },
  boy: { title: 'Cabin boy', berth: 'steerage', age: [12, 15], base: [1, 2, 2, 1] },
};
const MUSTER = [['master'], ['mate', 'First mate'], ['mate', 'Second mate'], ['mate', 'Third mate'],
  ...[0, 1, 2, 3].map((i) => ['boatsteerer', null, i % 2 ? 'starboard' : 'larboard']),
  ...Array.from({ length: 10 }, (_, i) => ['able', null, i % 2 ? 'starboard' : 'larboard']),
  ...Array.from({ length: 6 }, (_, i) => ['green', null, i % 2 ? 'starboard' : 'larboard']),
  ['cooper'], ['carpenter'], ['cook'], ['steward'], ['boy']];
const TRADES = ['cooking', 'carpentry', 'coopering', 'stewarding'];
const LEVELS = [0, 7, 20];                 // days served at a station to become able, then expert
export const LEVEL_NAMES = ['green', 'able', 'expert'];

let nextId = 1;
function man(rank, title, watch) {
  const r = RANKS[rank], [, home, firsts, lasts] = weighted();
  const [s, e, n, sea] = r.base.map((b) => clamp(b + roll(-1, 1)));
  const trades = Object.fromEntries(TRADES.map((t) => [t, rand() < 0.12 ? roll(2, 3) : 1]));
  if (r.trade) trades[r.trade] = roll(3, 5);
  return {
    id: nextId++, name: `${pick(firsts)} ${pick(lasts)}`, home, age: roll(...r.age), rank, title: title || r.title,
    watch: watch || null, berth: r.berth, officer: !!r.officer,
    stats: { strength: s, eye: e, nerve: n, seamanship: sea }, trades, health: 100, spirits: START, xp: {}, alive: true,
  };
}
function weighted() {
  let r = rand() * HOMES.reduce((a, h) => a + h[0], 0);
  for (const h of HOMES) if ((r -= h[0]) <= 0) return h;
  return HOMES[0];
}

export function makeCompany() {
  const men = MUSTER.map(([rank, title, watch]) => man(rank, title, watch));
  const slots = Object.fromEntries(SLOTS.map((k) => [k, null]));
  const byId = (id) => men.find((m) => m.id === id);

  const level = (m, stationId) => LEVELS.filter((d) => (m.xp[stationId] || 0) >= d).length - 1;
  const base = (m, uses) => m.stats[uses] ?? m.trades[uses];
  // How well a man works a station: his stat, what he has learned there, and how sick he is.
  const score = (m, st) => (base(m, st.uses) + level(m, st.id) * 0.75) * (0.5 + m.health / 200) * spiritFactor(m);
  const stationOf = (id) => SLOTS.find((k) => slots[k] === id) || null;
  const fits = (m, key) => {
    if (!m.alive) return false;
    const st = slotStation(key), w = key.split(':')[1];
    if (st.id === 'cutting') return m.rank === 'mate';      // the mates cut in, with spades from the stage
    if (m.officer) return false;                             // the master and mates keep no other station
    if (st.watch) return m.watch === (w === 'L' ? 'larboard' : 'starboard');
    return true;
  };

  function assign(key, id) {
    if (id != null) { const old = stationOf(id); if (old) slots[old] = null; }
    slots[key] = id;
  }
  const candidates = (key) => men.filter((m) => fits(m, key)).sort((a, b) => score(b, slotStation(key)) - score(a, slotStation(key)));

  // Fill empty places with the best men not already placed. Trades first, so the cook cooks.
  function fillEmpty() {
    const order = [...SLOTS].sort((a, b) => (slotStation(b).uses in men[0].trades) - (slotStation(a).uses in men[0].trades));
    for (const key of order) {
      if (slots[key] != null && byId(slots[key])?.alive) continue;
      slots[key] = candidates(key).find((m) => !stationOf(m.id))?.id ?? null;
    }
  }
  fillEmpty();

  function kill(m) {
    m.alive = false;
    const at = stationOf(m.id);
    if (at) slots[at] = null;
  }

  return {
    men, slots, byId, score, level, stationOf, candidates, assign, fits,
    alive: () => men.filter((m) => m.alive),
    get count() { return men.filter((m) => m.alive).length; },
    man: (key) => (slots[key] != null ? byId(slots[key]) : null),
    scoreAt: (key) => { const m = slots[key] != null && byId(slots[key]); return m ? score(m, slotStation(key)) : 0; },

    // Raise a man: a seaman to boatsteerer, a boatsteerer to mate. A mate keeps
    // no watch station and moves aft to the cabin.
    promote(m, rank) {
      const r = RANKS[rank];
      Object.assign(m, { rank, title: r.title, berth: r.berth, officer: !!r.officer });
      if (m.officer) { m.watch = null; const at = stationOf(m.id); if (at && !fits(m, at)) slots[at] = null; }
      hud.toast(`${m.name} is made ${r.title.toLowerCase()}.`);
    },

    // Men lost overboard or in a stove boat: from that boat's crew, or else
    // from the foremast hands and boatsteerers. Returns their names.
    lose(n, from = null) {
      const pool = (from || men.filter((m) => m.alive && !m.officer)).filter((m) => m.alive).sort(() => rand() - 0.5);
      const gone = pool.slice(0, n);
      gone.forEach(kill);
      return gone.map((m) => m.name);
    },

    // Each day at sea: time served at a station teaches, sickness wears men down
    // and care builds them up. Returns what the owner should hear.
    newDay({ trying, sicken, heal }) {
      const said = [];
      for (const key of SLOTS) {
        const m = slots[key] != null && byId(slots[key]), st = slotStation(key);
        if (!m || (st.gang && !trying)) continue;
        const before = level(m, st.id);
        m.xp[st.id] = (m.xp[st.id] || 0) + 1;
        if (level(m, st.id) > before) said.push(`${m.name} is now ${LEVEL_NAMES[level(m, st.id)] === 'expert' ? 'expert' : 'able'} ${st.says}.`);
      }
      const died = [];
      for (const m of men.filter((x) => x.alive)) {
        m.health = Math.min(100, m.health - sicken * (0.6 + rand() * 0.8) + heal);
        if (m.health <= 0) { kill(m); died.push(m.name); }
      }
      return { said, died };
    },

    // At the wharf: the sick are made well, the dead are replaced by green hands.
    refit() {
      for (const m of men) { m.health = 100; m.spirits = START; }     // a run ashore puts them right
      men.forEach((m, i) => {                 // a lost seaman is replaced by a green hand; others in kind
        if (!m.alive) men[i] = man(m.rank === 'able' ? 'green' : m.rank, m.officer ? m.title : null, m.watch);
      });
      fillEmpty();
    },
  };
}
