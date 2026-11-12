// Fitting out: the card shown at the wharf before each voyage. How the ice
// lies, what the owners look for, the talk on the wharf, what the master may
// buy from his own purse, and last the choice of provisions, which sends her off.
import { OUTFIT } from './outfit.js';
import { money } from './stores.js';
import { hud } from './hud.js';

export function fitOutCard({ v, career, season, intro, fits }, done) {
  const MONTHS = 'January February March April May June July August September October November December'.split(' ');
  const date = `${v.date.getDate()} ${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`;
  const gear = {};
  let purse = career.purse;

  hud.modal('Fitting out',
    `<p>${intro}It is ${date}. ${season.advice(v.date)}</p>` +
    `<p class="wharf">${v.report.text}</p>` +
    `<p>The owners look for <b>${money(career.expect())}</b> from this voyage. Your standing with them: <b>${career.word()}</b>.</p>` +
    `<div class="outfit"><div class="label">From your own purse: <b id="purse"></b></div><div id="outfitList"></div></div>` +
    '<p class="fine">Provisions and oil share the hold. Every day of provision stowed is room the oil cannot have until it is eaten.</p>',
    fits.map((f) => [`${f.name}: ${f.days} days`, () => { career.purse = purse; done(f, gear); }, `${f.note} Room for ${f.room} bbl of oil at first.`]));
  document.querySelector('#modal .panel').classList.add('wide');

  const list = document.getElementById('outfitList'), purseEl = document.getElementById('purse');
  function render() {
    purseEl.textContent = money(purse);
    list.innerHTML = '';
    for (const o of OUTFIT) {
      const b = document.createElement('button');
      b.className = `lesser item${gear[o.id] ? ' on' : ''}`;
      b.disabled = !gear[o.id] && o.price > purse;
      b.innerHTML = `<span>${o.name}<small>${o.note}</small></span><em>${money(o.price)}</em>`;
      b.onclick = () => { gear[o.id] = !gear[o.id]; purse += gear[o.id] ? -o.price : o.price; if (!gear[o.id]) delete gear[o.id]; render(); };
      list.append(b);
    }
  }
  render();
}
