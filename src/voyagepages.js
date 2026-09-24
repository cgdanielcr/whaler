// The pages behind the chart: the company, man by man; the log; and at the
// end of it all, the account, the lay, and what the owners make of you.

import { forget, save } from './ledger.js';
import { wantSaid, promotions, promote } from './wants.js';
import { reckon, dollars } from './lay.js';
import { payOff, VERDICT, shipFor, career, retire, WORDS } from './owners.js';


function sheet(title) {
  const box = document.createElement('div');
  box.className = 'v-sheet';
  box.innerHTML = `<div class="v-page"><button class="shut">close</button><h2>${title}</h2><div class="v-in"></div></div>`;
  box.querySelector('.shut').onclick = () => box.remove();
  box.onclick = (e) => { if (e.target === box) box.remove(); };
  document.body.appendChild(box);
  return box.querySelector('.v-in');
}

const line = (m, extra = '') =>
  `<li class="${m.health}"><b>${m.name}</b>, ${m.berth === 'Foremast hand' ? m.rate : m.berth.toLowerCase()}, ` +
  `${m.age}${m.health !== 'sound' ? ` &mdash; <em>${m.health === 'ran' ? 'ran' : m.health}</em>` : ''}` +
  (m.veteran ? ' <span class="vet">sailed with you before</span>' : '') +
  (wantSaid(m) ? `<i>${wantSaid(m)}</i>` : '') +
  (m.deeds.length ? `<span>${m.deeds.join('; ')}</span>` : '') + extra + '</li>';

export function showCompany(l, changed) {
  const inner = sheet(`The company of the ${l.ship.name}`);
  const draw = () => {
    const ups = promotions(l);
    const aboard = l.men.filter((m) => m.health !== 'lost' && m.health !== 'ran');
    const gone = l.men.filter((m) => m.health === 'lost' || m.health === 'ran');
    inner.innerHTML =
      '<p class="note">A man is rated up by the master. It shortens his lay, which is his share of the oil: ' +
      'a boatsteerer’s berth is worth nearly twice a seaman’s. And a boat cannot be lowered without a ' +
      'mate to head her and a boatsteerer to strike.</p>' +
      '<ul class="roll">' + aboard.map((m) => line(m, ups.filter((u) => u.man === m).map((u) =>
        `<button data-id="${m.id}" data-to="${u.to}">Rate him ${u.to} (lay 1/${u.lay})</button>`).join(''))).join('') +
      '</ul>' +
      (gone.length ? '<h3>Gone</h3><ul class="roll">' + gone.map((m) => line(m)).join('') + '</ul>' : '');
    for (const b of inner.querySelectorAll('button[data-id]')) {
      b.onclick = () => {
        promote(l, l.men.find((m) => m.id === +b.dataset.id), b.dataset.to);
        changed();
        draw();
      };
    }
  };
  draw();
}

export function showLog(l) {
  const inner = sheet('The log');
  inner.innerHTML = '<ul class="log">' + l.log.slice().reverse()
    .map((e) => `<li><span>${e.when}</span>${e.text}</li>`).join('') + '</ul>';
}

// The end of it: the oil sold, the lay paid, and the owners' verdict.
export function showAccount(l, root) {
  if (!l) {
    root.innerHTML = '<div class="v-end"><h2>No ship</h2><p>No owner in New Bedford will give you ' +
      'another ship. Your name is in every counting-house on the waterfront.</p>' +
      '<p><button class="again">Begin again, as a new master</button></p></div>';
    root.querySelector('.again').onclick = () => { retire(); forget(); location.reload(); };
    return;
  }
  if (!l.paid) { const r = payOff(l); l.paid = { verdict: r.verdict, over: r.over }; save(l); }
  const sperm = l.sperm + l.shipped, whale = l.whale + (l.shippedWhale || 0);
  const pay = reckon(l.men, sperm, l.month * 30,
    { whale, outlays: l.outlays, ambergris: l.ambergris, master: l.ship.lay });
  const c = career();
  const next = shipFor(c);
  const lost = l.men.filter((m) => m.health === 'lost'), ran = l.men.filter((m) => m.health === 'ran');

  root.innerHTML = '<div class="v-end">' +
    `<h2>The voyage of the ${l.ship.name}</h2>` +
    `<p class="took"><b>${sperm}</b> barrels of sperm oil${whale ? ` and ${whale} of whale oil` : ''}, ` +
    `in ${l.month} months.${l.ambergris ? ` And ambergris, sold for ${dollars(l.ambergris)}.` : ''}</p>` +
    `<p>${pay.said}</p>` +
    `<p class="verdict">${VERDICT[l.paid.verdict]}</p>` +
    (lost.length ? `<p class="toll">${lost.map((m) => m.name).join(', ')} did not come home.</p>` : '') +
    (ran.length ? `<p>${ran.length} ran, and forfeited their lay.</p>` : '') +
    (pay.inDebt ? `<p class="toll">${pay.inDebt} of your men come home owing the ship.</p>` : '') +
    '<h3>The company, paid off</h3><ul class="roll">' +
    l.men.map((m, i) => line(m, `<span class="pay">${pay.shares[i].said}${outcome(m, pay.shares[i])}</span>`)).join('') +
    '</ul>' +
    (l.paid.over
      ? '<p>No owner in New Bedford will give you another ship.</p><p><button class="again">Begin again, as a new master</button></p>'
      : `<p>The owners offer you the <b>${next.name}</b>: ${next.about}` +
        (c.veterans.length ? ` ${WORDS[c.veterans.length]} of your people will ship with you again.` : '') + '</p>' +
        '<p><button class="again">Ship again</button> &nbsp; <button class="office">The shipping office</button></p>') +
    '</div>';
  root.querySelector('.again').onclick = () => { if (l.paid.over) retire(); forget(); location.reload(); };
  const office = root.querySelector('.office');
  if (office) office.onclick = () => { forget(); location.hash = ''; location.reload(); };
}

// Whether what he shipped for came to him.
function outcome(m, share) {
  if (m.want === 'debt' && m.health !== 'ran' && m.health !== 'lost') {
    return share.due >= m.debt ? `; enough to clear his debt of $${m.debt}` : `; not enough to clear his debt of $${m.debt}`;
  }
  if (m.want === 'home') return m.health === 'sound' || m.health === 'hurt' ? '; home to his mother' : '';
  return '';
}

