// Cutting in and trying out. A dead whale is only meat for the sharks until
// she is brought alongside, her blubber stripped and boiled down in the
// tryworks, and the oil run into casks below. The ship lies still meanwhile,
// smoking like a factory.
import * as THREE from 'three';
import { room } from './stores.js';
import { hud } from './hud.js';

const BBL_PER_SECOND = 9;     // about fifty barrels a day
const ROT = 0.9;              // what the sharks leave of a whale adrift, each day
const ROT_ALONGSIDE = 0.985;   // they still take something with her alongside
const ADRIFT_DAYS = 6;        // after this a carcass left adrift sinks
const TEAR_LOOSE = 0.3;       // chance, each day of a gale, she tears loose from the ship

export function makeTrying(scene, { v, whales, helm }) {
  const smoke = [], mat = () => new THREE.MeshBasicMaterial({ color: 0x2f2b28, transparent: true, opacity: 0, depthWrite: false });
  const geo = new THREE.IcosahedronGeometry(0.7, 0);
  for (let i = 0; i < 36; i++) {
    const m = new THREE.Mesh(geo, mat());
    m.visible = false; m.renderOrder = 2;
    scene.add(m);
    smoke.push({ m, age: 99 });
  }
  let w = null, acc = 0, puffIn = 0, next = 0;
  const works = new THREE.Vector3();

  function castOff(text) {
    if (!w) return;
    w.alongside = false; w.cast = true; w = null;
    if (text) hud.toast(text);
  }

  const floating = () => whales.list.filter((x) => x.state === 'dead' && !x.sinks && !x.cast);

  return {
    get whale() { return w; },
    floating,
    near(pos, r) {
      return floating().find((x) => !x.alongside && Math.hypot(x.group.position.x - pos.x, x.group.position.z - pos.z) < r);
    },
    alongside(x) {
      w = x; x.alongside = true; x.tried = 0; acc = 0;
      helm.target = null; helm.set = false;
      hud.toast('She is made fast alongside. The cutting-in tackle is rigged and the tryworks lit.');
    },
    castOff,

    // Work her while the weather allows: strip, boil, and stow.
    // fx: what the tryworks gang and the cooper make of it.
    tick(dt, working, fx) {
      if (w && working) {
        if (room(v) < 1) return castOff('No room below for another barrel. The rest of her is cast adrift.');
        const boiled = Math.min(BBL_PER_SECOND * fx.trying * dt, w.left);
        acc += boiled * fx.stow; w.left -= boiled;          // a poor cooper loses some in the stowing
        const whole = Math.min(Math.floor(acc), room(v));
        v[w.sp.oil] += whole; w.tried += whole; acc -= whole;
        w.group.scale.setScalar(w.size * (0.6 + 0.4 * (w.left / w.barrels)));
        if ((puffIn -= dt) <= 0) {
          puffIn = 0.12;
          const p = smoke[next++ % smoke.length];
          helm.object.localToWorld(works.set(2.2, 2.6, 0));
          p.m.position.copy(works); p.age = 0; p.m.visible = true;
        }
        if (w.left < 0.5) castOff(`Tried out: ${w.tried} barrels of ${w.sp.oil === 'sperm' ? 'sperm oil' : 'oil'} stowed down. The stripped carcass is cast adrift.`);
      }
      for (const p of smoke) {
        if (p.age > 3) { p.m.visible = false; continue; }
        p.age += dt;
        p.m.position.y += dt * 2.2;
        p.m.position.x += dt * 1.2;
        p.m.scale.setScalar(0.6 + p.age * 1.2);
        p.m.material.opacity = 0.6 * (1 - p.age / 3);
      }
    },

    // Each morning the sharks take their share, and a gale may tear her away.
    newDay(gale) {
      for (const c of floating()) {
        c.adrift = (c.adrift || 0) + 1;
        c.left *= c.alongside ? ROT_ALONGSIDE : ROT;
        if (!c.alongside && c.adrift > ADRIFT_DAYS) c.cast = true;
      }
      if (gale && w && Math.random() < TEAR_LOOSE) castOff('The gale tears her loose from the ship, and she is gone.');
    },
  };
}
