// Her rig: three masts, their yards, and the canvas bent to them.
// Heights are given in metres above her deck.
import * as THREE from 'three';
import { deckAt } from './hull.js';
import { makeRigging } from './rigging.js';
import { REEFABLE, PLAIN, hoistFor, spreadFor, CANVAS, squareSail, gaffSail, stayTriangle, furledBundle } from './sails.js';

const SPAR = new THREE.MeshStandardMaterial({ color: '#6b5636', roughness: 0.85, flatShading: true });

// Her bow points along +z, so with y up her starboard side lies along -x.
const STARBOARD_X = -1;

// The mainmast, from which the other two are scaled.
const MAIN = {
  truck: 33.0,
  yard: { course: 12.6, topsail: 20.2, topgallant: 26.0, royal: 30.4 },
  half: { course: 8.6, topsail: 7.0, topgallant: 5.3, royal: 3.8 },
  courseFoot: 3.4          // where the clews of a course hang above the deck
};

// The hollow cut in the foot of each sail. Only the courses have much of one,
// and it is what keeps them clear of the deck.
const ROACH = { course: 2.6, topsail: 0.5, topgallant: 0.3, royal: 0.2 };

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

  // Everything above the lower masthead, kept together so that it can spring.
  const upper = new THREE.Group();
  upper.add(cylinder(0.22, 0.30, 0.32 * truck, 0.39 * truck));
  upper.add(cylinder(0.07, 0.18, 0.32 * truck, 0.68 * truck));
  g.add(upper);

  for (const [at, r] of [[0.42, 1.55], [0.70, 0.95]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.16, 8), SPAR);
    p.position.set(0, at * truck, 0.25);
    p.castShadow = true;
    (at > 0.5 ? upper : g).add(p);
  }
  g.userData.upper = upper;
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
    arm.userData.side = s * STARBOARD_X;   // +1 starboard, -1 larboard
    g.add(arm);
  }
  g.position.z = 0.34;   // yards ride on the forward side of the mast
  return g;
}

// One square sail, with its yard. Reefing brings the yard down and the sail
// with it; furling rolls her up on the yard. Her foot is sheeted to the yard
// below, so when that yard comes down she comes down with it.
function squareSailUnit(spec) {
  const { headHalf, footHalf, hoist, belly, roach, yard, footOf } = spec;
  const mesh = new THREE.Mesh(squareSail(headHalf, footHalf, hoist, belly, roach), CANVAS);
  mesh.position.z = 0.34;
  mesh.castShadow = true;
  const bundle = furledBundle(headHalf);
  yard.add(bundle);

  return Object.assign(spec, {
    state: 'set', target: null, progress: 0, canvas: 1,
    mesh, bundle,
    apply() {
      if (this.gone) {
        this.mesh.visible = false;
        this.bundle.visible = false;
        this.canvas = 0;
        return;
      }
      const to = this.target || this.state, p = this.target ? this.progress : 0;
      const lerp = (a, b) => a + (b - a) * p;
      const hoistF = lerp(hoistFor(this.state), hoistFor(to));
      const spread = lerp(spreadFor(this.state), spreadFor(to));
      this.canvas = hoistF * spread;

      const footY = footOf(), yardY = footY + hoist * hoistF;
      this.yard.position.y = yardY;

      // She always hangs from her own yard: reefing brings the yard down to
      // her, furling gathers her up to it.
      const drop = hoist * hoistF * spread;
      this.mesh.position.y = yardY - drop;
      this.mesh.visible = spread > 0.02;
      if (this.mesh.visible) {
        this.mesh.geometry.dispose();
        this.mesh.geometry = squareSail(headHalf, headHalf + (footHalf - headHalf) * spread,
                                        drop, belly * spread, roach * spread);
      }
      this.bundle.visible = spread < 0.98;
      this.bundle.scale.set(1 - spread, 1, 1 - spread);
    }
  });
}

function buildMast(m, sails, braces, uppers, parts) {
  const g = new THREE.Group();
  g.position.set(0, deckAt(m.z), m.z);
  const truck = MAIN.truck * m.h;
  const stick = mastStick(truck);
  g.add(stick);
  uppers[m.key] = stick.userData.upper;
  parts.sticks[m.key] = stick;

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
    parts.yards.push(yard);
    brace.add(yard);

    if (tier === 'course' && !m.course) continue;   // the crossjack carries no sail

    const below = BELOW[tier];
    const headHalf = half[tier] * 0.94;
    const footHalf = below ? half[below] * 0.94 : half.course * 0.90;
    const hoist = at[tier] - (below ? at[below] : foot);
    const unit = squareSailUnit({
      name: `${m.name} ${tier}`,
      tier, mast: m.key, ladder: tier === 'topsail' ? REEFABLE : PLAIN,
      footOf: below ? () => yards[below].position.y : () => foot,
      fullArea: hoist * (headHalf + footHalf),
      headHalf, footHalf, hoist, belly: BELLY[tier], roach: ROACH[tier] * m.h, yard
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
    name: 'Spanker', tier: 'spanker', mast: 'mizzen', ladder: REEFABLE, mesh,
    state: 'set', target: null, progress: 0, canvas: 1, pivot, fullArea: 96,
    apply() {
      if (this.gone) { this.mesh.visible = false; this.canvas = 0; return; }
      const to = this.target || this.state, p = this.target ? this.progress : 0;
      const mix = (a, b) => a + (b - a) * p;
      const f = mix(hoistFor(this.state), hoistFor(to));
      const spread = mix(spreadFor(this.state), spreadFor(to));
      this.canvas = f * spread;

      // Brailing draws her leech in to the mast; reefing rolls her foot up to
      // the gaff.
      const peakIn = lerp(throat, peak, spread), clewIn = lerp(tack, clew, spread);
      this.mesh.visible = spread > 0.02;
      this.mesh.geometry.dispose();
      this.mesh.geometry = gaffSail(throat, peakIn, lerp(peakIn, clewIn, f), lerp(throat, tack, f));
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
      name: h.name, tier: 'headsail', mast: 'fore', ladder: PLAIN, mesh,
      state: 'set', target: null, progress: 0, canvas: 1, fullArea: area, side: 0,
      apply() {
        if (this.gone) { this.mesh.visible = false; this.canvas = 0; return; }
        const to = this.target || this.state, p = this.target ? this.progress : 0;
        this.canvas = spreadFor(this.state) + (spreadFor(to) - spreadFor(this.state)) * p;
        this.mesh.visible = this.canvas > 0.02;
        this.draw();
      },
      // Her clew is sheeted away to leeward, and she bellies the same way.
      // Hauling her down draws the clew in along her stay until she is nothing.
      draw() {
        const side = this.side, s = this.canvas;
        const full = [h.clew[0] - side * 2.6, h.clew[1], h.clew[2]];
        const clew = h.tack.map((v, i) => v + (full[i] - v) * s);
        this.mesh.geometry.dispose();
        this.mesh.geometry = stayTriangle(h.head, h.tack, clew, -side * h.belly * s);
      },
      trim(side) {
        if (side === this.side) return;
        this.side = side;
        this.draw();
      }
    });
  }
}

export function makeRig() {
  const group = new THREE.Group();
  const sails = [], braces = [], uppers = {};
  const parts = { yards: [], sticks: {} };

  for (const m of MASTS) {
    const mastGroup = buildMast(m, sails, braces, uppers, parts);
    if (m.key === 'mizzen') buildSpanker(mastGroup, sails);
    group.add(mastGroup);
  }
  buildHeadsails(group, sails);

  // The standing rigging goes on last, in her own frame rather than any
  // mast's, because it never moves when the yards are braced round.
  const rigging = makeRigging(
    MASTS.map((m) => ({ key: m.key, z: m.z, deck: deckAt(m.z), truck: MAIN.truck * m.h })),
    HEADSAILS);
  group.add(rigging.group);

  const spanker = sails.find((s) => s.tier === 'spanker');
  const headsails = sails.filter((s) => s.tier === 'headsail');

  // Always redraw from the deck up: a lowered yard carries everything above it down.
  const order = { course: 0, topsail: 1, topgallant: 2, royal: 3 };
  const applyAll = () => {
    for (const s of [...sails].sort((a, b) => (order[a.tier] || 0) - (order[b.tier] || 0))) s.apply();
  };
  applyAll();

  // Only the sails she still has answer an order.
  const of = (tier) => sails.filter((s) => s.tier === tier && !s.gone);

  // --- lighting a part up, for the glossary ---------------------------------
  //
  // The spars all share one material and the sails another, so recolouring a
  // material in place would light the whole ship. Instead each mesh is handed
  // a bright copy of its own material, and given the shared one back
  // afterwards. Nothing in apply() touches materials, so a highlight survives
  // an evolution working through.
  const brightOf = new Map();
  const bright = (m) => {
    if (!brightOf.has(m)) {
      const c = m.clone();
      // Cordage is drawn as plain lines, which take no light, so those are
      // brightened in the colour itself.
      if ('emissive' in c) { c.emissive = new THREE.Color('#ffc257'); c.emissiveIntensity = 0.85; }
      else c.color = new THREE.Color('#ffc257');
      brightOf.set(m, c);
    }
    return brightOf.get(m);
  };

  let alight = [];
  const lit = new Set();
  const light = (o) => o.traverse((n) => {
    if (!(n.isMesh || n.isLine) || lit.has(n)) return;
    lit.add(n);
    alight.push([n, n.material]);
    n.material = bright(n.material);
  });

  return {
    group, sails,

    // Light whatever a term names: a tier of sails, the yards, the masts, one
    // mast, or everything down one side of her.
    mark(part) {
      this.unmark();
      if (!part) return;
      // A tier lights its canvas, and its yards with it.
      if (part.tier) {
        for (const s of sails) {
          if (s.tier !== part.tier) continue;
          light(s.mesh);
          if (s.yard) light(s.yard);
          if (s.pivot) light(s.pivot);
        }
      }
      if (part.yards) for (const y of parts.yards) light(y);
      if (part.rigging) {
        if (part.rigging === 'all') light(rigging.group);
        else if (rigging.parts[part.rigging]) light(rigging.parts[part.rigging]);
      }
      if (part.masts) for (const k in parts.sticks) light(parts.sticks[k]);
      if (part.mast) {
        if (parts.sticks[part.mast]) light(parts.sticks[part.mast]);
        for (const s of sails) if (s.mast === part.mast) light(s.mesh);
      }
      if (part.side) {
        for (const y of parts.yards) {
          for (const arm of y.children) if (arm.userData.side === part.side) light(arm);
        }
      }
    },

    unmark() {
      for (const [mesh, was] of alight) mesh.material = was;
      alight = [];
      lit.clear();
    },

    // Where a tier stands, and where one more step in either direction leads.
    stateOf(tier) {
      const found = of(tier).map((s) => s.state);
      if (!found.length) return 'gone';
      return found.every((s) => s === found[0]) ? found[0] : 'mixed';
    },
    nextState(tier, dir) {
      const s = of(tier)[0];
      if (!s) return null;
      // If the tier is somehow of two minds, go by the first sail in it; the
      // order will bring the rest into line with her.
      const where = this.stateOf(tier);
      const i = s.ladder.indexOf(where === 'mixed' ? s.state : where);
      if (i < 0) return null;
      const j = i + dir;
      return (j < 0 || j >= s.ladder.length) ? null : s.ladder[j];
    },

    // What she has lost, and to what.
    hurt: () => sails.filter((s) => s.gone).map((s) => ({ name: s.name, kind: s.gone })),

    // The sails themselves, for the hands who are to put them right.
    broken: () => sails.filter((s) => s.gone),

    // A sail bent anew, a yard fished, a topmast sent up. A sprung topmast
    // takes the whole mast's upper canvas with it, so mending it gives all of
    // them back at once. Whatever is mended comes back furled, ready to set.
    mend(sail) {
      const kind = sail.gone;
      const back = kind === 'sprung topmast'
        ? sails.filter((s) => s.mast === sail.mast && s.gone === 'sprung topmast')
        : [sail];
      for (const s of back) {
        // She comes back trimmed like her sisters on the other two masts. If
        // she came back furled while they were set, the tier would be neither
        // one thing nor the other and would answer no order at all.
        const sister = sails.find((o) => o.tier === s.tier && !o.gone && o !== s);
        s.gone = null;
        s.state = sister ? sister.state : 'furled';
        s.target = null;
        s.progress = 0;
        if (s.yard) s.yard.rotation.z = 0;
      }
      if (kind === 'sprung topmast' && uppers[sail.mast]) uppers[sail.mast].rotation.z = 0;
      applyAll();
      return back.map((s) => s.name);
    },

    // Something carries away. A sprung topmast takes everything above the
    // lower masthead on that mast with it.
    damage(sail, kind) {
      const hit = kind === 'sprung topmast'
        ? sails.filter((s) => s.mast === sail.mast && ['topsail', 'topgallant', 'royal'].includes(s.tier))
        : [sail];
      for (const s of hit) {
        if (s.gone) continue;
        s.gone = kind;
        s.target = null;
        s.progress = 0;
        s.state = 'furled';
        if (s.yard && kind !== 'split sail') s.yard.rotation.z = 0.26;
      }
      if (kind === 'sprung topmast' && uppers[sail.mast]) uppers[sail.mast].rotation.z = 0.19;
      applyAll();
      return hit.map((s) => s.name);
    },

    // An evolution: the hands go to work, she changes as they do, and when
    // they are done the new state stands.
    begin(tier, target) { for (const s of of(tier)) { s.target = target; s.progress = 0; } applyAll(); },
    progress(tier, p) { for (const s of of(tier)) s.progress = p; applyAll(); },
    finish(tier) {
      for (const s of of(tier)) { if (s.target) s.state = s.target; s.target = null; s.progress = 0; }
      applyAll();
    },
    working: (tier) => of(tier).some((s) => s.target),

    // How much of her full plain sail she is showing, from nothing to one.
    canvas() {
      let set = 0, full = 0;
      for (const s of sails) { full += s.fullArea; set += s.fullArea * s.canvas; }
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
