// The panels laid over the view: the ship's state, the date, the objective,
// the one thing to do next, the chase, the lookout's cries, and the voyage's end.
const $ = (id) => document.getElementById(id);
const MONTHS = 'January February March April May June July August September October November December'.split(' ');
const pct = (k) => `${Math.round(Math.max(0, Math.min(1, k)) * 100)}%`;
let actLabel, actFn, toastTimer;
$('act').onclick = () => actFn && actFn();

export const hud = {
  ship(v) {
    $('holdN').textContent = `${v.oil} of ${v.cap} bbl`;
    $('holdB').style.width = pct(v.oil / v.cap);
    $('storesN').textContent = `${v.stores} days`;
    $('storesB').style.width = pct(v.stores / v.storesMax);
    $('crewN').textContent = `${v.crew} hands`;
    $('crewB').style.width = '100%';
    $('tally').innerHTML = `<span>Voyage <b>${v.voyages + 1}</b></span><span>Day <b>${v.days}</b></span>` +
      `<span>Whales <b>${v.taken}</b></span><span>Landed <b>${v.landed}</b> bbl</span>`;
    $('date').textContent = `${v.date.getDate()} ${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`;
  },

  where(text) { $('where').textContent = text; },

  objective(goal, steps, hint) {
    $('goal').textContent = goal;
    $('steps').innerHTML = steps.map(([text, done]) =>
      `<li class="${done ? 'done' : ''}"><span class="box">${done ? '✓' : ''}</span>${text}</li>`).join('');
    $('hint').textContent = hint;
  },

  action(label, fn) {
    actFn = fn;
    if (label === actLabel) return;
    actLabel = label;
    $('act').textContent = label || '';
    $('act').hidden = !label;
  },

  chase(label, k) {
    $('chase').hidden = label == null;
    if (label == null) return;
    $('chaseLabel').textContent = label;
    $('chaseBar').hidden = k == null;
    if (k != null) $('chaseB').style.width = pct(k);
  },

  toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 4200);
  },

  ended(lines, again) {
    $('summary').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    $('modal').hidden = false;
    $('again').onclick = () => { $('modal').hidden = true; again(); };
  },
};
