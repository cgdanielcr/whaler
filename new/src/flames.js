// Fire on deck, for the ship view: a heap of flickering flame and a glow at
// the tryworks when they are ablaze, as big as the fire is.
import * as THREE from 'three';

export function makeFlames(deck) {
  const g = new THREE.Group(), geo = new THREE.ConeGeometry(0.28, 0.9, 5);
  const tongues = [0xffb347, 0xff7a2e, 0xffd76a, 0xe9502a, 0xffa13a].map((color, i) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    m.position.set(Math.cos(i * 1.3) * 0.45, 0.5, Math.sin(i * 1.3) * 0.55);
    g.add(m);
    return m;
  });
  const glow = new THREE.PointLight(0xff8a3a, 0, 9);
  glow.position.y = 1.2;
  g.add(glow);
  g.position.set(2.3, 0.75, 0);
  g.visible = false;
  deck.add(g);
  let t = 0;

  return {
    // now: the crisis in hand, or null.
    update(dt, now) {
      const fire = now && now.kind === 'fire' && now.troubles.find((x) => x.id === 'fire');
      g.visible = !!fire && fire.state === 'open';
      if (!g.visible) return;
      t += dt;
      const k = 0.5 + fire.m * 1.6;
      tongues.forEach((m, i) => { m.scale.set(k, k * (0.8 + 0.5 * Math.sin(t * (9 + i * 2.3) + i)), k); m.position.y = 0.45 * m.scale.y; });
      glow.intensity = 6 + 10 * fire.m + 3 * Math.sin(t * 17);
    },
  };
}
