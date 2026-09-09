// The little drawings on her boards: a sail in each of its states, and the
// compass rose.
//
// All of it is drawn as SVG in the page rather than loaded as pictures, so
// there is nothing to download and it stays sharp at any size. The sails are
// seen from ahead, as they are on a sail plan.

// How much of the sail is left, and how many reef bands are tied down under
// it. Reefing takes the sail in from the foot upward, so the drawn cloth
// shrinks toward the yard and the tied-up bands stack below it.
const CLOTH = {
  'set':           { foot: 13.2, bands: 0 },
  '1st reef':      { foot: 10.6, bands: 1 },
  '2nd reef':      { foot: 8.2,  bands: 2 },
  'close-reefed':  { foot: 6.0,  bands: 3 },
  'furled':        { foot: 3.4,  bands: 0 }
};

// A square sail bent to its yard: the yard across the top, then the cloth.
export function sailGlyph(state, working) {
  if (state === null) return '<svg class="sail none" viewBox="0 0 22 16"></svg>';

  const cls = `sail ${String(state).replace(/[^a-z]/g, '')}${working ? ' working' : ''}`;
  if (state === 'gone') {
    return `<svg class="${cls} gone" viewBox="0 0 22 16">` +
      '<path class="yard" d="M3 3 H19"/>' +
      '<path class="tear" d="M7 6 L15 13 M15 6 L7 13"/></svg>';
  }

  const c = CLOTH[state] || CLOTH.set;
  const head = 3.6;                          // the yard is at y = 3
  const spread = (y) => 5 + (y - head) * 0.30;   // she widens toward the foot
  const wHead = spread(head), wFoot = spread(c.foot);

  const cloth = state === 'furled'
    ? '<rect class="cloth furl" x="5.4" y="3.4" width="11.2" height="2.0" rx="0.9"/>'
    : `<path class="cloth" d="M${11 - wHead} ${head} H${11 + wHead} ` +
      `L${11 + wFoot} ${c.foot} H${11 - wFoot} Z"/>`;

  // The reefs tied down in a bundle under the foot of what is still set.
  let bands = '';
  for (let i = 0; i < c.bands; i++) {
    const y = c.foot + 1.05 + i * 1.15;
    const w = spread(y) * 0.94;
    bands += `<path class="reef" d="M${11 - w} ${y} H${11 + w}"/>`;
  }

  return `<svg class="${cls}" viewBox="0 0 22 16">` +
    '<path class="yard" d="M3 3 H19"/>' + cloth + bands + '</svg>';
}

// A fore-and-aft sail: the spanker on her gaff, and the headsails on their
// stays. Drawn as triangles, because that is what they look like.
export function foreAftGlyph(state, working, kind) {
  if (state === null) return '<svg class="sail none" viewBox="0 0 22 16"></svg>';
  const cls = `sail ${String(state).replace(/[^a-z]/g, '')}${working ? ' working' : ''}`;
  if (state === 'gone') {
    return `<svg class="${cls} gone" viewBox="0 0 22 16">` +
      '<path class="tear" d="M7 4 L15 13 M15 4 L7 13"/></svg>';
  }

  const c = CLOTH[state] || CLOTH.set;
  const shrink = (c.foot - 3.4) / 9.8;       // 1 when set, 0 when furled
  const luff = kind === 'spanker' ? 5.5 : 16.5;
  const foot = 3.4 + 9.8 * shrink;

  const cloth = shrink < 0.12
    ? `<path class="cloth furl" d="M${luff} 3.4 L${luff} 6.4"/>`
    : kind === 'spanker'
      ? `<path class="cloth" d="M${luff} 3 L${luff + 11 * shrink} ${foot} L${luff} ${foot} Z"/>`
      : `<path class="cloth" d="M${luff} 3 L${luff - 11 * shrink} ${foot} L${luff} ${foot} Z"/>`;

  const spar = kind === 'spanker'
    ? `<path class="yard" d="M${luff} 2.6 V${foot + 0.4}"/>`
    : '';
  return `<svg class="${cls}" viewBox="0 0 22 16">${spar}${cloth}</svg>`;
}

// The compass rose. Her head is the needle; the wind is the light arrow
// outside the ring. Both are turned by the board every frame.
export const COMPASS = `
<svg viewBox="-52 -52 104 104" class="rose">
  <circle class="rim" r="42"/>
  <circle class="face" r="38"/>
  <g class="ticks">
    ${Array.from({ length: 32 }, (_, i) => {
      const a = (i * 11.25) * Math.PI / 180;
      const long = i % 8 === 0 ? 7 : i % 4 === 0 ? 5 : 3;
      const s = 38 - long, e = 38;
      return `<line x1="${(Math.sin(a) * s).toFixed(2)}" y1="${(-Math.cos(a) * s).toFixed(2)}" ` +
             `x2="${(Math.sin(a) * e).toFixed(2)}" y2="${(-Math.cos(a) * e).toFixed(2)}" ` +
             `class="${i % 8 === 0 ? 'cardinal' : ''}"/>`;
    }).join('')}
  </g>
  <text class="letter" x="0" y="-24">N</text>
  <text class="letter" x="26" y="4">E</text>
  <text class="letter" x="0" y="32">S</text>
  <text class="letter" x="-26" y="4">W</text>
  <g class="needle">
    <path class="north" d="M0 -30 L5 0 L0 5 L-5 0 Z"/>
    <path class="south" d="M0 30 L5 0 L0 -5 L-5 0 Z"/>
  </g>
  <circle class="pin" r="2.6"/>
  <g class="wind"><path d="M0 -50 L4.4 -42 L0 -44 L-4.4 -42 Z"/></g>
</svg>`;
