// The panels laid over the view: the ship's state, the date, the objective,
// the one thing to do next, the chase, the lookout's cries, the choices put
// to the owner, and the voyage's end.
import { HOLD, CREW, BOATS, worth, money } from './stores.js';
import { mood } from './morale.js';

const $ = (id) => document.getElementById(id);
const MONTHS = 'January February March April May June July August September October November December'.split(' ');
const pct = (k) => `${Math.max(0, Math.min(100, k * 100)).toFixed(1)}%`;
let actKey, actFn, act2Fn;
$('act').onclick = () => actFn && actFn();
$('act2').onclick = () => act2Fn && act2Fn();

function modal(title, html, buttons) {
  $('modalTitle').textContent = title;
  $('summary').innerHTML = html;
  $('choices').innerHTML = '';
  for (const [label, fn, note] of buttons) {
    const b = document.createElement('button');
    b.innerHTML = note ? `${label}<small>${note}</small>` : label;
    b.onclick = () => { $('modal').hidden = true; fn(); };
    $('choices').append(b);
  }
  $('modal').hidden = false;
}

export const hud = {
  ship(v, { room, home, atSea, spirits }) {
    $('spiritsN').textContent = `${mood(spirits)}`;
    $('spiritsB').style.width = pct(spirits / 100);
    $('spiritsB').style.background = spirits >= 55 ? '#7fb069' : spirits >= 40 ? '#d9a441' : '#e2674f';
    $('holdN').textContent = `room for ${room} bbl`;
    $('hProv').style.width = pct((v.stores * 6) / HOLD);
    $('hWhale').style.width = pct(v.whale / HOLD);
    $('hSperm').style.width = pct(v.sperm / HOLD);
    $('holdKey').innerHTML = `<i class="stores"></i>provisions <i class="oil"></i>${v.whale} whale oil <i class="sperm"></i>${v.sperm} sperm oil`;
    $('storesN').textContent = atSea ? `${v.stores} days · ${home} home` : `${v.stores} days`;
    $('storesRow').className = 'row ' + (!atSea ? '' : v.stores < home ? 'danger' : v.stores <= home + 3 ? 'warn' : '');
    $('hullN').textContent = `${Math.ceil(v.hull)}%`;
    $('hullB').style.width = pct(v.hull / 100);
    $('hullB').style.background = v.hull > 60 ? '#5b9bd5' : v.hull > 30 ? '#d9a441' : '#e2674f';
    $('crewN').textContent = `${v.crew} hands`;
    $('crewB').style.width = pct(v.crew / CREW);
    $('boatsN').innerHTML = Array.from({ length: BOATS }, (_, i) => `<i class="${i < v.boats ? 'boat' : 'boat gone'}"></i>`).join('');
    $('tally').innerHTML = `<span>Voyage <b>${v.voyages + 1}</b></span><span>Day <b>${v.days}</b></span>` +
      `<span>Whales <b>${v.taken}</b></span><span>Aboard <b>${money(worth(v))}</b></span><span>Landed <b>${money(v.landed)}</b></span>`;
    $('date').textContent = `${v.date.getDate()} ${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`;
  },

  where(text, wind, gale) {
    $('where').textContent = text;
    $('wind').textContent = wind[0].toUpperCase() + wind.slice(1);
    $('wind').className = gale ? 'gale' : '';
  },

  objective(goal, steps, hint) {
    $('goal').textContent = goal;
    $('steps').innerHTML = steps.map(([text, done]) =>
      `<li class="${done ? 'done' : ''}"><span class="box">${done ? '✓' : ''}</span>${text}</li>`).join('');
    $('hint').textContent = hint;
  },

  // The big button for what may be done next, and sometimes a second, lesser one.
  action(label, fn, label2 = null, fn2 = null) {
    actFn = fn; act2Fn = fn2;
    if (label + '|' + label2 === actKey) return;
    actKey = label + '|' + label2;
    $('act').textContent = label || '';
    $('act').hidden = !label;
    $('act2').textContent = label2 || '';
    $('act2').hidden = !label2;
  },

  chase(label, k) {
    $('chase').hidden = label == null;
    if (label == null) return;
    $('chaseLabel').textContent = label;
    $('chaseBar').hidden = k == null;
    if (k != null) $('chaseB').style.width = pct(k);
  },

  toast(text) {
    const box = $('toast'), el = document.createElement('div');
    el.textContent = text;
    box.append(el);
    while (box.children.length > 3) box.firstChild.remove();       // the three latest, newest at the bottom
    setTimeout(() => el.classList.add('gone'), 5500);
    setTimeout(() => el.remove(), 6000);
  },

  // Before each voyage: how much provision to take.
  fitOut(fits, pick, intro) {
    modal('Fitting out',
      `<p>${intro}</p>` + '<p>Provisions and oil share the hold. Every day of provision stowed is room the oil cannot have ' +
      'until it is eaten. Take too little and the men starve on the way home.</p>',
      fits.map((f) => [`${f.name}: ${f.days} days`, () => pick(f), `${f.note} Room for ${f.room} bbl of oil at first.`]));
  },

  // A choice put to the owner mid-chase. The world waits for the answer.
  decide(text, options) { modal('A decision', `<p>${text}</p>`, options); },

  ended(title, lines, again) {
    modal(title, lines.map((l) => (l.startsWith('<div') ? l : `<p>${l}</p>`)).join(''), [['Fit out for another voyage', again]]);
  },
};
