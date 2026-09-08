// The watch bill: who is in which watch, what he is rated, and where he is
// stationed when the hands are called. Press b to open it.
//
// The names are yours to change. Click one and type over it.
import { readClock } from './clock.js';

const ORDER = ['mate', 'boatsteerer', 'tradesman', 'able seaman', 'ordinary seaman', 'green hand'];

// Where a man goes when the watch is called to work ship.
const STATION_SAID = {
  'the deck': 'has the deck',
  topman: 'aloft',
  afterguard: 'braces and wheel',
  waister: 'hauls on deck',
  'day work': 'his trade'
};

export function makeWatchBill(company) {
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
        `<td class="rate">${m.berth === 'Foremast hand' ? m.rate : m.berth.toLowerCase()}</td>` +
        `<td class="post">${STATION_SAID[m.station]}</td></tr>`).join('') +
      `</table><p class="tally">${men.length} hands</p></div>`;
  }

  function draw(gameSeconds) {
    const onDeck = readClock(gameSeconds).onDeck;
    panel.innerHTML =
      '<h2>The watch bill</h2>' +
      '<div class="watches">' + column('starboard', onDeck) + column('larboard', onDeck) + '</div>' +
      '<p class="note">Thirty hands under you. She is divided in two, four hours ' +
      'on deck and four below, so about half of them are up at any moment. ' +
      'Calling all hands turns out both watches at once.<br>' +
      'Click a name to change it. <b>b</b> or <b>esc</b> to close.</p>';

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

  // The bill is redrawn only when the watch changes, so that a name being
  // typed is not swept away under the cursor.
  let lastWatch = '';
  return function tick(gameSeconds) {
    clockAt = gameSeconds;
    const now = readClock(gameSeconds).onDeck;
    if (showing() && now !== lastWatch) draw(gameSeconds);
    lastWatch = now;
  };
}
