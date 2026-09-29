// The season: the calendar, the weather, and the pack ice that lies across
// the north in spring, goes out in high summer and comes down again with the
// autumn until it closes the port itself.
import { hud } from './hud.js';

// Where the southern edge of the pack lies (z on the chart) through the year,
// by day of the year. The sea runs from -360 in the north to +360 in the south.
const ICE = [[110, -220], [152, -330], [190, -470], [235, -450], [258, -270], [274, -130], [288, 20], [305, 400]];
export const LAST_FIT = 268;         // after about 25 September no ship is fitted out

const CALM = ['light airs', 'moderate breeze', 'moderate breeze', 'fresh breeze', 'fresh breeze', 'strong breeze'];
const GALES = ['fresh gale', 'fresh gale', 'strong gale', 'strong gale', 'whole gale'];
const WARNINGS = {
  244: 'September. The old hands say the ice comes down early some years.',
  262: 'The nights are drawing in, and there is new ice in the water at dawn.',
  278: 'The ice is coming down fast. The port will be frozen within the fortnight.',
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);

export function iceEdge(date, hours = 0) {
  const x = dayOfYear(date) + hours / 24;
  if (x <= ICE[0][0]) return ICE[0][1];
  for (let i = 1; i < ICE.length; i++) {
    const [a, za] = ICE[i - 1], [b, zb] = ICE[i];
    if (x <= b) return za + ((zb - za) * (x - a)) / (b - a);
  }
  return ICE[ICE.length - 1][1];
}

export function makeSeason() {
  const s = { wind: 'moderate breeze', gale: false, galeDays: 0, edge: -9999 };

  s.update = (date, hours) => { s.edge = iceEdge(date, hours); };

  // Each morning: the weather, and a word from the old hands as the year turns.
  s.newDay = (date) => {
    const doy = dayOfYear(date), late = Math.min(1, Math.max(0, (doy - 200) / 80));
    if (s.gale) {
      if (--s.galeDays <= 0) { s.gale = false; s.wind = 'strong breeze'; hud.toast('The gale blows itself out.'); }
    } else if (Math.random() < 0.03 + 0.1 * late) {
      s.gale = true; s.galeDays = 1 + Math.floor(Math.random() * 2); s.wind = pick(GALES);
      hud.toast(`It comes on to blow: a ${s.wind}. No boat can be lowered in this.`);
    } else s.wind = pick(CALM);
    if (WARNINGS[doy]) hud.toast(WARNINGS[doy]);
  };

  s.calm = () => { s.gale = false; s.galeDays = 0; s.wind = 'moderate breeze'; };

  // A line for the fitting-out, on how the ice lies.
  s.advice = (date) => {
    const doy = dayOfYear(date), edge = iceEdge(date);
    if (doy < 190 && edge > -360) return 'The pack ice still lies across the north of the grounds. The bowheads keep along its edge.';
    if (doy < 240) return 'The northern grounds are open. The ice will come down again by the end of September.';
    return 'The ice is on its way south. The bowheads come with it, and so does the risk of being beset.';
  };

  return s;
}
