// Every colour in the picture, in one place.
//
// The whole style rests on there being very few of them and on their being
// flat. Nothing is shaded from one into another inside a shape: a wave face is
// one blue, the next face is a different blue, and the edge between them is
// hard. That is what makes it read as paper cut out and laid down rather than
// as something photographed.
//
// Each colour is given twice, at both ends of the weather. A single "gloom"
// figure, driven by the wind force and by any squall that is over her, walks
// the whole set from a bright day to a grey one. That way there is one palette
// and not two, and everything moves together.
//
// The foam is cream, not white, and it is the same cream as the cloud and the
// canvas. That one choice is most of why it reads as a single picture.
import * as THREE from 'three';

const PAIRS = {
  skyHigh:  ['#7ea9c4', '#59626a'],
  skyLow:   ['#a8c4d4', '#8b9498'],
  cloudLit: ['#f5ecd8', '#ccd1d1'],
  cloudDim: ['#dfd2b6', '#949da1'],

  sea0:     ['#12293f', '#0d1a24'],   // the hollow
  sea1:     ['#21456b', '#1a3345'],
  sea2:     ['#2b5680', '#24475b'],
  sea3:     ['#4a80a8', '#3b6b85'],   // the face turned to the light
  foam:     ['#f2ead4', '#dde1de'],

  canvas:   ['#efe7d2', '#d3d6d2'],   // her sails
  furled:   ['#cdc2a4', '#b3b8b6'],
  spar:     ['#6b5636', '#4f4638'],
  rope:     ['#2f2a22', '#26262a'],
  hull:     ['#2b2620', '#232428'],
  band:     ['#b08a45', '#8e7c58'],   // the buff sheer band
  bottom:   ['#5c3329', '#43302c'],
  deck:     ['#9a8763', '#7d7767'],
  brick:    ['#8a5340', '#6d4c40'],
  iron:     ['#2a2724', '#25272a'],
  cedar:    ['#d8cfb8', '#bfc0ba'],
  trim:     ['#2f4a58', '#2b3c46'],
  whale:    ['#2e3238', '#242a30']
};

// The live set, mixed to wherever the weather stands. Everything that draws
// reads from this object, so one call moves the whole picture.
export const HUE = {};
const FAIR = {}, FOUL = {};
for (const key in PAIRS) {
  FAIR[key] = new THREE.Color(PAIRS[key][0]);
  FOUL[key] = new THREE.Color(PAIRS[key][1]);
  HUE[key] = FAIR[key].clone();
}

let at = -1;

// gloom runs from 0 on a fair day to 1 in the worst of it. Returns true when
// it has actually moved, so nothing is repainted for nothing.
export function weather(gloom) {
  const g = Math.max(0, Math.min(1, gloom));
  if (Math.abs(g - at) < 0.002) return false;
  at = g;
  for (const key in PAIRS) HUE[key].copy(FAIR[key]).lerp(FOUL[key], g);
  return true;
}

// How grey the day is, from the wind and from whatever squall is over her.
// A moderate breeze is a bright day; it closes in from a fresh breeze up.
export const gloomFor = (force, squall) =>
  Math.min(1, Math.max(0, (force - 3.5) / 5) * 0.8 + (squall || 0) * 0.6);

weather(0);
