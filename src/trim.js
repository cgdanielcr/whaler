// The glass: the wind, the light and the look, set by hand.
//
// This is a tool for looking at her, not part of the working of the ship. It
// takes the wind out of the weather's hands so you can hold one sea still and
// walk round it, swings the sun about, and lets you drag the whole palette
// from a bright day to a heavy one without waiting for a gale.
//
// The last dial is the only one that trades looks against speed, and the
// frame counter is right under it, so you can find your own answer on your
// own machine.
//
// Press g. Press it again and the weather has it all back.
const SUN_FAR = 93;

const DIALS = [
  { key: 'force',  said: 'Wind force',   lo: 0, hi: 9,   step: 0.1 },
  { key: 'from',   said: 'Wind from',    lo: 0, hi: 359, step: 1,  unit: '°' },
  { key: 'sunAt',  said: 'Sun bearing',  lo: 0, hi: 359, step: 1,  unit: '°' },
  { key: 'sunUp',  said: 'Sun height',   lo: 2, hi: 88,  step: 1,  unit: '°' },
  { key: 'sunHot', said: 'Sun strength', lo: 0, hi: 4,   step: 0.05 },
  { key: 'gloom',  said: 'The day',      lo: 0, hi: 1,   step: 0.02 },
  { key: 'facets', said: 'Sea detail',   lo: 70, hi: 300, step: 10 }
];

const FORCE_SAID = ['calm', 'light airs', 'light breeze', 'moderate breeze',
  'fresh breeze', 'strong breeze', 'fresh gale', 'strong gale', 'whole gale', 'storm'];

const DAY_SAID = (g) => g < 0.15 ? 'a bright day' : g < 0.4 ? 'clouding over'
  : g < 0.7 ? 'grey and closing in' : 'thick and dirty';

export function makeTrim({ weather, sun, aim, look, facets }) {
  const at = {
    force: weather.base.force,
    from: weather.base.from,
    sunAt: 70,
    sunUp: 34,
    sunHot: sun.intensity,
    gloom: 0,
    facets: 160
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
    '<p class="note">The weather has no say in the wind or the light while this ' +
    'is open. Squalls still come up; they simply do not move anything.<br>' +
    'Sea detail is the one dial that costs you speed. Watch the count below it.</p>' +
    '<p class="rate"></p><p class="shut">g to close and give it all back</p>';
  document.body.appendChild(panel);

  const readouts = {};
  let grid = at.facets;
  for (const el of panel.querySelectorAll('label')) {
    const k = el.dataset.k;
    readouts[k] = el.querySelector('.was');
    el.querySelector('input').addEventListener('input', (e) => {
      at[k] = Number(e.target.value);
      // A new sea is dear to build, so it is only rebuilt when the dial has
      // actually landed somewhere new.
      if (k === 'facets' && at.facets !== grid) { grid = at.facets; facets(at.facets); }
      apply();
    });
  }
  const rate = panel.querySelector('.rate');

  function apply() {
    weather.hold(at.force, at.from);
    look(at.gloom);

    const up = at.sunUp * Math.PI / 180, round = at.sunAt * Math.PI / 180;
    sun.position.set(
      SUN_FAR * Math.cos(up) * Math.sin(round),
      SUN_FAR * Math.sin(up),
      SUN_FAR * Math.cos(up) * Math.cos(round)
    );
    sun.intensity = at.sunHot;
    aim();

    for (const d of DIALS) {
      const v = at[d.key];
      readouts[d.key].textContent =
        d.key === 'force' ? `${v.toFixed(1)} — ${FORCE_SAID[Math.round(v)]}`
        : d.key === 'gloom' ? `${DAY_SAID(v)}`
        : d.key === 'facets' ? `${v} across`
        : `${d.step < 1 ? v.toFixed(2) : Math.round(v)}${d.unit || ''}`;
    }
  }

  const open = () => panel.style.display !== 'none';
  let frames = 0, since = performance.now();

  function show(to) {
    panel.style.display = to ? '' : 'none';
    if (to) { apply(); frames = 0; since = performance.now(); rate.textContent = ''; }
    else { weather.release(); look(null); }
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable) return;
    if (e.key === 'g' || e.key === 'G') { show(!open()); e.preventDefault(); }
    else if (e.key === 'Escape' && open()) show(false);
  });

  // How hard she is working, averaged over a second.
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
