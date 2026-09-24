// The plates.
//
// An engraver has no greys. He has a burin and a copper plate, and every tone
// he wants he must cut: a few widely spaced lines for a bright surface, the
// same lines with more between them for a duller one, and for a shadow the
// lines crossed and crossed again until the paper hardly shows.
//
// So we carry seven sheets of hatching, from nearly bare to nearly solid, and
// the shader picks whichever one matches how much light has landed on a spot.
// That is the whole trick, and it has a name: a tonal art map.
//
// The one thing that makes it work rather than flicker is that each sheet
// contains every line of the sheet before it and then adds more. When the
// light shifts and a surface moves from sheet three to sheet four, the lines
// already there stay put and new ones appear between them, exactly as a second
// pass of the burin would. Sheets drawn independently would crawl.
import * as THREE from 'three';

const SHEETS = 7;
const SIZE = 512;          // cut down from the drawn 1024: we never see a tile
                           // bigger than a few hundred pixels across

// One texture holding all seven, so the shader can choose a sheet per pixel.
// Seven separate samplers could not be indexed by anything that varies across
// the picture, which is the whole point.
const ink = new Uint8Array(SIZE * SIZE * SHEETS).fill(255);
const plates = new THREE.DataArrayTexture(ink, SIZE, SIZE, SHEETS);
plates.format = THREE.RedFormat;
plates.type = THREE.UnsignedByteType;
plates.wrapS = THREE.RepeatWrapping;
plates.wrapT = THREE.RepeatWrapping;
plates.minFilter = THREE.LinearMipmapLinearFilter;
plates.magFilter = THREE.LinearFilter;
plates.generateMipmaps = true;
// The lines lie on the deck and the sea, which are mostly seen edge-on; without
// this they smear into grey long before they are far away.
plates.anisotropy = 8;
plates.needsUpdate = true;

// Shared by every material in the picture, so one assignment when the sheets
// arrive lights up the whole scene at once.
export const INK = {
  uPlates: { value: plates },
  uInked:  { value: 0 },      // 0 until the sheets have loaded, then 1
  uTile:   { value: 24.0 },   // metres across one tile of hatching, near her.
                              // Set each frame from how far off the eye is, so
                              // her lines keep one spacing on the screen.
  uBite:   { value: 1.0 },    // how hard the ink bites: 0 is the old flat colour
  uWash:   { value: 0.42 },   // how much of a thing's own colour survives on
                              // the paper: 0 is a plate in a book of voyages,
                              // 1 is the picture we had before, in lines
  uFloor:  { value: 0.06 },   // how black the blackest shadow may go
  uCeil:   { value: 1.0 },    // 1 leaves the brightest lights as bare paper
  uPaper:  { value: new THREE.Color('#f0e7d1') }
};

// Reachable from the console, so the plate can be tuned with the ship in front
// of you instead of by editing and reloading.
window.INK = INK;

// The engraving itself, as a piece of shader source, because two quite
// different materials want it: everything built out of Three's own lighting
// (the ship, her canvas, the men) and the sea, which has always had a shader
// of its own. Whatever uses this needs the uniforms above and GLSL 3.
//
// Give engraveUV() or engraveTri() a colour and how bright that spot should finally come out,
// and it hands back the same thing drawn in lines on paper.
export const PLATE = `
  uniform sampler2DArray uPlates;
  uniform vec3 uPaper;
  uniform float uInked, uTile, uBite, uWash, uFloor, uCeil;

  const vec3 GREY = vec3(0.2126, 0.7152, 0.0722);

  // How dark each sheet actually comes out, measured off the drawings. They
  // are nothing like evenly spaced -- the first three are all but bare paper
  // and the last three do almost all the work -- so the sheet for a given tone
  // has to be found by walking this ladder rather than by dividing by seven.
  // Get that wrong and every surface in the picture lands on sheet two.
  // The first entry is the bare plate, before any sheet at all.
  const float TONE[8] = float[8](1.0, 0.941, 0.924, 0.862, 0.706, 0.533, 0.284, 0.155);

  // Where a wanted tone falls on that ladder, as a continuous rung from -1
  // (bare paper) to 6 (the last sheet).
  float rungFor(float want) {
    for (int i = 0; i < 7; i++) {
      if (want >= TONE[i + 1]) {
        float a = TONE[i], b = TONE[i + 1];
        return float(i) - 1.0 + clamp((a - want) / max(a - b, 0.0001), 0.0, 1.0);
      }
    }
    return 6.0;
  }

  // One sheet of the seven, with anything past the last reading as the last
  // and anything before the first reading as bare paper. The sheets were drawn
  // by eye, so their greys are how dark a line looks and not how much light it
  // carries; squaring brings them back into the light the rest of the picture
  // is mixed in, or every hatched surface comes out a shade too pale.
  float sheetAt(vec2 uv, float n) {
    if (n < 0.0) return 1.0;
    return pow(texture(uPlates, vec3(uv, min(n, 6.0))).r, 2.2);
  }

  // How much paper shows at a spot, for a tone and a place on the tile.
  float linesAt(vec2 uv, float value) {
    // uFloor and uCeil are the two ends of the plate: how black the blackest
    // shadow is allowed to go, and whether the brightest lights take a line.
    float rung = rungFor(uFloor + (uCeil - uFloor) * clamp(value, 0.0, 1.0));
    float low = floor(rung);
    // Blend the two neighbouring sheets, so a surface turning slowly into
    // shadow gains its lines gradually instead of jumping a whole pass.
    return mix(sheetAt(uv, low - 1.0), sheetAt(uv, low), rung - low);
  }

  // One cream paper for everything, carrying as much of the thing's own
  // colour as uWash allows. At nought it is a plate out of a book of voyages;
  // turned up it is a hand-tinted one.
  vec3 ink(vec3 col, float lines) {
    float paint = max(dot(col, GREY), 0.004);
    vec3 hue = clamp(col / paint, 0.0, 1.7);
    return uPaper * mix(vec3(1.0), hue, uWash) * max(lines, 0.05);
  }

  vec2 turned(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c) * p;
  }

  // The lines are cut into the thing, not ruled across the glass. Ruled on the
  // screen they stayed put while she rolled and turned beneath them, and the
  // whole picture read as seen through a veil -- and a sea whose lines never
  // move is a sea she is not moving through. An engraver's hatching follows
  // the form: so here each thing carries its own.

  // For a surface with a natural place on it: the sea, the sky.
  vec3 engraveUV(vec3 col, float value, vec2 uv) { return ink(col, linesAt(uv, value)); }

  // For everything built: the lines are laid on from three sides of the
  // thing's own frame and blended by which way the face looks, each side
  // ruled at its own angle, so her topsides, her deck and her canvas each
  // take a different run of line and a turned yard carries its lines round.
  vec3 engraveTri(vec3 col, float value, vec3 p, vec3 n) {
    vec3 w = pow(abs(n), vec3(4.0));
    w /= max(w.x + w.y + w.z, 0.0001);
    vec3 q = p / uTile;
    float lines = 0.0;
    if (w.x > 0.02) lines += w.x * linesAt(turned(q.zy, 0.35), value);
    if (w.y > 0.02) lines += w.y * linesAt(turned(q.xz, 1.10), value);
    if (w.z > 0.02) lines += w.z * linesAt(turned(q.xy, -0.45), value);
    return ink(col, lines / max(w.x * step(0.02, w.x) + w.y * step(0.02, w.y) + w.z * step(0.02, w.z), 0.0001));
  }
`;

// Read one sheet off its PNG and lay it into its layer of the stack.
function layIn(n) {
  return new Promise((done) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = SIZE;
      c.height = SIZE;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, SIZE, SIZE);
      const px = g.getImageData(0, 0, SIZE, SIZE).data;
      const at = n * SIZE * SIZE;
      for (let i = 0; i < SIZE * SIZE; i++) ink[at + i] = px[i * 4];
      done(true);
    };
    img.onerror = () => done(false);
    img.src = `art/hatch-${n + 1}.png`;
  });
}

// Cut all seven. Until they arrive the picture draws in flat colour, which is
// what it did before, so nothing is ever waiting on the plates.
export async function cutPlates() {
  const got = await Promise.all(
    Array.from({ length: SHEETS }, (unused, n) => layIn(n))
  );
  if (got.some((ok) => !ok)) return false;
  plates.needsUpdate = true;
  INK.uInked.value = 1;
  return true;
}
