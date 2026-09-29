// The kinds of whale, what each is worth, how each behaves when chased,
// and what each looks like. Oil is in barrels; prices are per barrel, 1841.
import * as THREE from 'three';

export const PRICE = { whale: 11, sperm: 30 };

export const SPECIES = {
  right: {
    name: 'right whale', note: 'Slow and easy to take.', oil: 'whale', bbl: [60, 110], size: [0.95, 1.2], color: 0x1f252c,
    body: 'baleen', blow: 'v', wander: 1.2, flee: 1.8, stove: 0.08, sound: 0.15, sink: 0,
  },
  bowhead: {
    name: 'bowhead', note: 'Thick with blubber; keeps near the ice.', oil: 'whale', bbl: [90, 150], size: [1.05, 1.3], color: 0x2a323b, chin: true,
    body: 'baleen', blow: 'v', wander: 1.1, flee: 1.6, stove: 0.12, sound: 0.3, sink: 0,
  },
  sperm: {
    name: 'sperm whale', note: 'The best oil of all, and she fights.', oil: 'sperm', bbl: [35, 85], size: [0.85, 1.25], color: 0x4b4b50,
    body: 'sperm', blow: 'forward', wander: 1.5, flee: 2.2, stove: 0.35, sound: 0.35, sink: 0,
  },
  humpback: {
    name: 'humpback', note: 'Poor oil, and she may sink when killed.', oil: 'whale', bbl: [25, 50], size: [0.8, 1.0], color: 0x353c44, fins: true,
    body: 'baleen', blow: 'column', wander: 1.4, flee: 2.2, stove: 0.15, sound: 0.2, sink: 0.5,
  },
  finback: {
    name: 'finback', note: 'Too fast for any boat.', oil: 'whale', bbl: [0, 0], size: [1.1, 1.3], color: 0x4a5058, dorsal: true,
    body: 'fin', blow: 'column', wander: 2.6, flee: 7.5, stove: 0, sound: 0, sink: 0, tooFast: true,
  },
};

// Which kinds keep where: bowheads among the northern ice, sperm whales in
// the south, right whales and humpbacks between. Finbacks anywhere.
export function pickKind(z, rand) {
  const w = z < -120 ? { bowhead: 6, right: 3, finback: 1 }
    : z > 120 ? { sperm: 5, humpback: 3, right: 1, finback: 1 }
    : { right: 4.5, humpback: 2.5, sperm: 1.5, finback: 1.5 };
  let r = rand() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, n] of Object.entries(w)) if ((r -= n) <= 0) return k;
  return 'right';
}

// How a whale is described once she is near enough to make out.
export function describe(w) {
  const sp = SPECIES[w.kind], [lo, hi] = sp.size, k = (w.size - lo) / (hi - lo);
  const age = k > 0.7 ? (w.kind === 'sperm' ? 'large bull ' : 'large ') : k < 0.3 ? 'young ' : '';
  return age + sp.name;
}

// Body outlines turned on a lathe: [radius, position along the body].
const OUTLINES = {
  baleen: [[0, 5.2], [1.0, 4.7], [1.6, 3.4], [1.8, 1.4], [1.6, -0.8], [1.15, -2.6], [0.65, -4], [0.3, -5], [0.16, -5.6]],
  sperm: [[0, 5.5], [1.25, 5.4], [1.5, 4.3], [1.55, 2], [1.4, 0], [1.1, -2], [0.7, -3.8], [0.35, -5], [0.18, -5.6]],
  fin: [[0, 5.8], [0.6, 5.2], [1.0, 3.8], [1.15, 1.5], [1.05, -0.8], [0.8, -2.8], [0.45, -4.4], [0.2, -5.6], [0.12, -6]],
};
const PALE = new THREE.Color(0xd3d7da);
const cache = {};

// The body of a kind of whale, coloured, with fins where she has them.
export function bodyGeometry(kind) {
  if (cache[kind]) return cache[kind];
  const sp = SPECIES[kind], dark = new THREE.Color(sp.color);
  let g = new THREE.LatheGeometry(OUTLINES[sp.body].map(([r, y]) => new THREE.Vector2(r, y)), 8);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, 0.72, 1);
  g = g.toNonIndexed();
  const parts = [g];
  if (sp.fins) parts.push(flat([[2.2, 0], [1.2, 0], [-0.4, 3.6], [0.3, 3.8]], -0.5), flat([[2.2, 0], [1.2, 0], [-0.4, -3.6], [0.3, -3.8]], -0.5));
  if (sp.dorsal) {
    const d = new THREE.BufferGeometry();
    d.setAttribute('position', new THREE.Float32BufferAttribute([-2.6, 0.7, 0, -3.6, 0.6, 0, -3.5, 1.5, 0], 3));
    parts.push(d);
  }
  const n = parts.reduce((a, p) => a + p.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let off = 0;
  for (const p of parts) {
    const a = p.attributes.position;
    for (let i = 0; i < a.count; i++, off++) {
      const x = a.getX(i), y = a.getY(i);
      pos.set([x, y, a.getZ(i)], off * 3);
      const c = (sp.chin && y < -0.4 && x > 2.6) || p !== g ? PALE : dark;   // white chin, pale flippers
      col.set([c.r, c.g, c.b], off * 3);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeVertexNormals();
  return (cache[kind] = out);
}

// A flat fin lying at height y, from four corners given as [x, z].
function flat(pts, y) {
  const [a, b, c, d] = pts.map(([x, z]) => [x, y, z]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  return g;
}
