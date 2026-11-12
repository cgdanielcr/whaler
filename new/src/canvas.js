// Her canvas: how much sail she carries, the work of making and shortening it,
// and what comes of carrying more than the wind will bear. All plain sail in
// a strong breeze drives her hardest of all, until something carries away.
export const CANVAS = [
  { name: 'All plain sail', k: 1, down: '', up: 'setting the courses and topgallants' },
  { name: 'Topsails', k: 0.78, down: 'taking in the courses and topgallants', up: 'shaking the reefs out of the topsails' },
  { name: 'Close-reefed topsails', k: 0.5, down: 'close-reefing the topsails', up: 'filling away under reefed topsails' },
  { name: 'Hove to', k: 0, down: 'backing the main topsail to heave her to', up: '' },
];
// The most canvas each wind will bear, as a place in the list above.
export const BEAR = { 'light airs': 0, 'moderate breeze': 0, 'fresh breeze': 0, 'strong breeze': 1,
  'fresh gale': 2, 'strong gale': 2, 'whole gale': 3 };
const STEP = 4.5;             // seconds for an ordinary watch to go from one to the next
const CARRY = 26;             // seconds one step too much is carried before something goes

export function makeCanvas() {
  const c = { at: 0, want: 0, lost: 0, strain: 0, warned: false };

  c.order = (i) => { c.want = Math.max(0, Math.min(CANVAS.length - 1, i)); };
  c.set = (i) => { c.at = c.want = i; c.strain = 0; };       // done for her, as after a gale
  c.fresh = () => { c.at = c.want = 0; c.lost = 0; c.strain = 0; c.warned = false; };

  // How much her canvas draws: between the two it lies between, less for sails lost.
  Object.defineProperty(c, 'k', { get() {
    const i = Math.floor(c.at), f = c.at - i, a = CANVAS[i].k, b = CANVAS[Math.min(i + 1, CANVAS.length - 1)].k;
    return (a + (b - a) * f) * Math.max(0.5, 1 - 0.15 * c.lost);
  } });
  // The work in hand, for the panel: what the men are doing and how far along.
  Object.defineProperty(c, 'job', { get() {
    if (Math.abs(c.want - c.at) < 0.01) return null;
    const down = c.want > c.at, i = down ? Math.floor(c.at + 1e-6) + 1 : Math.ceil(c.at - 1e-6) - 1;
    const text = down ? CANVAS[i].down : CANVAS[i].up, k = down ? c.at - (i - 1) : i + 1 - c.at;
    return { label: `${down ? 'Shortening sail' : 'Making sail'}: ${text}`, k };
  } });

  // rate: how smartly the hands on deck work, 1 for an ordinary watch. Returns a word for the owner, or null.
  c.tick = (dt, wind, rate) => {
    const d = c.want - c.at, step = (dt / STEP) * rate * (d > 0 ? 1 : 0.8);   // making sail is the slower work
    c.at = Math.abs(d) <= step ? c.want : c.at + Math.sign(d) * step;
    const over = BEAR[wind] - c.at;
    if (over < 0.5) { c.strain = Math.max(0, c.strain - dt / CARRY); c.warned = false; return null; }
    if (!c.warned) { c.warned = true; return `The mate looks aloft: "She is carrying more than this ${wind} will bear, sir."`; }
    if ((c.strain += (dt / CARRY) * over * (0.6 + Math.random() * 0.8) * (c.spare ? 0.6 : 1)) < 1) return null;
    c.strain = 0; c.lost = Math.min(3, c.lost + 1);
    return ['The fore topsail blows out of its bolt-ropes with a crack like a gun!', 'The main topsail splits from head to foot and flogs itself to rags!',
      'The mizzen topsail goes, and the yard with it!'][c.lost - 1];
  };
  // A new sail is bent each day while any is wanting. Says so.
  c.newDay = () => (c.lost ? (c.lost--, 'A new topsail is bent on. She can carry her canvas again.') : null);
  c.lose = () => { c.lost = Math.min(3, c.lost + 1); };
  return c;
}
