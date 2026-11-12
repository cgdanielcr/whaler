// The hands on deck. The watch on deck works the ship; the watch below sleeps.
// All hands can be called at any hour, and the work goes near twice as fast,
// but men kept from their sleep grow weary, work worse, and take it ill.
import { cheer } from './morale.js';

const clamp = (n) => Math.max(0, Math.min(100, n));
// How a man's weariness tells on his work.
export const wearyFactor = (m) => 1 - (m.weary || 0) / 220;
export const wearyWord = (n) => (n >= 70 ? 'Worn out' : n >= 45 ? 'Weary' : n >= 20 ? 'Tired' : 'Rested');

export function makeHands({ company }) {
  const h = { all: false };
  const seamen = () => company.alive().filter((m) => m.watch);

  // How smartly the ship is worked: 1 for an ordinary watch of ten.
  h.rate = (onDeck) => {
    const men = seamen().filter((m) => h.all || m.watch === onDeck);
    const skill = men.reduce((a, m) => a + (m.stats.seamanship + 1.5) * wearyFactor(m) * (0.5 + m.health / 200), 0);
    return Math.max(0.3, Math.min(2, skill / 42));
  };
  h.weariness = () => { const s = seamen(); return s.length ? s.reduce((a, m) => a + (m.weary || 0), 0) / s.length : 0; };

  // An hour (or part of one) goes by.
  h.pass = (hours, onDeck) => {
    for (const m of company.alive()) {
      const below = m.watch ? m.watch !== onDeck : true;
      const d = h.all ? (below ? 3.2 : 1) : below ? -2.6 : -0.4;
      m.weary = clamp((m.weary || 0) + d * hours * (m.watch ? 1 : 0.5));
      if (m.weary > 55) m.spirits = clamp(m.spirits - 0.12 * hours);
    }
  };
  // The watch below is turned out for a crisis: it costs them at once.
  h.roused = (men) => { for (const m of men) m.weary = clamp((m.weary || 0) + 7); cheer(company, -2, men); };
  h.rest = () => { h.all = false; for (const m of company.men) m.weary = 0; };
  return h;
}
