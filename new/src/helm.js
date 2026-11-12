// The helm: steers the ship toward where she is sent, as the wind allows. She
// cannot head closer than six points to it, so to get to windward she beats,
// one board and then another, going about between them; if she misses stays
// she wears round the long way. She gathers way by her canvas and her point
// of sailing, and is kept off the ice, the wharf and the shore.
import * as THREE from 'three';
import { shoreX, EDGE, PIER, BERTH, wrap } from './world.js';
import { CLOSE, pointOfSail } from './wind.js';

const MAX_SPEED = 10;
const BOARD = 0.55;          // how far past the mark's bearing she stands on before going about
const HARBOUR = 48;          // this near the wharf she is worked in under easy sail, whatever the wind

export function makeHelm(ship, ice) {
  const object = new THREE.Group();
  object.add(ship.group);

  const s = { object, pos: object.position, heading: Math.PI, speed: 0, target: null, set: false, sail: 0, heel: 0,
    hands: 1,                   // below 1 when short-handed or with canvas lost
    slow: 1,                    // below 1 in the pack ice; 0 when she is beset
    bump: 0,                    // hull damage from striking ice, gathered until the voyage reads it
    wind: { from: Math.PI, drive: 0.7 },   // set by the voyage
    canvas: 1, plan: 0,         // how much her canvas draws, and which canvas it is (0 all plain sail .. 3 hove to)
    handling: 1,                // how smartly the watch works her through stays
    tack: 0, round: 0, stays: 0, beating: false, said: null };

  s.steer = (x, z) => {
    x = Math.min(x, shoreX(z) - 6);
    s.target = { x: THREE.MathUtils.clamp(x, -EDGE + 15, EDGE), z: THREE.MathUtils.clamp(z, -EDGE + 15, EDGE - 15) };
    s.tack = 0; s.round = 0;
  };
  const harbour = () => Math.hypot(s.pos.x - BERTH.x, s.pos.z - BERTH.z) < HARBOUR;

  // Which way to head for the mark: straight, or close-hauled on one tack or the other.
  function course(bearing, d) {
    const b = wrap(bearing - s.wind.from);              // the mark, from the wind's eye
    s.beating = Math.abs(b) < CLOSE && d > 6 && !harbour();
    if (!s.beating) { s.tack = 0; return bearing; }
    if (!s.tack) s.tack = wrap(s.heading - s.wind.from) >= 0 ? 1 : -1;
    if (b * s.tack < -BOARD) { s.tack = -s.tack; s.said = 'about'; }
    return s.wind.from + s.tack * CLOSE;
  }

  s.update = (dt, t) => {
    const pos = s.pos, off = wrap(s.heading - s.wind.from), free = harbour();
    let want = 0, turn = 0;
    const inStays = Math.abs(off) < CLOSE - 0.1 && !free;
    if (s.target) {
      const dx = s.target.x - pos.x, dz = s.target.z - pos.z, d = Math.hypot(dx, dz);
      if (d < 2.5) { s.target = null; s.round = 0; }
      else {
        const to = wrap(course(Math.atan2(dz, dx), d) - s.heading);
        // In stays she may hang, and fall off again: then she wears round the long way.
        if (inStays && !s.stays && s.set && Math.abs(to) > 0.5) {
          s.stays = 1;
          const light = s.wind.drive < 0.5 || s.wind.drive >= 1.05 && s.plan < 2;
          if (Math.random() < (light ? 0.4 : 0.1) * (1.6 - s.handling)) { s.round = -Math.sign(to) || 1; s.said = 'missed'; }
        }
        if (!inStays) s.stays = 0;
        if (s.round && Math.abs(to) < 0.25) s.round = 0;
        const rate = (0.4 + 0.45 * Math.min(1, s.speed / 4)) * (inStays ? 0.85 * s.handling : 1);
        turn = s.round ? s.round * rate * dt : THREE.MathUtils.clamp(to, -rate * dt, rate * dt);
        s.heading = wrap(s.heading + turn);
        const drive = free ? 0.45 : s.wind.drive * pointOfSail(off) * s.canvas;
        if (s.set) want = MAX_SPEED * drive * s.hands * s.slow * Math.min(1, 0.25 + d / 20) * (1 - Math.min(0.5, Math.abs(to) / 2.6));
      }
    }
    s.speed += (want - s.speed) * Math.min(1, dt * (want < s.speed && inStays ? 0.25 : 0.5));
    pos.x += Math.cos(s.heading) * s.speed * dt;
    pos.z += Math.sin(s.heading) * s.speed * dt;

    if (ice.push(pos, 3.4)) { s.bump += Math.max(0, s.speed - 2) * dt * 0.35; s.speed *= 1 - Math.min(1, dt * 2); }   // a nudge is harmless; ramming is not
    // The wharf: slide off whichever side she is on.
    if (pos.x > PIER.x0 - 7 && pos.x < PIER.x1 && pos.z > PIER.z0 - 5 && pos.z < PIER.z1 + 2) {
      pos.z = pos.z > (PIER.z0 + PIER.z1) / 2 ? PIER.z1 + 2 : PIER.z0 - 5;
    }
    pos.x = Math.min(pos.x, shoreX(pos.z) - 5);
    pos.x = THREE.MathUtils.clamp(pos.x, -EDGE + 15, EDGE);
    pos.z = THREE.MathUtils.clamp(pos.z, -EDGE + 15, EDGE - 15);

    // Her canvas comes in and goes out gradually, and her yards are braced to the wind.
    s.sail += ((s.set ? 1 : 0) - s.sail) * Math.min(1, dt * 0.7);
    const rel = wrap(s.wind.from - s.heading);
    ship.setSails(s.sail, s.plan, rel, dt);

    // She heels to leeward under her canvas and in a turn, and rolls and pitches in the swell.
    const press = -Math.sin(rel) * 0.085 * s.wind.drive * s.canvas * s.sail * (free ? 0.3 : 1);
    const heelWant = press + (dt > 0 ? (-turn / dt) * 0.1 * (s.speed / MAX_SPEED) : 0);
    s.heel += (heelWant - s.heel) * Math.min(1, dt * 1.5);
    const sea = 0.6 + s.wind.drive;
    ship.group.rotation.x = s.heel + Math.sin(t * 0.9) * 0.02 * sea;
    ship.group.rotation.z = Math.sin(t * 0.7) * 0.012 * sea;
    ship.group.position.y = Math.sin(t * 1.1) * 0.07 * sea;
    object.rotation.y = -s.heading;
  };

  return s;
}
