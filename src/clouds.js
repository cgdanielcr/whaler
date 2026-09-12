// Cloud, painted once at load onto a canvas and then only looked up.
//
// Noise is cheap to write and dear to run: worked out for every pixel of the
// sky, every frame, it is the most expensive thing that could be on the
// screen. So it is worked out once here, on the processor, into a small
// square that tiles, and after that the graphics card only reads from it.
// The whole sky then costs two texture lookups a pixel.
//
// When there are painted cloud sheets to use instead, they replace what this
// makes and nothing else changes.
import * as THREE from 'three';

const SIZE = 256;         // it is cloud; it does not want to be sharp

// Value noise on a lattice that wraps, so the square tiles seamlessly.
function lattice(n, seed) {
  const g = new Float32Array(n * n);
  let h = seed >>> 0;
  for (let i = 0; i < g.length; i++) {
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    g[i] = (h >>> 0) / 4294967295;
  }
  return g;
}

const ease = (t) => t * t * (3 - 2 * t);

function noiseAt(g, n, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = ease(x - xi), yf = ease(y - yi);
  const x0 = ((xi % n) + n) % n, y0 = ((yi % n) + n) % n;
  const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
  const a = g[y0 * n + x0], b = g[y0 * n + x1];
  const c = g[y1 * n + x0], d = g[y1 * n + x1];
  return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
}

// Four octaves is enough for cloud. Each octave is sampled at exactly the
// size of its own lattice, so the whole square tiles.
//
// The billow term folds the noise about its middle and turns it back up
// again, which piles the value toward the top and gives cloud its heaped,
// rounded look instead of the smeared look of plain noise.
function fbm(grids, u, v, octaves, billow) {
  let sum = 0, amp = 1, weight = 0;
  for (let o = 0; o < octaves; o++) {
    const n = grids[o].n;
    let v0 = noiseAt(grids[o], n, u * n, v * n);
    if (billow) v0 = 1 - Math.abs(v0 * 2 - 1);
    sum += v0 * amp;
    weight += amp;
    amp *= 0.52;
  }
  return sum / weight;
}

// One sheet of cloud: how much of the sky it covers, and how hard its edges
// are. Low sheets are broken and hard; high sheets are thin and soft.
export function cloudSheet({ seed = 1, cover = 0.52, edge = 0.30, billow = true, octaves = 4 }) {
  const grids = [];
  for (let o = 0; o < octaves; o++) {
    const n = 8 << o;
    const g = lattice(n, seed * 7919 + o * 104729);
    g.n = n;
    grids.push(g);
  }

  // Work the field out first, then stretch it to fill nought to one. Noise
  // piles up around its middle, so a fixed threshold on the raw numbers gives
  // either no cloud at all or nothing but cloud; against the field's own
  // range, "cover" means what it says.
  const field = new Float32Array(SIZE * SIZE);
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = fbm(grids, x / SIZE, y / SIZE, octaves, billow);
      field[y * SIZE + x] = n;
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
  }
  const span = Math.max(1e-6, hi - lo);

  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);

  for (let i = 0; i < field.length; i++) {
    const n = (field[i] - lo) / span;
    // Everything above the line is cloud; the softness of the line is what
    // makes an edge ragged rather than cut with scissors.
    const a = Math.max(0, Math.min(1, (n - (1 - cover)) / edge));
    const p = i * 4;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = 255;
    img.data[p + 3] = Math.round(a * a * (3 - 2 * a) * 255);
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// The drawn cloud.
//
// art/clouds.png is five engraved cloud masses well apart on one sheet, so
// they can be cut up and scattered -- which is what happens here. They are
// found without being told where they are, laid at random over a square that
// wraps, and handed to the sky as one tiling sheet: the drawing's own light
// and shade in the colour, how much of it there is in the alpha.
//
// The pieces are found on a coarse copy of the sheet, where a square of eight
// pixels counts as cloud only if a fifth of it is solidly inked. That one test
// is what separates them: the five masses trail wisps towards one another and
// very nearly touch, so anything that asks merely whether a pixel is marked --
// or worse, thickens the mask first -- brings the whole sheet back as one
// shape, which is what the first attempt did.
const TILE = 1024;
const COARSE = 8;           // how much the sheet is shrunk before it is read
const SOLID = 120;          // how opaque a pixel must be to count at all
const SHARE = 0.18;         // and how much of a square must be that opaque

function piecesIn(px, w, h) {
  const cw = Math.ceil(w / COARSE), ch = Math.ceil(h / COARSE);
  const tally = new Uint16Array(cw * ch);
  for (let y = 0; y < h; y++) {
    const row = (y / COARSE) | 0;
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > SOLID) tally[row * cw + ((x / COARSE) | 0)]++;
    }
  }
  const need = COARSE * COARSE * SHARE;
  const cell = new Uint8Array(cw * ch);
  for (let i = 0; i < cell.length; i++) cell[i] = tally[i] > need ? 1 : 0;

  const seen = new Uint8Array(cw * ch);
  const out = [];
  for (let s = 0; s < cell.length; s++) {
    if (!cell[s] || seen[s]) continue;
    const stack = [s];
    seen[s] = 1;
    let x0 = cw, x1 = 0, y0 = ch, y1 = 0, n = 0;
    while (stack.length) {
      const i = stack.pop();
      const x = i % cw, y = (i / cw) | 0;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      const near = [x > 0 ? i - 1 : -1, x < cw - 1 ? i + 1 : -1,
                    y > 0 ? i - cw : -1, y < ch - 1 ? i + cw : -1];
      for (const j of near) if (j >= 0 && cell[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
    }
    if (n < 100) continue;                           // a speck, not a cloud
    // Opened out a little, because the coarse test throws away the thin end of
    // every wisp and those are half of what makes a drawn cloud look drawn.
    const pad = COARSE * 3;
    const ax = Math.max(0, x0 * COARSE - pad), ay = Math.max(0, y0 * COARSE - pad);
    out.push({
      x: ax, y: ay,
      w: Math.min(w, (x1 + 1) * COARSE + pad) - ax,
      h: Math.min(h, (y1 + 1) * COARSE + pad) - ay
    });
  }
  return out;
}

// A seeded shuffle of the sky, so the same weather comes back twice.
function roll(seed) {
  let h = seed >>> 0;
  return () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967295; };
}

export async function drawnCloud() {
  const sheet = await new Promise((done) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = 'art/clouds.png';
  });
  if (!sheet) return null;

  const read = document.createElement('canvas');
  read.width = sheet.width;
  read.height = sheet.height;
  const rg = read.getContext('2d', { willReadFrequently: true });
  rg.drawImage(sheet, 0, 0);
  const pieces = piecesIn(rg.getImageData(0, 0, read.width, read.height).data,
                          read.width, read.height);
  if (pieces.length < 3) return null;

  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d');
  const rnd = roll(20240912);

  // Laid down largest first, so the small ones sit in front of the banks
  // rather than being swallowed by them. Every one is drawn nine times, an
  // eighth of a turn of the sky apart, which is what makes the square wrap:
  // a cloud running off one edge comes back on at the other.
  // Six, and none of them large. Nine at half the width of the square covered
  // the whole sheet, and a sky with no paper left in it is not a sky with
  // clouds in it -- it is an overcast.
  const laid = [];
  for (let i = 0; i < 6; i++) {
    const p = pieces[Math.floor(rnd() * pieces.length) % pieces.length];
    const wide = TILE * (0.20 + rnd() * 0.22);
    laid.push({ p, wide, tall: wide * (p.h / p.w), x: rnd() * TILE, y: rnd() * TILE,
                flip: rnd() < 0.5 });
  }
  laid.sort((a, b) => b.wide - a.wide);

  for (const l of laid) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        g.save();
        g.translate(l.x + dx * TILE + (l.flip ? l.wide : 0), l.y + dy * TILE);
        if (l.flip) g.scale(-1, 1);
        g.drawImage(sheet, l.p.x, l.p.y, l.p.w, l.p.h, 0, 0, l.wide, l.tall);
        g.restore();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
