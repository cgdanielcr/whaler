// The helm: steers the ship toward where she is sent, gathers way when her
// sails are set, loses it when they are not, and keeps her off the ice, the
// wharf and the shore.
import * as THREE from 'three';
import { shoreX, EDGE, PIER, wrap } from './world.js';

const MAX_SPEED = 9;

export function makeHelm(ship, ice) {
  const object = new THREE.Group();
  object.add(ship.group);

  const s = { object, pos: object.position, heading: Math.PI, speed: 0, target: null, set: false, sail: 0, heel: 0 };

  s.steer = (x, z) => {
    x = Math.min(x, shoreX(z) - 6);
    s.target = { x: THREE.MathUtils.clamp(x, -EDGE + 15, EDGE), z: THREE.MathUtils.clamp(z, -EDGE + 15, EDGE - 15) };
  };

  s.update = (dt, t) => {
    const pos = s.pos;
    let want = 0, turn = 0;
    if (s.target) {
      const dx = s.target.x - pos.x, dz = s.target.z - pos.z, d = Math.hypot(dx, dz);
      if (d < 2.5) s.target = null;
      else {
        const off = wrap(Math.atan2(dz, dx) - s.heading);
        const rate = 0.25 + 0.55 * Math.min(1, s.speed / 4);
        turn = THREE.MathUtils.clamp(off, -rate * dt, rate * dt);
        s.heading += turn;
        if (s.set) want = MAX_SPEED * Math.min(1, 0.25 + d / 20) * (1 - Math.min(0.6, Math.abs(off) / 2.2));
      }
    }
    s.speed += (want - s.speed) * Math.min(1, dt * 0.5);
    pos.x += Math.cos(s.heading) * s.speed * dt;
    pos.z += Math.sin(s.heading) * s.speed * dt;

    if (ice.push(pos, 3.4)) s.speed *= 1 - Math.min(1, dt * 2);
    // The wharf: slide off whichever side she is on.
    if (pos.x > PIER.x0 - 7 && pos.x < PIER.x1 && pos.z > PIER.z0 - 5 && pos.z < PIER.z1 + 2) {
      pos.z = pos.z > (PIER.z0 + PIER.z1) / 2 ? PIER.z1 + 2 : PIER.z0 - 5;
    }
    pos.x = Math.min(pos.x, shoreX(pos.z) - 5);
    pos.x = THREE.MathUtils.clamp(pos.x, -EDGE + 15, EDGE);
    pos.z = THREE.MathUtils.clamp(pos.z, -EDGE + 15, EDGE - 15);

    // Sails come in and go out gradually.
    s.sail += ((s.set ? 1 : 0) - s.sail) * Math.min(1, dt * 0.7);
    ship.setSails(s.sail);

    // She heels in a turn, and rolls and pitches in the swell.
    const heelWant = dt > 0 ? (-turn / dt) * 0.12 * (s.speed / MAX_SPEED) : 0;
    s.heel += (heelWant - s.heel) * Math.min(1, dt * 1.5);
    ship.group.rotation.x = s.heel + Math.sin(t * 0.9) * 0.02;
    ship.group.rotation.z = Math.sin(t * 0.7) * 0.012;
    ship.group.position.y = Math.sin(t * 1.1) * 0.07;
    object.rotation.y = -s.heading;
  };

  return s;
}
