// Spirits: how the men feel, one by one. Good food and greasy luck lift them;
// short rations, a long passage, sickness and death wear them down. Low
// spirits make for sloppy work, and at the last the men will not lower. At the
// end of a voyage the unhappy, and those who came home owing, will not ship again.
//
// The master had two kindnesses in his gift, both kept by the calendar: duff
// (flour and molasses and dried fruit boiled in a bag) on Sundays and
// Thursdays, and a Sunday kept as a day of rest, with no whaling.
import { hud } from './hud.js';

export const START = 70;                 // spirits on shipping, after a run ashore
const clamp = (n) => Math.max(0, Math.min(100, n));

export const mood = (s) => (s >= 75 ? 'Cheerful' : s >= 55 ? 'Content' : s >= 40 ? 'Grumbling' : s >= 25 ? 'Sullen' : 'Near mutiny');
export const spiritsOf = (co) => { const a = co.alive(); return a.length ? a.reduce((x, m) => x + m.spirits, 0) / a.length : 0; };
// How a man's spirits tell on his work: willing hands do more.
export const spiritFactor = (m) => 0.85 + (0.3 * (m.spirits ?? START)) / 100;
export function cheer(co, n, who = co.alive()) { for (const m of who) m.spirits = clamp((m.spirits ?? START) + n); }

// Each day at sea: the food, the sameness of it, and how a sick man feels.
// Left alone, spirits drift back toward the middle; the food and the length of
// the voyage decide where they settle: content with a fair cook, sullen with a bad one.
export function dailySpirits(co, { cook, starving, days }) {
  const food = starving ? -6 : (cook - 3.5) * 0.6;         // an empty galley is worse than a poor cook
  const sea = days > 30 ? -0.6 : -0.2;                     // it tells more the longer she is out
  for (const m of co.alive()) {
    const drift = -0.06 * (m.spirits - 50);
    m.spirits = clamp(m.spirits + drift + food + sea + (m.health < 50 ? -1 : 0) + (Math.random() - 0.5));
  }
}

// When whales are raised: will they go? Only when spirits are very low do they balk.
export const willLower = (co) => spiritsOf(co) >= 25 || Math.random() < 0.5;

// At the end of a voyage: who will not ship again. Never the master.
export function leavers(co) {
  return co.alive().filter((m) => {
    if (m.rank === 'master') return false;
    const s = m.spirits, chance = (s < 30 ? 0.6 : s < 45 ? 0.25 : s < 60 ? 0.05 : 0) + (m.lastPay < 0 ? 0.25 : 0);
    return Math.random() < chance;
  });
}

// The two kindnesses, and the buttons for them on the ship's panel.
export function makeKindness({ v, company, atSea }) {
  const duffBtn = document.getElementById('duff'), sundayBtn = document.getElementById('sunday');
  const day = () => v.date.getDay();                       // 0 is Sunday, 4 Thursday
  const today = () => `${v.date.getFullYear()}-${v.date.getMonth()}-${v.date.getDate()}`;
  const k = {
    duffReady: () => atSea() && (day() === 0 || day() === 4) && v.duffOn !== today() && v.stores >= 2,
    sundayReady: () => atSea() && day() === 0 && v.sundayOn !== today(),
    get sunday() { return v.sundayOn === today(); },       // no whaling today
    duff() {
      if (!k.duffReady()) return;
      v.duffOn = today(); v.stores -= 1; cheer(company, 3);
      hud.toast('Duff for all hands: flour and molasses and dried apples, boiled in a bag. The men are the better for it.');
    },
    keepSunday() {
      if (!k.sundayReady()) return;
      v.sundayOn = today(); cheer(company, 5);
      for (const m of company.alive()) m.health = Math.min(100, m.health + 5);
      hud.toast('Sunday is kept: no whaling today. The men mend their clothes and yarn on the forecastle head.');
    },
    show() { duffBtn.hidden = !k.duffReady(); sundayBtn.hidden = !k.sundayReady(); },
  };
  duffBtn.onclick = k.duff;
  sundayBtn.onclick = k.keepSunday;
  return k;
}
