// The men themselves, hung on the scene as billboards that always face you.
//
// Until the drawings load, each man is about a hundred pixels painted onto a
// canvas, seeded from his own name so that he looks the same every time you
// look at him and different from the man beside him. What he wears is what
// whalemen wore in the 1840s: duck trousers, a wool or checked shirt, and a
// tarpaulin hat -- a hat of canvas painted with tar, which is where the word
// tar for a sailor comes from.
//
// Then art/figures.png arrives: twelve engraved hands on one sheet, and each
// man is given whichever of them suits his berth. The cooper carries a cask,
// the carpenter a spar, the boatsteerer his iron, the boy a bucket, and the
// mates stand about in their coats as mates do.
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
const TALL = 1.7;       // metres: the tallest man on the sheet

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

// Which of the twelve suits which berth, by their place on the sheet: a coil
// of rope, a cask, hauling, a mate's coat, a glass, a spar, coiling, an iron,
// a boy with a bucket, the windlass, a chart, and one shading his eyes.
const SUITS = {
  'Master':      [10],
  'First mate':  [3],
  'Second mate': [3],
  'Third mate':  [10],
  'Boatsteerer': [7],
  'Cooper':      [1],
  'Carpenter':   [5],
  'Cook':        [6],
  'Steward':     [6],
  'Cabin boy':   [8]
};
const WORKING = [0, 2, 9, 11, 4];      // what a foremast hand may be doing

const made = [];                        // every figure made, so they can be redrawn

// One man, as a billboard about the height of a man.
export function makeFigure(man) {
  const mat = new THREE.SpriteMaterial({ map: drawMan(man), transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(TALL * W / H, TALL, 1);
  s.center.set(0.5, 0);        // his feet are where you put him
  s.userData.man = man;
  made.push(s);
  return s;
}

// Which drawing this man gets. Berth first; failing that, seeded off his name
// so the same man is always at the same work.
function suitFor(man) {
  const want = SUITS[man.berth];
  if (want) return want[0];
  return WORKING[Math.floor(seedOf(man.name)() * WORKING.length) % WORKING.length];
}

const ACROSS = 6;      // how many men stand in each row of the sheet

// Find the twelve on the sheet without being told where they are. Six across
// and two down, but not on any grid worth trusting -- the cask and the
// windlass are far wider than the boy -- so each half is scanned for columns
// with nothing in them, and what lies between two gaps is a man.
//
// Except that two of them touch: the cask on one man's shoulder reaches the
// rope the next is hauling, and the three of them come back as one shape. So
// where a row gives up fewer than six, the widest run is cut at its thinnest
// column until it gives six -- which lands in the gap every time, because a
// rope crossing a column is ten pixels and a man is two hundred.
function findMen(px, w, h) {
  const boxes = [];
  for (const half of [0, 1]) {
    const y0 = half * Math.floor(h / 2), y1 = y0 + Math.floor(h / 2);
    const deep = [];
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = y0; y < y1; y++) if (px[(y * w + x) * 4 + 3] > 40) n++;
      deep.push(n);
    }

    let runs = [];
    let at = -1;
    for (let x = 0; x <= w; x++) {
      if (x < w && deep[x] > 0 && at < 0) at = x;
      if ((x === w || deep[x] === 0) && at >= 0) {
        if (x - at > 40) runs.push([at, x]);
        at = -1;
      }
    }

    while (runs.length < ACROSS && runs.length > 0) {
      let widest = 0;
      for (let i = 1; i < runs.length; i++) {
        if (runs[i][1] - runs[i][0] > runs[widest][1] - runs[widest][0]) widest = i;
      }
      const [a, b] = runs[widest];
      const edge = Math.floor((b - a) * 0.22);
      let cut = a + edge;
      for (let x = a + edge; x < b - edge; x++) if (deep[x] < deep[cut]) cut = x;
      if (cut <= a || cut >= b) break;
      runs.splice(widest, 1, [a, cut], [cut, b]);
    }

    for (const [a, b] of runs) {
      let top = y1, foot = y0;
      for (let y = y0; y < y1; y++) {
        for (let k = a; k < b; k++) {
          if (px[(y * w + k) * 4 + 3] > 40) { if (y < top) top = y; if (y > foot) foot = y; break; }
        }
      }
      if (foot > top) boxes.push({ x: a, y: top, w: b - a, h: foot - top + 1 });
    }
  }
  return boxes;
}

// Cut one man out of the sheet onto his own canvas, hardening the edge as he
// goes: the drawing is cut out against a faint halo, and a halo on a billboard
// is a grey box round a man. A little darkening with him, because at the size
// he is seen on deck a fine engraving averages out to almost nothing.
function cutOut(sheet, box) {
  const c = document.createElement('canvas');
  c.width = box.w;
  c.height = box.h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(sheet, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const img = g.getImageData(0, 0, box.w, box.h);
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    const a = p[i + 3];
    p[i + 3] = a < 70 ? 0 : Math.min(255, (a - 70) * 1.55);
    for (let k = 0; k < 3; k++) p[i + k] = Math.max(0, p[i + k] * 0.86 - 12);
  }
  g.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  return tex;
}

// Fetch the sheet and put the twelve of them aboard. Until this lands, and if
// it never lands, the men stay as they were.
export async function cutFigures() {
  const sheet = await new Promise((done) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = 'art/figures.png';
  });
  if (!sheet) return false;

  const c = document.createElement('canvas');
  c.width = sheet.width;
  c.height = sheet.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(sheet, 0, 0);
  const boxes = findMen(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
  if (boxes.length < 12) return false;

  // The tallest of them is a man's height, and the rest keep their proportion
  // to him -- which is how the boy stays a boy and the man at the windlass
  // stays bent over it.
  const tallest = Math.max(...boxes.map((b) => b.h));
  const cut = boxes.map((b) => ({ tex: cutOut(sheet, b), box: b }));

  for (const s of made) {
    const { tex, box } = cut[suitFor(s.userData.man) % cut.length];
    s.material.map = tex;
    s.material.needsUpdate = true;
    const tall = TALL * (box.h / tallest);
    s.scale.set(tall * (box.w / box.h), tall, 1);
  }
  return true;
}
