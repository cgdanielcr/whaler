// The wake: the water she tears up and leaves behind her.
//
// This is the only thing on the screen that says she is moving. The camera is
// locked to her, and the sea is a Gerstner field whose waves run at ten metres
// a second whether she moves or not -- so the swell is no cue at all. What
// reads is white water at her stem and a track streaming away astern.
//
// It is cut in with a hard edge, like the sea's own foam, and not faded in:
// a soft glow on this sea looks like weather, not water. The bands travel
// aft at the speed she is making, so they stand still on the water while she
// runs out from under them. That is the whole trick, and it is why the wake
// moves only when she does.
import * as THREE from 'three';
import { waveHeight } from './sea.js';
import { HUE } from './palette.js';

const KNOT = 0.5144;
const BOW = 16;         // her stem
const STERN = -17;      // her counter
const ASTERN = 165;     // metres of track behind that
const RUN = BOW - STERN + ASTERN;
const AT_STERN = (BOW - STERN) / RUN;

const ROWS = 72;
const ACROSS = [-1, -0.72, -0.34, 0, 0.34, 0.72, 1];
// Across the wake: nothing at the rim, most of it down the middle.
const SIDEWAYS = [0, 0.55, 0.95, 1, 0.95, 0.55, 0];

// How wide the torn water is from her stem to the end of her track.
function halfWidth(u) {
  // Wider than her own beam from the first, or the bow wave is drawn under
  // the hull and cannot be seen -- which is what was wrong with it.
  if (u < AT_STERN) return 2.6 + 5.4 * Math.pow(u / AT_STERN, 0.6);
  const v = (u - AT_STERN) / (1 - AT_STERN);
  return 8.0 + 13 * Math.pow(v, 0.6);
}

// How white it is: a hard wedge at the stem, a quieter run along her side,
// and a long track astern.
function brightness(u) {
  const bow = Math.exp(-Math.pow((u - 0.055) / 0.09, 2)) * 1.25;
  const along = u < AT_STERN ? 0.42 : 0;
  let track = 0;
  if (u >= AT_STERN) {
    const v = (u - AT_STERN) / (1 - AT_STERN);
    track = Math.pow(1 - v, 0.85) * Math.min(1, v * 26);
  }
  return Math.max(bow, Math.max(along, track));
}

const VERTEX = `
attribute float aBase;
varying float vBase;
varying float vZ;
void main() {
  vBase = aBase;
  vZ = position.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = `
uniform float uRun;
uniform float uStrength;
uniform vec3  uFoam;
varying float vBase;
varying float vZ;
void main() {
  // Bands lying across the track, anchored to the water she has left.
  float band = 0.54 + 0.46 * sin(vZ * 0.26 + uRun * 0.26);
  float a = vBase * uStrength * band;
  if (a < 0.28) discard;               // cut, not faded
  // Whiter than the sea's own wind-foam, or her track is lost among it.
  vec3 torn = mix(uFoam, vec3(1.0), 0.40);
  gl_FragColor = vec4(torn, a > 0.55 ? 1.0 : 0.7);
}`;

export function makeWake() {
  const positions = [], bases = [], indices = [];

  for (let r = 0; r <= ROWS; r++) {
    const u = r / ROWS;
    const z = BOW - u * RUN;
    const half = halfWidth(u);
    const lit = brightness(u);
    for (let c = 0; c < ACROSS.length; c++) {
      positions.push(ACROSS[c] * half, 0, z);
      bases.push(lit * SIDEWAYS[c]);
    }
  }

  const wide = ACROSS.length;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < wide - 1; c++) {
      const a = r * wide + c, b = a + wide;
      indices.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aBase', new THREE.Float32BufferAttribute(bases, 1));
  geometry.setIndex(indices);

  const uniforms = {
    uRun: { value: 0 },
    uStrength: { value: 0 },
    // The live colour, not a copy of it, so her wake greys with the weather
    // exactly as the sea's own foam does.
    uFoam: { value: HUE.foam }
  };

  // The sea's surface is displaced sideways as well as up -- it is a Gerstner
  // field -- so the height worked out here is not quite the height the shader
  // draws. Without the lift and the polygon offset the wake is drawn a hand's
  // breadth under the water and cannot be seen at all, which is exactly what
  // was wrong with it.
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8
  }));
  mesh.renderOrder = 1;

  const position = geometry.attributes.position;
  let run = 0;          // metres of water gone under her
  let last = 0;

  mesh.userData.update = (t, ox, oz, courseRad, knots) => {
    const dt = Math.max(0, Math.min(0.5, t - last));
    last = t;
    run += knots * KNOT * dt;

    mesh.rotation.y = courseRad;
    uniforms.uRun.value = run;

    // Below half a knot there is nothing to see, and there should not be.
    const strength = Math.min(1, Math.max(0, (knots - 0.4) / 2.8));
    uniforms.uStrength.value = strength;
    mesh.visible = strength > 0.001;
    if (!mesh.visible) return;

    const sin = Math.sin(courseRad), cos = Math.cos(courseRad);
    for (let i = 0; i < position.count; i++) {
      const lx = position.getX(i), lz = position.getZ(i);
      const wx = lx * cos + lz * sin + ox;      // where this scrap lies on the sea
      const wz = -lx * sin + lz * cos + oz;
      position.setY(i, waveHeight(wx, wz, t) + 0.55);
    }
    position.needsUpdate = true;
  };

  return mesh;
}
