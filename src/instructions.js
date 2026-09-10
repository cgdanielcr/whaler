// The owners' letter, the standing board of what you were told to do, and the
// account of it when it is done.
//
// The letter is the first thing on the screen and she lies hove to behind it
// until you have read it. Nothing here touches how she sails.
import { compassPoint, signedDiff } from './wind.js';
import { choose } from './voyages.js';

const SPELT = ['right on', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

// How her head lies against the bearing of the mark, in points of the compass,
// which is how it would have been said. A point is eleven and a quarter degrees.
function headSaid(bearing, heading) {
  const off = signedDiff(bearing, heading);
  const points = Math.round(Math.abs(off) / 11.25);
  if (points === 0) return 'right on the mark';
  if (points > 8) return `well off it, and ${off > 0 ? 'starboard' : 'larboard'} of it`;
  return `${SPELT[points]} point${points > 1 ? 's' : ''} ` +
         `to ${off > 0 ? 'starboard' : 'larboard'} of it`;
}

// Only the keys this voyage allows are put in front of you. A key that is not
// on the board is not named, so that nothing is written down that cannot be
// found.
const KEYS = [
  ['helm', '<b>&larr;</b> <b>&rarr;</b> put the helm over'],
  ['sail', '<b>1</b>&ndash;<b>6</b> shorten sail, with <b>shift</b> to make it'],
  ['sail', '<b>a</b> make sail all round, <b>f</b> shorten all round'],
  ['manoeuvre', '<b>t</b> tack her, <b>w</b> wear her round'],
  ['mend', '<b>m</b> set the hands to mend what has carried away'],
  ['whale', '<b>l</b> lower the boats, <b>o</b> cut in and try out'],
  ['allhands', '<b>h</b> calls all hands, when a watch of twelve is not enough'],
  ['clock', '<b>space</b> brings her to; <b>&minus;</b> and <b>=</b> run her clock'],
  ['look', '<b>c</b> takes you down on deck, <b>b</b> opens the watch bill, ' +
           '<b>?</b> every order she answers to']
];

export function makeInstructions(v, { begin }) {
  const allows = (group) => v.allow.includes(group);

  // --- the letter ------------------------------------------------------------

  const letter = document.createElement('div');
  letter.id = 'letter';
  letter.innerHTML =
    '<h2>The owners to the master</h2>' +
    v.letter.map((p, i) => `<p class="${i === 0 ? 'dateline' : ''}">${p}</p>`).join('') +
    '<h3>How she is worked</h3>' +
    '<ul class="keys">' +
    KEYS.filter(([g]) => allows(g)).map(([, said]) => `<li>${said}</li>`).join('') +
    '</ul>' +
    '<p class="go"><button class="sail">Sail</button></p>' +
    (v.key === 'cruise'
      ? '<p class="other">Or <button class="link" data-to="feel">sail voyage one first</button> ' +
        '&mdash; a morning in home water, and nothing in the weather.</p>'
      : '<p class="other">Or <button class="link" data-to="cruise">go whaling instead</button> ' +
        '&mdash; the ship as she stands, and the whole Pacific.</p>');
  document.body.appendChild(letter);

  letter.querySelector('.sail').addEventListener('click', () => {
    letter.style.display = 'none';
    begin();
  });
  for (const b of letter.querySelectorAll('.link')) {
    b.addEventListener('click', () => choose(b.dataset.to));
  }

  // --- the standing board ----------------------------------------------------

  // The whaling cruise keeps the passage board it has always had. A short
  // voyage has a mark instead of a destination, so it gets its own.
  let board = null;
  if (!v.ground) {
    const track = document.getElementById('track-board');
    if (track) track.style.display = 'none';

    board = document.createElement('div');
    board.id = 'voyage-board';
    board.className = 'board';
    board.innerHTML =
      `<h2>Your orders</h2><p class="task">${v.task}</p><dl>` +
      '<dt>Now</dt><dd class="leg"></dd>' +
      '<dt>Bears</dt><dd class="bear"></dd>' +
      '<dt>To run</dt><dd class="run"></dd>' +
      '<dt>Her head</dt><dd class="head"></dd></dl>';
    const right = document.getElementById('right') || document.body;
    right.insertBefore(board, right.firstChild);
  }

  const out = board ? {
    leg: board.querySelector('.leg'),
    bear: board.querySelector('.bear'),
    run: board.querySelector('.run'),
    head: board.querySelector('.head')
  } : null;

  const putText = (el, text) => { if (el.__said !== text) { el.__said = text; el.textContent = text; } };

  // --- the account -----------------------------------------------------------

  const done = document.createElement('div');
  done.id = 'voyage-done';
  done.style.display = 'none';
  document.body.appendChild(done);

  // What the mate makes of how you sailed her. Her best point of sail is a
  // broad reach, and she will do four knots in a light breeze if you keep her
  // there; hang about in the wind's eye and she will not.
  function word(passage) {
    if (passage.lost && passage.lost.length) {
      return 'She is home, but not whole. That is what carrying too much canvas costs.';
    }
    if (passage.worth > 0.93) return 'Handsomely done, sir. She was never out of her best water.';
    if (passage.worth > 0.8) return 'Well enough. A little more attention to her head and you would have saved half an hour.';
    return 'You wandered, sir. Every mile she sails off her course is a mile she sails twice.';
  }

  return {
    update(passage, heading) {
      if (!out) return;
      putText(out.leg, passage.legSaid === 'home' ? 'the homeward leg' : 'the outward leg');
      putText(out.bear, `${compassPoint(passage.bearing)} — ${Math.round(passage.bearing)}°`);
      putText(out.run, `${passage.toRun.toFixed(1)} miles to ${passage.legSaid}`);
      putText(out.head, headSaid(passage.bearing, heading));
    },

    // Written up when she has run her legs. The whaling cruise never comes
    // here; it has an account of its own.
    account(passage, clockAt) {
      const a = passage.arrived;
      done.innerHTML =
        `<h2>Voyage ${v.n} — ${v.title}</h2>` +
        '<p class="home">She is home, and the anchor down.</p><dl>' +
        `<dt>Out and home in</dt><dd>${a.took}</dd>` +
        `<dt>Sailed through the water</dt><dd>${a.sailed.toFixed(1)} miles</dd>` +
        `<dt>Her best</dt><dd>${passage.most.toFixed(1)} knots</dd>` +
        `<dt>Of every mile sailed, made good</dt><dd>${Math.round(a.worth * 100)}%</dd>` +
        `<dt>At</dt><dd>${clockAt}</dd></dl>` +
        (a.lost.length
          ? `<p>She is not whole: ${a.lost.map((d) => `${d.name.toLowerCase()} — ${d.kind}`).join('; ')}.</p>`
          : '<p>Every sail and every spar she began with.</p>') +
        `<p class="mate">&ldquo;${word(a)}&rdquo;</p>` +
        '<p class="go"><button class="link" data-to="feel">Sail her again</button> &nbsp; ' +
        '<button class="link" data-to="cruise">Go whaling</button></p>';

      for (const b of done.querySelectorAll('.link')) {
        b.addEventListener('click', () => choose(b.dataset.to));
      }
      done.style.display = '';
    }
  };
}
