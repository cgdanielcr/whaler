// The men on the decks: small figures dressed from their looks. Trousers,
// shirt or coat, a face, hair or a hat, a beard; tall or short, broad or
// narrow; and a ring at his feet in the colour of his watch (gold if he is
// the man chosen). Every part is drawn for all the men at once, so the whole
// company costs a dozen draws however many there are.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cyl = (rt, rb, h, y) => new THREE.CylinderGeometry(rt, rb, h, 7).translate(0, y, 0);
const dome = (r, y, sy = 1) => new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, sy, 1).translate(0, y, 0);
const both = (...gs) => mergeGeometries(gs.map((x) => x.index ? x.toNonIndexed() : x));

const HEAD_Y = 0.9;
// How big the men are drawn against the ship: true scale. She is about 107 feet
// long in 14.4 units, so a man of five foot seven, hat and all, stands 0.75.
const SIZE = 0.73;
const PARTS = {
  legs: cyl(0.11, 0.1, 0.36, 0.18),
  torso: cyl(0.15, 0.13, 0.44, 0.58),
  head: new THREE.SphereGeometry(0.13, 8, 6).translate(0, HEAD_Y, 0),
  hair: dome(0.138, HEAD_Y + 0.01),
  beard: new THREE.SphereGeometry(0.137, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0, HEAD_Y - 0.01, 0),
  ring: new THREE.RingGeometry(0.2, 0.28, 20).rotateX(-Math.PI / 2).translate(0, 0.02, 0),
  armL: cyl(0.042, 0.036, 0.36, -0.18), armR: cyl(0.042, 0.036, 0.36, -0.18),       // hung from the shoulder
  handL: new THREE.SphereGeometry(0.045, 6, 4).translate(0, -0.38, 0), handR: new THREE.SphereGeometry(0.045, 6, 4).translate(0, -0.38, 0),
};
// How he holds his arms at his work, as [forward swing, outward], left arm then right.
// He faces +x; his right hand is toward +z.
const ARMS = {
  idle: [[0.1, 0.12], [0.1, 0.12]], walk: [[0.35, 0.08], [-0.25, 0.08]],
  lookout: [[0.1, 0.15], [2.55, 0.45]],     // shading his eyes, scanning for a spout
  wheel: [[1.25, 0.05], [1.35, 0.05]],      // both hands on the spokes
  stir: [[0.95, 0.2], [0.75, 0.2]],         // over the try-pots, the galley fire, the blubber
  spade: [[2.35, 0.12], [2.15, 0.12]],      // the cutting spade raised to strike
  hammer: [[0.9, 0.1], [2.75, 0.12]],       // the carpenter's or the cooper's hammer lifted
  sit: [[0.65, 0.1], [0.65, 0.1]],          // hands on his knees, on his sea chest
};
const SHOULDER_Y = 0.74, SHOULDER_Z = 0.17, HIP = 0.36, SIT_DROP = 0.2;
const HATS = {
  beaver: both(cyl(0.12, 0.12, 0.24, HEAD_Y + 0.2), cyl(0.2, 0.2, 0.02, HEAD_Y + 0.09)),
  cap: both(cyl(0.145, 0.14, 0.07, HEAD_Y + 0.1), new THREE.BoxGeometry(0.12, 0.015, 0.1).translate(0.12, HEAD_Y + 0.07, 0)),
  tarpaulin: both(cyl(0.12, 0.13, 0.09, HEAD_Y + 0.13), cyl(0.21, 0.21, 0.015, HEAD_Y + 0.09)),
  knit: dome(0.148, HEAD_Y + 0.02, 1.25),
  straw: both(cyl(0.12, 0.13, 0.08, HEAD_Y + 0.14), cyl(0.27, 0.27, 0.012, HEAD_Y + 0.1)),
  souwester: both(dome(0.15, HEAD_Y + 0.02, 1.1), cyl(0.23, 0.23, 0.012, HEAD_Y + 0.06)),
  kerchief: dome(0.143, HEAD_Y + 0.01, 1.05),
};
const WATCH = { larboard: new THREE.Color(0x4a78c0), starboard: new THREE.Color(0xc0553a), none: new THREE.Color(0x8a8070), chosen: new THREE.Color(0xf0c96a) };

export function makeCrewFigures(scene, N) {
  const mesh = (geo, basic) => {
    const m = new THREE.InstancedMesh(geo, basic ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false })
      : new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85 }), N);
    m.castShadow = !basic; m.frustumCulled = false; scene.add(m);
    for (let i = 0; i < N; i++) m.setColorAt(i, WATCH.none);
    return m;
  };
  const parts = Object.fromEntries(Object.entries(PARTS).map(([k, g]) => [k, mesh(g, k === 'ring')]));
  const hats = Object.fromEntries(Object.entries(HATS).map(([k, g]) => [k, mesh(g)]));
  const all = [...Object.values(parts), ...Object.values(hats)];
  const M = new THREE.Matrix4(), NONE = new THREE.Matrix4().makeScale(0, 0, 0), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  const A = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4(), X = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), qf = new THREE.Quaternion();
  const Bm = new THREE.Matrix4(), Lg = new THREE.Matrix4();

  // Dress each man from his look. Needed again whenever the company changes.
  function dress(men) {
    men.forEach((m, i) => {
      const L = m.look;
      parts.legs.setColorAt(i, c.set(L.trousers));
      parts.torso.setColorAt(i, c.set(L.coat || L.shirt));
      parts.armL.setColorAt(i, c); parts.armR.setColorAt(i, c);
      parts.handL.setColorAt(i, c.set(L.skin)); parts.handR.setColorAt(i, c);
      parts.head.setColorAt(i, c.set(L.skin));
      parts.hair.setColorAt(i, c.set(L.hair));
      parts.beard.setColorAt(i, c.set(L.hair));
      if (hats[L.hat]) hats[L.hat].setColorAt(i, c.set(L.hatColour));
    });
    all.forEach((p) => { p.instanceColor.needsUpdate = true; });
  }

  // Stand man i with his feet at p (or hide him), at the deck's scale k, turned
  // `face` on a deck that is itself turned `turn`, holding his arms for `pose`.
  function place(i, m, p, k, chosen, face = 0, pose = 'idle', turn = null) {
    if (!p) { for (const part of all) part.setMatrixAt(i, NONE); return; }
    const L = m.look;
    k *= SIZE;
    q.setFromAxisAngle(up, face); if (turn) q.premultiply(turn);
    M.compose(p, q, s.set(L.girth * k, L.height * k, L.girth * k));
    // Seated on his chest: the body drops, the thighs come forward from the hip.
    const sit = pose === 'sit', B = sit ? Bm.copy(M).multiply(T.makeTranslation(0, -SIT_DROP, 0)) : M;
    const legs = sit ? Lg.copy(M).multiply(T.makeTranslation(0, HIP - SIT_DROP, 0)).multiply(R.makeRotationZ(1.35)).multiply(X.makeTranslation(0, -HIP, 0)) : M;
    const arms = ARMS[pose] || ARMS.idle;
    [[parts.armL, parts.handL, -1, arms[0]], [parts.armR, parts.handR, 1, arms[1]]].forEach(([arm, hand, side, [fwd, out]]) => {
      A.copy(B).multiply(T.makeTranslation(0, SHOULDER_Y, side * SHOULDER_Z)).multiply(R.makeRotationZ(fwd)).multiply(X.makeRotationX(-side * out));
      arm.setMatrixAt(i, A); hand.setMatrixAt(i, A);
    });
    parts.legs.setMatrixAt(i, legs); parts.torso.setMatrixAt(i, B); parts.head.setMatrixAt(i, B);
    parts.hair.setMatrixAt(i, L.hat === 'bare' && !L.bald ? B : NONE);
    parts.beard.setMatrixAt(i, L.beard === 'full' || L.beard === 'curtain' ? B : NONE);
    for (const [kind, hat] of Object.entries(hats)) hat.setMatrixAt(i, kind === L.hat ? B : NONE);
    parts.ring.setMatrixAt(i, M.compose(p, qf.identity(), s.setScalar(k * (chosen ? 1.35 : 1))));
    parts.ring.setColorAt(i, chosen ? WATCH.chosen : WATCH[m.watch || 'none']);
  }

  function done() {
    for (const part of all) part.instanceMatrix.needsUpdate = true;
    parts.ring.instanceColor.needsUpdate = true;
  }

  // What a click can land on, to find a man.
  function pickables() {
    for (const p of [parts.torso, parts.head, parts.legs]) p.computeBoundingSphere();
    return [parts.torso, parts.head, parts.legs];
  }

  return { dress, place, done, pickables };
}
