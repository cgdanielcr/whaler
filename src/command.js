// The command bar: every order she answers to, as a button you can press.
//
// Modelled on the command card of a real-time strategy game -- anchored along
// the bottom, her state on the left, the work in hand beside it, and the
// orders themselves in a grid of buttons on the right, each with its key in
// the corner. Nothing here is new machinery: a button presses the same key
// you would, so there is nothing it can do that the keyboard cannot.
//
// The buttons are drawn once and only their state is refreshed, so a press
// never lands on a button that has just been rebuilt under the finger.
import { sailGlyph } from './glyphs.js';

const TIERS = [
  ['course', 'Courses', 'Digit1', '1'],
  ['topsail', 'Topsails', 'Digit2', '2'],
  ['topgallant', 'Topgallants', 'Digit3', '3'],
  ['royal', 'Royals', 'Digit4', '4'],
  ['spanker', 'Spanker', 'Digit5', '5'],
  ['headsail', 'Headsails', 'Digit6', '6']
];

// The third row: everything that is not canvas.
const SHIP = [
  ['allhands', 'KeyH', 'h', 'All hands', 'Turn out every man aboard. Reefing and tacking both want it.'],
  ['manoeuvre', 'KeyT', 't', 'Tack ship', 'Her head through the wind. Quick, and she may miss stays.'],
  ['manoeuvre', 'KeyW', 'w', 'Wear ship', 'Her stern through the wind. Slow, sure, loses ground.'],
  ['mend', 'KeyM', 'm', 'Mend', 'Set the hands to what has carried away, out of her stores.'],
  ['whale', 'KeyL', 'l', 'Lower away', 'Three boats down, and eighteen men out of her.'],
  ['whale', 'KeyO', 'o', 'Cut in', 'Cutting in, then trying out. All hands, and days of it.'],
  ['clock', 'Space', 'sp', 'Bring her to', 'Stop her clock. Nothing moves while she lies to.']
];

export function makeCommand({ rig, crew, allows, press }) {
  const bar = document.createElement('div');
  bar.id = 'command';

  const button = (key, badge, said, hint, extra = '') =>
    `<button class="ord${extra}" data-key="${key}" title="${hint}">` +
    `<span class="badge">${badge}</span><span class="what">${said}</span>` +
    '<span class="glyph"></span></button>';

  const row = (label, html) =>
    `<div class="row"><span class="rowname">${label}</span><div class="cards">${html}</div></div>`;

  const canvasRows =
    (allows('sail')
      ? row('Shorten', TIERS.map(([t, said, key, badge]) =>
          button(key, badge, said, `Take in the ${said.toLowerCase()}`, ` t-${t}`)).join('') +
          button('KeyF', 'f', 'All round', 'Shorten every sail she carries')) +
        row('Make sail', TIERS.map(([t, said, key, badge]) =>
          button(`shift:${key}`, `⇧${badge}`, said, `Set the ${said.toLowerCase()}`, ` m-${t}`)).join('') +
          button('KeyA', 'a', 'All round', 'Make sail all round'))
      : '');

  const shipRow = row('Ship', SHIP.filter(([g]) => allows(g))
    .map(([, key, badge, said, hint]) => button(key, badge, said, hint)).join(''));

  bar.innerHTML =
    '<div class="her"><span class="tag">Her head</span><b class="head"></b>' +
    '<span class="tag">Making</span><b class="speed"></b>' +
    '<span class="tag">Hands free</span><b class="hands"></b></div>' +
    `<div class="card">${canvasRows}${shipRow}</div>`;
  document.body.appendChild(bar);

  for (const b of bar.querySelectorAll('.ord')) {
    b.addEventListener('click', () => {
      const [mod, code] = b.dataset.key.split(':');
      if (code) press(code, true); else press(mod, false);
    });
  }

  const out = {
    head: bar.querySelector('.head'),
    speed: bar.querySelector('.speed'),
    hands: bar.querySelector('.hands')
  };
  const put = (el, s) => { if (el.__said !== s) { el.__said = s; el.innerHTML = s; } };

  // Which tiers can still be shortened or made, so a button that would do
  // nothing looks like it would do nothing.
  const shortenable = {};
  const makeable = {};
  for (const [t] of TIERS) {
    shortenable[t] = bar.querySelector(`.t-${t}`);
    makeable[t] = bar.querySelector(`.m-${t}`);
  }

  return function update(air) {
    if (air) {
      put(out.head, `${air.headSaid} <em>${Math.round(air.heading)}°</em>`);
      put(out.speed, air.knots < 0.05 ? 'no way on her' : `${air.knots.toFixed(1)} knots`);
    }
    put(out.hands, `${crew.free} of ${crew.onDeck}${crew.allHands ? ' <em>all hands</em>' : ''}`);

    for (const [t] of TIERS) {
      const busy = rig.working(t);
      const state = rig.stateOf(t);
      const glyph = sailGlyph(state, busy);

      for (const [dir, el] of [[+1, shortenable[t]], [-1, makeable[t]]]) {
        if (!el) continue;
        const can = !!rig.nextState(t, dir) && !busy;
        el.classList.toggle('spent', !can);
        el.classList.toggle('busy', busy);
        const g = el.querySelector('.glyph');
        if (g.__said !== glyph) { g.__said = glyph; g.innerHTML = glyph; }
      }
    }
  };
}
