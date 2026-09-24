// The view from above: the ship seen at a fixed angle, the way a builder's
// model is looked at on a table, close enough to see what each man is at.
//
// From here her insides can be shown two ways: cut down the middle like a
// ship's plan, or slid out of her side a deck at a time, like drawers. Nothing
// below is ever walked into -- SPEC section 3 stands -- a deck drawn out of
// her is a plate in a book, not a place.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeInterior } from './between.js';
import { bindPanel } from './isoface.js';

const VIEW = 62;                    // metres, top to bottom, at no zoom
const ISO = Math.atan(Math.SQRT2);  // true isometric: 54.7 degrees off overhead
const OUT = 10.5;                   // how far a drawer comes out of her side
const OFF = 1e6;                    // a cut so far off it cuts nothing

const ease = (t) => t * t * (3 - 2 * t);
const clamp = (t) => Math.max(0, Math.min(1, t));

export function makeAbove({ renderer, hull, rig, sky, sea, water }) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 9000);
  camera.zoom = 1.25;
  const fit = () => {
    const a = window.innerWidth / window.innerHeight;
    Object.assign(camera, { left: -VIEW * a / 2, right: VIEW * a / 2, top: VIEW / 2, bottom: -VIEW / 2 });
    camera.updateProjectionMatrix();
  };
  fit();
  window.addEventListener('resize', fit);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 7, 0);
  camera.position.set(-230, 290, -135);
  controls.minPolarAngle = controls.maxPolarAngle = ISO;
  Object.assign(controls, {
    enabled: false, enableDamping: true, dampingFactor: 0.08,
    minZoom: 0.7, maxZoom: 10, zoomToCursor: true
  });
  controls.update();

  // Her decks below. Out of this view they are not drawn at all.
  const below = makeInterior();
  const inside = new THREE.Group();
  inside.add(below.tween, below.hold, below.fixed);
  inside.visible = false;
  hull.add(inside);

  // The cut: one plane down her centreline, kept on the far side from you.
  // Every material aboard answers to it; away from section it stands a mile
  // off and cuts nothing.
  renderer.localClippingEnabled = true;
  const cut = new THREE.Plane(new THREE.Vector3(1, 0, 0), OFF);
  const ownCut = new THREE.Plane();
  hull.traverse((n) => {
    if (!n.material || n.isSprite) return;
    for (const m of [].concat(n.material)) m.clippingPlanes = [cut];
  });

  // The rig can stand, be ghosted, or be struck out of the picture.
  const rigMats = new Set();
  rig.group.traverse((n) => { if (n.material) rigMats.add(n.material); });
  for (const m of rigMats) m.userData.was = { t: m.transparent, o: m.opacity, d: m.depthWrite };
  function setRig(how) {
    state.rig = how;
    rig.group.visible = how !== 'struck';
    for (const m of rigMats) {
      const ghost = how === 'ghosted';
      m.transparent = ghost || m.userData.was.t;
      m.opacity = ghost ? 0.15 : m.userData.was.o;
      m.depthWrite = ghost ? false : m.userData.was.d;
      m.needsUpdate = true;
    }
  }

  // In section she is an engraved plate: the sea is laid behind her, so what
  // is under her waterline is drawn as plainly as what is above it.
  // Her wake and the weed are left off the plate: they float at the waterline
  // and would lie across her hold.
  function plate(on) {
    const s = sea();
    s.material.depthTest = s.material.depthWrite = !on;
    s.renderOrder = on ? -1 : 0;
    sky.renderOrder = on ? -2 : 0;
    for (const w of water) w.visible = !on;
  }

  const state = { on: false, mode: 'whole', down: false, rig: 'standing' };
  const drawers = {
    tween: { group: below.tween, now: 0, want: 0, lift: 2.7, side: 1 },
    hold:  { group: below.hold,  now: 0, want: 0, lift: 5.6, side: 1 }
  };
  const v = new THREE.Vector3();
  const sideNow = () => Math.sign(hull.worldToLocal(v.copy(camera.position)).x) || 1;

  const act = {
    state,
    toggle(on = !state.on) {
      state.on = on;
      inside.visible = on;
      controls.enabled = on;
      if (!on) {
        act.mode('whole');
        for (const d of Object.values(drawers)) { d.now = 0; d.group.position.set(0, 0, 0); }
        cut.set(v.set(1, 0, 0), OFF);
        plate(false);
      }
      return state;
    },
    mode(m) {
      state.mode = m;
      for (const key in drawers) {
        const d = drawers[key];
        if (m === key && d.now === 0) d.side = sideNow();
        d.want = m === key ? 1 : 0;
      }
      setRig(m === 'section' ? 'struck' : 'standing');
      if ((m === 'tween' || m === 'hold') && camera.zoom < 1.5) {
        camera.zoom = 1.5;
        camera.updateProjectionMatrix();
      }
      return state;
    },
    down() { state.down = !state.down; return state; },
    rig() { setRig({ standing: 'ghosted', ghosted: 'struck', struck: 'standing' }[state.rig]); return state; }
  };
  const ui = bindPanel(act, below.labels, camera);

  const aim = new THREE.Vector3();
  let men = null;

  function tick(real) {
    if (!state.on) return;
    const dt = Math.min(real, 0.05);
    const k = 1 - Math.exp(-dt * 4);

    const phi = state.down ? 0.001 : ISO;
    controls.minPolarAngle = controls.maxPolarAngle += (phi - controls.maxPolarAngle) * k;
    const open = drawers[state.mode];
    if (open) open.group.getWorldPosition(aim).setY(3);
    else aim.set(0, state.mode === 'section' ? 1 : 7, 0);
    const shift = v.subVectors(aim, controls.target).multiplyScalar(k);
    controls.target.add(shift);
    camera.position.add(shift);
    controls.update();

    for (const d of Object.values(drawers)) {
      d.now += Math.sign(d.want - d.now) * Math.min(Math.abs(d.want - d.now), dt / 1.3);
      // Straight out towards you first, then up clear of the water; going
      // back it sinks first and then slides home.
      d.group.position.x = d.side * OUT * ease(clamp(d.now * 1.8));
      d.group.position.y = d.lift * ease(clamp((d.now - 0.5) / 0.5));
    }

    const side = sideNow();
    const section = state.mode === 'section';
    if (section) cut.copy(ownCut.set(v.set(-side, 0, 0), 0.4)).applyMatrix4(hull.matrixWorld);
    else cut.set(v.set(1, 0, 0), OFF);
    plate(section);

    // A man standing on the half of her that has been cut away is not drawn.
    if (!men) { men = []; hull.traverse((n) => { if (n.isSprite && n.userData.man) men.push(n); }); }
    if (section) {
      for (const s of men) {
        s.getWorldPosition(v);
        if (side * hull.worldToLocal(v).x > 0.4) s.visible = false;
      }
    }
    ui.frame(state, drawers);
  }

  return {
    camera, below, tick,
    toggle: act.toggle,
    get on() { return state.on; },
    // Whether a man below can be seen, and so pointed at.
    seesBelow: () => state.on && (state.mode === 'section' || drawers.tween.now > 0.3)
  };
}
