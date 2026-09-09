// The compass rose, standing on her own in the corner.
//
// The needle is her head. The light arrow outside the ring is the wind, and
// it flies with the wind rather than into it -- it shows the way the wind is
// going, which is how a wind vane on a chart is drawn.
//
// Everything else that used to live here -- the force, her heading, what she
// is making -- has gone onto the clock board, where it reads as a page of her
// papers instead of a dial.
import { FORCE_NAMES, compassPoint, wrap } from './wind.js';
import { COMPASS } from './glyphs.js';

export function makeInstruments() {
  const rose = document.createElement('div');
  rose.id = 'rose';
  rose.innerHTML = COMPASS + '<p class="squall"></p>';
  document.body.appendChild(rose);

  const needle = rose.querySelector('.needle');
  const windArrow = rose.querySelector('.wind');
  const squall = rose.querySelector('.squall');
  let said = '';

  // What the boards want to print, worked out here so the wind is named in
  // one place only.
  return function update({ heading, windFrom, force, point, knots, squall: blow }) {
    needle.setAttribute('transform', `rotate(${wrap(heading).toFixed(1)})`);
    windArrow.setAttribute('transform', `rotate(${wrap(windFrom).toFixed(1)})`);

    const line = !blow ? ''
      : blow.here
        ? `A squall on her, out of the ${compassPoint(blow.bearing)}`
        : `A squall to the ${compassPoint(blow.bearing)} — ${Math.max(1, Math.round(blow.minutes))} min off`;
    if (line !== said) { said = line; squall.textContent = line; }

    return {
      force: FORCE_NAMES[Math.max(0, Math.min(9, Math.round(force)))],
      from: compassPoint(windFrom),
      headSaid: compassPoint(heading),
      heading: wrap(heading),
      point,
      knots
    };
  };
}
