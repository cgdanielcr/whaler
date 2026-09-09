// The sea, drawn rather than rendered.
//
// The shape is unchanged and it is the good part: five Gerstner waves running
// across each other, sharp at the crest and long in the hollow, because the
// water at the top of a wave moves forward as well as up.
//
// What has gone is the lighting. There is no physically based shading here, no
// shine, no soft gradient anywhere. Each triangle of the sea works out how it
// stands to the sun, that one number is cut into four steps, and each step is
// painted a flat colour. The foam is cut in with a hard edge, not faded in.
// Four blues and a cream, and every boundary between them is a line.
//
// It is also markedly cheaper than what it replaces.
import * as THREE from 'three';
import { HUE } from './palette.js';

const EXTENT = 1400;      // metres across, wider than the eye can see
const CROWD = 0.35;       // how tight the grid is under her, against the horizon

// Each wave: length in metres, height, the way it runs, and how sharp its
// crest is. Long swell first, chop last. Tuned by eye, not measured.
const WAVES = [
  { len: 78.0, amp: 1.45, dir: [1.00,  0.22], sharp: 0.92 },
  { len: 47.0, amp: 0.85, dir: [0.62, -0.78], sharp: 0.85 },
  { len: 29.0, amp: 0.46, dir: [0.18,  0.98], sharp: 0.75 },
  { len: 14.0, amp: 0.13, dir: [-0.72, 0.69], sharp: 0.60 },
  { len:  7.5, amp: 0.05, dir: [0.88,  0.47], sharp: 0.45 }
];

const G = 9.81;
const unit = (d) => { const l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
const PACKED = WAVES.map((w) => {
  const k = (2 * Math.PI) / w.len;
  const d = unit(w.dir);
  return { k, w: Math.sqrt(G * k), dx: d[0], dz: d[1], amp: w.amp, sharp: w.sharp };
});
const TOTAL = PACKED.reduce((n, w) => n + w.amp, 0);

// How high the sea runs at each force. The sea takes hours to get up and
// hours to go down, so this is a target the swell creeps toward.
export const swellFor = (force) => 0.30 + Math.max(0, force) * 0.33;

// The one piece the rest of the ship needs: how high the water is under a
// given point, near enough for a hull thirty-three metres long.
let swell = swellFor(3.3);

export function waveHeight(x, z, t) {
  let y = 0;
  for (const w of PACKED) {
    y += w.amp * swell * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t);
  }
  return y;
}

const WAVE_GLSL = PACKED.map((w) =>
  `  f = ${w.k.toFixed(6)} * dot(vec2(${w.dx.toFixed(4)}, ${w.dz.toFixed(4)}), X) - ${w.w.toFixed(6)} * uTime;\n` +
  `  a = ${w.amp.toFixed(4)} * uSwell;\n` +
  `  s = sin(f); c = cos(f);\n` +
  `  d.y += a * s;\n` +
  `  d.x += ${(w.sharp * w.dx).toFixed(5)} * a * c;\n` +
  `  d.z += ${(w.sharp * w.dz).toFixed(5)} * a * c;`
).join('\n');

const VERTEX = `
uniform float uTime;
uniform float uSwell;
uniform vec2  uOffset;
varying vec3  vWorld;
varying float vLift;

vec3 seaAt(vec2 X) {
  vec3 d = vec3(0.0);
  float f, a, s, c;
${WAVE_GLSL}
  return d;
}

void main() {
  vec2 X = position.xz + uOffset;
  vec3 p = seaAt(X);
  vLift = clamp(p.y / max(0.001, ${TOTAL.toFixed(3)} * uSwell), -1.0, 1.0);
  vec3 moved = vec3(position.x + p.x, p.y, position.z + p.z);
  vWorld = (modelMatrix * vec4(moved, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(moved, 1.0);
}
`;

const FRAGMENT = `
uniform vec3  uSun;
uniform vec3  uSea0;
uniform vec3  uSea1;
uniform vec3  uSea2;
uniform vec3  uSea3;
uniform vec3  uFoam;
uniform vec3  uHaze;
uniform float uTime;
varying vec3  vWorld;
varying float vLift;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  // The true face of this triangle, whatever its corners were told to be.
  // This is what makes the sea read as flat pieces instead of a smooth sheet.
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (N.y < 0.0) N = -N;

  // One number for how this face stands: mostly which way it is turned, and
  // a little of how high it has been lifted.
  float tone = clamp(dot(N, uSun) * 0.72 + (vLift * 0.5 + 0.5) * 0.42, 0.0, 1.0);

  // Cut into four. No blending: the step between two blues is a hard line.
  vec3 col = uSea0;
  col = mix(col, uSea1, step(0.34, tone));
  col = mix(col, uSea2, step(0.52, tone));
  col = mix(col, uSea3, step(0.68, tone));

  // Foam only where the water is both high and steep, which is the crest and
  // the shoulder just under it. The noise does not decide whether there is
  // foam -- it only tears the edge of it, so what is drawn is a shape with a
  // ragged border and not a fog of speckles.
  float steep = clamp(1.0 - N.y, 0.0, 1.0);
  float ready = clamp((steep - 0.06) * 3.4, 0.0, 1.0) * clamp((vLift - 0.42) * 2.6, 0.0, 1.0);
  vec2 drift = vec2(uTime * 0.05, uTime * -0.035);
  float torn = vnoise(vWorld.xz * 0.34 + drift);
  col = mix(col, uFoam, step(0.60, ready * (0.62 + 0.75 * torn)));

  // A few long streaks lying along the swell, well up the face and nowhere
  // else, stretched so they run with the wave rather than dotting it.
  float streak = vnoise(vec2(vWorld.x * 0.05, vWorld.z * 0.44) + drift * 0.4);
  col = mix(col, uFoam, step(0.72, clamp((vLift - 0.30) * 1.7, 0.0, 1.0) * streak * 1.5));

  // Distance takes the colour toward the sky, in two steps rather than a fade.
  float far = length(vWorld.xz) / 620.0;
  col = mix(col, uHaze, step(0.55, far) * 0.30 + step(0.82, far) * 0.45);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function makeSea(segments = 120) {
  const geometry = new THREE.PlaneGeometry(EXTENT, EXTENT, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  // Bunch the grid toward the middle: fine water where she is, coarse water
  // out where nothing can be read anyway.
  const pos = geometry.attributes.position;
  const half = EXTENT / 2;
  for (let i = 0; i < pos.count; i++) {
    for (const axis of ['X', 'Z']) {
      const u = pos[`get${axis}`](i) / half;
      pos[`set${axis}`](i, u * (CROWD + (1 - CROWD) * u * u) * half);
    }
  }
  pos.needsUpdate = true;

  const uniforms = {
    uTime:   { value: 0 },
    uSwell:  { value: swell },
    uOffset: { value: new THREE.Vector2() },
    uSun:    { value: new THREE.Vector3(0.76, 0.55, 0.28).normalize() },
    uSea0:   { value: HUE.sea0 },
    uSea1:   { value: HUE.sea1 },
    uSea2:   { value: HUE.sea2 },
    uSea3:   { value: HUE.sea3 },
    uFoam:   { value: HUE.foam },
    uHaze:   { value: HUE.skyLow }
  };

  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT
  }));

  let last = 0, started = false;
  mesh.userData.update = (t, ox, oz, force = 3.3) => {
    const dt = Math.max(0, Math.min(1, t - last));
    last = t;
    const want = swellFor(force);
    // She takes her time. A wind that gets up in ten minutes leaves a sea
    // still making an hour later. But the sea she starts the day with is
    // already the sea that wind has made.
    if (!started) { started = true; swell = want; }
    else swell += (want - swell) * Math.min(1, dt * (want > swell ? 0.06 : 0.03));

    uniforms.uTime.value = t;
    uniforms.uSwell.value = swell;
    uniforms.uOffset.value.set(ox, oz);
  };

  // The direction from the water toward the sun.
  mesh.userData.sun = (v) => uniforms.uSun.value.copy(v).normalize();
  return mesh;
}
