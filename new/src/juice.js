// The feel of things: a jolt of the picture when something strikes, and a few
// words that rise and fade over the sea when something is won or lost. Any
// file may ask for either; the main loop and the page do the rest.
const box = document.getElementById('floats');

export const juice = {
  jolt: 0,
  shake(n) { juice.jolt = Math.max(juice.jolt, n); },
  // Words that rise from the middle of the picture. kind: 'good', 'bad' or nothing.
  float(text, kind = '') {
    const el = document.createElement('div');
    el.className = kind; el.textContent = text;
    el.style.left = `${46 + Math.random() * 8}%`;
    box.append(el);
    setTimeout(() => el.remove(), 2200);
  },
};
