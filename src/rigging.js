// Her standing rigging: the cordage that holds the masts up, as opposed to the
// running rigging that works the sails.
//
// Shrouds go from each masthead down and aft to the channels on her sides, and
// are crossed by ratlines to make the ladder the topmen climb. Stays hold the
// masts from falling aft, backstays from falling forward. None of it moves.
import * as THREE from 'three';
import { beamAt } from './hull.js';
import { HUE } from './palette.js';

const ROPE = new THREE.MeshLambertMaterial({ color: HUE.rope, flatShading: true });
const RATLINE = new THREE.LineBasicMaterial({ color: HUE.rope });

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// One length of rope between two points, as a thin spar.
function rope(a, b, radius) {
  const A = V(a), B = V(b), run = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, run.length(), 5), ROPE);
  m.position.copy(A).addScaledVector(run, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), run.clone().normalize());
  return m;
}

// How many shrouds a mast carries on each side, and how far aft they spread
// along the channel. Inferred from the usual practice: the heaviest mast gets
// the most, and they fan aft from the masthead.
const SHROUDS = { fore: 5, main: 5, mizzen: 4 };

export function makeRigging(masts, headsails) {
  const group = new THREE.Group();
  const shrouds = new THREE.Group();
  const stays = new THREE.Group();
  const backstays = new THREE.Group();
  const ratlineEnds = [];
  group.add(shrouds, stays, backstays);

  // Where each mast's rigging is made fast, worked out once so the stays that
  // run between masts can find their far end.
  const at = {};
  for (const m of masts) {
    at[m.key] = {
      z: m.z,
      hounds: m.deck + 0.40 * m.truck,      // the lower masthead
      top: m.deck + 0.42 * m.truck,         // the platform, 1.55 out from the mast
      topmast: m.deck + 0.68 * m.truck,     // the topmast head
      truck: m.deck + 0.96 * m.truck,
      chX: beamAt(m.z) + 0.42,              // the channels, just outside her sides
      chY: m.deck + 0.15
    };
  }

  for (const m of masts) {
    const a = at[m.key];
    const n = SHROUDS[m.key];

    for (const side of [-1, 1]) {
      // --- lower shrouds, fanning aft from the masthead to the channel ------
      const set = [];
      for (let i = 0; i < n; i++) {
        const f = n === 1 ? 0 : i / (n - 1);
        const head = [side * 0.34, a.hounds, a.z + 0.3 - f * 0.8];
        const heel = [side * a.chX, a.chY, a.z + 0.6 - f * 3.4];
        shrouds.add(rope(head, heel, 0.055));
        set.push([head, heel]);
      }

      // --- ratlines, the ladder across them --------------------------------
      // Every fifteen inches or so, from above the rail to short of the top.
      const foot = 1.25 / (a.hounds - a.chY), head = 1 - 1.6 / (a.hounds - a.chY);
      // Wider apart than a real ship rattles them down, because six hundred
      // hairlines read as grey fuzz in a picture drawn in flat shapes.
      for (let t = foot; t < head; t += 0.80 / (a.hounds - a.chY)) {
        for (let i = 0; i < n - 1; i++) {
          ratlineEnds.push(...lerp(set[i][0], set[i][1], 1 - t), ...lerp(set[i + 1][0], set[i + 1][1], 1 - t));
        }
      }

      // --- topmast shrouds, from the rim of the top to the topmast head ----
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        shrouds.add(rope([side * 1.45, a.top, a.z + 0.5 - f * 1.5],
                         [side * 0.22, a.topmast, a.z + 0.1 - f * 0.3], 0.042));
      }

      // --- futtock shrouds, from the rim of the top down in to the mast ----
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        shrouds.add(rope([side * 1.45, a.top, a.z + 0.5 - f * 1.5],
                         [side * 0.28, a.top - 2.3, a.z + 0.4 - f * 1.1], 0.045));
      }

      // --- backstays, holding the upper masts from going forward -----------
      backstays.add(rope([side * 0.24, a.topmast, a.z],
                         [side * a.chX, a.chY, a.z - 4.6], 0.05));
      backstays.add(rope([side * 0.16, a.truck - 1.2, a.z],
                         [side * a.chX, a.chY, a.z - 6.4], 0.042));
    }
  }

  const ratlines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute(
      'position', new THREE.Float32BufferAttribute(ratlineEnds, 3)), RATLINE);
  group.add(ratlines);

  // --- the fore-and-aft stays -------------------------------------------------
  // Each mast is stayed forward: the fore to her stem, the main to the foot of
  // the foremast, the mizzen to the mainmast.
  const f = at.fore, mn = at.main, mz = at.mizzen;
  stays.add(rope([0, f.hounds, f.z], [0, 3.7, 16.6], 0.08));                 // fore stay
  stays.add(rope([0, mn.hounds, mn.z], [0, mn.chY + 0.9, f.z - 1.2], 0.08)); // main stay
  stays.add(rope([0, mz.hounds, mz.z], [0, mn.hounds - 5.4, mn.z - 0.4], 0.07)); // mizzen stay
  stays.add(rope([0, mn.topmast, mn.z], [0, f.hounds - 0.6, f.z + 0.4], 0.05));  // main topmast stay
  stays.add(rope([0, mz.topmast, mz.z], [0, mn.hounds - 1.2, mn.z - 0.4], 0.045)); // mizzen topmast stay

  // The headsails already hang on stays of their own; here is the cordage
  // itself, from the fore topmast down to the bowsprit.
  for (const h of headsails) stays.add(rope(h.head, h.tack, 0.05));

  return { group, parts: { shrouds, ratlines, stays, backstays } };
}
