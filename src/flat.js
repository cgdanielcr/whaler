// Cutting light into steps.
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
// How big a step in the light. Coarser is more of a poster; finer starts to
// look like shading again.
const STEP = '0.30';

const CUT = `
  #include <lights_fragment_end>
  {
    // What is cut here is the light, not the colour. The light that has landed
    // already has the paint mixed into it, so dividing that back out leaves
    // how brightly lit this point is and nothing else. Cut that, and a dark
    // hull stays a dark hull instead of being dragged up to cream.
    float paint = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float landed = dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse,
                       vec3(0.2126, 0.7152, 0.0722));
    if (paint > 0.001 && landed > 0.0001) {
      float shade = landed / paint;
      // Steps of a third, and a floor under the darkest of them, because in a
      // drawing the shaded side of a thing is never black.
      float cut = max(0.58, floor(shade / ${STEP} + 0.5) * ${STEP});
      float k = cut / shade;
      reflectedLight.directDiffuse *= k;
      reflectedLight.indirectDiffuse *= k;
    }
  }
`;

// Give a material the treatment. Returns the same material, so it can be
// wrapped round a declaration.
export function cutLight(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_fragment_end>', CUT);
  };
  // Materials that compile to the same program are shared by Three.js, so a
  // material with an injection needs its own key or it may be handed a
  // program compiled without one.
  material.customProgramCacheKey = () => 'cut';
  return material;
}
