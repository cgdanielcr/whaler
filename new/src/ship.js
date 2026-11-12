// The ship: a black-hulled, three-masted whaler with a white band, square
// sails on every mast, jibs and a spanker, tryworks amidships and boats on
// her davits. The bow points along +x.
import * as THREE from 'three';
import { boatMesh, figure } from './boats.js';
import { bake } from './bake.js';
import { sailcloth, dress } from './shipdress.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
const HULL = mat(0x2e2620), DECK = mat(0xa07a52), RAIL = mat(0x4a3526), BAND = mat(0xd9ceb4);
const SPAR = mat(0x4e3a29), BRICK = mat(0x8c4b34);
const cloth = sailcloth();
const CANVAS = mat(0xffffff, { map: cloth, emissiveMap: cloth, side: THREE.DoubleSide, roughness: 0.95, emissive: 0x9a8f78, emissiveIntensity: 0.6 });   // canvas glows a little with the light through it
const STAYSAIL = mat(0xf1e7d0, { side: THREE.DoubleSide, roughness: 0.95, emissive: 0x8a7f66, emissiveIntensity: 0.5 });
const FLAG = mat(0xa8322a, { side: THREE.DoubleSide });

const MASTS = [{ x: 3.9, h: 12.5, k: 1 }, { x: 0.3, h: 13.5, k: 1.08 }, { x: -3.7, h: 10.5, k: 0.8, mizzen: true }];
const YARDS = [{ f: 0.36, w: 6.4 }, { f: 0.62, w: 5.0 }, { f: 0.84, w: 3.6 }];
const DECK_Y = 0.9;

// Her boats on the davits, as [x along her, side]: three on the larboard side and one on
// the starboard quarter, leaving the starboard waist clear for cutting in. The first two
// listed are the first lowered. (The Morgan carried five; we play with four.)
export const DAVITS = [[0.9, -1], [-4.3, 1], [3.4, -1], [-1.9, -1]];

// The outline of the hull seen from above, at scale s.
export function trace(p, s) {
  p.moveTo(-7 * s, 0); p.lineTo(-7 * s, 1.45 * s); p.quadraticCurveTo(-6.7 * s, 1.9 * s, -5 * s, 1.95 * s);
  p.lineTo(2 * s, 1.95 * s); p.quadraticCurveTo(5.6 * s, 1.85 * s, 7.4 * s, 0);
  p.quadraticCurveTo(5.6 * s, -1.85 * s, 2 * s, -1.95 * s); p.lineTo(-5 * s, -1.95 * s);
  p.quadraticCurveTo(-6.7 * s, -1.9 * s, -7 * s, -1.45 * s); p.lineTo(-7 * s, 0);
  return p;
}

// Stand an outline up into a solid: its bottom face at y, its top at y + depth.
export function lift(shape, depth, y, steps = 1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, steps, bevelEnabled: false, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function hullMesh() {
  const g = lift(trace(new THREE.Shape(), 1), 2.3, -1.4, 2);
  const p = g.attributes.position;           // narrow the bottom so the sides slope in
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), keel = y < -1.3;
    p.setZ(i, p.getZ(i) * (keel ? 0.42 : y < 0 ? 0.9 : 1));
    if (keel) p.setX(i, p.getX(i) * 0.9);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, [DECK, HULL]);    // top face is the deck
}

export function ring(outer, inner, depth, y, m) {
  const s = trace(new THREE.Shape(), outer);
  s.holes.push(trace(new THREE.Path(), inner));
  return new THREE.Mesh(lift(s, depth, y), m);
}

function spar(a, b, r) {
  const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, d.length(), 6), SPAR);
  m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

// A square sail hanging from its yard: wider at the foot, bellied forward.
function sailGeo(wTop, wBot, h) {
  const g = new THREE.PlaneGeometry(1, 1, 6, 4), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = 0.5 - p.getY(i), w = wTop + (wBot - wTop) * v;
    p.setXYZ(i, Math.sin(v * Math.PI) * (1 - 4 * u * u) * 0.6 + 0.15 * v, -v * h, u * w);
  }
  g.computeVertexNormals();
  return g;
}

function tri(...pts) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  g.computeVertexNormals();
  return g;
}

export function makeShip() {
  const g = new THREE.Group();
  g.add(hullMesh(), ring(1, 0.94, 0.5, DECK_Y, RAIL), ring(1.012, 0.97, 0.28, 0.3, BAND));

  // Each mast's yards and square sails hang in a group of their own, so they can be braced round to the wind.
  const squares = [], braced = [], jibs = new THREE.Group(), spanker = new THREE.Group(), lines = [];
  for (const m of MASTS) {
    const top = DECK_Y + m.h, yards = new THREE.Group();
    yards.position.x = m.x;
    g.add(spar([m.x, DECK_Y, 0], [m.x, top, 0], 0.17), yards);
    braced.push(yards);
    YARDS.forEach((y, i) => {
      const yy = DECK_Y + m.h * y.f, w = y.w * m.k;
      yards.add(spar([0.15, yy, -w / 2], [0.15, yy, w / 2], 0.07));
      if (m.mizzen && i === 0) return;          // no course on the mizzen: the spanker is there
      const below = i === 0 ? DECK_Y + m.h * 0.13 : DECK_Y + m.h * YARDS[i - 1].f;
      const wb = i === 0 ? w * 1.05 : YARDS[i - 1].w * m.k;
      const sail = new THREE.Group();
      sail.position.set(0.25, yy - 0.05, 0);
      sail.add(new THREE.Mesh(sailGeo(w * 0.94, wb * 0.94, yy - below - 0.25), CANVAS));
      yards.add(sail);
      squares.push({ sail, tier: i, mast: MASTS.indexOf(m) });
    });
    // Shrouds from the masthead down to each side.
    for (const side of [-1, 1]) for (const dx of [-1.3, -0.6, 0.1]) lines.push([m.x, top * 0.92, 0], [m.x + dx, 1.4, side * 1.95]);
  }
  const bowsprit = [11.2, 2.9, 0];
  g.add(spar([6.2, 1.1, 0], bowsprit, 0.14));
  lines.push([3.9, DECK_Y + 12.2, 0], bowsprit, [0.3, DECK_Y + 13.2, 0], [3.9, DECK_Y + 8, 0],
    [-3.7, DECK_Y + 10.2, 0], [0.3, DECK_Y + 7.5, 0], [-3.7, DECK_Y + 10.2, 0], [-7, 1.4, 0]);

  // Jibs forward, spanker aft: set with the rest, gone when she is furled.
  jibs.add(new THREE.Mesh(tri([3.95, DECK_Y + 6.9, 0], [10.3, 2.6, 0], [5.4, 2.1, 0.5]), STAYSAIL));
  jibs.add(new THREE.Mesh(tri([3.95, DECK_Y + 10, 0], [11, 2.85, 0], [6.8, 3.6, 0.6]), STAYSAIL));
  const a = [-3.85, 2.1, 0], b = [-3.85, DECK_Y + 6.7, 0], c = [-7.2, DECK_Y + 5.9, 0.5], d = [-7.5, 2.1, 0.6];
  spanker.add(new THREE.Mesh(tri(a, b, c, a, c, d), STAYSAIL));
  g.add(jibs, spanker);
  g.add(spar([-3.7, DECK_Y + 6.9, 0], [-7.3, DECK_Y + 6, 0], 0.07), spar([-3.7, 2, 0], [-7.6, 1.9, 0], 0.07));

  const rig = new THREE.BufferGeometry();
  rig.setAttribute('position', new THREE.Float32BufferAttribute(lines.flat(), 3));
  g.add(new THREE.LineSegments(rig, new THREE.LineBasicMaterial({ color: 0x241b14 })));

  // On deck: the tryworks, a deckhouse aft, some hands, and the flag.
  const box = (w, h, dd, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m); o.position.set(x, y, z); g.add(o); };
  box(1.6, 0.8, 1.8, BRICK, 2.2, 1.3, 0);
  box(0.3, 0.7, 0.3, BRICK, 2.2, 2, 0);
  box(2.2, 0.9, 2.4, RAIL, -5.2, 1.35, 0);
  dress(g, ring, DECK_Y);
  for (const [x, z] of [[1, 0.8], [-1.3, -0.9], [-2.6, 0.9], [5, -0.5], [-6.2, 0.4], [0.9, -1.2]]) figure(g, x, DECK_Y, z, true);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7).translate(0.75, 0, 0), FLAG);   // it streams from the hoist
  flag.position.set(0.3, DECK_Y + 13.8, 0);
  g.add(flag);

  // Boats on the davits, and two spares bottom-up on the skids over the after house.
  const davits = DAVITS.map(([x, side]) => {
    const boat = boatMesh(false);
    boat.scale.setScalar(0.8);
    boat.position.set(x, 1.9, side * 2.4);
    g.add(boat);
    return boat;
  });
  for (const z of [-0.55, 0.55]) {
    const spare = boatMesh(false);
    spare.scale.setScalar(0.75);
    spare.rotation.x = Math.PI;
    spare.position.set(-5.2, 2.2, z);
    g.add(spare);
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  bake(g, [...braced, jibs, spanker, flag, ...davits]);

  let brace = 0, lost = 0;
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  return {
    group: g,
    // set: 0 furled at the wharf to 1 set. plan: her canvas, 0 all plain sail, 1 topsails,
    // 2 close-reefed topsails, 3 hove to. rel: where the wind is from, off her bow.
    setSails(set, plan = 0, rel = Math.PI, dt = 0) {
      const light = clamp01(1 - plan), reef = plan <= 1 ? 1 : 0.45, hove = clamp01(plan - 2);
      for (const { sail, tier, mast } of squares) {
        let k = set * (tier === 1 ? reef : light);
        if (tier === 1 && mast < lost) k = 0;                       // a topsail blown out of its bolt-ropes
        if (tier === 1 && mast === 2) k *= 1 - hove;                // hove to under fore and main topsails
        sail.scale.set(0.35 + 0.65 * k, 0.07 + 0.93 * k, 1);
      }
      jibs.visible = set > 0.4 && plan < 2.5;
      spanker.visible = set > 0.4 && plan < 1.5;
      // Yards square before the wind, braced sharp up when she is close-hauled; the weather yardarm goes forward.
      const want = Math.sign(Math.sin(rel)) * Math.min(0.95, (Math.PI - Math.abs(rel)) * 0.62) * set;
      brace += (want - brace) * Math.min(1, dt * 1.2);
      braced.forEach((y, i) => { y.rotation.y = i === 1 && hove > 0.5 ? -brace : brace; });   // main topsail aback when hove to
      flag.rotation.y = -(rel + Math.PI);
    },
    setLost(n) { lost = n; },
    // Show each boat on her davits, or not (lost, or away after a whale). In DAVITS order.
    showBoats(flags) { davits.forEach((b, i) => { b.visible = flags[i]; }); },
  };
}
