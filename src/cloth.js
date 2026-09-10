// Her canvas, drawn on a canvas.
//
// A sail is not a white slab. It is made of cloths -- strips of sailcloth
// about two feet wide, sewn edge to edge up and down the sail -- so a real
// sail is ruled with vertical seams from head to foot. Across the upper part
// run the reef bands, doubled strips of cloth carrying the reef points the
// hands knot round the yard when they take a reef in. And no working sail is
// white: it is weathered, salt-stained and patched.
//
// All of it is drawn onto an HTML canvas element at load and handed to
// Three.js as a texture. No image file, no modelling tool, nothing in the repo
// but this. DESIGN section 4 already sanctions the technique for the crew
// sprites; this is the same trick on her canvas.
import * as THREE from 'three';

const CLOTH_W = 128;        // one cloth across, tiled by the sail's own width
const SAIL_H = 512;         // the whole hoist, head to foot, not tiled

// Where the reef bands lie, as a fraction of the hoist up from the foot. A
// square sail reefs at the head, because the sail is gathered up to the yard.
const BANDS = [0.72, 0.80, 0.88];

const rand = (a, b) => a + Math.random() * (b - a);

export function sailCloth() {
  const c = document.createElement('canvas');
  c.width = CLOTH_W;
  c.height = SAIL_H;
  const g = c.getContext('2d');

  // The material carries the colour; the texture only darkens it. So the
  // ground is white and everything drawn on it is a shadow of some kind.
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, CLOTH_W, SAIL_H);

  // Weathering: soft blotches of salt and damp, so no two square feet of her
  // canvas are quite the same tone.
  for (let i = 0; i < 90; i++) {
    const x = rand(-20, CLOTH_W + 20), y = rand(0, SAIL_H);
    const r = rand(12, 55);
    const wash = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand(0.03, 0.10);
    wash.addColorStop(0, `rgba(150,138,112,${dark})`);
    wash.addColorStop(1, 'rgba(150,138,112,0)');
    g.fillStyle = wash;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // The seam between this cloth and the next. Drawn at both edges so that
  // when the texture tiles, one seam falls on the join.
  const seam = (x) => {
    g.fillStyle = 'rgba(112,100,76,0.46)';
    g.fillRect(x - 1, 0, 2, SAIL_H);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(x + 1, 0, 1, SAIL_H);
  };
  seam(0.5);
  seam(CLOTH_W - 0.5);

  // The reef bands, and the reef points hanging from them.
  for (const v of BANDS) {
    const y = (1 - v) * SAIL_H;
    g.fillStyle = 'rgba(120,108,84,0.30)';
    g.fillRect(0, y - 5, CLOTH_W, 10);
    g.fillStyle = 'rgba(120,108,84,0.55)';
    g.fillRect(0, y - 6, CLOTH_W, 1.5);
    g.fillRect(0, y + 5, CLOTH_W, 1.5);

    g.fillStyle = 'rgba(100,88,66,0.62)';
    for (let i = 0; i < 3; i++) {
      const x = (i + 0.5) * (CLOTH_W / 3);
      g.fillRect(x - 1, y + 6, 2, 13);      // a reef point, hanging
    }
  }

  // The bolt rope: the sail is roped all round, and the head and foot read as
  // a firm dark edge rather than as a cut.
  g.fillStyle = 'rgba(110,96,70,0.55)';
  g.fillRect(0, 0, CLOTH_W, 4);
  g.fillRect(0, SAIL_H - 4, CLOTH_W, 4);

  const map = new THREE.CanvasTexture(c);
  // Across: one cloth, repeated as many times as the sail is cloths wide.
  // Up and down: once only, so the reef bands stay where they were put.
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 4;
  return map;
}

// A cloth is about two feet wide, which on a topsail fourteen metres across
// is a good many seams -- and that is exactly what a photograph of one shows.
export const CLOTH_METRES = 0.62;
