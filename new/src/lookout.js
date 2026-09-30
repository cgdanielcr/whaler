// The lookout at the masthead: he cries a spout when one is in sight, and names
// the kind of whale when she is near enough to tell. How far he sees depends
// on who is aloft.
import { wrap } from './world.js';
import { describe } from './species.js';
import { hud } from './hud.js';

export const SIGHT = 95;        // how far an ordinary lookout can see a spout
export const MAKE_OUT = 50;     // how near before he can tell the kind of whale

export function makeLookout({ helm, whales }) {
  const far = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);

  // Where she lies from the ship, as a seaman says it.
  function bearing(p) {
    const rel = wrap(Math.atan2(p.z - helm.pos.z, p.x - helm.pos.x) - helm.heading), a = Math.abs(rel);
    const side = rel > 0 ? 'starboard' : 'larboard';
    if (a < 0.3) return 'Dead ahead';
    if (a < 1.2) return `Off the ${side} bow`;
    if (a < 1.95) return `On the ${side} beam`;
    if (a < 2.85) return `Off the ${side} quarter`;
    return 'Right astern';
  }

  // eyes: how good the lookouts are, 1 for ordinary. cry: whether to call out.
  function tick(eyes, cry) {
    for (const w of whales.within(helm.pos, SIGHT * eyes)) {
      if (!w.sighted && w.surfaced) {
        w.sighted = true;
        if (cry) hud.toast(`There she blows! ${bearing(w.group.position)}.`);
      }
      if (w.sighted && !w.known && far(w.group.position, helm.pos) < MAKE_OUT * eyes) {
        w.known = true;
        if (cry) hud.toast(`A ${describe(w)}. ${w.sp.note}`);
      }
    }
  }

  return { tick };
}
