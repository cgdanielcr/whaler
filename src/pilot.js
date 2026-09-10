// The pilot: one thing at a time, with a hand on your shoulder.
//
// The letter tells you where you are going. This tells you what to do next,
// one step at a time, and says so when you have done it. It replaces the
// scripted tutorial that was thrown out after M6 -- the difference is that
// this one never names a thing without a button that does it, and never
// moves on until the ship herself says the step is done.
//
// A voyage carries its own steps. A voyage with none has no pilot.

const put = (el, html) => { if (el.__said !== html) { el.__said = html; el.innerHTML = html; } };

export function makePilot(steps, { press, helm }) {
  let at = 0;
  let cheering = 0;       // ms left of the well-done line before she moves on
  let shut = false;

  const panel = document.createElement('div');
  panel.id = 'pilot';
  panel.innerHTML =
    '<p class="tally"></p><p class="say"></p><p class="how"></p>' +
    '<p class="acts"></p><p class="well"></p>' +
    '<button class="shut" title="Close the pilot">I have the hang of her</button>';
  document.body.appendChild(panel);

  const out = {
    tally: panel.querySelector('.tally'),
    say: panel.querySelector('.say'),
    how: panel.querySelector('.how'),
    acts: panel.querySelector('.acts'),
    well: panel.querySelector('.well')
  };

  panel.querySelector('.shut').addEventListener('click', () => {
    shut = true;
    panel.style.display = 'none';
  });

  // The buttons are rebuilt only when the step changes, so a press does not
  // land on a button that has just been replaced under the finger.
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

  return {
    get done() { return shut || at >= steps.length; },

    // Called every frame with everything a step might want to look at.
    tick(realDt, ship) {
      if (shut) return;
      if (at >= steps.length) { panel.style.display = 'none'; return; }

      const step = steps[at];

      if (cheering > 0) {
        cheering -= realDt;
        if (cheering <= 0) {
          at += 1;
          put(out.well, '');
          drawn = -1;
        }
        return;
      }

      if (drawn !== at) {
        drawn = at;
        put(out.tally, `Step ${at + 1} of ${steps.length}`);
        put(out.say, step.say);
        drawActs(step);
      }

      // How she is doing at this step, in her own words, refreshed as she goes.
      put(out.how, step.how ? step.how(ship) : '');

      if (step.done(ship)) {
        put(out.well, step.well);
        put(out.acts, '');
        put(out.how, '');
        cheering = 3.2;
      }
    }
  };
}
