// The owners' letter, the standing board of what you were told to do, and the
// account of it when it is done.
//
// The letter is the first thing on the screen and she lies hove to behind it
// until you have read it. Nothing here touches how she sails.
import { compassPoint, signedDiff } from './wind.js';
import { VOYAGES, choose } from './voyages.js';

// A voyage named as it would be on a list of them.
const named = (o) => (o.n ? `Voyage ${o.n} — ${o.title.toLowerCase()}` : o.title);
const link = (o, said) => `<button class="link" data-to="${o.key}">${said || named(o)}</button>`;
const others = (v, but) => VOYAGES.filter((o) => o.key !== v.key && o !== but)
  .map((o) => link(o)).join(' &nbsp;·&nbsp; ');

const SPELT = ['right on', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

// How her head lies against the bearing of the mark, in points of the compass,
// which is how it would have been said. A point is eleven and a quarter degrees.
export function headSaid(bearing, heading) {
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

export function makeInstructions(v, { begin, letterFirst = true }) {
  const allows = (group) => v.allow.includes(group);

  // --- the letter ------------------------------------------------------------

  const letter = document.createElement('div');
  letter.id = 'letter';
  letter.innerHTML =
    '<h2>The owners to the master</h2>' +
    v.letter.map((p, i) => `<p class="${i === 0 ? 'dateline' : ''}">${p}</p>`).join('') +
    // A voyage with a pilot does not get a wall of keys: he hands you one
    // button at a time, which is the whole point of him.
    (v.steps ? '' :
      '<h3>How she is worked</h3><ul class="keys">' +
      KEYS.filter(([g]) => allows(g)).map(([, said]) => `<li></li>`).join('') +
      '</ul>') +
    '<p class="go"><button class="sail">Sail</button></p>' +
    `<p class="other">Or sail instead: ${others(v)}</p>`;
  // When the shipping office is up, the letter waits behind it.
  if (!letterFirst) letter.style.display = 'none';
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
      '<dt>Her head</dt><dd class="head"></dd>' +
      // Sailed against made good. On a beating leg these two part company,
      // and watching them do it is the lesson.
      '<dt>Sailed</dt><dd class="through"></dd>' +
      '<dt>Made good</dt><dd class="made"></dd></dl>';
    const right = document.getElementById('right') || document.body;
    right.insertBefore(board, right.firstChild);
  }

  const out = board ? {
    leg: board.querySelector('.leg'),
    bear: board.querySelector('.bear'),
    run: board.querySelector('.run'),
    head: board.querySelector('.head'),
    through: board.querySelector('.through'),
    made: board.querySelector('.made')
  } : null;

  const putText = (el, text) => { if (el.__said !== text) { el.__said = text; el.textContent = text; } };

  // --- the account -----------------------------------------------------------

  const done = document.createElement('div');
  done.id = 'voyage-done';
  done.style.display = 'none';
  document.body.appendChild(done);

  // What the mate makes of how you sailed her, judged against what this
  // voyage could be sailed in. A reach he expects you to hold; a beat to
  // windward gains a little over half a mile in every mile even when it is
  // done well, so the same figure means quite different things.
  const well = v.wellSailed || 0.9;

  function word(passage) {
    if (passage.lost && passage.lost.length) {
      return 'Not whole, sir. That is what carrying too much canvas costs.';
    }
    if (v.squalls) {
      return 'She came through it whole, sir. That is what shortening down in time buys you.';
    }
    if (passage.worth >= well) return 'Handsomely sailed, sir. You did not waste a mile of it.';
    if (passage.worth >= well * 0.85) {
      return 'Well enough. A little more attention to her head and you would have saved half an hour.';
    }
    return 'You wandered, sir. Every mile she sails off her course is a mile she sails twice.';
  }

  return {
    update(passage, heading) {
      if (!out) return;
      putText(out.leg, passage.legSaid === 'home' ? 'the homeward leg' : 'the outward leg');
      putText(out.bear, `${compassPoint(passage.bearing)} — ${Math.round(passage.bearing)}°`);
      putText(out.run, `${passage.toRun.toFixed(1)} miles to ${passage.legSaid}`);
      putText(out.head, headSaid(passage.bearing, heading));
      putText(out.through, `${passage.sailed.toFixed(1)} miles`);
      putText(out.made, `${passage.made.toFixed(1)} of ${passage.total}`);
    },

    // Written up when she has run her legs. The whaling cruise never comes
    // here; it has an account of its own.
    account(passage, clockAt) {
      const a = passage.arrived;
      const next = VOYAGES[VOYAGES.indexOf(v) + 1];
      // Leg by leg, when there is more than one. Six miles to windward and six
      // miles home are the same six miles only on the chart.
      const legs = passage.legs;
      const byLeg = legs.length > 1
        ? legs.map((l) => `<dt>To ${l.said}</dt><dd>${l.took}` +
            `<span class="through">${l.through.toFixed(1)} miles sailed for ${l.miles}</span></dd>`).join('')
        : '';

      // A voyage that comes back is home; one that only goes out has fetched
      // what it was sent for.
      const home = legs.length && legs[legs.length - 1].said === 'home';

      done.innerHTML =
        `<h2>Voyage ${v.n} — ${v.title}</h2>` +
        `<p class="home">${home ? 'She is home, and the anchor down.'
                                : 'The mark is under her bow.'}</p><dl>` +
        byLeg +
        `<dt>${home ? 'Out and home in' : 'Run in'}</dt><dd>${a.took}</dd>` +
        `<dt>Sailed through the water</dt><dd>${a.sailed.toFixed(1)} miles</dd>` +
        `<dt>Her best</dt><dd>${passage.most.toFixed(1)} knots</dd>` +
        `<dt>Of every mile sailed, made good</dt><dd>${Math.round(a.worth * 100)}%</dd>` +
        `<dt>At</dt><dd>${clockAt}</dd></dl>` +
        (a.lost.length
          ? `<p>She is not whole: ${a.lost.map((d) => `${d.name.toLowerCase()} — ${d.kind}`).join('; ')}.</p>`
          : '<p>Every sail and every spar she began with.</p>') +
        `<p class="mate">&ldquo;${word(a)}&rdquo;</p>` +
        (next ? `<p class="go"><button class="on" data-to="${next.key}">${named(next)}</button></p>` : '') +
        `<p class="other">Or ${link(v, 'sail this one again')} &nbsp;·&nbsp; ${others(v, next)}</p>`;

      for (const b of done.querySelectorAll('.on')) {
        b.addEventListener('click', () => choose(b.dataset.to));
      }

      for (const b of done.querySelectorAll('.link')) {
        b.addEventListener('click', () => choose(b.dataset.to));
      }
      done.style.display = '';
    }
  };
}
