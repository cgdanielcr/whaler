// The roster: the ship's company on paper beside the exploded ship. Pick a
// station to choose who works it; pick a man to see what he is. At the top,
// what the men where they stand are doing for the ship.
import { STATIONS, SLOTS, slotStation, slotName, STAT_NAMES } from './stations.js';
import { LEVEL_NAMES } from './company.js';
import { describeEffects } from './effects.js';
import { SIGHT } from './lookout.js';
import { BOATS, SEATS } from './boatcrews.js';
import { layOf } from './lay.js';

const $ = (id) => document.getElementById(id);
const pips = (n) => '●'.repeat(Math.round(n)) + '○'.repeat(Math.max(0, 5 - Math.round(n)));
const stars = (lv) => '★'.repeat(lv) + '☆'.repeat(2 - lv);
const bar = (h) => `<i class="hbar"><i style="width:${Math.max(0, h)}%;background:${h > 60 ? '#7fb069' : h > 30 ? '#d9a441' : '#e2674f'}"></i></i>`;

export function makeRoster({ company, crews, voyage, onChange, onSelect }) {
  const body = $('rosterBody'), head = $('rosterFx');
  let deck = 'upper', mode = 'stations', arg = null, flash = null;

  const holder = (key) => {
    const m = company.man(key), st = slotStation(key);
    return m ? `<b>${m.name}</b> <em>${stars(company.level(m, st.id))} ${company.score(m, st).toFixed(1)}</em>` : '<b class="empty">empty</b>';
  };
  const place = (m) => { const k = company.stationOf(m.id); return k ? slotName(k) : ''; };
  const seatName = (m) => { const at = crews.seatOf(m.id); return at ? `${SEATS[at[1]].name}, ${BOATS[at[0]].name.toLowerCase()}` : ''; };
  const pct = (k) => `${Math.round(k * 100)}%`;
  const sat = (m, s) => (m ? `<b>${m.name}</b> <em>${stars(company.level(m, `boat-${SEATS[s].id}`))} ${crews.score(m, s).toFixed(1)}</em>` : '<b class="empty">empty</b>');

  // The boats: who sits where, whether she is lowered for whales, and what her crew is worth.
  function boatList() {
    return BOATS.map((boat, b) => { const q = crews.quality(b);
      return `<div class="st"><div class="stname">${boat.name} <small>${crews.lost[b] ? 'stove and lost; the carpenter will rig a spare' : `pull ${pct(q.pull)} · dart ${pct(q.dart)} · lance ${pct(q.lance)}`}</small></div>` +
        `<button class="slot" data-lower="${b}"><span>Lowers</span><b>${crews.lower[b] ? 'when whales are raised' : 'no: kept on the davits'}</b></button>` +
        SEATS.map((seat, s) => `<button class="slot" data-seat="${b}:${s}"><span>${seat.name}</span>${sat(crews.who(b, s), s)}</button>`).join('') + '</div>';
    }).join('') + `<p class="quiet">Spare boats on the skids: ${crews.spares}.</p>`;
  }
  function seatChoice(b, s) {
    return `<button class="back" data-back>‹ Back</button><div class="stname">${SEATS[s].name} of the ${BOATS[b].name.toLowerCase()} <small>calls for ${STAT_NAMES[SEATS[s].uses]}</small></div>` +
      crews.candidates(b, s).map((m) => {
        const now = seatName(m), made = s === 0 && !m.officer ? ' · would be made mate' : s === 1 && (m.rank === 'able' || m.rank === 'green') ? ' · would be made boatsteerer' : '';
        return `<button class="man" data-sit="${m.id}"><span><b>${m.name}</b> <small>${m.title}${now ? ` · now ${now}` : ''}${made}</small></span><span><em>${crews.score(m, s).toFixed(1)}</em></span></button>`;
      }).join('') + '<button class="man quiet" data-sit="">Leave it empty</button>';
  }

  function stations() {
    const list = STATIONS.filter((s) => s.deck === deck);
    if (!list.length) return '<p class="quiet">No stations on this deck.</p>';
    return list.map((s) => `<div class="st${flash === s.id ? ' flash' : ''}"><div class="stname">${s.name} <small>${STAT_NAMES[s.uses]}${s.gang ? ', when trying out' : ''}${s.known ? '' : ' · place inferred'}</small></div>` +
      SLOTS.filter((k) => slotStation(k).id === s.id).map((k) =>
        `<button class="slot" data-slot="${k}"><span>${s.watch ? (k.endsWith('L') ? 'Larboard' : 'Starboard') : s.spots ? `No. ${Number(k.split(':')[1]) + 1}` : ''}</span>${holder(k)}</button>`).join('') + '</div>').join('');
  }

  function roll() {
    const alive = company.alive();
    const groups = [['Officers', (m) => m.officer], ['Boatsteerers', (m) => m.rank === 'boatsteerer'],
      ['Larboard watch', (m) => m.watch === 'larboard' && m.rank !== 'boatsteerer'], ['Starboard watch', (m) => m.watch === 'starboard' && m.rank !== 'boatsteerer'],
      ['Idlers', (m) => !m.officer && !m.watch]];
    return groups.map(([t, f]) => `<div class="grp">${t}</div>` + alive.filter(f).map((m) =>
      `<button class="man" data-man="${m.id}"><span><b>${m.name}</b> <small>${m.title}, ${m.age}</small></span><span>${bar(m.health)}<small>${place(m)}</small></span></button>`).join('')).join('');
  }

  function choose(key) {
    const st = slotStation(key);
    return `<button class="back" data-back>‹ Back</button><div class="stname">${slotName(key)} <small>calls for ${STAT_NAMES[st.uses]}</small></div>` +
      company.candidates(key).map((m) => {
        const now = place(m);
        return `<button class="man" data-assign="${m.id}"><span><b>${m.name}</b> <small>${m.title}${now ? ` · now ${now}` : ''}</small></span>` +
          `<span><em>${stars(company.level(m, st.id))} ${company.score(m, st).toFixed(1)}</em></span></button>`;
      }).join('') + '<button class="man quiet" data-assign="">Leave it empty</button>';
  }

  function card(id) {
    const m = company.byId(id);
    const trades = Object.entries(m.trades).filter(([, n]) => n > 1).map(([t, n]) => `<div class="row"><span>${STAT_NAMES[t]}</span><b>${pips(n)}</b></div>`).join('');
    const served = Object.entries(m.xp).map(([sid, d]) => `<div class="row"><span>${STATIONS.find((s) => s.id === sid).name}</span><b>${LEVEL_NAMES[company.level(m, sid)]}, ${d} days</b></div>`).join('');
    return `<button class="back" data-back>‹ Back</button><div class="title">${m.name}</div>` +
      `<div class="sub">${m.title}, aged ${m.age}, of ${m.home}${m.watch ? ` · ${m.watch} watch` : ''}</div>` +
      `<div class="row"><span>Health</span>${bar(m.health)}</div>` +
      `<div class="row"><span>Lay</span><b>1/${layOf(m)}</b></div>` +
      (m.lastPay != null ? `<div class="row"><span>Last voyage</span><b>${m.lastPay < 0 ? `owed $${(-m.lastPay).toFixed(2)}` : `paid $${m.lastPay.toFixed(2)}`}</b></div>` : '') +
      Object.entries(m.stats).map(([k, n]) => `<div class="row"><span>${STAT_NAMES[k]}</span><b>${pips(n)}</b></div>`).join('') + trades +
      `<div class="grp">Station</div><p class="quiet">${place(m) || 'None: he works where he is told.'}</p>` +
      `<div class="grp">Boat</div><p class="quiet">${seatName(m) || (m.officer ? 'None' : 'None: he stays aboard as a shipkeeper.')}</p>` +
      (served ? `<div class="grp">Time served</div>${served}` : '');
  }

  function render() {
    head.innerHTML = describeEffects(voyage.fx, { sight: SIGHT }).map(([k, t]) => `<div class="row"><span>${k}</span><b>${t}</b></div>`).join('');
    document.querySelectorAll('#rosterTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === mode || (mode === 'choose' && b.dataset.tab === 'stations') || (mode === 'card' && b.dataset.tab === 'company') || (mode === 'seat' && b.dataset.tab === 'boats')));
    body.innerHTML = mode === 'stations' ? stations() : mode === 'company' ? roll() : mode === 'boats' ? boatList()
      : mode === 'seat' ? seatChoice(...arg) : mode === 'choose' ? choose(arg) : card(arg);
  }

  document.querySelectorAll('#rosterTabs button').forEach((b) => { b.onclick = () => { mode = b.dataset.tab; render(); }; });
  body.onclick = (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.slot) { mode = 'choose'; arg = t.dataset.slot; }
    else if (t.dataset.seat) { mode = 'seat'; arg = t.dataset.seat.split(':').map(Number); }
    else if (t.dataset.lower) { const b = Number(t.dataset.lower); crews.lower[b] = !crews.lower[b]; }
    else if (t.dataset.sit !== undefined) { crews.assign(...arg, t.dataset.sit === '' ? null : Number(t.dataset.sit)); voyage.refresh(); onChange(); mode = 'boats'; }
    else if (t.dataset.back !== undefined) { mode = mode === 'card' ? 'company' : mode === 'seat' ? 'boats' : 'stations'; onSelect(null); }
    else if (t.dataset.assign !== undefined) {
      company.assign(arg, t.dataset.assign === '' ? null : Number(t.dataset.assign));
      voyage.refresh(); onChange(); mode = 'stations';
    } else if (t.dataset.man) { mode = 'card'; arg = Number(t.dataset.man); onSelect(arg); }
    render();
  };

  return {
    render,
    setDeck(id) { deck = id; if (mode === 'choose') mode = 'stations'; render(); },
    showStation(id) { deck = STATIONS.find((s) => s.id === id).deck; mode = 'stations'; flash = id; render(); flash = null; },
    showMan(id) { mode = 'card'; arg = id; onSelect(id); render(); },
  };
}
