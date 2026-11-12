// The look of the weather: the light as the season turns and as it comes on
// to blow, the shadows of clouds drifting down the wind across the sea, the
// white streaks the wind tears off the wave tops, and rain in a gale.
import * as THREE from 'three';
import { dayOfYear } from './season.js';
import { makeGlints } from './glints.js';

// Each sky: the sun's colour, strength and place, the light of the sky, the colour behind the sea,
// how the sun shines on the water, how thick the air is, and how heavy the cloud shadow.
const MOODS = {
  fair: { sun: 0xfff0d8, sunK: 2.7, at: [-25, 110, -60], sky: 0xdcefff, ground: 0x1a4a5c, skyK: 1.3, back: 0x0f4a63, shine: 0.8, mist: 0, shade: 0.2 },
  golden: { sun: 0xffc98a, sunK: 2.9, at: [-95, 52, -40], sky: 0xf2d9c4, ground: 0x24465a, skyK: 1.0, back: 0x154a5e, shine: 1, mist: 0, shade: 0.14 },
  overcast: { sun: 0xdfe6ea, sunK: 1.5, at: [-25, 120, -50], sky: 0xc3cfd8, ground: 0x18394a, skyK: 1.45, back: 0x103c50, shine: 0.1, mist: 0.15, shade: 0.3 },
  mist: { sun: 0xf0ece0, sunK: 1.3, at: [-40, 100, -60], sky: 0xdfe6e8, ground: 0x2a4c5a, skyK: 1.6, back: 0x2a5566, shine: 0.05, mist: 1, shade: 0.08 },
  late: { sun: 0xffdcae, sunK: 2.3, at: [-70, 70, -55], sky: 0xd9e2ec, ground: 0x1c4152, skyK: 1.15, back: 0x12435a, shine: 0.7, mist: 0.1, shade: 0.2 },
  fresh: { sun: 0xf2ead8, sunK: 2.1, at: [-25, 110, -60], sky: 0xc9d8e4, ground: 0x173d4e, skyK: 1.2, back: 0x0f4057, shine: 0.4, mist: 0, shade: 0.3 },
  gale: { sun: 0xb8c6d0, sunK: 1.3, at: [-25, 110, -60], sky: 0x9db0be, ground: 0x14303f, skyK: 1.25, back: 0x0b2a3a, shine: 0, mist: 0.35, shade: 0.34 },
};
// What the sky may be on a quiet day, early in the season and late.
const EARLY = ['fair', 'fair', 'fair', 'golden', 'golden', 'overcast', 'mist'], LATE = ['late', 'late', 'golden', 'overcast', 'overcast', 'mist', 'mist'];
const CLOUDS = 9, STREAKS = 70, SPAN = 150;

function softDisc() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.6, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function makeWeather(view, voyage) {
  const { scene, sun, sky, sunFrom } = view, rain = document.getElementById('rain'), snow = document.getElementById('snow'), haze = document.getElementById('haze');
  const glints = makeGlints(scene), sunTo = new THREE.Vector3();
  let today = -1, skyNow = 'fair', shine = 0.8, mist = 0;
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
    get dim() { return Math.min(1, mist + (voyage.season.gale ? 0.8 : 0) + (1 - shine) * 0.3); },   // how thick or dark it is
    update(real, t, from, blow, focus) {
      const s = voyage.season, v = voyage.v, late = dayOfYear(v.date) > 235;
      if (v.days !== today && (today = v.days) % 3 === 0) { const list = late ? LATE : EARLY; skyNow = list[Math.floor(Math.random() * list.length)]; }   // the sky changes every few days
      if (!voyage.atSea()) skyNow = 'fair';
      const mood = MOODS[s.gale ? 'gale' : s.wind === 'strong breeze' ? 'fresh' : skyNow], k = Math.min(1, real * 0.35);
      sunFrom.lerp(sunTo.set(...mood.at), k);
      shine += (mood.shine - shine) * k; mist += (mood.mist - mist) * k;
      const cold = voyage.atSea() && (s.edge - v.pos.z > -110 || dayOfYear(v.date) > 262);
      snow.classList.toggle('on', cold && !s.gale && skyNow !== 'fair' && skyNow !== 'golden');
      haze.style.opacity = (mist * 0.8).toFixed(2);
      glints.update(real, focus, from, shine, mist);
      now.sun.lerp(to.set(mood.sun), k); now.sky.lerp(to.set(mood.sky), k); now.ground.lerp(to.set(mood.ground), k); now.back.lerp(to.set(mood.back), k);
      now.sunK += (mood.sunK - now.sunK) * k; now.skyK += (mood.skyK - now.skyK) * k;
      sun.color.copy(now.sun); sun.intensity = now.sunK;
      sky.color.copy(now.sky); sky.groundColor.copy(now.ground); sky.intensity = now.skyK;
      scene.background.copy(now.back);
      shade.opacity += (mood.shade - shade.opacity) * k;
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
