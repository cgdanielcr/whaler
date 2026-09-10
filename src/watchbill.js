// The watch bill: who is in which watch, what he is rated, and where he is
// stationed when the hands are called. Press b to open it.
//
// The names are yours to change. Click one and type over it.
import { readClock } from './clock.js';
import { section, bindSection } from './cutaway.js';

const ORDER = ['mate', 'boatsteerer', 'tradesman', 'able seaman', 'ordinary seaman', 'green hand'];

// Where a man goes when the watch is called to work ship.
const STATION_SAID = {
  'the deck': 'has the deck',
  topman: 'aloft',
  afterguard: 'braces and wheel',
  waister: 'hauls on deck',
  'day work': 'his trade'
};

export function makeWatchBill(company, crew) {
  const panel = document.createElement('div');
  panel.id = 'watch-bill';
  panel.style.display = 'none';
  document.body.appendChild(panel);

  function column(watch, onDeck) {
    const men = [...company.watch(watch)]
      .sort((a, b) => ORDER.indexOf(a.rate) - ORDER.indexOf(b.rate));

    return `<div class="watch${watch === onDeck ? ' up' : ''}">` +
      `<h3>${watch} watch` +
      `<span class="where">${watch === onDeck ? 'on deck' : 'below'}</span></h3>` +
      '<table>' + men.map((m) =>
        `<tr><td class="who"><span class="name" contenteditable="true" ` +
        `spellcheck="false" data-id="${m.id}">${m.name}</span></td>` +
        `<td class="rate">${m.berth === 'Foremast hand' ? m.rate : m.berth.toLowerCase()}` +
        `<span class="age">${m.age}</span></td>` +
        `<td class="post">${STATION_SAID[m.station]}</td></tr>`).join('') +
      `</table><p class="tally">${men.length} hands</p></div>`;
  }

  // The idlers keep no watch. They work through the day at their trades, and
  // turn out with the rest when all hands are called.
  function idlerColumn() {
    return '<div class="watch idlers"><h3>Idlers<span class="where">no watch</span></h3>' +
      '<table>' + company.idlers.map((m) =>
        `<tr><td class="who"><span class="name" contenteditable="true" ` +
        `spellcheck="false" data-id="${m.id}">${m.name}</span></td>` +
        `<td class="rate">${m.berth.toLowerCase()}<span class="age">${m.age}</span></td>` +
        `<td class="post${m.job ? ' set' : ''}">${m.job || m.idler}</td></tr>`).join('') +
      `</table><p class="tally">${company.idlers.length} hands</p></div>`;
  }

  function draw(gameSeconds) {
    const onDeck = readClock(gameSeconds).onDeck;
    panel.innerHTML =
      '<h2>The ship in section</h2>' +
      // Where every man is this minute, drawn. The bill below says the same
      // thing in a table; this says it as a place.
      section(company, crew, gameSeconds) +
      '<p class="whois"></p>' +
      '<h2 class="bill">The watch bill</h2>' +
      '<div class="watches">' + column('starboard', onDeck) + column('larboard', onDeck) +
      idlerColumn() + '</div>' +
      '<p class="note">Thirty-two hands under you, which with yourself makes ' +
      'the thirty-three a whaleship of this size averaged. Twenty-seven keep ' +
      'watches, four hours on deck and four below; the five idlers keep no ' +
      'watch and work at their trades through the day.<br>' +
      'Look at their ages. A whaleship was worked by boys: on this ship&rsquo;s ' +
      'real first voyage in 1841, twelve of her thirty hands were between ' +
      'fifteen and nineteen.<br>' +
      'A watch of twelve cannot reef topsails or tack ship on its own. Both ' +
      'want all hands, and always did.<br>' +
      'Click a name to change it. <b>b</b> or <b>esc</b> to close.</p>';

    bindSection(panel, company);

    for (const el of panel.querySelectorAll('.name')) {
      el.addEventListener('blur', commit);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); el.blur(); }
        e.stopPropagation();
      });
    }
  }

  function commit(e) {
    const el = e.target;
    const man = company.all.find((m) => m.id === Number(el.dataset.id));
    if (man) el.textContent = company.rename(man, el.textContent);
  }

  const showing = () => panel.style.display !== 'none';
  let clockAt = 0;

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable) return;
    if (e.key === 'b' || e.key === 'B') { show(!showing()); e.preventDefault(); }
    else if (e.key === 'Escape') show(false);
  });

  function show(to) {
    if (to) {
      draw(clockAt);
      const orders = document.getElementById('orders-card');   // only one at a time
      if (orders) orders.style.display = 'none';
    }
    panel.style.display = to ? '' : 'none';
  }

  // The bill is redrawn only when the watch turns over or a man is set to a
  // new piece of work, so that a name being typed is not swept away under the
  // cursor.
  let last = '';
  return function tick(gameSeconds) {
    clockAt = gameSeconds;
    // The section must also follow the men about, so a piece of work starting
    // or ending redraws it -- but never while a name is being typed.
    const now = readClock(gameSeconds).onDeck +
      company.idlers.map((m) => m.job || '').join('|') +
      '|' + crew.running.map((o) => o.name).join(',') +
      '|' + company.all.filter((m) => m.inBoat).length;
    if (showing() && now !== last && !panel.contains(document.activeElement)) draw(gameSeconds);
    last = now;
  };
}
