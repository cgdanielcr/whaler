// The pilot: one thing at a time, with a hand on your shoulder.
//
// The letter tells you where you are going. This tells you what to do next,
// one step at a time, points at the thing it is talking about, and makes a
// small noise about it when you have got it right. It replaces the scripted
// tutorial thrown out after M6 -- the difference is that this one never names
// a thing without a button that does it, never names a thing without lighting
// it up, and never moves on until the ship herself says the step is done.
//
// A voyage carries its own steps. A voyage with none has no pilot.

const put = (el, html) => { if (el.__said !== html) { el.__said = html; el.innerHTML = html; } };

const POINTING = 4.0;    // seconds the pilot holds his finger on a thing
const CHEER = 3.4;       // seconds the well-done stands before he moves on

export function makePilot(steps, { press, helm, point, unpoint }) {
  let at = 0;
  let cheering = 0;
  let pointing = 0;
  let shut = false;

  const panel = document.createElement('div');
  panel.id = 'pilot';
  panel.innerHTML =
    '<p class="tally"></p><p class="say"></p><div class="gauge"></div>' +
    '<p class="how"></p><p class="acts"></p><p class="well"></p>' +
    '<button class="shut" title="Close the pilot">I have the hang of her</button>';
  document.body.appendChild(panel);

  const out = {
    tally: panel.querySelector('.tally'),
    say: panel.querySelector('.say'),
    gauge: panel.querySelector('.gauge'),
    how: panel.querySelector('.how'),
    acts: panel.querySelector('.acts'),
    well: panel.querySelector('.well')
  };

  panel.querySelector('.shut').addEventListener('click', () => {
    shut = true;
    unpoint();
    panel.style.display = 'none';
  });

  // The buttons are rebuilt only when the step changes, so a press never
  // lands on a button that has just been swapped out under the finger.
  let drawn = -1;

  function drawActs(step) {
    put(out.acts, (step.acts || []).map((a, i) =>
      `<button class="act${a.hold ? ' hold' : ''}" data-i="${i}">${a.said}</button>`).join(''));

    for (const b of out.acts.querySelectorAll('.act')) {
      const a = step.acts[Number(b.dataset.i)];
      if (a.hold) {
        // The helm is held over, not tapped, so the button is held down.
        const down = (e) => { e.preventDefault(); helm.hold(a.hold); b.classList.add('down'); };
        const up = () => { helm.release(a.hold); b.classList.remove('down'); };
        b.addEventListener('mousedown', down);
        b.addEventListener('touchstart', down, { passive: false });
        for (const ev of ['mouseup', 'mouseleave', 'touchend', 'touchcancel']) {
          b.addEventListener(ev, up);
        }
      } else {
        b.addEventListener('click', () => press(a.key, a.shift));
      }
    }
  }

  // How far her head is off the mark, drawn as a thing that closes. The
  // needle walks in from the side and the whole bar goes solid when she is
  // near enough, which is the plainest way to say "that is right" without
  // writing it down.
  function drawGauge(step, ship) {
    if (!step.gauge) { put(out.gauge, ''); out.gauge.className = 'gauge'; return; }
    const off = ship.offMark;
    const near = Math.abs(off) < step.gauge;
    const walk = Math.max(-1, Math.min(1, off / 90));
    put(out.gauge,
      '<span class="track"><span class="notch"></span>' +
      `<span class="needle" style="left:${(50 + walk * 48).toFixed(1)}%"></span></span>` +
      `<span class="reads">${near ? 'on the mark' : `${Math.round(Math.abs(off))}° ${off > 0 ? 'to starboard' : 'to larboard'}`}</span>`);
    out.gauge.className = near ? 'gauge near' : 'gauge';
  }

  return {
    get done() { return shut || at >= steps.length; },

    tick(realDt, ship) {
      if (shut) return;
      if (at >= steps.length) { panel.style.display = 'none'; return; }

      const step = steps[at];

      if (cheering > 0) {
        cheering -= realDt;
        if (cheering <= 0) {
          at += 1;
          put(out.well, '');
          panel.classList.remove('done');
          drawn = -1;
        }
        return;
      }

      if (drawn !== at) {
        drawn = at;
        put(out.tally, `Step ${at + 1} of ${steps.length}`);
        put(out.say, step.say);
        drawActs(step);
        // He points at the thing he is talking about, and holds it there long
        // enough for you to find it.
        point(step);
        pointing = POINTING;
        panel.classList.add('fresh');
        setTimeout(() => panel.classList.remove('fresh'), 700);
      }

      if (pointing > 0) {
        pointing -= realDt;
        if (pointing <= 0) unpoint();
      }

      drawGauge(step, ship);
      put(out.how, step.how ? step.how(ship) : '');

      if (step.done(ship)) {
        unpoint();
        pointing = 0;
        put(out.well, `<span class="tick">&#10003;</span>${step.well}`);
        put(out.acts, '');
        put(out.how, '');
        put(out.gauge, '');
        out.gauge.className = 'gauge';
        panel.classList.add('done');
        cheering = CHEER;
      }
    }
  };
}
