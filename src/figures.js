// The men themselves, drawn as pixel figures at load and hung on the scene as
// billboards that always face you.
//
// No modelling program and no image files: each man is about a hundred pixels
// painted onto a canvas, seeded from his own name so that he looks the same
// every time you look at him, and different from the man beside him.
//
// What they wear is what whalemen wore in the 1840s: duck trousers, a wool or
// checked shirt, and a tarpaulin hat -- a hat of canvas painted with tar,
// which is where the word tar for a sailor comes from.
import * as THREE from 'three';

const SHIRTS = ['#8a3b34', '#3f5670', '#5c6b48', '#7a6a45', '#4a4652', '#8a6a3b', '#6b4a52'];
const TROUSERS = ['#cdc3a8', '#bdb49a', '#d6cdb4', '#a8a08c'];
const SKIN = ['#e3b48c', '#c98f65', '#9a6440', '#6f4429', '#4e2f1c', '#eac49c'];
const HATS = ['#2b2620', '#3a352c', '#8a8168'];

// A little hash, so a man's look follows his name rather than the order he
// was shipped in.
function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); return ((h >>> 0) % 1000) / 1000; };
}

const W = 11, H = 20;   // pixels: he is eleven across and twenty tall

export function drawMan(man) {
  const rnd = seedOf(man.name + man.berth);
  const pick = (a) => a[Math.floor(rnd() * a.length) % a.length];
  const skin = pick(SKIN), shirt = pick(SHIRTS), duck = pick(TROUSERS), hat = pick(HATS);
  const capped = rnd() < 0.7;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const box = (x, y, w, h, fill) => { g.fillStyle = fill; g.fillRect(x, y, w, h); };

  // head and hat
  box(4, 2, 3, 3, skin);
  if (capped) box(3, 1, 5, 2, hat);
  // shoulders, body and arms
  box(3, 5, 5, 7, shirt);
  box(2, 6, 1, 5, shirt);
  box(8, 6, 1, 5, shirt);
  box(2, 11, 1, 1, skin);
  box(8, 11, 1, 1, skin);
  // trousers and feet
  box(3, 12, 5, 5, duck);
  box(3, 17, 2, 2, '#3a3128');
  box(6, 17, 2, 2, '#3a3128');
  // a dark line down the middle of the legs so he reads as two of them
  box(5, 12, 1, 5, 'rgba(0,0,0,0.22)');

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  return tex;
}

// One man, as a billboard about the height of a man.
export function makeFigure(man) {
  const mat = new THREE.SpriteMaterial({ map: drawMan(man), transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(1.7 * W / H, 1.7, 1);
  s.center.set(0.5, 0);        // his feet are where you put him
  s.userData.man = man;
  return s;
}
