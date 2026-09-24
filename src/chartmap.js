// The master's chart of the voyage: the Atlantic and the Pacific on one sheet,
// the coasts drawn roughly, as a master might rule them into his own journal,
// and the places she may go marked on it. SVG, in the ink of the boards.
//
// Centred on the Pacific: longitude runs from 120 east round to the meridian
// of Greenwich, so Japan sits at the left edge and the Azores at the right.

import { STOPS, LINKS } from './stops.js';

const W = 960, H = 520;
const LON0 = 120, LON1 = 360, LAT0 = 62, LAT1 = -62;
const x = (lon) => ((((lon % 360) + 360) % 360) - LON0) / (LON1 - LON0) * W;
const y = (lat) => (LAT0 - lat) / (LAT0 - LAT1) * H;
const pt = ([lon, lat]) => `${x(lon).toFixed(1)},${y(lat).toFixed(1)}`;

// Coasts, much simplified, as [longitude, latitude].
const COASTS = [
  // the Americas, from Alaska round the Horn and up to Labrador
  [[-150, 61], [-136, 58], [-130, 54], [-124, 48], [-124, 42], [-122.5, 37.8], [-120.5, 34.5],
   [-117, 32.7], [-114, 30], [-110, 23], [-105.5, 23], [-105, 20], [-96, 15.7], [-92, 14.5],
   [-87.5, 13], [-85, 10], [-79.5, 7.5], [-78, 3], [-80, -2], [-81, -6], [-76, -14], [-70.3, -18.5],
   [-70.5, -24], [-71.5, -33], [-73.5, -40], [-74, -47], [-75, -52], [-68, -55.5], [-65.5, -55],
   [-68, -52], [-69, -50], [-65.8, -45], [-63, -42], [-57.5, -38], [-58, -34.5], [-53, -34],
   [-48.5, -26], [-45, -23.5], [-41, -22], [-39, -15], [-35, -9], [-35.2, -5.5], [-41, -3],
   [-50, 0], [-52, 5], [-57, 6], [-61, 10], [-67, 10.5], [-72, 11.5], [-76, 9], [-79.5, 9],
   [-83, 10], [-83.5, 15], [-87, 16], [-88, 21], [-90.5, 21], [-97, 22], [-97, 27], [-94, 29.5],
   [-89, 30], [-85, 29.8], [-83, 29], [-82.7, 27.5], [-81, 25.2], [-80.1, 26.5], [-81.3, 30.5],
   [-78, 34], [-75.5, 35.3], [-76, 37], [-74, 40.5], [-70, 41.5], [-70, 43.8], [-66, 44.8],
   [-61, 45.5], [-60, 47], [-53, 47], [-56, 52], [-61, 56], [-64, 60]],
  // Europe and Africa, the part of them that shows
  [[-4, 48.5], [-1.5, 43.5], [-9, 43], [-8.8, 37], [-6, 36], [-9.5, 31], [-13, 27.5], [-17, 21],
   [-17.5, 14.7], [-15, 11], [-13, 9], [-11, 6.5], [-7.5, 4.5], [-2, 5], [-0.1, 5.5]],
  // Japan and the coast of China
  [[130, 31], [131.5, 34], [135, 34], [140, 35], [141, 38.5], [141.5, 41.5], [140, 42],
   [141, 45], [145, 43.5]],
  [[121, 23], [121.5, 31], [122, 37], [126, 37], [126.5, 34.5], [129, 35], [130, 42], [140, 48], [141, 53]],
  // New Holland's north-east corner and New Guinea, at the edge
  [[142, -11], [145.5, -15], [149, -21], [153, -26], [151, -34]],
  [[131, -1], [141, -3], [147, -6], [150, -10.5]]
];
const ISLES = [[-155.5, 19.6], [-157, 21], [-159.5, 22], [-90.5, -0.6], [-28.7, 38.5],
  [-25.5, 37.8], [-24, 16], [-149.5, -17.5], [174, -41], [172, -37]];

const HEADINGS = [[-150, 5, 'The Pacific Ocean'], [-40, 25, 'The Atlantic']];

export function drawChart(l, onPick) {
  const svg = [`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="The chart of the voyage">`];
  for (let lat = -60; lat <= 60; lat += 20) {
    svg.push(`<line class="grat" x1="0" x2="${W}" y1="${y(lat)}" y2="${y(lat)}"/>`);
  }
  for (let lon = 120; lon <= 360; lon += 30) {
    svg.push(`<line class="grat" y1="0" y2="${H}" x1="${x(lon)}" x2="${x(lon)}"/>`);
  }
  svg.push(`<line class="line" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>`);
  for (const [lon, lat, said] of HEADINGS) svg.push(`<text class="ocean" x="${x(lon)}" y="${y(lat)}">${said}</text>`);
  for (const c of COASTS) svg.push(`<polyline class="coast" points="${c.map(pt).join(' ')}"/>`);
  for (const i of ISLES) svg.push(`<circle class="isle" cx="${x(i[0])}" cy="${y(i[1])}" r="2.2"/>`);

  // The passages, with the months each one takes.
  for (const [a, b, months, via] of LINKS) {
    const A = STOPS[a], B = STOPS[b];
    const path = via === 'horn' ? viaHorn(A, B) : [[A.lon, A.lat], [B.lon, B.lat]];
    const mid = path[Math.floor(path.length / 2)];
    svg.push(`<polyline class="leg" points="${path.map(pt).join(' ')}"/>`);
    if (via !== 'horn' || a === 'fayal') svg.push(`<text class="months" x="${x(mid[0])}" y="${y(mid[1]) - 4}">${months}</text>`);
  }

  for (const [key, s] of Object.entries(STOPS)) {
    const here = key === l.at;
    const news = l.news[key] ? `<tspan class="news"> &middot; ${l.news[key]}</tspan>` : '';
    svg.push(`<g class="stop ${s.kind}${here ? ' here' : ''}" data-to="${key}">` +
      (s.kind === 'ground'
        ? `<circle cx="${x(s.lon)}" cy="${y(s.lat)}" r="22" class="ground"/>`
        : `<circle cx="${x(s.lon)}" cy="${y(s.lat)}" r="4.5"/>`) +
      `<text x="${x(s.lon) + 8}" y="${y(s.lat) - 8}">${s.said}${news}</text></g>`);
  }
  // Her mark: a small ship, where she is now.
  const H0 = STOPS[l.at];
  svg.push(`<g class="her" transform="translate(${x(H0.lon)},${y(H0.lat)})">` +
    '<path d="M-9,3 L9,3 L6,7 L-6,7 Z"/><path d="M0,3 L0,-10 M0,-9 L6,-2 L0,-2 M0,-6 L-5,0 L0,0"/></g>');
  svg.push('</svg>');

  const wrap = document.createElement('div');
  wrap.className = 'chart-wrap';
  wrap.innerHTML = svg.join('');
  if (onPick) for (const g of wrap.querySelectorAll('.stop')) g.addEventListener('click', () => onPick(g.dataset.to));
  return wrap;
}

// A passage round the Horn does not go over the land.
function viaHorn(A, B) {
  const horn = [-67, -58];
  const east = [-40, -40];
  const west = [-85, -45];
  const atl = (s) => s.lon > -70 || s.said === 'New Bedford';
  const first = atl(A) ? [[A.lon, A.lat], east, horn, west] : [[A.lon, A.lat], west, horn, east];
  return [...first, [B.lon, B.lat]];
}
