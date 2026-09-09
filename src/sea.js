// The sea.
//
// Not a sheet of blue with ripples on it. What makes a painted sea read as
// water is three things, and none of them is texture:
//
//   1. The shape. Real waves are not sine curves. They have sharp crests and
//      long flat troughs, because the water at the top of a wave is moving
//      forward as well as up. That is a Gerstner wave, and it is the whole
//      difference between a corrugated roof and a sea.
//   2. The light through them. A wave with the sun behind it glows green at
//      the crest, where the water is thin, while the trough beside it stays
//      almost black. That one effect is most of Aivazovsky.
//   3. The range. From near-black in the hollow to near-white on the crest.
//
// The wave field is displaced on the graphics card, so the processor only has
// to work out the height at the four points where she floats.
import * as THREE from 'three';

const EXTENT = 1400;      // metres across, wider than the fog can see
const SEGMENTS = 280;     // squeezed toward the middle, so she sails in detail
const CROWD = 0.35;       // how tight the grid is under her, against the horizon

// Each wave: length in metres, height, the way it runs, and how sharp its
// crest is. Long swell first, chop last. The set is tuned by eye against the
// paintings rather than measured from anything.
const WAVES = [
  { len: 78.0, amp: 1.45, dir: [1.00,  0.22], sharp: 0.92 },
  { len: 47.0, amp: 0.85, dir: [0.62, -0.78], sharp: 0.85 },
  { len: 29.0, amp: 0.46, dir: [0.18,  0.98], sharp: 0.75 },
  { len: 14.0, amp: 0.22, dir: [-0.72, 0.69], sharp: 0.60 },
  { len:  7.5, amp: 0.10, dir: [0.88,  0.47], sharp: 0.45 }
];

const G = 9.81;
const norm = (d) => { const l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
const PACKED = WAVES.map((w) => {
  const k = (2 * Math.PI) / w.len;
  const d = norm(w.dir);
  return { k, w: Math.sqrt(G * k), dx: d[0], dz: d[1], amp: w.amp, sharp: w.sharp };
});

// How high the sea runs at each force. The sea takes hours to get up and
// hours to go down, so this is a target that the swell creeps toward.
export const swellFor = (force) => 0.30 + Math.max(0, force) * 0.33;

// The one piece the rest of the ship needs: how high the water is under a
// given point. Only the height, and only at the undisplaced coordinate, which
// is near enough for a hull thirty-three metres long.
let swell = swellFor(3.3);

export function waveHeight(x, z, t) {
  let y = 0;
  for (const w of PACKED) {
    y += w.amp * swell * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t);
  }
  return y;
}

// --- the shader ---------------------------------------------------------------

const WAVE_GLSL = PACKED.map((w, i) =>
  `  f = ${w.k.toFixed(6)} * dot(vec2(${w.dx.toFixed(4)}, ${w.dz.toFixed(4)}), X) - ${w.w.toFixed(6)} * uTime;\n` +
  `  a = ${w.amp.toFixed(4)} * uSwell;\n` +
  `  s = sin(f); c = cos(f);\n` +
  `  d.y += a * s;\n` +
  `  d.x += ${(w.sharp * w.dx).toFixed(5)} * a * c;\n` +
  `  d.z += ${(w.sharp * w.dz).toFixed(5)} * a * c;`
).join('\n');

const COMMON = `
uniform float uTime;
uniform float uSwell;
uniform vec2  uOffset;
uniform vec3  uSun;
uniform vec3  uDeep;
uniform vec3  uMid;
uniform vec3  uLit;
uniform vec3  uGlow;
uniform vec3  uSky;
varying vec3  vWorld;
varying float vLift;
varying float vSteep;
varying float vFoam;
varying vec3  vWorldN;
`;

// One evaluation of the whole wave field: where a point on the flat plane
// actually ends up.
const GERSTNER = `
vec3 seaAt(vec2 X) {
  vec3 d = vec3(0.0);
  float f, a, s, c;
${WAVE_GLSL}
  return d;
}
`;

const VERTEX = `
  vec2 X = position.xz + uOffset;
  vec3 p0 = seaAt(X);
  // The normal is taken over a third of a metre, far finer than the mesh, so
  // the light plays over water the geometry is too coarse to carve.
  const float E = 0.34;
  vec3 pX = seaAt(X + vec2(E, 0.0));
  vec3 pZ = seaAt(X + vec2(0.0, E));
  vec3 tX = vec3(E + pX.x - p0.x, pX.y - p0.y, pX.z - p0.z);
  vec3 tZ = vec3(pZ.x - p0.x, pZ.y - p0.y, E + pZ.z - p0.z);
  vec3 objectNormal = normalize(cross(tZ, tX));

  float amp = max(0.001, ${PACKED.reduce((n, w) => n + w.amp, 0).toFixed(3)} * uSwell);
  vLift = clamp(p0.y / amp, -1.0, 1.0);
  vSteep = clamp(1.0 - objectNormal.y, 0.0, 1.0);
  // Foam gathers where the water is both high and steep: on the crest and
  // down the face just under it, which is where a wave breaks.
  vFoam = smoothstep(0.045, 0.28, vSteep) * smoothstep(-0.10, 0.60, vLift);
  vWorldN = objectNormal;
`;

const NOISE = `
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
float fbm(vec2 p) {
  return 0.54 * vnoise(p) + 0.28 * vnoise(p * 2.13) + 0.18 * vnoise(p * 4.41);
}
`;

export function makeSea() {
  const geometry = new THREE.PlaneGeometry(EXTENT, EXTENT, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  // Bunch the grid toward the middle: fine water where she is, coarse water
  // out where the fog takes it anyway.
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
    uSun:    { value: new THREE.Vector3(-0.76, -0.55, -0.28).normalize() },
    uDeep:   { value: new THREE.Color('#0a2430') },
    uMid:    { value: new THREE.Color('#1d5468') },
    uLit:    { value: new THREE.Color('#3fb59d') },
    uGlow:   { value: new THREE.Color('#4fdca0') },
    uSky:    { value: new THREE.Color('#9fb3b6') }
  };

  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff', roughness: 0.56, metalness: 0.02
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${COMMON}\n${GERSTNER}`)
      .replace('#include <beginnormal_vertex>', VERTEX)
      .replace('#include <begin_vertex>',
        `vec3 transformed = vec3(position.x + p0.x, p0.y, position.z + p0.z);
         vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${COMMON}\n${NOISE}`)
      .replace('#include <map_fragment>', `
        vec3 V = normalize(cameraPosition - vWorld);

        // Deep in the hollow, and green where the water thins toward the crest.
        vec3 water = mix(uDeep, uMid, smoothstep(-0.85, 0.25, vLift));
        float thin = smoothstep(0.04, 0.45, vSteep) * smoothstep(-0.1, 0.75, vLift);
        water = mix(water, uLit, thin * 0.85);

        // Water seen edge-on is a mirror. This is why the far sea is pale and
        // the near sea is dark, and why a wave turning away from you lights up
        // along its back before it does anything else.
        float fres = pow(1.0 - clamp(dot(normalize(vWorldN), V), 0.0, 1.0), 4.0);
        water = mix(water, uSky, fres * 0.62);

        // The foam is torn up by noise so it reads as froth, not as paint,
        // and it drifts a little slower than the water it sits on.
        vec2 fp = vWorld.xz * 0.34 + vec2(uTime * 0.06, uTime * -0.04);
        float lace = fbm(fp) * 0.62 + fbm(fp * 3.9 + 11.0) * 0.38;
        float foam = smoothstep(0.30, 0.80, vFoam * (0.50 + 1.20 * lace));
        // A thinner wash of it lying in the flat water astern of the crests.
        foam = max(foam, smoothstep(0.55, 0.95, vFoam) * smoothstep(0.34, 0.72, lace));
        water = mix(water, vec3(0.88, 0.93, 0.92), foam);

        diffuseColor.rgb *= water;
        vFoamOut = foam;
      `)
      .replace('#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.92, vFoamOut);`)
      .replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        // The light coming through the back of the wave. This is the whole
        // trick: it only shows where you are looking toward the sun, and only
        // where the water is thin.
        float behind = max(0.0, dot(uSun, V));
        float through = smoothstep(0.10, 0.85, vLift) * smoothstep(0.06, 0.5, vSteep);
        totalEmissiveRadiance += uGlow * pow(behind, 3.6) * through * 2.2;
        totalEmissiveRadiance += uGlow * 0.10 * through * vFoamOut;
      `);

    // A scratch varying for the foam, so the roughness and the glow can both
    // see what the colour worked out.
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'float vFoamOut = 0.0;\nvoid main() {');
  };

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;

  let last = 0, started = false;
  mesh.userData.update = (t, ox, oz, force = 3.3) => {
    const dt = Math.max(0, Math.min(1, t - last));
    last = t;
    const want = swellFor(force);
    // She takes her time. A wind that gets up in ten minutes leaves a sea
    // that is still making an hour later, and still running long after. But
    // the sea she starts the day with is already the sea that wind has made.
    if (!started) { started = true; swell = want; }
    else swell += (want - swell) * Math.min(1, dt * (want > swell ? 0.06 : 0.03));

    uniforms.uTime.value = t;
    uniforms.uSwell.value = swell;
    uniforms.uOffset.value.set(ox, oz);
  };

  mesh.userData.sun = (v) => uniforms.uSun.value.copy(v).normalize();
  return mesh;
}
