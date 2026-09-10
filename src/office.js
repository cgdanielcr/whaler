// The shipping office: the voyages she may be sent on, and which of them you
// have sailed through to the end.
//
// Nothing here is locked. The order is the order they teach in, and the next
// one you have not sailed is marked, but a master who wants to go whaling on
// his first morning may go whaling on his first morning.
import { VOYAGES, sailed, choose } from './voyages.js';

export function makeOffice() {
  const done = sailed();
  const next = VOYAGES.find((v) => !done.includes(v.key));

  const office = document.createElement('div');
  office.id = 'office';
  office.innerHTML =
    '<h2>The shipping office</h2>' +
    '<p class="preamble">Five short voyages out of New Bedford, each one teaching ' +
    'a piece of how she is worked, and then the whole of her.</p>' +
    '<ul class="berth">' +
    VOYAGES.map((v) => {
      const sailedIt = done.includes(v.key);
      const isNext = v === next;
      return `<li class="${sailedIt ? 'done' : ''}${isNext ? ' next' : ''}">` +
        `<span class="mark">${sailedIt ? '&#10003;' : ''}</span>` +
        `<button class="link" data-to="${v.key}">` +
        `${v.n ? `Voyage ${v.n} — ${v.title.toLowerCase()}` : v.title}</button>` +
        // The cue belongs on the same line as the name, so it must come
        // before the line of what the voyage teaches.
        `<span class="cue">${isNext ? 'next' : ''}</span>` +
        `<span class="teaches">${v.teaches}</span>` +
        '</li>';
    }).join('') +
    '</ul>' +
    (done.length
      ? `<p class="note">${done.length} of ${VOYAGES.length} sailed. ` +
        'Your browser remembers this much and nothing else.</p>'
      : '<p class="note">Nothing sailed yet. Your browser will remember which ' +
        'ones you finish, and nothing else.</p>');
  document.body.appendChild(office);

  for (const b of office.querySelectorAll('.link')) {
    b.addEventListener('click', () => choose(b.dataset.to));
  }

  return office;
}
