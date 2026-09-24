// The whole voyage, on the chart. The first screen of a three-year cruise:
// where she is, what she has left, and what you will do with the month.
//
// Nothing here is sailed. The months between stops are skipped, and what is
// left is the choosing. When you want the ship in your own hands -- a
// lowering, a blow -- the chart hands you over to her, and takes you back.

import { load, save, newVoyage, wearySaid, HULL, aboard, boatsCanLower } from './ledger.js';
import { STOPS, linksFrom, dated } from './stops.js';
import { CARDS } from './cards.js';
import { sail, cruise, lower } from './months.js';
import { offers, risk, informer, leave } from './port.js';
import { drawChart } from './chartmap.js';
import { launch, takeBack } from './crises.js';
import { career, shipFor, ownersLetter } from './owners.js';
import { promotions } from './wants.js';
import { showCompany, showLog, showAccount } from './voyagepages.js';

let l = load();
if (!l) {
  const c = career();
  if (c.standing >= 0) {
    l = newVoyage(shipFor(c), c.veterans);
    l.cards.push({ key: 'owners' });
    save(l);
  }
}
if (l && l.crisis) { takeBack(l); save(l); }

const root = document.createElement('div');
root.id = 'voyage';
document.body.appendChild(root);

const OWNERS = {
  head: 'The owners to the master',
  text: () => ownersLetter(l, career()).map((p) => `<p>${p}</p>`).join(''),
  choices: () => [{ said: 'Put to sea' }]
};

const cardOf = (c) => (c.key === 'owners' ? OWNERS : CARDS[c.key]);
const call = (v, c) => (typeof v === 'function' ? v(l, c) : v);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function render() {
  if (!l) { showAccount(null, root); return; }
  if (l.over && !l.cards.length) { showAccount(l, root); return; }
  const s = STOPS[l.at];
  root.innerHTML =
    `<header><h1>The ${l.ship.name}</h1><span class="when">${dated(l.month)} &middot; ` +
    `${plural(l.month, 'month')} out &middot; ${s.said}</span></header>` +
    '<div class="v-body"><div class="v-chart"></div><aside class="v-side">' +
    `<dl class="v-state">${state()}</dl><section class="v-now"></section>` +
    '<nav><button data-go="company">The company</button><button data-go="log">The log</button>' +
    '<button data-go="office">The shipping office</button></nav></aside></div>';

  root.querySelector('.v-chart').appendChild(drawChart(l, (to) => {
    const link = linksFrom(l.at).find((k) => k.to === to);
    if (link && !l.cards.length && !(s.kind === 'port' && !l.flags.portDone)) go(() => sail(l, link));
  }));
  const now = root.querySelector('.v-now');
  if (l.cards.length) card(now);
  else if (s.kind === 'port' && !l.flags.portDone) port(now);
  else actions(now);

  root.querySelector('[data-go="company"]').onclick = () => showCompany(l, () => { save(l); render(); });
  root.querySelector('[data-go="log"]').onclick = () => showLog(l);
  root.querySelector('[data-go="office"]').onclick = () => { location.hash = ''; location.reload(); };
}

function state() {
  const men = aboard(l);
  const sick = men.filter((m) => m.health !== 'sound').length;
  const warn = (bad, text) => `<dd${bad ? ' class="warn"' : ''}>${text}</dd>`;
  return `<dt>Water</dt>${warn(l.water <= 2, plural(l.water, 'month'))}` +
    `<dt>Bread and beef</dt>${warn(l.provisions <= 4, plural(l.provisions, 'month'))}` +
    `<dt>Fresh food</dt>${warn(l.fresh > 6, l.fresh ? `${plural(l.fresh, 'month')} since` : 'this month')}` +
    `<dt>The men</dt>${warn(l.weary >= 60, `${wearySaid(l.weary)} &middot; ${men.length} aboard` +
      (sick ? `, ${sick} sick or hurt` : ''))}` +
    `<dt>Her hull</dt>${warn(l.hull > 0, HULL[l.hull])}` +
    `<dt>Boats</dt>${warn(boatsCanLower(l) < 3, `${l.boats}, ${boatsCanLower(l)} can be manned`)}` +
    `<dt>In the hold</dt><dd>${l.sperm} of ${l.ship.capacity.toLocaleString('en-US')} barrels` +
    (l.whale ? `, ${l.whale} of them whale oil` : '') + (l.shipped ? ` &middot; ${l.shipped} sent home` : '') + '</dd>' +
    `<dt>Laid out</dt><dd>$${l.outlays.toLocaleString('en-US')}</dd>`;
}

function card(now) {
  const c = l.cards[0];
  const def = cardOf(c);
  const text = call(def.text, c);
  now.innerHTML = `<h2>${call(def.head, c)}</h2>` +
    (text.startsWith('<p>') ? text : `<p>${text}</p>`) + '<ul class="choices"></ul>';
  const ul = now.querySelector('.choices');
  for (const ch of def.choices(l, c)) {
    const li = document.createElement('li');
    li.innerHTML = `<button>${ch.said}</button>`;
    li.firstChild.onclick = () => choose(c, def, ch);
    ul.appendChild(li);
  }
}

function choose(c, def, ch) {
  l.cards.shift();
  if (ch.crisis) { launch(l, c, ch.crisis); return; }
  if (ch.lower) {
    const out = lower(l, ch.lower === 'right');
    l.cards.unshift({ key: 'said', head: 'The boats are back', text: `${out.said} ${out.lines.join(' ')}` });
  } else if (ch.do) {
    const t = ch.do(l, c);
    if (t) l.cards.unshift({ key: 'said', head: call(def.head, c), text: t });
  }
  save(l);
  render();
}

function port(now) {
  const told = informer(l);
  const list = offers(l);
  now.innerHTML = `<h2>At anchor, ${STOPS[l.at].said}</h2>` +
    '<p>Her casks are filled with water, and the boats go ashore. What else will you buy? ' +
    'Every dollar comes off the top of the voyage, before anyone’s lay.</p>' +
    (told ? `<p class="warn">${told}</p>` : '') +
    '<ul class="offers">' + list.map((o) =>
      `<li><label><input type="checkbox" name="${o.key}"${o.on ? ' checked' : ''}> ${o.said}</label></li>`).join('') +
    '</ul><ul class="offers">' +
    `<li><label><input type="radio" name="liberty" value="1"> Liberty ashore: the men come back rested, ` +
    `and ${risk(l, true)} of them run</label></li>` +
    `<li><label><input type="radio" name="liberty" value="0" checked> No liberty: the men stay aboard, a little ` +
    `rested, and ${risk(l, false)} of them run</label></li></ul>` +
    '<p><button class="weigh">Weigh anchor</button></p>';
  now.querySelector('.weigh').onclick = () => {
    const chosen = {};
    for (const o of list) chosen[o.key] = now.querySelector(`[name="${o.key}"]`).checked;
    go(() => leave(l, chosen, now.querySelector('[name="liberty"]:checked').value === '1'));
  };
}

function actions(now) {
  const s = STOPS[l.at];
  let html = `<h2>${s.said}</h2>`;
  if (s.kind === 'ground') {
    html += '<ul class="choices">' +
      '<li><button data-pace="hard">Cruise a month hard</button><span>mastheads manned dawn to dusk, ' +
      'and lower for every spout. More whales; the men wear out.</span></li>' +
      '<li><button data-pace="easy">Cruise a month easy</button><span>watch and watch. Fewer whales ' +
      'raised; the men recover.</span></li></ul>';
  }
  html += `<h3>${s.kind === 'ground' ? 'Or sail for' : 'Sail for'}</h3><ul class="choices">` +
    linksFrom(l.at).map((k, i) => {
      const short = k.months > l.water ? ' <em>&mdash; her water will not last</em>' : '';
      const home = k.to === 'newbedford' && l.at !== 'fayal';
      return `<li><button data-link="${i}">${home ? 'Turn for home' : STOPS[k.to].said}</button>` +
        `<span>${plural(k.months, 'month')}${k.via === 'horn' ? ', round the Horn' : ''}${short}</span></li>`;
    }).join('') + '</ul>';
  if (promotions(l).length) html += '<p class="note">There are men you could rate up. See the company.</p>';
  now.innerHTML = html;
  for (const b of now.querySelectorAll('[data-pace]')) b.onclick = () => go(() => cruise(l, b.dataset.pace));
  const links = linksFrom(l.at);
  for (const b of now.querySelectorAll('[data-link]')) b.onclick = () => go(() => sail(l, links[+b.dataset.link]));
}

function go(what) { what(); save(l); render(); }

render();
