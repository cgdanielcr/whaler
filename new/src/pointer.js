// The spout pointer: when a whale has been raised but lies off the edge of
// the picture, a small brass mark at the edge shows which way she bears, and
// how far. Sighted and floating whales only; the nearest first.
import * as THREE from 'three';

export function makePointer({ view, helm, whales }) {
  const el = document.getElementById('pointer'), v = new THREE.Vector3();
  return {
    draw(show) {
      let best = null, bd = 1e9, dead = false;
      for (const w of whales.list) {
        const afloat = w.state === 'dead' && !w.sinks && !w.cast && !w.alongside;
        if (!afloat && !(w.sighted && w.state === 'free')) continue;
        const d = Math.hypot(w.group.position.x - helm.pos.x, w.group.position.z - helm.pos.z) * (afloat ? 0.5 : 1);
        if (d < bd) { bd = d; best = w; dead = afloat; }
      }
      if (!show || !best) { el.hidden = true; return; }
      v.copy(best.group.position).setY(0).project(view.camera);
      if (Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.86) { el.hidden = true; return; }   // she is in the picture
      const k = Math.min(0.84 / Math.abs(v.x || 1e-6), 0.8 / Math.abs(v.y || 1e-6));
      el.hidden = false;
      el.style.left = `${((v.x * k + 1) / 2) * innerWidth}px`;
      el.style.top = `${((1 - v.y * k) / 2) * innerHeight}px`;
      el.className = dead ? 'dead' : '';
      el.firstChild.style.transform = `rotate(${Math.atan2(-v.y, v.x)}rad)`;
      el.lastChild.textContent = dead ? 'A dead whale' : best.known ? best.sp.name : 'A spout';
    },
  };
}
