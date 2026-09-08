// The board she is conned by: where the wind is, where her head is, what point
// of sail she is on, and what she is making.
import { FORCE_NAMES, compassPoint, wrap } from './wind.js';

const DIAL = `
<svg viewBox="-50 -50 100 100" width="86" height="86">
  <circle r="44" class="dial-face"/>
  <line x1="0" y1="-44" x2="0" y2="-37" class="dial-north"/>
  <g class="dial-ship">
    <path d="M0 -21 L6 -6 L6 19 L-6 19 L-6 -6 Z" class="dial-hull"/>
  </g>
  <g class="wind-arrow">
    <line x1="0" y1="-40" x2="0" y2="-9" class="arrow-shaft"/>
    <path d="M0 -4 L-6 -16 L6 -16 Z" class="arrow-head"/>
  </g>
</svg>`;

export function makeInstruments() {
  const panel = document.createElement('div');
  panel.id = 'instruments';
  panel.className = 'board';
  panel.innerHTML = DIAL +
    '<dl>' +
    '<dt>Wind</dt><dd id="i-wind"></dd>' +
    '<dt>Her head</dt><dd id="i-head"></dd>' +
    '<dt>Point</dt><dd id="i-point"></dd>' +
    '<dt>Making</dt><dd id="i-speed"></dd>' +
    '<dt class="warn" id="i-squall-label">Squall</dt><dd id="i-squall" class="warn"></dd>' +
    '</dl>';
  (document.getElementById('right') || document.body).appendChild(panel);

  const arrow = panel.querySelector('.wind-arrow');
  const shipMark = panel.querySelector('.dial-ship');
  const out = {
    wind: panel.querySelector('#i-wind'),
    head: panel.querySelector('#i-head'),
    point: panel.querySelector('#i-point'),
    speed: panel.querySelector('#i-speed'),
    squall: panel.querySelector('#i-squall'),
    squallLabel: panel.querySelector('#i-squall-label')
  };

  // The dial is drawn with north up, her hull swinging round inside it and the
  // arrow flying with the wind -- pointing the way the wind is going.
  return function update({ heading, windFrom, force, point, knots, squall }) {
    shipMark.setAttribute('transform', `rotate(${wrap(heading).toFixed(1)})`);
    arrow.setAttribute('transform', `rotate(${wrap(windFrom).toFixed(1)})`);

    const named = FORCE_NAMES[Math.max(0, Math.min(9, Math.round(force)))];
    out.wind.textContent = `${named}, from the ${compassPoint(windFrom)}`;
    out.head.textContent = `${compassPoint(heading)} — ${Math.round(wrap(heading))}°`;
    out.point.textContent = point;
    out.speed.textContent = knots < 0.05 ? 'no way on her' : `${knots.toFixed(1)} knots`;
    out.speed.className = knots < 0.05 ? 'stalled' : '';

    out.squall.style.display = out.squallLabel.style.display = squall ? '' : 'none';
    if (squall) {
      out.squall.textContent = squall.here
        ? `on her, out of the ${compassPoint(squall.bearing)}`
        : `to the ${compassPoint(squall.bearing)}, ${Math.max(1, Math.round(squall.minutes))} min off`;
    }
  };
}
