// The chart: where she actually is, on the actual sea.
//
// Her master saw two things and nothing else for weeks together -- his own
// deck, and a chart. This is the second of them. The land is real, from
// public-domain Natural Earth coastlines, so New Bedford is where New Bedford
// is and Cape Horn is where Cape Horn is.
//
// It is drawn on **Mercator**, which is not a whim: on a Mercator chart a
// steady compass course is a straight line, which is the entire reason every
// sea chart from 1569 onward used it and why a navigator would recognise no
// other. A chart on any other projection would be a picture of the world
// rather than a thing you could shape a course on.
import { LAND } from './coast.js';
import { compassPoint } from './wind.js';

const NM_PER_DEG = 60;          // minutes of latitude in a degree, and a minute is a mile
const TOP = 78;                 // Mercator runs away to infinity; stop short of it

// Mercator: longitude is itself, latitude is stretched so that a rhumb line
// comes out straight.
const merc = (lat) => {
  const l = Math.max(-TOP, Math.min(TOP, lat)) * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + l / 2)) * 180 / Math.PI;
};

const W = 900, H = 560;
const EDGE = 34;                // the neatline: a chart has a graduated border

// The ornament of a chart of the period, drawn rather than fetched. Foxed
// paper, a graduated neatline, rhumb lines radiating from compass roses, and a
// cartouche. None of it is a picture file: the paper's stain is an SVG
// turbulence filter and the rest is lines.
const PAPER = `
<defs>
  <filter id="foxed" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves="4" seed="7"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.32  0 0 0 0 0.16  0 0 0 0.30 0"/>
  </filter>
  <filter id="damp" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="3"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.38  0 0 0 0 0.27  0 0 0 0 0.12  0 0 0 0.22 0"/>
  </filter>
</defs>`;

// A rose of thirty-two points, with rhumb lines running out of it across the
// whole sheet -- the thing that makes a sea chart look like a sea chart.
function rose(cx, cy, reach, full) {
  let out = '<g class="rhumb">';
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    out += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" ` +
      `x2="${(cx + Math.sin(a) * reach).toFixed(1)}" y2="${(cy - Math.cos(a) * reach).toFixed(1)}" ` +
      `class="${i % 4 === 0 ? 'main' : i % 2 === 0 ? 'half' : ''}"/>`;
  }
  out += '</g>';
  if (!full) return out;

  out += `<g class="rose" transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r = i % 2 ? 15 : 26;
    const p = (t, k) => `${(Math.sin(a + t) * k).toFixed(1)} ${(-Math.cos(a + t) * k).toFixed(1)}`;
    out += `<path class="${i % 2 ? 'minor' : 'major'}" d="M ${p(0, r)} L ${p(Math.PI / 8, 5)} ` +
      `L 0 0 L ${p(-Math.PI / 8, 5)} Z"/>`;
  }
  out += '<circle class="pin" r="3.2"/><circle class="ring" r="27"/><circle class="ring" r="31"/>' +
    '<text class="np" y="-34">N</text></g>';
  return out;
}

// The graduated border, ticked every degree and numbered where the graticule
// falls, which is how a chart tells you where you are without a grid over the
// water.
function neatline(at, step, span) {
  let ticks = '';
  const fine = span > 90 ? 5 : span > 40 ? 2 : 1;
  for (let lon = -180; lon <= 180; lon += fine) {
    const [x] = at(0, lon);
    if (x < EDGE || x > W - EDGE) continue;
    const big = lon % step === 0;
    ticks += `<line class="tick" x1="${x.toFixed(1)}" y1="${EDGE}" x2="${x.toFixed(1)}" y2="${(EDGE - (big ? 9 : 5)).toFixed(1)}"/>` +
      `<line class="tick" x1="${x.toFixed(1)}" y1="${H - EDGE}" x2="${x.toFixed(1)}" y2="${(H - EDGE + (big ? 9 : 5)).toFixed(1)}"/>`;
    if (big) {
      ticks += `<text class="deg" x="${x.toFixed(1)}" y="${EDGE - 13}">${Math.abs(lon)}°${lon < 0 ? 'W' : lon > 0 ? 'E' : ''}</text>`;
    }
  }
  for (let lat = -85; lat <= 85; lat += fine) {
    const [, y] = at(lat, 0);
    if (y < EDGE || y > H - EDGE) continue;
    const big = lat % step === 0;
    ticks += `<line class="tick" x1="${EDGE}" y1="${y.toFixed(1)}" x2="${(EDGE - (big ? 9 : 5)).toFixed(1)}" y2="${y.toFixed(1)}"/>` +
      `<line class="tick" x1="${W - EDGE}" y1="${y.toFixed(1)}" x2="${(W - EDGE + (big ? 9 : 5)).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    if (big) {
      ticks += `<text class="deg lat" x="${EDGE - 5}" y="${(y + 3).toFixed(1)}">${Math.abs(lat)}°${lat < 0 ? 'S' : lat > 0 ? 'N' : ''}</text>`;
    }
  }
  return `<rect class="neat outer" x="6" y="6" width="${W - 12}" height="${H - 12}"/>` +
    `<rect class="neat" x="${EDGE}" y="${EDGE}" width="${W - EDGE * 2}" height="${H - EDGE * 2}"/>` +
    ticks;
}

export function makeChart(home) {
  const panel = document.createElement('div');
  panel.id = 'chart';
  panel.style.display = 'none';
  document.body.appendChild(panel);

  const track = [];               // where she has been, in degrees
  let lastLogged = 0;

  const showing = () => panel.style.display !== 'none';

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable) return;
    if (e.key === 'k' || e.key === 'K') { show(!showing()); e.preventDefault(); }
    else if (e.key === 'Escape') show(false);
  });

  function show(to) {
    panel.style.display = to ? '' : 'none';
    if (to) draw();
  }

  let latest = null;              // { lat, lon, heading, marks }

  // What window of the world to draw: everything that matters, with a margin,
  // and never so tight that there is no coast in sight to place her by.
  function window_() {
    const pts = [[home.lat, home.lon], ...(latest ? [[latest.lat, latest.lon]] : []),
                 ...(latest ? latest.marks.map((m) => [m.lat, m.lon]) : [])];
    let n = -90, s = 90, w = 180, e = -180;
    for (const [lat, lon] of pts) {
      n = Math.max(n, lat); s = Math.min(s, lat);
      w = Math.min(w, lon); e = Math.max(e, lon);
    }
    const midLat = (n + s) / 2, midLon = (w + e) / 2;
    const span = Math.max(e - w, (n - s) * 1.6, 11) * 1.5;
    return { midLat, midLon, span };
  }

  function draw() {
    const win = window_();
    const scale = W / win.span;                      // pixels per degree of longitude
    const y0 = merc(win.midLat);
    const at = (lat, lon) => [
      W / 2 + (lon - win.midLon) * scale,
      H / 2 - (merc(lat) - y0) * scale
    ];

    // The land. Rings are flat runs of lon, lat.
    //
    // Every point of a ring is drawn, even the ones off the sheet. Skipping
    // them tears the outline open and the closing stroke then cuts straight
    // across the gap, which is what turned North America into a wedge. The
    // clipping is left to the SVG, which is better at it.
    const land = LAND.map((r) => {
      // Skip a ring only if the whole of it is off the sheet.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const pts = [];
      for (let i = 0; i < r.length; i += 2) {
        const [x, y] = at(r[i + 1], r[i]);
        pts.push(x, y);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      if (maxX < 0 || minX > W || maxY < 0 || minY > H) return '';

      let d = '';
      for (let i = 0; i < pts.length; i += 2) {
        d += (i ? 'L' : 'M') + pts[i].toFixed(1) + ' ' + pts[i + 1].toFixed(1);
      }
      return `<path class="land" d="${d}Z"/>`;
    }).join('');

    // The graticule, at whatever spacing keeps it readable.
    const step = win.span > 60 ? 20 : win.span > 24 ? 10 : win.span > 10 ? 5 : 2;
    let grid = '';
    for (let lon = -180; lon <= 180; lon += step) {
      const [x] = at(0, lon);
      if (x < 0 || x > W) continue;
      // Lines only. The graduated border carries the numbers, as a chart's does.
      grid += `<line class="grat" x1="${x}" y1="${EDGE}" x2="${x}" y2="${H - EDGE}"/>`;
    }
    for (let lat = -80; lat <= 80; lat += step) {
      const [, y] = at(lat, 0);
      if (y < 0 || y > H) continue;
      grid += `<line class="grat" x1="${EDGE}" y1="${y}" x2="${W - EDGE}" y2="${y}"/>`;
    }

    // Her track, and the marks she is running between.
    let laid = '';
    if (track.length > 1) {
      laid += '<path class="track" d="' + track.map(([lat, lon], i) => {
        const [x, y] = at(lat, lon);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join('') + '"/>';
    }

    const port = at(home.lat, home.lon);
    laid += `<g class="port" transform="translate(${port[0].toFixed(1)},${port[1].toFixed(1)})">` +
      '<circle r="4"/><text x="7" y="4">' + home.said + '</text></g>';

    for (const m of (latest ? latest.marks : [])) {
      const [x, y] = at(m.lat, m.lon);
      laid += `<g class="mark" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">` +
        '<path d="M0 -6 L5 5 L-5 5 Z"/><text x="8" y="4">' + m.said + '</text></g>';
    }

    let her = '';
    if (latest) {
      const [x, y] = at(latest.lat, latest.lon);
      her = `<g class="her" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) ` +
        `rotate(${latest.heading.toFixed(0)})">` +
        '<path d="M0 -10 L5.5 8 L0 4.5 L-5.5 8 Z"/></g>';
    }

    // A scale bar, in the only unit she measures anything in.
    const nm = win.span * NM_PER_DEG;
    const round = [60, 120, 300, 600, 1200, 3000, 6000].find((n) => n > nm / 5) || 6000;
    const bar = (round / NM_PER_DEG) * scale;
    const scaleBar =
      `<g class="scale" transform="translate(${W - bar - EDGE - 18},${H - EDGE - 22})">` +
      `<line x1="0" y1="0" x2="${bar.toFixed(1)}" y2="0"/>` +
      `<line x1="0" y1="-5" x2="0" y2="5"/><line x1="${bar.toFixed(1)}" y1="-5" x2="${bar.toFixed(1)}" y2="5"/>` +
      `<text x="${(bar / 2).toFixed(1)}" y="-9">${round} sea miles</text></g>`;

    const said = latest
      ? `${Math.abs(latest.lat).toFixed(2)}° ${latest.lat < 0 ? 'S' : 'N'}, ` +
        `${Math.abs(latest.lon).toFixed(2)}° ${latest.lon < 0 ? 'W' : 'E'} — ` +
        `heading ${compassPoint(latest.heading)}`
      : '';

    // A rose in an empty quarter of the sheet, with the rhumbs running out of
    // it, and two lesser ones for the network to cross at.
    const rhumbs = rose(W * 0.74, H * 0.30, W, true) +
      rose(W * 0.22, H * 0.72, W * 0.8, false);

    const cartouche =
      `<g class="cartouche" transform="translate(${EDGE + 16},${H - EDGE - 58})">` +
      '<rect x="-8" y="-22" width="286" height="66" rx="2"/>' +
      '<text class="title" y="-4">A Chart of the Western Ocean</text>' +
      '<text class="sub" y="14">and the passage to the Pacifick Ground</text>' +
      '<text class="sub small" y="31">New Bedford · 1841</text></g>';

    panel.innerHTML = '<h2>The chart</h2>' +
      // The sheet clips its own edges, so land running off it is simply cut.
      `<svg class="sea" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">` +
      PAPER +
      `<rect class="water" x="0" y="0" width="${W}" height="${H}"/>` +
      `<rect class="stain" x="0" y="0" width="${W}" height="${H}" filter="url(#damp)"/>` +
      // The rose and its rhumbs are printed over the land, as they are on a
      // real chart: the network belongs to the sheet, not to the sea.
      grid + land + rhumbs + laid + her +
      `<rect class="grain" x="0" y="0" width="${W}" height="${H}" filter="url(#foxed)"/>` +
      neatline(at, step, win.span) + cartouche + scaleBar + '</svg>' +
      `<p class="fix">${said}</p>` +
      '<p class="note">Drawn on Mercator, as every sea chart since 1569 has been: on ' +
      'this projection a steady compass course comes out a straight line, which is ' +
      'the whole reason a navigator wanted it.<br>' +
      'Coastlines from Natural Earth, which is in the public domain. ' +
      '<b>k</b> or <b>esc</b> to close.</p>';
  }

  // Called every frame. Keeps her position, and lays a breadcrumb now and then.
  return function tick(gameSeconds, lat, lon, heading, marks) {
    latest = { lat, lon, heading, marks };
    if (gameSeconds - lastLogged > 900) {        // a fix every quarter of an hour
      lastLogged = gameSeconds;
      track.push([lat, lon]);
      if (track.length > 400) track.shift();
    }
    if (showing()) draw();
  };
}
