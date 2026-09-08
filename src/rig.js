// Her rig: three masts, their yards, and the canvas bent to them.
// Heights are given in metres above her deck.
import * as THREE from 'three';
import { deckAt } from './hull.js';
import { REEFABLE, PLAIN, hoistFor, CANVAS, squareSail, gaffSail, stayTriangle, furledBundle } from './sails.js';

const SPAR = new THREE.MeshStandardMaterial({ color: '#6b5636', roughness: 0.85, flatShading: true });

// The mainmast, from which the other two are scaled.
const MAIN = {
  truck: 33.0,
  yard: { course: 12.6, topsail: 20.2, topgallant: 26.0, royal: 30.4 },
  half: { course: 8.6, topsail: 7.0, topgallant: 5.3, royal: 3.8 },
  courseFoot: 2.4
};

const MASTS = [
  { key: 'fore',   name: 'Fore',   z:  10.4, h: 0.94, w: 0.92, course: true },
  { key: 'main',   name: 'Main',   z:  -0.6, h: 1.00, w: 1.00, course: true },
  { key: 'mizzen', name: 'Mizzen', z: -10.8, h: 0.86, w: 0.80, course: false }
];

const TIERS = ['royal', 'topgallant', 'topsail', 'course'];
const BELOW = { course: null, topsail: 'course', topgallant: 'topsail', royal: 'topgallant' };
const BELLY = { course: 1.75, topsail: 1.40, topgallant: 1.05, royal: 0.75 };

function cylinder(rTop, rBottom, height, y) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, 8), SPAR);
  m.position.y = y + height / 2;
  m.castShadow = true;
  return m;
}

// Lower mast, topmast and topgallant mast, overlapping where they are doubled,
// with the top and the crosstrees between them.
function mastStick(truck) {
  const g = new THREE.Group();
  g.add(cylinder(0.36, 0.48, 0.44 * truck, 0));
  g.add(cylinder(0.22, 0.30, 0.32 * truck, 0.39 * truck));
  g.add(cylinder(0.07, 0.18, 0.32 * truck, 0.68 * truck));
  for (const [at, r] of [[0.42, 1.55], [0.70, 0.95]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.16, 8), SPAR);
    p.position.set(0, at * truck, 0.25);
    p.castShadow = true;
    g.add(p);
  }
  return g;
}

// A yard: one spar across the mast, tapering to both yardarms.
function makeYard(half) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.20, half, 6), SPAR);
    arm.rotation.z = -s * Math.PI / 2;
    arm.position.x = s * half / 2;
    arm.castShadow = true;
    g.add(arm);
  }
  g.position.z = 0.34;   // yards ride on the forward side of the mast
  return g;
}

// One square sail, with its yard. Reefing brings the yard down and the sail
// with it; furling rolls her up on the yard. Her foot is sheeted to the yard
// below, so when that yard comes down she comes down with it.
function squareSailUnit(spec) {
  const { headHalf, footHalf, hoist, belly, yard, footOf } = spec;
  const mesh = new THREE.Mesh(squareSail(headHalf, footHalf, hoist, belly), CANVAS);
  mesh.position.z = 0.34;
  mesh.castShadow = true;
  const bundle = furledBundle(headHalf);
  yard.add(bundle);

  return Object.assign(spec, {
    state: 'set', mesh, bundle,
    apply() {
      const furled = this.state === 'furled', f = hoistFor(this.state);
      const footY = footOf();
      this.mesh.visible = !furled;
      this.bundle.visible = furled;
      this.mesh.position.y = footY;
      this.yard.position.y = footY + hoist * f;
      if (!furled) {
        this.mesh.geometry.dispose();
        this.mesh.geometry = squareSail(headHalf, footHalf, hoist * f, belly);
      }
    }
  });
}

function buildMast(m, sails, braces) {
  const g = new THREE.Group();
  g.position.set(0, deckAt(m.z), m.z);
  const truck = MAIN.truck * m.h;
  g.add(mastStick(truck));

  // All the yards on a mast swing together when she is braced round.
  const brace = new THREE.Group();
  braces.push(brace);
  g.add(brace);

  const at = {}, half = {};
  for (const t of TIERS) { at[t] = MAIN.yard[t] * m.h; half[t] = MAIN.half[t] * m.w; }

  const yards = {}, foot = MAIN.courseFoot * m.h;

  // Built from the deck up, because each sail is sheeted to the yard below her.
  for (const tier of ['course', 'topsail', 'topgallant', 'royal']) {
    const yard = makeYard(half[tier]);
    yard.position.y = at[tier];
    yards[tier] = yard;
    brace.add(yard);

    if (tier === 'course' && !m.course) continue;   // the crossjack carries no sail

    const below = BELOW[tier];
    const headHalf = half[tier] * 0.94;
    const footHalf = below ? half[below] * 0.94 : half.course * 0.90;
    const hoist = at[tier] - (below ? at[below] : foot);
    const unit = squareSailUnit({
      name: `${m.name} ${tier}`,
      tier, mast: m.key, ladder: (tier === 'topsail' || tier === 'topgallant') ? REEFABLE : PLAIN,
      footOf: below ? () => yards[below].position.y : () => foot,
      fullArea: hoist * (headHalf + footHalf),
      headHalf, footHalf, hoist, belly: BELLY[tier], yard
    });
    brace.add(unit.mesh);
    sails.push(unit);
  }
  return g;
}

// The spanker: a fore-and-aft sail on a gaff and a boom, abaft the mizzen.
// Reefing rolls her foot up towards the gaff.
function buildSpanker(mastGroup, sails) {
  const throat = [0, 8.8, -0.7], peak = [0, 14.2, -7.9];
  const tack = [0, 2.9, -0.7], clew = [0, 3.4, -9.9];
  const lerp = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);

  // Gaff, boom and sail swing out to leeward together.
  const pivot = new THREE.Group();
  mastGroup.add(pivot);

  for (const [a, b, r] of [[throat, peak, 0.15], [tack, clew, 0.16]]) {
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.hypot(b[1] - a[1], b[2] - a[2]), 6), SPAR);
    spar.position.set(0, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    spar.rotation.x = Math.atan2(b[2] - a[2], b[1] - a[1]);
    spar.castShadow = true;
    pivot.add(spar);
  }

  const mesh = new THREE.Mesh(gaffSail(throat, peak, clew, tack), CANVAS);
  mesh.castShadow = true;
  pivot.add(mesh);

  sails.push({
    name: 'Spanker', tier: 'spanker', mast: 'mizzen', ladder: REEFABLE, state: 'set', mesh,
    pivot, fullArea: 96,
    apply() {
      const f = hoistFor(this.state);
      this.mesh.visible = this.state !== 'furled';
      this.mesh.geometry.dispose();
      this.mesh.geometry = gaffSail(throat, peak, lerp(peak, clew, f), lerp(throat, tack, f));
    }
  });
}

// The headsails, hanging on their stays between the fore topmast and the
// bowsprit. Given in her own coordinates rather than any mast's.
const HEADSAILS = [
  { name: 'Fore topmast staysail', head: [0, 22.5, 10.4], tack: [0, 3.24, 18.2], clew: [0, 5.6, 8.2], belly: 1.15 },
  { name: 'Jib',                   head: [0, 26.0, 10.4], tack: [0, 4.14, 22.6], clew: [0, 7.2, 11.4], belly: 0.95 },
  { name: 'Flying jib',            head: [0, 29.5, 10.4], tack: [0, 5.19, 27.8], clew: [0, 9.8, 15.0], belly: 0.75 }
];

function buildHeadsails(group, sails) {
  for (const h of HEADSAILS) {
    const mesh = new THREE.Mesh(stayTriangle(h.head, h.tack, h.clew, h.belly), CANVAS);
    mesh.castShadow = true;
    group.add(mesh);
    // Half the base times the height, worked out in her fore-and-aft plane.
    const area = Math.abs((h.tack[2] - h.head[2]) * (h.clew[1] - h.head[1]) -
                          (h.clew[2] - h.head[2]) * (h.tack[1] - h.head[1])) / 2;
    sails.push({
      name: h.name, tier: 'headsail', mast: 'fore', ladder: PLAIN, state: 'set', mesh,
      fullArea: area, side: 0,
      apply() { this.mesh.visible = this.state !== 'furled'; },
      // Her clew is sheeted away to leeward, and she bellies the same way.
      trim(side) {
        if (side === this.side) return;
        this.side = side;
        const clew = [h.clew[0] - side * 2.6, h.clew[1], h.clew[2]];
        this.mesh.geometry.dispose();
        this.mesh.geometry = stayTriangle(h.head, h.tack, clew, -side * h.belly);
      }
    });
  }
}

export function makeRig() {
  const group = new THREE.Group();
  const sails = [], braces = [];

  for (const m of MASTS) {
    const mastGroup = buildMast(m, sails, braces);
    if (m.key === 'mizzen') buildSpanker(mastGroup, sails);
    group.add(mastGroup);
  }
  buildHeadsails(group, sails);

  const spanker = sails.find((s) => s.tier === 'spanker');
  const headsails = sails.filter((s) => s.tier === 'headsail');

  // Always redraw from the deck up: a lowered yard carries everything above it down.
  const order = { course: 0, topsail: 1, topgallant: 2, royal: 3 };
  const applyAll = () => {
    for (const s of [...sails].sort((a, b) => (order[a.tier] || 0) - (order[b.tier] || 0))) s.apply();
  };
  applyAll();

  const step = (tier, dir) => {
    for (const s of sails) {
      if (s.tier !== tier) continue;
      const i = s.ladder.indexOf(s.state);
      s.state = s.ladder[Math.max(0, Math.min(s.ladder.length - 1, i + dir))];
    }
    applyAll();
  };

  return {
    group, sails,
    takeIn: (tier) => step(tier, +1),
    letOut: (tier) => step(tier, -1),
    setAll(state) {
      for (const s of sails) s.state = s.ladder.includes(state) ? state : s.ladder[0];
      applyAll();
    },
    stateOf(tier) {
      const found = sails.filter((s) => s.tier === tier).map((s) => s.state);
      return found.every((s) => s === found[0]) ? found[0] : 'mixed';
    },

    // How much of her full plain sail she is showing, from nothing to one.
    canvas() {
      let set = 0, full = 0;
      for (const s of sails) {
        full += s.fullArea;
        if (s.state !== 'furled') set += s.fullArea * hoistFor(s.state);
      }
      return set / full;
    },

    // Brace her round. offWind is her angle from the wind in degrees; side is
    // +1 with the wind over her starboard side, -1 over her larboard.
    // The weather yardarm comes forward, and the lee yardarm goes aft.
    trim(offWind, side) {
      const yardAngle = Math.min(40, Math.max(0, (180 - offWind) / 2));
      for (const b of braces) b.rotation.y = -side * yardAngle * Math.PI / 180;

      const boomAngle = Math.min(70, Math.max(6, (offWind - 45) * 0.55));
      if (spanker) spanker.pivot.rotation.y = side * boomAngle * Math.PI / 180;

      for (const h of headsails) h.trim(side);
    }
  };
}
