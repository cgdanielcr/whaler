// Where the ship view is played: over the sea itself. The camera closes in,
// the decks rise out of her hull, turn bow to the right as a ship's plan is
// drawn, and hang above the water with the sea still running beneath. The
// deck in hand is full size; the others stand above and below it, shrunk and
// dimmed, until the carousel brings one of them forward.
import * as THREE from 'three';

const SHOW = Math.PI / 4;                 // bow to the right of the screen
const ABOVE = 7;                          // how high over the water the deck in hand hangs
const RISE = 5.2;                         // how far above or below it the next deck stands
const SHRINK = 0.45, DIM = 0.45;          // how much smaller and fainter the other decks are
const SHUT = [0.9, -0.1, -1.1];           // the decks' heights when she is whole
const FIT_W = 17;                         // this much of the deck must fit between the panels
const RIGHT = new THREE.Vector3(1, 0, 1).normalize();     // the screen's right, on the sea

export function makeStage({ view, helm, ship }) {
  let from = 0, wasH = null, sideways = 0;
  const focus = new THREE.Vector3();

  // How close the camera comes, so the deck fills the space between the panels,
  // and how far aside it must look so she sits in the middle of that space.
  function fit(rightPx, leftPx) {
    const wide = innerWidth > 760, r = wide ? rightPx : 0, l = wide ? leftPx : 0;
    const h = (FIT_W * innerHeight) / Math.max(240, innerWidth - r - l);
    sideways = (((r - l) / 2) * h) / innerHeight;
    return h;
  }

  return {
    camera: view.camera,
    open(rightPx, leftPx) { from = helm.heading; wasH = view.height(fit(rightPx, leftPx)); },
    resize(rightPx, leftPx) { view.height(fit(rightPx, leftPx)); },
    close() { if (wasH) view.height(wasH); wasH = null; },

    // e: how far she has come apart, 0 whole to 1 apart. at: which deck is in hand (eased).
    place(root, layers, e, at) {
      root.position.set(helm.pos.x, 0, helm.pos.z);
      const turn = Math.atan2(Math.sin(SHOW - from), Math.cos(SHOW - from));
      root.rotation.y = -(from + turn * e);
      layers.forEach((l, i) => {
        const o = i - at, a = Math.min(1, Math.abs(o));
        const y = ABOVE - o * RISE, s = 1 - SHRINK * a;
        l.group.position.y = SHUT[i] + (y - SHUT[i]) * e;
        l.group.scale.setScalar(1 + (s - 1) * e);
        l.fade(Math.abs(o) > 1.5 ? 1 - 0.85 * e : 1 - DIM * a * e);   // two decks away, it is barely there
      });
      ship.group.visible = e < 0.02;
    },

    // Where the camera looks: the ship at sea, or the deck in hand between the panels.
    look(sea, e) {
      focus.set(helm.pos.x, ABOVE, helm.pos.z).addScaledVector(RIGHT, sideways);
      return focus.lerp(sea, 1 - e);
    },
  };
}
