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
      grid += `<line class="grat" x1="${x}" y1="0" x2="${x}" y2="${H}"/>` +
        `<text class="deg" x="${x + 3}" y="${H - 6}">${Math.abs(lon)}°${lon < 0 ? 'W' : lon > 0 ? 'E' : ''}</text>`;
    }
    for (let lat = -80; lat <= 80; lat += step) {
      const [, y] = at(lat, 0);
      if (y < 0 || y > H) continue;
      grid += `<line class="grat" x1="0" y1="${y}" x2="${W}" y2="${y}"/>` +
        `<text class="deg" x="4" y="${y - 4}">${Math.abs(lat)}°${lat < 0 ? 'S' : lat > 0 ? 'N' : ''}</text>`;
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
      `<g class="scale" transform="translate(${W - bar - 24},${H - 34})">` +
      `<line x1="0" y1="0" x2="${bar.toFixed(1)}" y2="0"/>` +
      `<line x1="0" y1="-5" x2="0" y2="5"/><line x1="${bar.toFixed(1)}" y1="-5" x2="${bar.toFixed(1)}" y2="5"/>` +
      `<text x="${(bar / 2).toFixed(1)}" y="-9">${round} sea miles</text></g>`;

    const said = latest
      ? `${Math.abs(latest.lat).toFixed(2)}° ${latest.lat < 0 ? 'S' : 'N'}, ` +
        `${Math.abs(latest.lon).toFixed(2)}° ${latest.lon < 0 ? 'W' : 'E'} — ` +
        `heading ${compassPoint(latest.heading)}`
      : '';

    panel.innerHTML = '<h2>The chart</h2>' +
      // The sheet clips its own edges, so land running off it is simply cut.
      `<svg class="sea" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">` +
      `<rect class="water" x="0" y="0" width="${W}" height="${H}"/>` +
      grid + land + laid + her + scaleBar + '</svg>' +
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
