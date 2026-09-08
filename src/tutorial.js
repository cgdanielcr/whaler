// Learning the ropes, aboard the ship herself.
//
// One instruction at a time, each waiting until you have actually done the
// thing. Nothing here changes how she sails; it only watches and prompts, and
// gets out of the way as soon as you have the hang of her.
import { signedDiff, compassPoint } from './wind.js';
import { DESTINATION } from './passage.js';

const AYE = 1.4;       // seconds to acknowledge a step before the next one opens
const LAST = 20;       // seconds the closing word stands before it fades

const STEPS = [
  {
    title: 'Look about her',
    say: 'Drag with the mouse to walk your eye round her, and scroll to come closer or stand off.',
    key: 'drag the mouse',
    open: (s) => s.weather.quiet(90),   // no squall until the lesson asks for one
    done: (s) => s.looked
  },
  {
    title: `Lay her head ${compassPoint(DESTINATION.bearing)}`,
    say: `The passage board on your right gives the bearing of your destination — ${compassPoint(DESTINATION.bearing)}, ${DESTINATION.bearing}°. Put the helm over until her head agrees with it. She answers slowly, as 350 tons will.`,
    key: '← →',
    done: (s) => Math.abs(signedDiff(DESTINATION.bearing, s.heading)) < 9
  },
  {
    title: 'Run the clock on',
    say: 'Her clock already runs thirty times faster than yours — a twelve-minute reef takes twenty-four seconds to watch. In a quiet stretch you may run it faster still, up to eight times. Space brings her to when you want to think.',
    key: '=',
    done: (s) => s.pace > 1
  },
  {
    title: 'Take in the royals',
    say: 'The wind has freshened and she is carrying more than it will bear — the mate says so on the orders board. Canvas comes off from the top down, and the royals are the first to go.',
    wait: (s) => s.over > 0,
    hold: {
      title: 'Stand on',
      say: 'Nothing wants doing yet. Watch the wind on the board to your right: it rises and falls of its own accord, and what is safe now will not be safe in an hour. When she is carrying more than it will bear, the mate will say so.',
      key: 'run the clock on if it drags'
    },
    key: '4',
    done: (s) => s.rig.working('royal') || s.rig.stateOf('royal') !== 'set'
  },
  {
    title: 'Now watch the hands',
    say: 'That order is not a thing that happens. Four hands have gone aloft and they will be three minutes about it. Watch the orders board: an order that wants more hands than are free will wait its turn.',
    key: 'no key — just watch',
    done: (s) => s.rig.stateOf('royal') === 'furled'
  },
  {
    title: 'A squall to windward',
    say: 'A dark line on the horizon, and the board says how many minutes you have. The clock is locked at ×1 while she is in sight. You have not time to get all your canvas off before she strikes — you never will have. Choose what comes in.',
    open: (s) => s.weather.summon(15),
    key: '3 — the topgallants next',
    done: (s) => s.rig.working('topgallant') || s.rig.stateOf('topgallant') !== 'set'
  },
  {
    title: 'And a reef in the topsails',
    say: 'Single-reefing wants fourteen hands and twelve minutes — near enough the whole watch. If she is short, press h and call all hands; you will get thirty, and tire them. Order it now and it may be down before the squall is on her.',
    key: '2',
    done: (s) => s.rig.working('topsail') || s.rig.stateOf('topsail') !== 'set'
  },
  {
    title: 'She is yours',
    say: `${DESTINATION.miles} miles to the ${compassPoint(DESTINATION.bearing)}. She cannot lie closer than six points to the wind — t tacks her through it, w wears her round the other way. Carry too much for too long and something will carry away. When she is within a mile of it, the account is written up.`,
    key: 'good luck to her',
    done: (s) => s.inStep > LAST
  }
];

export function makeTutorial() {
  const card = document.createElement('div');
  card.id = 'tutor';
  document.body.appendChild(card);

  let at = 0, aye = 0, inStep = 0, shown = '', over = false;

  const stop = () => { over = true; card.style.display = 'none'; };
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') stop(); });

  const draw = (what) =>
    `<div class="of">${at + 1} of ${STEPS.length}</div>` +
    `<h3>${what.title}</h3><p>${what.say}</p>` +
    `<div class="press">${what.key}</div>` +
    '<div class="skip">esc to sail without instruction</div>';

  return function tick(dt, state) {
    if (over) return;
    const step = STEPS[at];
    if (!step) { stop(); return; }

    // A step may have to wait on the weather. While it does, she still has
    // something to say, so that you are never left looking at nothing.
    const holding = !!(step.wait && !step.wait(state));
    const key = `${at}:${holding}`;
    if (shown !== key) {
      shown = key;
      if (!holding) {
        inStep = 0;
        if (step.open) step.open(state);
      }
      card.innerHTML = draw(holding ? step.hold : step);
    }
    card.style.display = '';
    if (holding) return;
    inStep += dt;

    if (aye > 0) {
      aye -= dt;
      if (aye <= 0) at++;
      return;
    }

    if (step.done({ ...state, inStep })) {
      aye = AYE;
      card.classList.add('done');
      setTimeout(() => card.classList.remove('done'), AYE * 1000);
    }
  };
}
