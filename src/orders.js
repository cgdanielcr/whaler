// The keyboard. In M4 a key no longer changes a sail: it gives an order, and
// the hands take their own time over it.
import { evolution } from './evolutions.js';

const BY_DIGIT = {
  Digit1: 'course', Digit2: 'topsail', Digit3: 'topgallant',
  Digit4: 'royal', Digit5: 'spanker', Digit6: 'headsail'
};
const ALL_TIERS = ['royal', 'topgallant', 'topsail', 'course', 'spanker', 'headsail'];

export function bindOrders({ rig, crew, time, manoeuvre, helm }) {
  // dir is +1 to shorten sail, -1 to make more.
  function give(tier, dir) {
    const from = rig.stateOf(tier);
    const to = rig.nextState(tier, dir);
    if (!to) return;
    const e = evolution(tier, from, to, dir);
    if (!e) return;
    crew.issue({
      name: e.name, hands: e.hands, minutes: e.minutes, tier,
      onStart: () => rig.begin(tier, to),
      onProgress: (p) => rig.progress(tier, p),
      onDone: () => rig.finish(tier)
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    // While a name is being typed on the watch bill, the keys are his, not hers.
    if (e.target.isContentEditable) return;

    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { helm.hold(e.code); e.preventDefault(); return; }

    const tier = BY_DIGIT[e.code] || (e.code === 'KeyR' ? 'topsail' : null);
    if (tier) give(tier, e.shiftKey ? -1 : +1);
    else if (e.code === 'KeyF') for (const t of ALL_TIERS) give(t, +1);
    else if (e.code === 'KeyA') for (const t of ALL_TIERS) give(t, -1);
    else if (e.code === 'KeyH') crew.call(!crew.allHands);
    else if (e.code === 'KeyT') manoeuvre('tack');
    else if (e.code === 'KeyW') manoeuvre('wear');
    else if (e.code === 'Space') time.toggle();
    else if (e.code === 'Equal') time.faster();
    else if (e.code === 'Minus') time.slower();
    else return;

    e.preventDefault();
  });

  window.addEventListener('keyup', (e) => helm.release(e.code));
}
