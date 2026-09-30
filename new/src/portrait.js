// A portrait of a man, painted from his look: head and shoulders in an oval,
// on the warm brown of an old daguerreotype. Drawn once and kept.
const W = 120, H = 140, S = 2;                           // drawn at twice the size, for sharpness
const cache = new Map();

const shade = (hex, k) => {                              // lighter (k > 0) or darker (k < 0)
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(c + (k > 0 ? (255 - c) * k : c * k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

export function portrait(m) {
  const key = `${m.id}:${m.rank}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const g = c.getContext('2d'); g.scale(S, S);
  const L = m.look, cx = 60, cy = 64;
  const ell = (x, y, rx, ry, fill) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); };

  // The oval, and the sitter's ground.
  g.save(); g.beginPath(); g.ellipse(60, 70, 56, 66, 0, 0, Math.PI * 2); g.clip();
  const bg = g.createRadialGradient(55, 55, 10, 60, 70, 80); bg.addColorStop(0, '#cfb991'); bg.addColorStop(1, '#5d4a35');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Shoulders: a coat over a shirt for the officers, a shirt for the rest.
  g.beginPath(); g.moveTo(4, 140); g.quadraticCurveTo(10, 108, 40, 102); g.lineTo(80, 102); g.quadraticCurveTo(110, 108, 116, 140); g.closePath();
  g.fillStyle = L.coat || L.shirt; g.fill();
  if (L.coat) {
    g.beginPath(); g.moveTo(47, 102); g.lineTo(60, 128); g.lineTo(73, 102); g.fillStyle = L.shirt; g.fill();
    g.beginPath(); g.moveTo(52, 104); g.lineTo(60, 118); g.lineTo(68, 104); g.fillStyle = '#1a1a1a'; g.fill();   // a black stock at the throat
  }
  g.fillStyle = shade(L.skin, -0.12); g.fillRect(51, 84, 18, 20);                           // neck

  // Hair behind the head, framing the face; a bald man keeps a fringe at the back.
  const rx = L.jaw === 'square' ? 21 : 20, ry = L.jaw === 'long' ? 27 : 24;
  if (L.bald) ell(cx, cy + 2, rx + 2.5, ry * 0.55, L.hair);
  else ell(cx, cy - 3, rx + (L.texture === 'curly' ? 5 : 3), ry + 2, L.hair);

  // Head, ears, and the light on the near cheek.
  ell(cx - rx + 1, cy + 2, 4, 6, shade(L.skin, -0.08)); ell(cx + rx - 1, cy + 2, 4, 6, shade(L.skin, -0.08));
  ell(cx, cy, rx, ry, L.skin);
  if (L.jaw === 'square') { g.fillStyle = L.skin; g.fillRect(cx - rx + 3, cy + 4, rx * 2 - 6, ry - 8); }
  const lit = g.createRadialGradient(cx - 8, cy - 8, 2, cx - 8, cy - 8, 26); lit.addColorStop(0, shade(L.skin, 0.18)); lit.addColorStop(1, 'rgba(0,0,0,0)');
  ell(cx, cy, rx, ry, lit);

  // Hair on top, unless he is bald or under a hat that hides it.
  const hatHides = ['beaver', 'cap', 'knit', 'tarpaulin', 'souwester', 'kerchief'].includes(L.hat);
  if (!L.bald && !hatHides) {
    g.beginPath(); g.ellipse(cx, cy - ry * 0.45, rx + 1.5, ry * 0.6, 0, Math.PI, 0); g.fillStyle = L.hair; g.fill();
    if (L.texture === 'curly') for (let i = -3; i <= 3; i++) ell(cx + i * 6, cy - ry * 0.85 + Math.abs(i) * 1.6, 4.5, 4, L.hair);
  }
  // Brows, gently arched; eyes; nose; mouth.
  g.strokeStyle = L.grey ? shade(L.hair, -0.2) : L.hair; g.lineWidth = 1.6; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 4, cy - 6); g.quadraticCurveTo(cx + s * 8, cy - 9, cx + s * 12, cy - 6.5); g.stroke(); }
  for (const s of [-1, 1]) { ell(cx + s * 8, cy - 1, 2.2, 1.3, '#efe6d6'); ell(cx + s * 8, cy - 0.9, 1.2, 1.2, '#2a1d14'); }
  g.strokeStyle = shade(L.skin, -0.28); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 2.5, cy + 9); g.lineTo(cx + 1.5, cy + 10); g.stroke();
  g.strokeStyle = shade(L.skin, -0.4); g.beginPath(); g.moveTo(cx - 5, cy + 15); g.quadraticCurveTo(cx, cy + 16.5, cx + 5, cy + 15); g.stroke();

  // Lines of age, and an old scar.
  g.strokeStyle = shade(L.skin, -0.2); g.lineWidth = 0.8;
  for (let i = 0; i < L.lines; i++) { g.beginPath(); g.moveTo(cx - 8, cy - 12 - i * 3); g.quadraticCurveTo(cx, cy - 14 - i * 3, cx + 8, cy - 12 - i * 3); g.stroke(); }
  if (L.lines > 1) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 12, cy - 1); g.lineTo(cx + s * 15, cy + 1); g.stroke(); }
  if (L.scar) { g.strokeStyle = shade(L.skin, 0.25); g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + 9, cy + 4); g.lineTo(cx + 15, cy + 11); g.stroke(); }

  // Beard.
  g.fillStyle = L.hair;
  if (L.beard === 'full' || L.beard === 'curtain') {
    g.beginPath(); g.moveTo(cx - rx + 1, cy + 2); g.quadraticCurveTo(cx - rx + 2, cy + ry + 8, cx, cy + ry + 9);
    g.quadraticCurveTo(cx + rx - 2, cy + ry + 8, cx + rx - 1, cy + 2);
    if (L.beard === 'curtain') { g.lineTo(cx + rx - 5, cy + 4); g.quadraticCurveTo(cx, cy + ry + 1, cx - rx + 5, cy + 4); }   // shaved lip and chin
    else { g.lineTo(cx + 8, cy + 12); g.quadraticCurveTo(cx, cy + 20, cx - 8, cy + 12); }
    g.closePath(); g.fill();
  }
  if (L.beard === 'full' || L.beard === 'moustache') { g.beginPath(); g.ellipse(cx, cy + 12.5, 8, 2.6, 0, 0, Math.PI * 2); g.fill(); }
  if (L.beard === 'stubble') { g.globalAlpha = 0.28; g.beginPath(); g.ellipse(cx, cy + 12, rx - 3, ry * 0.55, 0, 0, Math.PI); g.fill(); g.globalAlpha = 1; }

  hat(g, L, cx, cy - ry + 4, rx);
  g.restore();
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.ellipse(60, 70, 56, 66, 0, 0, Math.PI * 2); g.stroke();

  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

// The hat, sitting on the crown of his head at y.
function hat(g, L, cx, y, rx) {
  const col = L.hatColour, box = (x, yy, w, h) => { g.fillRect(x, yy, w, h); };
  g.fillStyle = col;
  switch (L.hat) {
    case 'beaver': box(cx - 16, y - 30, 32, 30); g.fillStyle = '#000'; box(cx - 16, y - 6, 32, 4); g.fillStyle = col; box(cx - 26, y - 2, 52, 5); break;
    case 'cap': g.beginPath(); g.ellipse(cx, y + 3, rx + 2, 12, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#0d0d0d'; g.beginPath(); g.ellipse(cx, y + 4, rx - 2, 3.5, 0, 0, Math.PI); g.fill(); break;    // the peak, seen from the front
    case 'tarpaulin': g.beginPath(); g.ellipse(cx, y + 1, 15, 10, 0, Math.PI, 0); g.fill(); box(cx - 27, y, 54, 4); break;
    case 'knit': g.beginPath(); g.ellipse(cx, y + 4, rx + 2, 16, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; box(cx - rx - 2, y + 1, rx * 2 + 4, 4); break;
    case 'straw': g.beginPath(); g.ellipse(cx, y + 1, 14, 9, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(cx, y + 2, 34, 4, 0, 0, Math.PI * 2); g.fill(); break;
    case 'souwester': g.beginPath(); g.ellipse(cx, y + 5, rx + 3, 17, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(cx, y + 5, rx + 9, 5, 0, 0, Math.PI * 2); g.fill(); break;
    case 'kerchief': g.beginPath(); g.ellipse(cx, y + 5, rx + 1.5, 14, 0, Math.PI, 0); g.fill(); g.beginPath(); g.moveTo(cx + rx - 2, y + 4); g.lineTo(cx + rx + 8, y + 10); g.lineTo(cx + rx + 2, y + 12); g.fill(); break;
    default: break;
  }
}
