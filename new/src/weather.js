// The look of the weather: the light as the season turns and as it comes on
// to blow, the shadows of clouds drifting down the wind across the sea, the
// white streaks the wind tears off the wave tops, and rain in a gale.
import * as THREE from 'three';
import { dayOfYear } from './season.js';

const MOODS = {
  fair: { sun: 0xfff0d8, sunK: 2.7, sky: 0xdcefff, ground: 0x1a4a5c, skyK: 1.3, back: 0x0f4a63 },
  late: { sun: 0xffdcae, sunK: 2.3, sky: 0xd9e2ec, ground: 0x1c4152, skyK: 1.15, back: 0x12435a },
  fresh: { sun: 0xf2ead8, sunK: 2.1, sky: 0xc9d8e4, ground: 0x173d4e, skyK: 1.2, back: 0x0f4057 },
  gale: { sun: 0xb8c6d0, sunK: 1.3, sky: 0x9db0be, ground: 0x14303f, skyK: 1.25, back: 0x0b2a3a },
};
const CLOUDS = 9, STREAKS = 70, SPAN = 150;

function softDisc() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.6, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function makeWeather(view, voyage) {
  const { scene, sun, sky } = view, rain = document.getElementById('rain');
  const now = { sun: new THREE.Color(MOODS.fair.sun), sky: new THREE.Color(MOODS.fair.sky), ground: new THREE.Color(MOODS.fair.ground), back: new THREE.Color(MOODS.fair.back), sunK: 2.7, skyK: 1.3 };
  const to = new THREE.Color();

  // Cloud shadows: soft dark patches lying on the sea.
  const shade = new THREE.MeshBasicMaterial({ map: softDisc(), color: 0x04202e, transparent: true, opacity: 0.2, depthWrite: false });
  const clouds = Array.from({ length: CLOUDS }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shade);
    m.scale.set(50 + (i * 37) % 60, 1, 34 + (i * 53) % 44);
    m.position.set(((i * 97) % (SPAN * 2)) - SPAN, 0.75, ((i * 61) % (SPAN * 2)) - SPAN);
    m.rotation.y = i; m.renderOrder = 0;
    scene.add(m);
    return m;
  });

  // Wind streaks: thin white dashes on the water, running down the wind.
  const dash = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const streaks = new THREE.InstancedMesh(dash, new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.32, depthWrite: false }), STREAKS);
  streaks.renderOrder = 0; streaks.frustumCulled = false;
  scene.add(streaks);
  const at = Array.from({ length: STREAKS }, (_, i) => ({ x: ((i * 73) % 200) - 100, z: ((i * 131) % 200) - 100, life: (i * 0.37) % 1, len: 1 + (i % 4) * 0.7 }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const wrapTo = (n, c) => c + ((((n - c + SPAN) % (SPAN * 2)) + SPAN * 2) % (SPAN * 2)) - SPAN;

  return {
    // real: seconds gone by; from: where the wind blows from; blow: how hard (its drive); focus: where the camera looks.
    update(real, t, from, blow, focus) {
      const s = voyage.season, late = dayOfYear(voyage.v.date) > 235;
      const mood = MOODS[s.gale ? 'gale' : s.wind === 'strong breeze' ? 'fresh' : late ? 'late' : 'fair'], k = Math.min(1, real * 0.6);
      now.sun.lerp(to.set(mood.sun), k); now.sky.lerp(to.set(mood.sky), k); now.ground.lerp(to.set(mood.ground), k); now.back.lerp(to.set(mood.back), k);
      now.sunK += (mood.sunK - now.sunK) * k; now.skyK += (mood.skyK - now.skyK) * k;
      sun.color.copy(now.sun); sun.intensity = now.sunK;
      sky.color.copy(now.sky); sky.groundColor.copy(now.ground); sky.intensity = now.skyK;
      scene.background.copy(now.back);
      shade.opacity += ((s.gale ? 0.34 : 0.2) - shade.opacity) * k;
      rain.classList.toggle('on', s.gale && voyage.atSea());

      const dx = -Math.cos(from), dz = -Math.sin(from);                 // the way the wind blows
      for (const c of clouds) {
        c.position.x = wrapTo(c.position.x + dx * real * (1.5 + 5 * blow), focus.x);
        c.position.z = wrapTo(c.position.z + dz * real * (1.5 + 5 * blow), focus.z);
      }
      q.setFromAxisAngle(up, -Math.atan2(dz, dx));
      const show = Math.round(STREAKS * Math.min(1, Math.max(0.12, blow * 1.1 - 0.25)));
      at.forEach((a, i) => {
        a.life += real * (0.25 + 0.2 * (i % 3));
        if (a.life > 1) { a.life = 0; a.x = focus.x + (Math.random() - 0.5) * 170; a.z = focus.z + (Math.random() - 0.5) * 170; }
        a.x += dx * real * (6 + 16 * blow); a.z += dz * real * (6 + 16 * blow);
        const fade = i < show ? Math.sin(a.life * Math.PI) : 0;
        m4.compose(p.set(a.x, 0.42, a.z), q, sc.set(a.len * (0.5 + blow) * fade + 0.001, 1, 0.13 * fade + 0.001));
        streaks.setMatrixAt(i, m4);
      });
      streaks.instanceMatrix.needsUpdate = true;
    },
  };
}
