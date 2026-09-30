// The upper deck in full: everything a whaleman would have had underfoot and
// to hand. Plank seams, the bulwarks' stanchions and cap rail, pin rails and
// their belaying pins, channels and deadeyes with the shrouds and ratlines
// rising from them, hatch gratings, the windlass and its chain, catheads and
// anchors, the tryworks with its firebox doors and cooling tank, the mincing
// horse, the scuttlebutt, water casks, coiled lines, fire buckets, lanterns,
// the wheel's spokes and binnacle, iron davits, and boats fitted for whaling.
// Only the ship view shows it; at sea she is too small for it to tell.
import * as THREE from 'three';
import { DAVITS } from './ship.js';
import { halfBeam } from './decks.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const SEAM = mat(0x5e442e), RAIL = mat(0x4a3526), IRON = mat(0x2b2b2b), SPAR = mat(0x4e3a29), BRICK = mat(0x8c4b34);
const ROPE = mat(0xc2ad84), CASK = mat(0x7a5a38), HOOP = mat(0x3a3a36), COPPER = mat(0xb0703f), GLASS = mat(0x9cc3d6, { roughness: 0.3 });
const LAMP = mat(0xffd48a, { emissive: 0xffa53a, emissiveIntensity: 1.2 }), OAR = mat(0xcbb389), WHITE = mat(0xe4ddcc), BLADE = mat(0x9a9a98);
const MASTS = [[3.9, 3.3], [0.3, 3.3], [-3.7, 2.2]];

export function detailUpperDeck(g) {
  const lines = [];
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const cyl = (r, h, m, x, y, z, rx = 0, rz = 0, seg = 8) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  const cask = (x, y, z, lying = false) => {
    cyl(0.17, 0.42, CASK, x, y, z, lying ? Math.PI / 2 : 0, 0, 10);
    for (const k of [-0.13, 0.13]) { const h = cyl(0.175, 0.03, HOOP, x, y, z, lying ? Math.PI / 2 : 0, 0, 10); if (lying) h.position.z += k; else h.position.y += k; }
  };
  const coil = (x, z) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 5, 12), ROPE); t.rotation.x = Math.PI / 2; t.position.set(x, 0.04, z); g.add(t); };

  // Plank seams, fore and aft, wherever the deck runs.
  for (let z = -1.75; z <= 1.76; z += 0.29) {
    let x0 = 99, x1 = -99;
    for (let x = -6.9; x <= 7.3; x += 0.1) if (halfBeam(x) - 0.15 > Math.abs(z)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    if (x1 > x0) box(x1 - x0, 0.008, 0.018, SEAM, (x0 + x1) / 2, 0.004, z);
  }
  // Bulwark stanchions and the cap rail on top.
  for (let x = -6.7; x <= 6.9; x += 0.5) for (const s of [-1, 1]) box(0.05, 0.45, 0.07, RAIL, x, 0.22, s * (halfBeam(x) * 0.97 - 0.05));
  for (let x = -6.6; x <= 6.8; x += 0.4) for (const s of [-1, 1]) box(0.42, 0.04, 0.12, SPAR, x, 0.46, s * (halfBeam(x) * 0.97 - 0.03), s * Math.atan2(halfBeam(x + 0.2) - halfBeam(x - 0.2), 0.4));

  // At each mast: pin rails inside the bulwark, channels and deadeyes outside, shrouds and ratlines up to the masthead.
  for (const [mx, top] of MASTS) {
    for (const s of [-1, 1]) {
      const hb = halfBeam(mx);
      box(0.9, 0.05, 0.1, SPAR, mx, 0.33, s * (hb - 0.14));
      for (let i = 0; i < 5; i++) cyl(0.018, 0.16, SPAR, mx - 0.36 + i * 0.18, 0.38, s * (hb - 0.14));
      box(1.3, 0.05, 0.2, SPAR, mx - 0.3, 0.28, s * (hb + 0.1));
      const feet = [-0.8, -0.35, 0.1].map((dx) => [mx + dx, 0.3, s * (hb + 0.12)]);
      for (const [x, y, z] of feet) cyl(0.055, 0.04, IRON, x, y + 0.03, z, Math.PI / 2);
      for (const f of feet) lines.push(f, [mx, top - 0.1, s * 0.1]);
      for (let k = 1; k < 7; k++) {                                   // ratlines: the rungs the men went aloft by
        const t = k / 7.2, at = (f) => [f[0] + (mx - f[0]) * t, f[1] + (top - 0.1 - f[1]) * t, f[2] + (s * 0.1 - f[2]) * t];
        lines.push(at(feet[0]), at(feet[2]));
      }
      coil(mx - 0.2, s * (hb - 0.45)); coil(mx + 0.35, s * (hb - 0.42));
    }
  }
  // A fife rail round the mainmast, with pins.
  for (const [dx, dz, w, d] of [[0.45, 0, 0.06, 0.9], [-0.45, 0, 0.06, 0.9], [0, 0.45, 0.9, 0.06], [0, -0.45, 0.9, 0.06]]) box(w, 0.05, d, SPAR, 0.3 + dx, 0.35, dz);

  // The main hatch's grating, and a smaller one abaft the mizzen.
  const grating = (x, z, w, d) => {
    box(w + 0.1, 0.12, d + 0.1, RAIL, x, 0.06, z);
    for (let i = -w / 2; i <= w / 2 + 0.01; i += 0.12) box(0.02, 0.02, d, SPAR, x + i, 0.135, z);
    for (let j = -d / 2; j <= d / 2 + 0.01; j += 0.12) box(w, 0.02, 0.02, SPAR, x, 0.14, z + j);
  };
  grating(1.2, 0, 1.0, 1.1); grating(-2.95, 0.6, 0.6, 0.6);

  // The tryworks: firebox doors forward, a second chimney, the cooling tank, the mincing horse and a tub of blubber.
  for (const z of [-0.45, 0.45]) box(0.02, 0.22, 0.3, IRON, 3.21, 0.2, z);
  for (let y = 0.1; y < 0.8; y += 0.14) box(1.62, 0.012, 1.82, SEAM, 2.4, y, 0);
  box(0.25, 0.7, 0.25, BRICK, 1.75, 0.95, 0.5);
  box(0.4, 0.35, 0.9, COPPER, 3.45, 0.18, 0);
  box(0.9, 0.08, 0.22, SPAR, 1.55, 0.35, -1.25); for (const dx of [-0.35, 0.35]) box(0.06, 0.32, 0.18, SPAR, 1.55 + dx, 0.16, -1.25);
  cyl(0.22, 0.28, CASK, 1.75, 0.14, 1.2, 0, 0, 10);

  // The windlass: handspikes, the pawl post, and the chain to the hawse holes; catheads and anchors at the bow.
  box(0.1, 0.5, 0.1, SPAR, 6.0, 0.25, 0); for (const z of [-0.45, 0.45]) box(0.05, 0.05, 0.9, SPAR, 6.0, 0.55, z * 0.2, 0.6);
  for (const s of [-1, 1]) {
    box(0.9, 0.035, 0.05, IRON, 6.45, 0.25, s * 0.45, s * -0.15);
    box(0.16, 0.14, 0.7, SPAR, 6.3, 0.42, s * (halfBeam(6.3) + 0.2));
    cyl(0.03, 0.6, IRON, 6.3, 0.05, s * (halfBeam(6.3) + 0.45));                        // the anchor's shank
    box(0.5, 0.05, 0.05, IRON, 6.3, -0.22, s * (halfBeam(6.3) + 0.45));                  // and her arms
    cyl(0.025, 0.55, SPAR, 6.3, 0.33, s * (halfBeam(6.3) + 0.45), 0, Math.PI / 2);       // and her stock
  }
  cyl(0.12, 2.1, SPAR, 7.3, 0.62, 0, 0, Math.PI / 2 - 0.3);                               // the bowsprit's heel

  // Aft: the wheel's spokes and handles, and the binnacle; a skylight, door and lamps on the after house; fire buckets.
  for (let i = 0; i < 4; i++) cyl(0.015, 0.9, SPAR, -6.5, 0.8, 0, (i * Math.PI) / 4, 0, 5);   // four through-spokes: eight handles
  box(0.22, 0.34, 0.22, RAIL, -5.95, 0.17, -0.4); cyl(0.09, 0.08, COPPER, -5.95, 0.38, -0.4);
  box(0.7, 0.18, 0.6, RAIL, -5.1, 0.99, 0); box(0.66, 0.02, 0.56, GLASS, -5.1, 1.09, 0);
  box(0.02, 0.6, 0.4, RAIL, -4.19, 0.3, -0.5);
  for (const z of [-0.9, 0.9]) { box(0.08, 0.12, 0.08, LAMP, -4.15, 0.75, z); }
  for (let i = 0; i < 4; i++) cyl(0.07, 0.12, CASK, -4.1, 0.5, -0.3 + i * 0.2, 0, 0, 7);
  box(0.08, 0.12, 0.08, LAMP, 3.9, 1.2, 0.2);

  // The scuttlebutt, where the men drank; water casks lashed forward; the carpenter's vise.
  cask(-0.6, 0.21, 0.95); cyl(0.02, 0.3, SPAR, -0.45, 0.5, 0.95, 0, 0.6, 4);
  cask(4.7, 0.18, 1.25, true); cask(4.7, 0.18, -1.25, true);
  box(0.12, 0.14, 0.12, IRON, -1.75, 0.52, -1.25); box(0.9, 0.04, 0.2, OAR, -2.3, 0.47, -1.25);

  // The cutting spade leaning by the stage, and the falls from the stage up the side.
  cyl(0.02, 1.8, SPAR, 1.9, 0.75, 1.7, 0.2, 0.3, 5); box(0.12, 0.2, 0.02, BLADE, 2.15, 0.02, 1.9);
  lines.push([-0.8, 0.9, 2.3], [-0.8, -0.3, 2.3], [1.6, 0.9, 2.3], [1.6, -0.3, 2.3]);

  // Davits and falls, and each boat fitted for whaling.
  for (const [x, s] of DAVITS) {
    for (const dx of [-1.1, 1.1]) {
      cyl(0.035, 0.9, IRON, x + dx, 0.5, s * 1.95);
      box(0.05, 0.05, 0.5, IRON, x + dx, 0.95, s * 2.18);
      lines.push([x + dx, 0.95, s * 2.4], [x + dx, 1.05, s * 2.4]);
    }
    const y = 1.05, z = s * 2.4;
    for (const dx of [-0.8, -0.2, 0.4, 0.9]) box(0.08, 0.02, 0.62, OAR, x + dx, y + 0.05, z);             // thwarts
    for (const dx of [-0.5, 0.15]) cyl(0.12, 0.14, CASK, x + dx, y + 0.08, z + s * 0.08, 0, 0, 8);        // line tubs
    for (const dz of [-0.14, 0, 0.14]) cyl(0.012, 2.6, OAR, x, y + 0.14, z + dz, 0, Math.PI / 2, 4);      // oars laid fore and aft
    for (const dz of [-0.08, 0.08]) cyl(0.012, 1.1, IRON, x + 1.05, y + 0.25, z + dz, 0, 1.2, 4);         // irons in the crotch
    box(0.18, 0.03, 0.4, WHITE, x - 1.3, y + 0.06, z);                                                    // the stern sheets
  }

  const rig = new THREE.BufferGeometry();
  rig.setAttribute('position', new THREE.Float32BufferAttribute(lines.flat(), 3));
  g.add(new THREE.LineSegments(rig, new THREE.LineBasicMaterial({ color: 0x2a2018, transparent: true })));
  return g;
}
