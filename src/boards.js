// The boards she is conned by: what canvas she carries, what the hands are
// working at, and what o'clock it is.
import { readClock } from './clock.js';
import { DESTINATION } from './passage.js';
import { compassPoint } from './wind.js';

const TIERS = [
  { tier: 'royal',      label: 'Royals',      key: '4' },
  { tier: 'topgallant', label: 'Topgallants', key: '3' },
  { tier: 'topsail',    label: 'Topsails',    key: '2 or r' },
  { tier: 'course',     label: 'Courses',     key: '1' },
  { tier: 'spanker',    label: 'Spanker',     key: '5' },
  { tier: 'headsail',   label: 'Headsails',   key: '6' }
];

// Only write when the words have actually changed. The boards are redrawn
// every frame, and rebuilding a line you are hovering would sweep the glossary
// term out from under the mouse sixty times a second.
const put = (el, html) => { if (el.__said !== html) { el.__said = html; el.innerHTML = html; } };
const putText = (el, text) => { if (el.__said !== text) { el.__said = text; el.textContent = text; } };

function panel(id, html, where) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'board';
  el.innerHTML = html;
  const home = where ? document.getElementById(where) : null;
  (home || document.body).appendChild(el);
  return el;
}

export function makeBoards(rig, crew, company) {
  const canvas = panel('canvas-board', '<h2>Canvas</h2><table></table>' +
    '<p class="note"><b>1</b>-<b>6</b> shorten &nbsp; shift to make sail' +
    '<br><b>a</b> make sail all round &nbsp; <b>f</b> shorten all round' +
    '<br><b>t</b> tack &nbsp; <b>w</b> wear &nbsp; <b>&larr; &rarr;</b> helm' +
    '<br><b>h</b> all hands &nbsp; <b>space</b> bring her to' +
    '<br><b>-</b> <b>=</b> slower and faster &nbsp; drag to look about' +
    '<br><b>m</b> mend what is broken &nbsp; <b>c</b> go on deck<br><b>b</b> the watch bill &nbsp; <b>?</b> all orders</p>');

  const rows = {};
  for (const t of TIERS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="name">${t.label}</td><td class="state"></td><td class="key">${t.key}</td>`;
    canvas.querySelector('table').appendChild(tr);
    rows[t.tier] = tr.querySelector('.state');
  }

  const orders = panel("orders-board",
    "<h2>Orders</h2><ul></ul><p class='hands'></p><p class='hurt'></p><p class='word'></p>");
  const list = orders.querySelector('ul');
  const hands = orders.querySelector(".hands");
  const hurt = orders.querySelector(".hurt");
  const word = orders.querySelector('.word');
  let saying = 0;

  const clock = panel('clock-board', '<div class="time"></div><div class="watch"></div><div class="pace"></div>', 'right');
  const track = panel('track-board', '<h2>Passage</h2><dl>' +
    '<dt>To run</dt><dd class="to-run"></dd>' +
    '<dt>Bearing</dt><dd class="to-bear"></dd>' +
    '<dt>Made good</dt><dd class="made"></dd>' +
    '<dt>Sailed</dt><dd class="sailed"></dd></dl>', 'right');
  const reckoning = {
    toRun: track.querySelector('.to-run'),
    bear: track.querySelector('.to-bear'),
    made: track.querySelector('.made'),
    sailed: track.querySelector('.sailed')
  };

  // What she has left below. She cannot send ashore for any of it.
  const locker = panel('stores-board', '<h2>Stores</h2><dl></dl><p class="short"></p>', 'right');
  const lockerList = locker.querySelector('dl');
  const lockerWord = locker.querySelector('.short');

  const landfall = panel('landfall', '');
  landfall.style.display = 'none';
  const out = {
    time: clock.querySelector('.time'),
    watch: clock.querySelector('.watch'),
    pace: clock.querySelector('.pace')
  };

  const update = function (gameSeconds, pace, sea, passage, stores) {
    put(lockerList, stores.all.map((s) =>
      `<dt>${s.said}</dt><dd class="${s.out ? 'out' : s.low ? 'low' : ''}">${s.reads}</dd>`).join(''));
    put(lockerWord, stores.word);

    reckoning.toRun.textContent = `${passage.toRun.toFixed(1)} miles`;
    reckoning.bear.textContent = `${passage.bearingSaid} — ${Math.round(passage.bearing)}°`;
    reckoning.made.textContent = `${passage.made.toFixed(1)} of ${DESTINATION.miles} miles`;
    reckoning.sailed.textContent = `${passage.sailed.toFixed(1)} miles`;

    for (const t of TIERS) {
      const state = rig.stateOf(t.tier);
      const cell = rows[t.tier];
      putText(cell, rig.working(t.tier) ? `${state} …` : state);
      cell.className = 'state' + (state === 'gone' ? ' lost' : rig.working(t.tier) ? ' working'
        : state === 'furled' ? ' furled' : state === 'set' ? '' : ' reefed');
    }

    // The bar creeps along every frame, so it is moved on its own and the
    // words around it are left alone unless they have really changed.
    put(list, crew.running.length || crew.waiting.length
      ? crew.running.map((o) =>
          `<li><span class="what">${o.name}</span>` +
          `<span class="left">${crew.remaining(o)} min</span>` +
          `<span class="bar"><i></i></span>` +
          (o.posted || []).map((p) =>
            `<span class="post"><b>${p.at}</b> &mdash; ` +
            `${p.men.map((m) => m.name).join(', ')}</span>`).join('') +
          '</li>').join('') +
        crew.waiting.map((o) =>
          `<li class="held"><span class="what">${o.name}</span>` +
          `<span class="left">wants ${o.hands} hands</span></li>`).join('')
      : '<li class="idle">nothing in hand</li>');

    const bars = list.querySelectorAll('.bar i');
    crew.running.forEach((o, i) => {
      if (bars[i]) bars[i].style.width = `${Math.round((o.elapsed / o.seconds) * 100)}%`;
    });

    const t = readClock(gameSeconds);
    const mate = company.mateOf(t.onDeck);
    put(hands, `<b>${crew.free}</b> of ${crew.onDeck} hands free &mdash; ` +
      `crew ${crew.weariness}${crew.allHands ? ' &mdash; <em>all hands on deck</em>' : ''}` +
      (mate ? `<br>${mate.name}, ${mate.berth.toLowerCase()}, has the deck` : ''));

    // What she is carrying away, and what she has already lost.
    const lost = rig.hurt();
    const strain = sea.over > 1 ? 'She is dangerously over-pressed for this wind.'
      : sea.over === 1 ? 'She is carrying more than this wind will bear.' : '';
    put(hurt,
      (strain ? `<span class="strain">${strain}</span>` : '') +
      (lost.length ? `<span class="lost">${lost.map((d) => `${d.name} &mdash; ${d.kind}`).join('<br>')}</span>` : ''));

    out.time.textContent = t.time;
    put(out.watch, `${t.watch}, ${t.bells}<br>${t.onDeck} watch on deck`);
    // "her clock at ×1" rather than "running ×1": running is a point of sail,
    // and the glossary would offer the wrong meaning for it here.
    put(out.pace, (pace === 0 ? 'hove to — she waits on you' : `her clock at ×${pace}`) +
      (sea.held ? '<br><span class="held-back">no speeding up with a squall in sight</span>' : ''));
    out.pace.className = 'pace' + (pace === 0 ? ' paused' : '');
  };

  // A word from the mate, for an order she cannot obey.
  const say = (text) => {
    word.textContent = text;
    clearTimeout(saying);
    saying = setTimeout(() => { word.textContent = ''; }, 6000);
  };

  // The account of the passage, written up when she comes to her anchorage.
  const account = (arrived, clockAt) => {
    const spars = arrived.lost.length
      ? `<p>She did not come by it whole: ${arrived.lost.map((d) => `${d.name.toLowerCase()} &mdash; ${d.kind}`).join('; ')}.</p>`
      : '<p>She came by it with every sail and every spar she began with.</p>';

    landfall.innerHTML =
      '<h2>The passage</h2>' +
      `<p class="took">${DESTINATION.miles} miles to the ${compassPoint(DESTINATION.bearing)}, ` +
      `made good in <b>${arrived.took}</b>.</p>` +
      '<dl>' +
      `<dt>Made good</dt><dd>${arrived.made.toFixed(1)} miles</dd>` +
      `<dt>Sailed through the water</dt><dd>${arrived.sailed.toFixed(1)} miles</dd>` +
      `<dt>Of every mile sailed, made good</dt><dd>${Math.round(arrived.worth * 100)}%</dd>` +
      `<dt>Averaged</dt><dd>${arrived.average.toFixed(1)} knots</dd>` +
      `<dt>Landfall at</dt><dd>${clockAt}</dd>` +
      '</dl>' + spars +
      '<p class="again">Reload the page to sail her again.</p>';

    // The passage is over; the working boards have nothing left to say.
    for (const b of document.querySelectorAll('#canvas-board, #orders-board, #right')) {
      b.style.transition = 'opacity 1.2s';
      b.style.opacity = 0;
    }
    landfall.style.display = '';
  };

  return { update, say, account };
}
