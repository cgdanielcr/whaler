// The ship's dressing: the small things that make her a particular ship at
// sea. Sailcloth sewn in cloths with its reef bands; copper at her waterline;
// lit stern windows and a lantern on the taffrail; hatches, the wheel, the
// windlass, anchors at the catheads, casks lashed in the waist, and the
// galley's stovepipe.
import * as THREE from 'three';

// Sailcloth: narrow cloths seamed up and down, two reef bands with their points, weathered toward the foot.
export function sailcloth() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const shade = g.createLinearGradient(0, 0, 0, 256);
  shade.addColorStop(0, '#fbf5e6'); shade.addColorStop(0.7, '#f1e7d0'); shade.addColorStop(1, '#e2d5b8');
  g.fillStyle = shade; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 21) {                       // the cloths
    g.fillStyle = `rgba(120, 100, 70, ${0.05 + ((x * 7) % 5) * 0.012})`; g.fillRect(x, 0, 21, 256);
    g.fillStyle = 'rgba(92, 74, 50, 0.5)'; g.fillRect(x, 0, 1.6, 256);
  }
  for (const y of [52, 92]) {                               // reef bands and reef points
    g.fillStyle = 'rgba(92, 74, 50, 0.4)'; g.fillRect(0, y, 256, 3);
    g.fillStyle = 'rgba(70, 55, 38, 0.75)';
    for (let x = 10; x < 256; x += 21) g.fillRect(x, y + 2, 2, 11);
  }
  g.fillStyle = 'rgba(92, 74, 50, 0.6)'; g.fillRect(0, 0, 256, 4); g.fillRect(0, 250, 256, 6);   // head and foot ropes
  for (let i = 0; i < 26; i++) {                            // weather stains
    g.fillStyle = `rgba(110, 96, 70, ${0.03 + (i % 4) * 0.012})`;
    g.beginPath(); g.ellipse((i * 67) % 256, 120 + ((i * 41) % 130), 14 + (i % 5) * 6, 26 + (i % 3) * 14, 0, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const COPPER = mat(0x5f8f7c, { roughness: 0.6 }), DARK = mat(0x1d1a17), IRON = mat(0x2b2d30), OAK = mat(0x7a5a3a);
const GLOW = mat(0xffcf7a, { emissive: 0xffa53a, emissiveIntensity: 1.6 });

// Add her dressing to the ship's group g. ring: makes a band following her side (from ship.js). deckY: the height of her deck.
export function dress(g, ring, deckY) {
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const cyl = (r, h, m, x, y, z, rz = 0) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 7), m); o.position.set(x, y, z); o.rotation.z = rz; g.add(o); return o; };
  g.add(ring(1.006, 0.9, 0.42, -0.36, COPPER));             // copper, green with the sea, showing as she rolls
  g.add(ring(1.016, 0.985, 0.07, 0.72, mat(0xc79a3f)));      // a thin yellow strake under her rail
  for (const z of [-0.85, -0.28, 0.28, 0.85]) box(0.06, 0.36, 0.34, GLOW, -7.03, 1.02, z);   // stern windows, lit
  cyl(0.03, 0.9, IRON, -6.9, 1.85, 0); box(0.22, 0.28, 0.22, GLOW, -6.9, 2.4, 0);             // the taffrail lantern
  box(1.5, 0.12, 1.3, DARK, 0.9, deckY + 0.06, 0); box(0.9, 0.12, 0.9, DARK, 5.0, deckY + 0.06, 0);   // main hatch, forecastle scuttle
  cyl(0.42, 0.07, OAK, -6.2, deckY + 0.55, 0, Math.PI / 2);                                     // the wheel
  box(0.18, 0.5, 0.18, OAK, -6.0, deckY + 0.25, 0);                                             // the binnacle
  cyl(0.24, 2.2, OAK, 6.0, deckY + 0.3, 0, 0).rotation.x = Math.PI / 2;                         // the windlass barrel
  for (const side of [-1, 1]) {
    box(1.1, 0.14, 0.14, OAK, 6.4, deckY + 0.5, side * 1.5, -side * 0.5);                       // catheads
    box(0.12, 0.9, 0.12, IRON, 6.7, 0.75, side * 1.72); box(0.6, 0.1, 0.12, IRON, 6.7, 0.32, side * 1.72);   // an anchor hung at each
    for (const x of [-0.6, -1.2]) cyl(0.2, 0.5, OAK, x, deckY + 0.25, side * 1.45);             // water casks lashed in the waist
  }
  cyl(0.06, 1.1, IRON, -4.2, deckY + 1.5, 0.7);                                                 // the galley stovepipe
  for (let x = -6; x <= 6.2; x += 1.1) for (const side of [-1, 1]) box(0.06, 0.5, 0.06, DARK, x, deckY + 0.25, side * (x > 4 ? 1.95 - (x - 4) * 0.45 : 1.88));   // rail stanchions
}
// Where her galley smoke comes from, in her own measure.
export const STOVEPIPE = [-4.2, 3.0, 0.7];
