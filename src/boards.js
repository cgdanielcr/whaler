// The boards she is conned by, laid out as her papers: what canvas she
// carries mast by mast, what the hands are working at, what o'clock it is,
// what is left below, and how the passage goes.
import { readClock } from './clock.js';
import { compassPoint } from './wind.js';
import { sailGlyph, foreAftGlyph } from './glyphs.js';

// The sail plan as a grid: the tiers down, her three masts across. The mizzen
// carries no course -- that yard is the crossjack and it carries nothing --
// and the headsails all stand on the fore stays, so those cells are blank.
const MASTS = ['fore', 'main', 'mizzen'];
const TIERS = [
  { tier: 'royal',      label: 'Royals',      key: '4' },
  { tier: 'topgallant', label: 'Topgallants', key: '3' },
  { tier: 'topsail',    label: 'Topsails',    key: '2' },
  { tier: 'course',     label: 'Courses',     key: '1' },
  { tier: 'spanker',    label: 'Spanker',     key: '5', foreAft: 'spanker' },
  { tier: 'headsail',   label: 'Headsails',   key: '6', foreAft: 'headsail' }
];

const put = (el, html) => { if (el.__said !== html) { el.__said = html; el.innerHTML = html; } };
const putText = (el, text) => { if (el.__said !== text) { el.__said = text; el.textContent = text; } };

// How long a piece of work has left to run, in her own time.
const clockOf = (minutes) => {
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m} min`;
};

function panel(id, html, where) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'board';
  el.innerHTML = html;
  (document.getElementById(where) || document.body).appendChild(el);
  return el;
}

// The keys, gathered by the work they belong to, so that a voyage which does
// not allow a thing does not advertise it either.
const LEGEND = [
  ['sail', '<b>1</b>-<b>6</b> shorten'],
  ['sail', '<b>shift</b> to make sail'],
  ['sail', '<b>a</b> all round'],
  ['sail', '<b>f</b> shorten all round'],
  ['manoeuvre', '<b>t</b> tack'],
  ['manoeuvre', '<b>w</b> wear'],
  ['allhands', '<b>h</b> all hands'],
  ['helm', '<b>&larr; &rarr;</b> helm'],
  ['clock', '<b>space</b> bring her to'],
  ['mend', '<b>m</b> mend'],
  ['whale', '<b>l</b> lower'],
  ['whale', '<b>o</b> cut in and try out'],
  ['look', '<b>c</b> on deck'],
  ['look', '<b>b</b> the watch bill'],
  ['look', '<b>g</b> the glass'],
  ['look', '<b>?</b> all orders']
];

export function makeBoards(rig, crew, company, allows = () => true, legend = true) {
  const canvas = panel('canvas-board',
    '<h2>Canvas</h2>' +
    '<table><thead><tr><td></td>' +
    MASTS.map((m) => `<th>${m}</th>`).join('') + '<td></td></tr></thead><tbody></tbody></table>' +
    // What the drawings mean, which is half the lesson.
    '<p class="states">' +
    [['set', 'set'], ['1st reef', 'reefed'], ['2nd reef', 'twice'],
     ['close-reefed', 'close'], ['furled', 'furled']]
      .map(([s, said]) => `<span>${sailGlyph(s, false)}<i>${said}</i></span>`).join('') + '</p>' +
    // On a voyage with a pilot at your elbow the legend is noise: he gives you
    // the button for the one thing that is wanted now.
    (legend
      ? '<p class="legend">' +
        LEGEND.filter(([g]) => allows(g)).map(([, said]) => said).join(' &nbsp; ') + '</p>'
      : ''));

  const body = canvas.querySelector('tbody');
  const cells = {};
  for (const t of TIERS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th class="tier">${t.label}</th>` +
      MASTS.map((m) => `<td class="cell" data-m="${m}"></td>`).join('') +
      `<td class="key">${t.key}</td>`;
    body.appendChild(tr);
    cells[t.tier] = {};
    for (const td of tr.querySelectorAll('.cell')) cells[t.tier][td.dataset.m] = td;
  }

  const orders = panel('orders-board',
    "<h2>Orders</h2><ul></ul><p class='hands'></p><p class='chase'></p>" +
    "<p class='hurt'></p><p class='word'></p>");
  const list = orders.querySelector('ul');
  const hands = orders.querySelector('.hands');
  const hurt = orders.querySelector('.hurt');
  const word = orders.querySelector('.word');
  const chase = orders.querySelector('.chase');
  let saying = 0;

  const clock = panel('clock-board',
    '<div class="time"></div><div class="watch"></div><div class="bell"></div>' +
    '<div class="rule"></div><h3>Wind</h3><div class="wind"></div>' +
    '<div class="rule"></div><h3>Her head</h3><div class="head"></div>' +
    '<div class="rule"></div><h3>Speed</h3><div class="speed"></div>' +
    '<div class="pace"></div>', 'right');

  const track = panel('track-board', '<h2>Passage</h2><dl>' +
    '<dt>To run</dt><dd class="to-run"></dd>' +
    '<dt>Bearing</dt><dd class="to-bear"></dd>' +
    '<dt>Made good</dt><dd class="made"></dd>' +
    '<dt>Sailed</dt><dd class="sailed"></dd></dl>', 'right');

  const locker = panel('stores-board', '<h2>Stores</h2><dl></dl><p class="short"></p>', 'right');

  const out = {
    time: clock.querySelector('.time'),
    watch: clock.querySelector('.watch'),
    bell: clock.querySelector('.bell'),
    wind: clock.querySelector('.wind'),
    head: clock.querySelector('.head'),
    speed: clock.querySelector('.speed'),
    pace: clock.querySelector('.pace'),
    toRun: track.querySelector('.to-run'),
    bear: track.querySelector('.to-bear'),
    made: track.querySelector('.made'),
    sailed: track.querySelector('.sailed'),
    stores: locker.querySelector('dl'),
    short: locker.querySelector('.short')
  };

  const landfall = panel('landfall', '');
  landfall.style.display = 'none';

  const update = function (gameSeconds, pace, sea, passage, stores, lookouts, hunt, cruise, workUp, air) {
    put(out.stores, stores.all.map((s) =>
      `<dt>${s.said}</dt><dd class="${s.out ? 'out' : s.low ? 'low' : ''}">${s.reads}</dd>`).join(''));
    put(out.short, stores.word);

    const cruising = cruise && cruise.onGround;
    putText(out.toRun, cruising
      ? `day ${Math.floor(cruise.days(gameSeconds)) + 1} on the ground`
      : `${passage.toRun.toFixed(1)} miles`);
    putText(out.bear, `${passage.bearingSaid} — ${Math.round(passage.bearing)}°`);
    putText(out.made, cruising
      ? `${cruise.barrels} barrels, ${cruise.whales} whale${cruise.whales === 1 ? '' : 's'}`
      : `${passage.made.toFixed(1)} of ${passage.total} miles`);
    putText(out.sailed, `${passage.sailed.toFixed(1)} miles`);

    // The sail plan, one cell to a sail.
    for (const t of TIERS) {
      const busy = rig.working(t.tier);
      for (const m of MASTS) {
        const state = rig.stateOf(t.tier, m);
        put(cells[t.tier][m], t.foreAft
          ? foreAftGlyph(state, busy, t.foreAft)
          : sailGlyph(state, busy));
      }
    }

    // The orders in hand, each with a ring that fills as the work goes on.
    put(list, crew.running.length || crew.waiting.length
      ? crew.running.map((o) =>
          `<li><span class="ring"><svg viewBox="0 0 24 24">` +
          `<circle class="track" cx="12" cy="12" r="9"/>` +
          `<circle class="done" cx="12" cy="12" r="9"/></svg></span>` +
          `<span class="what">${o.name}<em>${o.hands} hands</em></span>` +
          `<span class="left">${clockOf(crew.remaining(o))}</span>` +
          (o.posted || []).map((p) =>
            `<span class="post"><b>${p.at}</b> &mdash; ${p.men.map((m) => m.name).join(', ')}</span>`
          ).join('') + '</li>').join('') +
        crew.waiting.map((o) =>
          `<li class="held"><span class="ring"><svg viewBox="0 0 24 24">` +
          `<circle class="track" cx="12" cy="12" r="9"/></svg></span>` +
          `<span class="what">${o.name}<em>wants ${o.hands} hands</em></span>` +
          `<span class="left">waiting</span></li>`).join('')
      : '<li class="idle">No orders in hand</li>');

    const rings = list.querySelectorAll('.ring .done');
    crew.running.forEach((o, i) => {
      if (!rings[i]) return;
      const c = 2 * Math.PI * 9;
      rings[i].style.strokeDasharray = `${c}`;
      rings[i].style.strokeDashoffset = `${c * (1 - o.elapsed / o.seconds)}`;
    });

    const t = readClock(gameSeconds);
    const mate = company.mateOf(t.onDeck);
    put(hands, `<b>${crew.free}</b> of ${crew.onDeck} hands free` +
      `${crew.allHands ? ' &mdash; <em>all hands on deck</em>' : ''}` +
      (mate ? `<br>${mate.name}, ${mate.berth.toLowerCase()}, has the deck` : '') +
      `<br>The company is <em class="fit">${crew.weariness}</em>` +
      (lookouts && lookouts.said ? `<br>At the mastheads: ${lookouts.said}` : ''));
    put(chase, [hunt && hunt.said, workUp && workUp.said].filter(Boolean).join('<br>'));

    const lost = rig.hurt();
    const strain = sea.over > 1 ? 'She is dangerously over-pressed for this wind.'
      : sea.over === 1 ? 'She is carrying more than this wind will bear.' : '';
    put(hurt, (strain ? `<span class="strain">${strain}</span>` : '') +
      (lost.length ? `<span class="lost">${lost.map((d) => `${d.name} &mdash; ${d.kind}`).join('<br>')}</span>` : ''));

    putText(out.time, t.time);
    putText(out.watch, t.watch);
    putText(out.bell, t.bells ? `${t.bells} — ${t.onDeck} watch` : `${t.onDeck} watch`);
    if (air) {
      put(out.wind, `${air.force}<br><span class="from">from the ${air.from}</span>`);
      put(out.head, `${air.headSaid}<br><span class="from">${Math.round(air.heading)}° — ${air.point}</span>`);
      putText(out.speed, air.knots < 0.05 ? 'no way on her' : `${air.knots.toFixed(1)} knots`);
    }
    put(out.pace, (pace === 0 ? 'hove to' : `her clock at ×${pace}`) +
      (sea.held ? '<br><span class="held-back">her clock is held back</span>' : ''));
    out.pace.className = 'pace' + (pace === 0 ? ' paused' : '');
  };

  // A word from the mate, for an order she cannot obey.
  const say = (text) => {
    word.textContent = text;
    clearTimeout(saying);
    saying = setTimeout(() => { word.textContent = ''; }, 6000);
  };

  // The account of the whole voyage, written up when she turns for home.
  const account = (ended, cruise, arrived, clockAt) => {
    const men = cruise.muster();
    const gone = men.filter((m) => m.health === 'lost');
    const hurtMen = men.filter((m) => m.health === 'hurt');
    const roll = men.map((m) =>
      `<li class="${m.health}"><b>${m.name}</b>, ${m.berth.toLowerCase()}` +
      (m.health === 'lost' ? ' &mdash; <em>lost</em>' : m.health === 'hurt' ? ' &mdash; <em>hurt</em>' : '') +
      (m.deeds ? `<span>${m.deeds.join('; ')}</span>` : '') + '</li>').join('');

    landfall.innerHTML =
      '<h2>The voyage</h2>' +
      `<p class="took"><b>${cruise.barrels}</b> barrels of sperm oil stowed down, ` +
      `out of ${cruise.whales} whale${cruise.whales === 1 ? '' : 's'} taken.</p>` +
      '<dl>' +
      `<dt>Days on the ground</dt><dd>${Math.round(ended.days)}</dd>` +
      `<dt>Sailed through the water</dt><dd>${arrived ? arrived.sailed.toFixed(0) : '—'} miles</dd>` +
      `<dt>Men brought home sound</dt><dd>${men.length - gone.length - hurtMen.length} of ${men.length}</dd>` +
      `<dt>She turned for home because</dt><dd>${ended.why}</dd>` +
      `<dt>At</dt><dd>${clockAt}</dd></dl>` +
      (rig.hurt().length
        ? `<p>She is not whole: ${rig.hurt().map((d) => `${d.name.toLowerCase()} &mdash; ${d.kind}`).join('; ')}.</p>`
        : '<p>She has every sail and every spar she began with.</p>') +
      (gone.length ? `<p class="toll">${gone.map((m) => m.name).join(' and ')} did not come home.</p>` : '') +
      '<h3>The company</h3><ul class="roll">' + roll + '</ul>' +
      '<p class="again">Reload the page to ship a new crew and sail her again.</p>';

    for (const b of document.querySelectorAll('#canvas-board, #orders-board, #right, #rose')) {
      b.style.transition = 'opacity 1.2s';
      b.style.opacity = 0;
    }
    landfall.style.display = '';
  };

  return { update, say, account };
}
