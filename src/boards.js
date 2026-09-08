// The boards she is conned by: what canvas she carries, what the hands are
// working at, and what o'clock it is.
import { readClock } from './clock.js';

const TIERS = [
  { tier: 'royal',      label: 'Royals',      key: '4' },
  { tier: 'topgallant', label: 'Topgallants', key: '3' },
  { tier: 'topsail',    label: 'Topsails',    key: '2 or r' },
  { tier: 'course',     label: 'Courses',     key: '1' },
  { tier: 'spanker',    label: 'Spanker',     key: '5' },
  { tier: 'headsail',   label: 'Headsails',   key: '6' }
];

function panel(id, html, where) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'board';
  el.innerHTML = html;
  const home = where ? document.getElementById(where) : null;
  (home || document.body).appendChild(el);
  return el;
}

export function makeBoards(rig, crew) {
  const canvas = panel('canvas-board', '<h2>Canvas</h2><table></table>' +
    '<p class="note"><b>1</b>-<b>6</b> shorten &nbsp; shift to make sail' +
    '<br><b>a</b> make sail all round &nbsp; <b>f</b> shorten all round' +
    '<br><b>t</b> tack &nbsp; <b>w</b> wear &nbsp; <b>&larr; &rarr;</b> helm' +
    '<br><b>h</b> all hands &nbsp; <b>space</b> bring her to' +
    '<br><b>-</b> <b>=</b> slower and faster &nbsp; drag to look about</p>');

  const rows = {};
  for (const t of TIERS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="name">${t.label}</td><td class="state"></td><td class="key">${t.key}</td>`;
    canvas.querySelector('table').appendChild(tr);
    rows[t.tier] = tr.querySelector('.state');
  }

  const orders = panel('orders-board', '<h2>Orders</h2><ul></ul><p class="hands"></p><p class="word"></p>');
  const list = orders.querySelector('ul');
  const hands = orders.querySelector('.hands');
  const word = orders.querySelector('.word');
  let saying = 0;

  const clock = panel('clock-board', '<div class="time"></div><div class="watch"></div><div class="pace"></div>', 'right');
  const out = {
    time: clock.querySelector('.time'),
    watch: clock.querySelector('.watch'),
    pace: clock.querySelector('.pace')
  };

  const update = function (gameSeconds, pace) {
    for (const t of TIERS) {
      const state = rig.stateOf(t.tier);
      const cell = rows[t.tier];
      cell.textContent = rig.working(t.tier) ? `${state} …` : state;
      cell.className = 'state' + (rig.working(t.tier) ? ' working'
        : state === 'furled' ? ' furled' : state === 'set' ? '' : ' reefed');
    }

    list.innerHTML = crew.running.map((o) => {
      const done = Math.round((o.elapsed / o.seconds) * 100);
      return `<li><span class="what">${o.name}</span>` +
             `<span class="left">${crew.remaining(o)} min</span>` +
             `<span class="bar"><i style="width:${done}%"></i></span></li>`;
    }).join('') + crew.waiting.map((o) =>
      `<li class="held"><span class="what">${o.name}</span>` +
      `<span class="left">wants ${o.hands} hands</span></li>`
    ).join('');

    if (!crew.running.length && !crew.waiting.length) {
      list.innerHTML = '<li class="idle">nothing in hand</li>';
    }

    hands.innerHTML = `<b>${crew.free}</b> of ${crew.onDeck} hands free &mdash; ` +
      `crew ${crew.weariness}${crew.allHands ? ' &mdash; <em>all hands on deck</em>' : ''}`;

    const t = readClock(gameSeconds);
    out.time.textContent = t.time;
    out.watch.innerHTML = `${t.watch}, ${t.bells}<br>${t.onDeck} watch on deck`;
    out.pace.textContent = pace === 0 ? 'hove to — she waits on you' : `running ×${pace}`;
    out.pace.className = 'pace' + (pace === 0 ? ' paused' : '');
  };

  // A word from the mate, for an order she cannot obey.
  const say = (text) => {
    word.textContent = text;
    clearTimeout(saying);
    saying = setTimeout(() => { word.textContent = ''; }, 6000);
  };

  return { update, say };
}
