// The glass: the wind and the light, set by hand.
//
// This is a tool for looking at her, not part of the working of the ship. It
// takes the wind out of the weather's hands so you can hold one sea still and
// walk round it, and it lets you swing the sun about, which is the only way
// to see the light come through a wave.
//
// Press g. Press it again and the weather has the wind back.
import * as THREE from 'three';

// The sun as it stands at the start: a little abaft the starboard beam and a
// third of the way up the sky.
const SUN_FAR = 93;

const DIALS = [
  { key: 'force', said: 'Wind force', lo: 0, hi: 9,   step: 0.1, unit: '' },
  { key: 'from',  said: 'Wind from',  lo: 0, hi: 359, step: 1,   unit: '°' },
  { key: 'sunAt', said: 'Sun bearing', lo: 0, hi: 359, step: 1,  unit: '°' },
  { key: 'sunUp', said: 'Sun height',  lo: 2, hi: 88,  step: 1,  unit: '°' },
  { key: 'sunHot', said: 'Sun strength', lo: 0, hi: 5, step: 0.05, unit: '' }
];

const FORCE_SAID = ['calm', 'light airs', 'light breeze', 'moderate breeze',
  'fresh breeze', 'strong breeze', 'fresh gale', 'strong gale', 'whole gale', 'storm'];

export function makeTrim({ weather, sun, sea, hemi }) {
  const at = {
    force: weather.base.force,
    from: weather.base.from,
    sunAt: 70,
    sunUp: 34,
    sunHot: sun.intensity
  };

  const panel = document.createElement('div');
  panel.id = 'glass';
  panel.style.display = 'none';
  panel.innerHTML =
    '<h2>The glass</h2>' +
    DIALS.map((d) =>
      `<label data-k="${d.key}"><span class="what">${d.said}</span>` +
      `<input type="range" min="${d.lo}" max="${d.hi}" step="${d.step}" value="${at[d.key]}">` +
      `<span class="was"></span></label>`).join('') +
    '<p class="note">The weather has no say in the wind while this is open. ' +
    'Squalls still come up and still darken the day; they simply do not move ' +
    'the wind any more.<br>Swing the sun round behind a wave to see the light ' +
    'come through it.</p>' +
    '<p class="rate"></p><p class="shut">g to close and give the wind back</p>';
  document.body.appendChild(panel);

  const readouts = {};
  for (const el of panel.querySelectorAll('label')) {
    const k = el.dataset.k;
    readouts[k] = el.querySelector('.was');
    el.querySelector('input').addEventListener('input', (e) => {
      at[k] = Number(e.target.value);
      apply();
    });
  }
  const rate = panel.querySelector('.rate');

  function apply() {
    weather.hold(at.force, at.from);

    const up = at.sunUp * Math.PI / 180, round = at.sunAt * Math.PI / 180;
    sun.position.set(
      SUN_FAR * Math.cos(up) * Math.sin(round),
      SUN_FAR * Math.sin(up),
      SUN_FAR * Math.cos(up) * Math.cos(round)
    );
    sun.intensity = at.sunHot;
    // The light travels from the sun toward her, and the sea needs to know
    // which way that is.
    sea.userData.sun(new THREE.Vector3().copy(sun.position).multiplyScalar(-1));
    if (hemi) hemi.intensity = 0.5 + 0.45 * at.sunHot;

    for (const d of DIALS) {
      readouts[d.key].textContent = d.key === 'force'
        ? `${at.force.toFixed(1)} — ${FORCE_SAID[Math.round(at.force)]}`
        : `${d.step < 1 ? at[d.key].toFixed(2) : Math.round(at[d.key])}${d.unit}`;
    }
  }

  const open = () => panel.style.display !== 'none';
  let frames = 0, since = performance.now();

  function show(to) {
    panel.style.display = to ? '' : 'none';
    if (to) { apply(); frames = 0; since = performance.now(); rate.textContent = ''; }
    else weather.release();
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable) return;
    if (e.key === 'g' || e.key === 'G') { show(!open()); e.preventDefault(); }
    else if (e.key === 'Escape' && open()) show(false);
  });

  // How hard she is working, averaged over a second, so you can see at once
  // whether something you have turned up is costing you the frame rate.
  return function tick() {
    if (!open()) return;
    frames++;
    const now = performance.now();
    if (now - since < 1000) return;
    const fps = Math.round((frames * 1000) / (now - since));
    frames = 0;
    since = now;
    rate.textContent = `${fps} frames a second`;
    rate.className = `rate${fps < 25 ? ' slow' : ''}`;
  };
}
