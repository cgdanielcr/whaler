// Sailing her: the wind, her canvas and the hands on deck brought together.
// Each moment this tells the helm what the wind is doing and how she is
// handled, and tells the owner what the mate would tell him.
import { makeWind, DRIVE, sailing, compass } from './wind.js';
import { makeCanvas, CANVAS, BEAR } from './canvas.js';
import { makeHands } from './hands.js';
import { sound } from './sound.js';
import { hud } from './hud.js';

export function makeSailing({ helm, ship, season, company }) {
  const wind = makeWind(), canvas = makeCanvas(), hands = makeHands({ company });
  let rate = 1;

  const s = {
    wind, canvas, hands,
    fitOut() { wind.season(); canvas.fresh(); hands.rest(); s.abouts = 0; },
    newDay() { wind.newDay(); const said = canvas.newDay(); if (said) hud.toast(said); },
    order(i) {
      if (i === Math.round(canvas.want)) return;
      canvas.order(i);
      hud.toast(i > canvas.at ? `"Shorten sail!" The watch ${hands.all ? 'and the watch below ' : ''}lay aloft.` : '"Make sail!" The hands tail on to the halyards.');
    },
    allHands(on) {
      if (hands.all === on) return;
      hands.all = on; if (on) sound.pipe();
      hud.toast(on ? 'All hands! The watch below tumbles up, cursing.' : 'The watch below is sent down to their berths.');
    },

    // dt in seconds of the world; hours of ship's time gone by; who has the deck; fx from the stations.
    tick(dt, hours, onDeck, fx, working) {
      wind.update(dt);
      hands.pass(hours, onDeck);
      rate = hands.rate(onDeck);
      if (working) { const said = canvas.tick(dt, season.wind, rate * (canvas.spare ? 1.25 : 1)); if (said) { hud.toast(said); if (!said.startsWith('The mate')) sound.crack(); } }
      helm.wind.from = wind.from;
      helm.wind.drive = DRIVE[season.wind];
      helm.canvas = canvas.k; helm.plan = canvas.at;
      helm.handling = Math.max(0.5, Math.min(1.5, rate * (fx.scores.helm / 4)));
      ship.setLost(canvas.lost);
      if (helm.said === 'about' && (s.abouts = (s.abouts || 0) + 1) <= 2) hud.toast('"Ready about!" She comes up into the wind, and round on the other tack.');
      if (helm.said === 'missed') hud.toast('She misses stays, and falls off again. "Wear ship!" Round she goes, the long way.');
      helm.said = null;
      if (hands.all && hands.weariness() > 60 && !s.nagged) { s.nagged = true; hud.toast('The mate: "The men are dead on their feet, sir. Send the watch below."'); }
      if (!hands.all) s.nagged = false;
    },

    // Everything the quarterdeck panel shows.
    get state() {
      return {
        from: wind.from, heading: helm.heading, wind: season.wind, gale: season.gale,
        says: `${cap(season.wind)} from the ${compass(wind.from)}`,
        point: !helm.set ? 'Lying still' : canvas.at > 2.9 ? 'Hove to' : !helm.target ? (helm.speed < 0.4 ? 'Lying to, no course set' : 'Losing her way') : sailing(helm.heading - wind.from),
        knots: helm.speed * 0.9, plan: Math.round(canvas.want), bear: BEAR[season.wind], job: canvas.job, lost: canvas.lost,
        all: hands.all, weary: hands.weariness(), rate, names: CANVAS.map((c) => c.name),
      };
    },
  };
  return s;
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);
