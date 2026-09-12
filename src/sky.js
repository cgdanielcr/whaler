// The sky, drawn rather than rendered.
//
// Three flat bands of blue with hard steps between them, a flat sun, and
// cloud cut out of a noise sheet with a hard edge so it reads as paper rather
// than as vapour. Two tones to the cloud: the lit body and the heavier core
// under it.
//
// The cloud lies on a ceiling far overhead, so it piles up and closes toward
// the horizon the way real cloud does. How far that projection may stretch is
// clamped, which is what stops it tearing into stripes at the sea line.
//
// It costs two texture lookups a pixel. The noise that made the cloud was
// worked out once, at load, on the processor.
import * as THREE from 'three';
import { cloudSheet, drawnCloud } from './clouds.js';
import { HUE } from './palette.js';
import { INK, PLATE } from './hatch.js';

export const HORIZON_COLOUR = new THREE.Color('#a8c4d4');

export function makeSky() {
  const uniforms = {
    ...INK,
    high:  { value: HUE.skyHigh },
    low:   { value: HUE.skyLow },
    lit:   { value: HUE.cloudLit },
    dim:   { value: HUE.cloudDim },
    sheet: { value: cloudSheet({ seed: 3, cover: 0.46, edge: 0.04, billow: true }) },
    veil:  { value: cloudSheet({ seed: 11, cover: 0.34, edge: 0.05, billow: false, octaves: 3 }) },
    drift: { value: new THREE.Vector2() },
    sun:   { value: new THREE.Vector3(0.76, 0.55, 0.28).normalize() },
    gloom: { value: 0 },
    drawn: { value: 0 }          // 0 until the engraved cloud has been cut up
  };

  // The drawn cloud, fetched while she is already sailing. If it never comes
  // she keeps the noise, which is what she had.
  drawnCloud().then((tex) => {
    if (!tex) return;
    uniforms.sheet.value = tex;
    uniforms.drawn.value = 1;
  });

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: PLATE + `
      out vec4 fragOut;

      uniform vec3 high;
      uniform vec3 low;
      uniform vec3 lit;
      uniform vec3 dim;
      uniform sampler2D sheet;
      uniform sampler2D veil;
      uniform vec2 drift;
      uniform vec3 sun;
      uniform float gloom;
      uniform float drawn;
      varying vec3 vPos;

      void main() {
        vec3 d = normalize(vPos);
        float h = clamp(d.y, -1.0, 1.0);

        // Three flat bands, with a step between them rather than a fade.
        vec3 col = low;
        col = mix(col, mix(low, high, 0.5), step(0.14, h));
        col = mix(col, high, step(0.42, h));

        // A flat sun, sitting where the light actually comes from. It goes
        // behind the cloud, as it should.
        col = mix(col, lit, step(0.9975, dot(d, sun)) * (1.0 - gloom * 0.6));

        // The cloud, on its ceiling. Where the projection begins to stretch it
        // is faded out rather than clamped: clamping smears one patch of it
        // round the whole horizon and hangs it there in curtains.
        // A drawn cloud will not take the stretch a noise field will. Where the
        // ceiling is allowed to run out to the horizon it pulls a mass of it
        // into a streak a mile long, and five drawn masses streaked like that
        // are five smears. The floor under the divisor holds them to a shape.
        float up = max(h, drawn > 0.5 ? 0.16 : 0.05);
        vec2 ceiling = d.xz / up;
        float near = smoothstep(0.05, 0.24, h);
        float b = texture2D(veil, ceiling * 0.038 + drift * 0.55 + 0.37).a;

        if (drawn > 0.5) {
          // Engraved cloud. It carries its own light and shade, so nothing is
          // cut here: the drawing's greys go straight into the colour, and the
          // hatching below picks its sheets off them exactly as it does off a
          // sail. A faint bank of the old noise is left underneath for the
          // thin high stuff the drawings do not have.
          vec4 c = texture2D(sheet, ceiling * 0.075 + drift);
          col = mix(col, mix(lit, dim, 0.55), step(0.5, b) * step(0.35, near) * 0.35);
          // Firmed up. A drawn cloud is cut out against a long soft fringe, and
          // taken at face value that fringe lays a wash of half-cloud over half
          // the sky. Pulled in, the banks get bodies and the paper between them
          // stays paper.
          float cover = smoothstep(0.16, 0.52, c.a) * smoothstep(0.18, 0.78, near);
          // Opened right out. The drawing's greys all sit close together, and
          // laid straight down between the two cloud colours they came out as
          // one flat tone: cloud-shaped, but with no cloud in it. Stretched
          // across the range, and with the underside allowed to go greyer than
          // the cloud colour proper, the billows come back.
          vec3 deep = mix(dim, low, 0.45);
          col = mix(col, mix(deep, lit, smoothstep(0.16, 0.80, c.r)), cover);
        } else {
          // Cut, not faded. Two thresholds on the one sheet give the lit body
          // and the heavier core under it.
          float a = texture2D(sheet, ceiling * 0.090 + drift).a;
          col = mix(col, mix(lit, dim, 0.45), step(0.5, b) * step(0.35, near) * 0.8);
          col = mix(col, lit, step(0.5, a) * step(0.35, near));
          col = mix(col, dim, step(0.78, a) * step(0.35, near));
        }

        if (uInked > 0.5) {
          // An engraved sky is mostly bare paper: a few lines in the blue, a
          // few more in the underside of the cloud, and nothing at all in the
          // lit heads of it. And its ruling is turned across the water's, so
          // the two do not run together at the horizon.
          float value = 0.46 + dot(col, GREY) * 0.60;
          col = mix(col, engraveTurn(col, value, 1.5708), uBite);
        }

        fragOut = linearToOutputTexel(vec4(col, 1.0));
      }
    `
  });

  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 40, 24), material);
  sky.frustumCulled = false;

  // The cloud goes with the wind, and faster than she does.
  sky.userData.update = (t, windFrom, gloom) => {
    const a = (windFrom + 180) * Math.PI / 180;
    uniforms.drift.value.set(Math.sin(a) * t * 0.0016, Math.cos(a) * t * 0.0016);
    uniforms.gloom.value = gloom;
  };
  sky.userData.sun = (v) => uniforms.sun.value.copy(v).normalize();
  return sky;
}
