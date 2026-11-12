// The mate's word: how the game teaches. The first time each thing comes up,
// the mate says what it is and what may be done about it, once, on a card the
// owner dismisses. What has been said is remembered with the career.
import { BEAR } from './canvas.js';
import { BERTH } from './world.js';

const $ = (id) => document.getElementById(id);

export function makeMate({ voyage, career, crisis, helm }) {
  const v = voyage.v, s = voyage.season, sail = voyage.sail;
  const out = () => Math.hypot(helm.pos.x - BERTH.x, helm.pos.z - BERTH.z);
  const LESSONS = [
    ['wind', () => v.phase === 'sea' && out() > 55,
      'That dial is the wind, sir, with her head uppermost. The red wedge is the six points either side of the wind’s eye, where no square-rigger can lie. Send her that way and she must beat: a board on one tack, then go about, and a board on the other. Click the sea to lay her course.'],
    ['hold', () => v.phase === 'sea' && v.days >= 2,
      'Press Space, sir, and the world stands still while you think. Press it again and she runs on. And click the ship herself to go aboard and see who stands where.'],
    ['spout', () => v.phase === 'sea' && voyage.chase.over && voyage.sail && whalesSighted(),
      'A spout! Lay her within a few ship’s lengths and the order to lower is yours. Pull for her and the boats are quick; paddle up and they are quiet, which a sperm whale wants.'],
    ['dart', () => v.phase === 'hunt' && voyage.chase.aim,
      'The boat is on her, sir, and the boatsteerer has his iron up. Press Space when the mark runs into the gold, and he darts. Dead centre is a deep iron.'],
    ['chase', () => v.phase === 'hunt' && voyage.chase.order && !voyage.chase.aim,
      'Fast to her! Hauled up alongside, the headsmen lance and she dies. But when she rounds on the boats you have a breath to cry "Stern all!" and lie off till she quiets. Do not lie off long, or the irons draw.'],
    ['carcass', () => v.phase === 'sea' && voyage.trying.floating().length > 0,
      'She is dead, sir, and only meat for the sharks until she is alongside. Sail close to her and take her alongside to cut in and try out.'],
    ['canvas', () => v.phase === 'sea' && BEAR[s.wind] > sail.canvas.at + 0.5 && !s.gale,
      'It is freshening, sir. She will carry all plain sail in this and fly, until something carries away. Shortened to topsails she is safe, and slower. The red dots mark what is too much for this wind.'],
    ['hands', () => v.phase === 'sea' && sail.canvas.job,
      'The watch on deck does the work, sir, and takes its time. Call all hands and it goes near twice as fast; but men kept from their sleep are poor hands tomorrow, and sullen ones.'],
    ['glass', () => s.brewing,
      'The glass is falling, sir. If she is snugged down to close-reefed topsails before it strikes, the work is half done when the gale comes.'],
    ['ice', () => v.phase === 'sea' && s.edge - helm.pos.z > -45,
      'Ice ahead, sir. The bowheads keep along its edge, and so may we; but stand into the pack and it will grind her, and deep in it she is beset.'],
    ['crisis', () => crisis.now,
      'All is held, sir, while you station the hands. Click a trouble and the best man to hand goes to it; or carry a man of your own choosing there. The watch below is asleep until all hands are called. How you station them is written in her bill for next time.'],
  ];
  let whales = null;
  const whalesSighted = () => whales && whales.list.some((w) => w.sighted && w.state === 'free');
  let showing = null, age = 0;

  $('mateAye').onclick = () => { $('mate').hidden = true; showing = null; };

  return {
    watch(w) { whales = w; },
    tick() {
      if (showing) { if ((age += 0.15) > 30) $('mateAye').onclick(); return; }
      if (v.phase === 'port' || !$('modal').hidden) return;
      const l = LESSONS.find(([key, when]) => !career.learned[key] && (!crisis.now || key === 'crisis') && when());
      if (!l) return;
      career.learned[l[0]] = true; showing = l[0]; age = 0;
      $('mateText').textContent = l[2];
      $('mate').hidden = false;
    },
  };
}
