// The glossary. Every sea term on the boards is underlined; hover one and she
// tells you what it means and lights up the part of herself it names.
//
// Nothing here changes how she sails. It only reads the boards and marks them.
import { TERMS } from './terms.js';
import { TAKE_IN, LET_OUT, TOPSAIL, SPANKER_REEF, MANOEUVRES } from './evolutions.js';

// Longest first, so "close-reefed" is not mistaken for "reef", nor "fresh
// gale" for "gale". A trailing s is allowed, since the boards say "Royals"
// where the dictionary says "royal".
const KEYS = Object.keys(TERMS).sort((a, b) => b.length - a.length);
const escaped = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FINDER = new RegExp(
  `\\b(?:${KEYS.map((k) => escaped(k) + (k.endsWith('s') ? '' : 's?')).join('|')})\\b`, 'gi');

// The word as written on the board, back to its entry in the dictionary.
function lookUp(word) {
  const w = word.toLowerCase();
  return TERMS[w] ? w : TERMS[w.replace(/s$/, '')] ? w.replace(/s$/, '') : null;
}

export function makeGlossary(rig) {
  const card = document.createElement('div');
  card.id = 'gloss';
  card.style.display = 'none';
  document.body.appendChild(card);

  // --- marking the boards ----------------------------------------------------

  let marking = false;

  function markUnder(node) {
    if (node.nodeType === 3) {
      const text = node.nodeValue;
      FINDER.lastIndex = 0;
      if (!FINDER.test(text)) return;
      FINDER.lastIndex = 0;
      const held = document.createElement('span');
      held.innerHTML = text.replace(FINDER, (hit) => {
        const key = lookUp(hit);
        return key ? `<span class="term" data-t="${key}">${hit}</span>` : hit;
      });
      node.parentNode.replaceChild(held, node);
      return;
    }
    // Never touch a name being typed on the watch bill.
    if (node.nodeType !== 1 || node.classList.contains('term') || node.isContentEditable) return;
    for (const child of [...node.childNodes]) markUnder(child);
  }

  const mark = (root) => {
    if (marking) return;
    marking = true;
    markUnder(root);
    marking = false;
  };

  // The boards rewrite themselves as she sails, so the marking has to be done
  // again each time they do. The guard above keeps our own writes from setting
  // the watcher off in a circle.
  const watcher = new MutationObserver((records) => {
    if (marking) return;
    const seen = new Set();
    for (const r of records) {
      const el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (el && !seen.has(el)) { seen.add(el); mark(el); }
    }
  });

  const watch = (el) => {
    if (!el) return;
    mark(el);
    watcher.observe(el, { childList: true, subtree: true, characterData: true });
  };

  // --- the definition card ---------------------------------------------------

  let showing = null;

  function show(span) {
    const entry = TERMS[span.dataset.t];
    const at = span.getBoundingClientRect();
    // A board that redrew itself between the mouse arriving and this call
    // leaves the word detached, with no box to hang the card on.
    if (!entry || !at.width) return;
    showing = span;
    card.innerHTML = `<h4>${span.textContent}</h4><p>${entry.say}</p>`;
    card.style.display = '';

    // Clear of the whole board the word sits in, so the board you are reading
    // is not covered by what it says. To the right of it if there is room,
    // otherwise to the left.
    const box = card.getBoundingClientRect();
    const host = (span.closest('.board') || span).getBoundingClientRect();
    let left = host.right + 14;
    if (left + box.width > window.innerWidth - 8) left = host.left - box.width - 14;
    const top = at.top + at.height / 2 - box.height / 2;
    card.style.left = `${Math.max(8, left)}px`;
    card.style.top = `${Math.max(8, Math.min(window.innerHeight - box.height - 8, top))}px`;

    rig.mark(entry.part);
    if (entry.board) document.getElementById(entry.board)?.classList.add('lit');
  }

  function hide() {
    if (!showing) return;
    const entry = TERMS[showing.dataset.t];
    if (entry?.board) document.getElementById(entry.board)?.classList.remove('lit');
    showing = null;
    card.style.display = 'none';
    rig.unmark();
  }

  // Moving onto anything that is not the term already shown puts the card
  // away. That also covers the case where a board has redrawn itself and the
  // word under the mouse is a new one.
  document.addEventListener('mouseover', (e) => {
    const span = e.target.closest?.('.term') || null;
    if (span === showing) return;
    hide();
    if (span) show(span);
  });
  document.addEventListener('mouseleave', hide);

  // --- the card of orders ----------------------------------------------------

  const cost = (e) => `${e.hands} hands, ${e.minutes} min`;
  const ORDERS = [
    ['1', 'Courses', `furl — ${cost(TAKE_IN.course)}`, `set — ${cost(LET_OUT.course)}`],
    ['2 or r', 'Topsails', `single-reef — ${cost(TOPSAIL['set>1st reef'])}`,
      `second reef — ${cost(TOPSAIL['1st reef>2nd reef'])}`,
      `close-reef — ${cost(TOPSAIL['2nd reef>close-reefed'])}`,
      `shake out a reef — ${cost(TOPSAIL['1st reef>set'])}`],
    ['3', 'Topgallants', `take in — ${cost(TAKE_IN.topgallant)}`, `set — ${cost(LET_OUT.topgallant)}`],
    ['4', 'Royals', `take in — ${cost(TAKE_IN.royal)}`, `set — ${cost(LET_OUT.royal)}`],
    ['5', 'Spanker', `brail in — ${cost(TAKE_IN.spanker)}`, `reef — ${cost(SPANKER_REEF)}`],
    ['6', 'Headsails', `haul down — ${cost(TAKE_IN.headsail)}`, `set — ${cost(LET_OUT.headsail)}`],
    ['t', 'Tack ship', `through the wind — ${cost(MANOEUVRES.tack)}`, 'quick, and it can fail'],
    ['w', 'Wear ship', `stern through the wind — ${cost(MANOEUVRES.wear)}`, 'slow, sure, loses ground']
  ];

  const sheet = document.createElement('div');
  sheet.id = 'orders-card';
  sheet.style.display = 'none';
  sheet.innerHTML = '<h2>The orders she answers to</h2><table>' +
    ORDERS.map(([key, what, ...lines]) =>
      `<tr><td class="k">${key}</td><td class="w">${what}</td>` +
      `<td class="d">${lines.join('<br>')}</td></tr>`).join('') +
    '</table><p class="note">' +
    'Hold <b>shift</b> with a number to make sail instead of shortening it.<br>' +
    '<b>a</b> makes sail all round, <b>f</b> shortens all round.<br>' +
    '<b>h</b> calls all hands: every hand aboard instead of the watch of twelve, ' +
    'and it tires them. Reefing topsails and tacking ship both want it.<br>' +
    '<b>&larr; &rarr;</b> put the helm over. <b>space</b> brings her to.<br>' +
    '<b>c</b> takes you down on deck and back to the quarterdeck.<br>' +
    '<b>b</b> opens the watch bill: who is in which watch, and what he is rated.<br>' +
    '<b>l</b> lowers three boats for a whale the mastheads have raised. Eighteen ' +
    'men go, and the watch on deck falls from twelve to three.<br>' +
    '<b>o</b> sets the hands on a whale alongside: cutting in first, which is ' +
    'all hands and most of a day, then trying out, which runs day and night.<br>' +
    '<b>m</b> sets the hands to mend whatever has carried away, out of her stores. ' +
    'A split sail wants a bolt of canvas; a sprung yard or topmast wants a spare ' +
    'spar and the carpenter.<br>' +
    'Her masts are held up by shrouds, stays and backstays. The ratlines ' +
    'across the shrouds are the ladder her topmen go aloft by.<br>' +
    '<b>-</b> and <b>=</b> run her clock slower and faster.<br>' +
    'Canvas comes off from the top down: royals, topgallants, then reef the topsails.' +
    '</p><p class="shut">? or esc to close</p>';
  document.body.appendChild(sheet);

  const toggle = (open) => {
    sheet.style.display = open ? '' : 'none';
    const bill = document.getElementById('watch-bill');        // only one at a time
    if (open && bill) bill.style.display = 'none';
  };
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.isContentEditable) return;
    if (e.key === '?') { toggle(sheet.style.display === 'none'); e.preventDefault(); }
    else if (e.key === 'Escape') toggle(false);
  });

  // The boards she is conned by. The clock face and the reckoning are numbers
  // and match nothing, so they cost only a failed search.
  for (const id of ['canvas-board', 'orders-board', 'track-board', 'clock-board', 'watch-bill',
                    'instruments', 'landfall', 'orders-card']) {
    watch(document.getElementById(id));
  }
}
