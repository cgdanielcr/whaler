// The ship in section: where every man aboard is, this minute.
//
// This is a diagram of her, not a place in her. Nothing below deck is ever
// entered in the world -- SPEC section 3 stands -- but a drawing of her
// insides on a sheet of paper is a different thing from walking about in
// them, and it is the only way to see at a glance how she is organised.
//
// Drawn as boxes rather than as a beautiful sheer plan, on purpose. It is a
// berthing chart, and a berthing chart wants to be read, not admired.
//
// She is drawn bow to the right, as a ship's plan is.
import { readClock } from './clock.js';

// Every place a man can be, and the box he is drawn in. Bow to the right.
const PLACES = {
  aloft:      { x: 300, y: 36,  w: 560, h: 104, said: 'Aloft' },
  boats:      { x: 250, y: 158, w: 440, h: 38,  said: 'The boats' },
  deck:       { x: 62,  y: 208, w: 812, h: 44,  said: 'On deck' },
  cabin:      { x: 62,  y: 264, w: 168, h: 64,  said: 'The cabin' },
  steerage:   { x: 238, y: 264, w: 162, h: 64,  said: 'Steerage' },
  blubber:    { x: 408, y: 264, w: 252, h: 64,  said: 'Blubber room' },
  forecastle: { x: 668, y: 264, w: 194, h: 64,  said: 'Forecastle' },
  hold:       { x: 62,  y: 340, w: 800, h: 54,  said: 'The hold' }
};

const BELOW = ['cabin', 'steerage', 'blubber', 'forecastle'];

// Where a man berths when he is not wanted on deck. A whaleship's officers
// live aft in the cabin, her boatsteerers and tradesmen in steerage between
// decks, and her foremast hands forward in the forecastle -- which was the
// wettest and foulest place aboard, and is why sheathing it is worth money.
function berthOf(man) {
  if (man.rate === 'mate' || man.berth === 'Steward') return 'cabin';
  if (man.rate === 'boatsteerer' || man.rate === 'tradesman') return 'steerage';
  return 'forecastle';
}

// Every man's place this minute, worked out in the same order the ship works
// it out: a boat's crew first, then the mastheads, then whatever piece of work
// he has been posted to, then his watch, then his berth.
export function placeEveryone(company, crew, gameSeconds) {
  const aloftAt = new Set();
  const employed = new Set();
  for (const order of crew.running) {
    for (const post of order.posted || []) {
      for (const m of post.men) {
        employed.add(m);
        if (post.aloft) aloftAt.add(m);
      }
    }
  }

  const onDeck = readClock(gameSeconds).onDeck;
  const hour = (gameSeconds / 3600) % 24;
  const daylight = hour >= 5.5 && hour < 18.5;
  const where = new Map();

  for (const m of company.all) {
    if (m.inBoat) { where.set(m, 'boats'); continue; }
    if (m.standing) { where.set(m, 'aloft'); continue; }
    if (aloftAt.has(m)) { where.set(m, 'aloft'); continue; }
    if (employed.has(m)) { where.set(m, 'deck'); continue; }
    if (m.idler) { where.set(m, daylight ? 'deck' : berthOf(m)); continue; }
    where.set(m, m.watch === onDeck ? 'deck' : berthOf(m));
  }
  return where;
}

// A man, drawn small. Head, body, and nothing else: at this size a figure
// with legs is a smudge.
function figure(m, x, y) {
  const hurt = m.health !== 'sound' ? ' hurt' : '';
  return `<g class="man${hurt}" data-id="${m.id}" transform="translate(${x},${y})">` +
    '<circle cx="0" cy="-7.5" r="3.1"/>' +
    '<rect x="-3.2" y="-4" width="6.4" height="10" rx="1.6"/></g>';
}

// Lay a company of men out inside a box, in rows, wrapping.
function fill(men, box) {
  const step = 13;
  const perRow = Math.max(1, Math.floor((box.w - 14) / step));
  return men.map((m, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rows = Math.ceil(men.length / perRow);
    const x = box.x + 10 + col * step;
    const y = box.y + box.h - 8 - (rows - 1 - row) * 17;
    return figure(m, x, y);
  }).join('');
}

export function section(company, crew, gameSeconds) {
  const where = placeEveryone(company, crew, gameSeconds);
  const inPlace = {};
  for (const key in PLACES) inPlace[key] = [];
  for (const [m, key] of where) inPlace[key].push(m);

  // Her outline: deck, sides, and a bow that tapers away to the right.
  const hull =
    '<path class="hull" d="M 48 204 L 872 204 Q 910 204 918 250 L 918 300 ' +
    'Q 918 356 876 396 L 66 396 Q 48 396 48 372 Z"/>';

  const masts = [340, 560, 780].map((x) =>
    `<line class="mast" x1="${x}" y1="40" x2="${x}" y2="206"/>` +
    [56, 88, 120].map((y) =>
      `<line class="yard" x1="${x - 34}" y1="${y}" x2="${x + 34}" y2="${y}"/>`).join('')
  ).join('');

  const rooms = BELOW.map((key) => {
    const b = PLACES[key];
    return `<rect class="room" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`;
  }).join('');

  const labels = Object.keys(PLACES).map((key) => {
    const b = PLACES[key];
    return `<text class="tag" x="${b.x + 5}" y="${b.y + 11}">${PLACES[key].said}</text>` +
      `<text class="tally" x="${b.x + b.w - 5}" y="${b.y + 11}">${inPlace[key].length || ''}</text>`;
  }).join('');

  const men = Object.keys(PLACES).map((key) => fill(inPlace[key], PLACES[key])).join('');

  return '<svg class="section" viewBox="0 0 930 410" preserveAspectRatio="xMidYMid meet">' +
    hull + masts + rooms +
    `<line class="deck" x1="48" y1="204" x2="900" y2="204"/>` +
    `<line class="water" x1="10" y1="300" x2="928" y2="300"/>` +
    labels + men + '</svg>';
}

// Hovering a man writes his particulars under the drawing. Nothing here
// changes anything: reassigning him is the next milestone.
export function bindSection(panel, company) {
  const whois = panel.querySelector('.whois');
  if (!whois) return;
  const rest = 'Hover a man to see who he is.';
  whois.textContent = rest;

  panel.addEventListener('mouseover', (e) => {
    const g = e.target.closest && e.target.closest('.man');
    if (!g) return;
    const m = company.all.find((x) => x.id === Number(g.dataset.id));
    if (!m) return;
    const deeds = m.deeds && m.deeds.length ? ` — ${m.deeds.join('; ')}` : '';
    whois.innerHTML = `<b>${m.name}</b>, ${m.age}, ${m.berth.toLowerCase()}` +
      `${m.watch ? `, ${m.watch} watch` : ', no watch'}` +
      ` — ${m.rate}, ${m.strength}, ${m.health}${deeds}`;
  });
  panel.addEventListener('mouseleave', () => { whois.textContent = rest; });
}
