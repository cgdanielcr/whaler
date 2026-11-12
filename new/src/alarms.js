// When trouble breaks out. A gale when the weather turns; a squall out of a
// fresh or strong breeze, with a few moments' warning; fire when the tryworks
// are going; a man overboard when sail is being shortened in a blow or by
// weary hands; and the windlass when the ice has had her a day.
import { hud } from './hud.js';

const AT_SEA = ['sea', 'docking', 'trying'];

export function makeAlarms({ voyage, company, helm }) {
  let wasGale = false, gale = false, day = -1, squallIn = 0, quiet = 0, besetDays = 0, fired = null;
  const rand = Math.random;

  return {
    // Returns { kind, who } when a crisis should begin now, else null.
    tick(dt) {
      const v = voyage.v, s = voyage.season, sail = voyage.sail;
      if (s.gale && !wasGale) gale = true;
      if (!s.gale) gale = false;
      wasGale = s.gale;
      if (v.phase === 'port' || v.phase === 'ended' || v.phase === 'lost') { quiet = 4; squallIn = 0; besetDays = 0; return null; }
      const calm = AT_SEA.includes(v.phase) && !v.paused;

      if (v.days !== day) {                      // each morning
        day = v.days; quiet--;
        besetDays = helm.slow === 0 ? besetDays + 1 : 0;
        if (calm && quiet <= 0 && !s.gale && !s.brewing && ['fresh breeze', 'strong breeze'].includes(s.wind) && rand() < 0.1) {
          squallIn = 4.5; quiet = 4;
          hud.toast('A white squall to windward, coming down fast! Shorten sail, if there is time.');
        }
      }
      if (!calm) return null;
      if (gale) { gale = false; quiet = 3; return { kind: 'gale' }; }
      if (squallIn > 0 && (squallIn -= dt) <= 0) return { kind: 'squall' };
      if (besetDays >= 1 && helm.slow === 0) { besetDays = -3; return { kind: 'beset' }; }
      // Fire: once at most for each whale tried out.
      const w = voyage.trying.whale;
      if (v.phase === 'trying' && w && fired !== w && !s.gale && rand() < dt * 0.012) { fired = w; return { kind: 'fire' }; }
      // A man from the yard: when sail is handled in a strong wind, or by men asleep on their feet.
      if (quiet <= 0 && sail.canvas.job && v.phase === 'sea') {
        const risk = (['strong breeze', 'fresh gale', 'strong gale'].includes(s.wind) ? 0.012 : 0.002) + (sail.hands.weariness() > 45 ? 0.012 : 0);
        if (rand() < dt * risk) {
          const men = company.alive().filter((m) => m.watch && (sail.hands.all || m.watch === voyage.watch.onDeck));
          quiet = 8;
          if (men.length) return { kind: 'overboard', who: men[Math.floor(rand() * men.length)] };
        }
      }
      return null;
    },
  };
}
