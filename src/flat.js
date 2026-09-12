// Cutting light into steps, and then into lines.
//
// The flatness in a drawing like the one we are after does not come from the
// surface being faceted. It comes from the light on it being cut into a few
// steps instead of running smoothly from lit to shaded. A curved sail painted
// that way reads as two or three flat shapes whose edges follow the curve of
// the cloth; a sail that is faceted instead shows every triangle it is made
// of, which is a picture of the mesh and not of a sail.
//
// So: leave the surface smooth, and cut the light.
//
// Once the plates have loaded that stepping becomes engraving, and the rule
// changes completely. An engraver has no dark paint. His plate is white paper
// and every tone on it is cut: a black hull is not painted black, it is ruled
// so close that the paper hardly shows. So what picks the sheet of hatching is
// not the light alone but how dark the thing is meant to come out -- its own
// colour multiplied by the light that has landed on it. A tarred hull in
// sunshine and a cream sail in shadow then get the treatment each deserves,
// and both of them are drawn on the same sheet of paper. See hatch.js.
import { INK, PLATE } from './hatch.js';

// How big a step in the light, before the plates arrive. Coarser is more of a
// poster; finer starts to look like shading again.
const STEP = '0.30';

const CUT = `
  #include <lights_fragment_end>
  {
    // What is cut here is the light, not the colour. The light that has landed
    // already has the paint mixed into it, so dividing that back out leaves
    // how brightly lit this point is and nothing else. Cut that, and a dark
    // hull stays a dark hull instead of being dragged up to cream.
    float paint = dot(diffuseColor.rgb, GREY);
    vec3 landed = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;

    if (paint > 0.001 && dot(landed, GREY) > 0.0001) {
      float shade = dot(landed, GREY) / paint;

      if (uInked > 0.5) {
        // How dark this spot wants to come out, all told.
        float value = clamp(paint * min(shade, 1.4), 0.0, 1.0);
        reflectedLight.directDiffuse = vec3(0.0);
        reflectedLight.indirectDiffuse =
          mix(landed, engrave(diffuseColor.rgb, value), uBite);
      } else {
        // Steps of a third, and a floor under the darkest of them, because in
        // a drawing the shaded side of a thing is never black.
        float want = max(0.58, floor(shade / ${STEP} + 0.5) * ${STEP});
        float k = want / shade;
        reflectedLight.directDiffuse *= k;
        reflectedLight.indirectDiffuse *= k;
      }
    }
  }
`;

// Give a material the treatment. Returns the same material, so it can be
// wrapped round a declaration.
export function cutLight(material) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, INK);
    shader.fragmentShader = PLATE + shader.fragmentShader
      .replace('#include <lights_fragment_end>', CUT);
  };
  // Materials that compile to the same program are shared by Three.js, so a
  // material with an injection needs its own key or it may be handed a
  // program compiled without one.
  material.customProgramCacheKey = () => 'cut';
  return material;
}
