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
