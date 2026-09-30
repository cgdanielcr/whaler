// How each man looks, worked out once from who he is and kept: his skin and
// hair from where he was born, grey with his years, a beard or not, and the
// hat and clothes of his rank. Whaling crews of the 1840s were mixed: New
// England Yankees, Wampanoag men from Martha's Vineyard, Black New Bedford
// men, Azoreans, Cape Verdeans, Hawaiians, Irishmen. They are drawn plainly,
// with the same care, and differ as real faces do.

const rand = Math.random;
const pick = (a) => a[Math.floor(rand() * a.length)];
const weigh = (pairs) => { let r = rand() * pairs.reduce((a, p) => a + p[1], 0); for (const [v, w] of pairs) if ((r -= w) <= 0) return v; return pairs[0][0]; };

const SKIN = {
  fair: ['#f2d6c2', '#eccab2', '#f0cfb8'], light: ['#e6bfa1', '#dfb392', '#e2b89a', '#d8a987'],
  olive: ['#cf9f78', '#c4916a', '#bb875f'], brown: ['#a8724b', '#9a6642', '#8d5a37'], dark: ['#6f4529', '#5f3a22', '#4e2f1b'],
};
const BIRTH = {
  Nantucket: [['fair', 2], ['light', 3]], 'New Bedford': [['fair', 1], ['light', 3], ['brown', 1], ['dark', 1]],
  "Martha's Vineyard": [['light', 3], ['olive', 1], ['brown', 2]], 'the Azores': [['olive', 3], ['light', 2]],
  'Cape Verde': [['olive', 1], ['brown', 3], ['dark', 3]], 'the Sandwich Islands': [['olive', 1], ['brown', 3]],
  Ireland: [['fair', 3], ['light', 2]],
};
const HAIR = { black: '#1b1512', dark: '#3a291d', brown: '#5c3f27', auburn: '#7b3b1d', red: '#a4492a', fair: '#b8935c', grey: '#9b958c', white: '#dcd7cf' };

const HATS = {
  master: [['beaver', 1]], mate: [['cap', 3], ['tarpaulin', 1]],
  boatsteerer: [['knit', 2], ['tarpaulin', 2], ['bare', 1]],
  able: [['knit', 3], ['straw', 2], ['souwester', 1], ['kerchief', 1], ['bare', 2]],
  green: [['knit', 2], ['straw', 2], ['bare', 3], ['kerchief', 1]],
  cooper: [['cap', 1], ['bare', 2], ['knit', 1]], carpenter: [['cap', 1], ['bare', 2], ['knit', 1]],
  cook: [['kerchief', 2], ['bare', 1]], steward: [['bare', 1]], boy: [['cap', 1], ['knit', 1]],
};
const HAT_COLOURS = { knit: ['#8e2a22', '#2d3f63', '#5b5b56', '#3d5a3a', '#7a5a2a'], kerchief: ['#8e2a22', '#c8a23c', '#2d4a73', '#e6e0d2'],
  cap: ['#1f2940', '#1a1a1a'], beaver: ['#141414'], tarpaulin: ['#161616'], straw: ['#d8c38a'], souwester: ['#d9a92e'] };
const SHIRTS = ['#3a5a7a', '#c9c3b3', '#6b6f75', '#7a2f22', '#4a4a3a', '#8a7a5a'];
const TROUSERS = ['#c2b89c', '#8f8a7a', '#2e3140', '#5a5142'];

export function makeLook(m) {
  const tone = weigh(BIRTH[m.home] || [['light', 1]]);
  const pale = tone === 'fair' || tone === 'light';
  let hair = pale ? weigh([['dark', 3], ['brown', 3], ['black', 1], ['fair', 2], ['auburn', 1], ['red', m.home === 'Ireland' ? 3 : 0.5]])
    : weigh([['black', 4], ['dark', 2]]);
  if (m.age >= 55) hair = weigh([['white', 2], ['grey', 2]]); else if (m.age >= 42 && rand() < 0.6) hair = 'grey';
  const texture = tone === 'dark' || (tone === 'brown' && m.home !== 'the Sandwich Islands') ? weigh([['curly', 4], ['wavy', 1]]) : weigh([['straight', 2], ['wavy', 2], ['curly', 0.5]]);
  const beard = m.age < 17 ? 'none'
    : weigh([['none', 3], ['stubble', 2], ['curtain', m.home === 'Nantucket' || m.officer ? 3 : 1], ['full', m.age > 30 ? 3 : 1], ['moustache', 1]]);
  const hat = weigh(HATS[m.rank] || [['bare', 1]]);
  const officer = m.rank === 'master' || m.rank === 'mate';
  return {
    skin: pick(SKIN[tone]), hair: HAIR[hair], grey: hair === 'grey' || hair === 'white', texture,
    bald: m.age > 45 && rand() < 0.3, beard, hat, hatColour: pick(HAT_COLOURS[hat] || ['#333']),
    coat: officer ? pick(['#1f2433', '#1a1a1a', '#2a2a33']) : null,
    shirt: m.rank === 'boatsteerer' && rand() < 0.6 ? '#9a2f24' : officer ? '#e8e2d4' : pick(SHIRTS),
    trousers: officer ? '#23252c' : pick(TROUSERS),
    jaw: pick(['round', 'square', 'long']), scar: rand() < 0.1, lines: m.age >= 50 ? 2 : m.age >= 35 ? 1 : 0,
    height: m.rank === 'boy' ? 0.8 + rand() * 0.06 : m.age < 17 ? 0.88 + rand() * 0.06 : 0.93 + rand() * 0.14,
    girth: 0.85 + m.stats.strength * 0.05 + (m.rank === 'cook' ? 0.08 : 0),
  };
}
