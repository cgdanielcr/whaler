// The paper round the view from above: a strip of buttons along the top, and
// the names of her rooms written over them when she is opened up.
import * as THREE from 'three';

const RIG_SAID = { standing: 'standing', ghosted: 'ghosted', struck: 'struck' };

export function bindPanel(act, labels, camera) {
  const bar = document.createElement('div');
  bar.id = 'above';
  bar.hidden = true;
  bar.innerHTML =
    '<h2>From above</h2>' +
    '<button data-do="whole">Her whole</button>' +
    '<button data-do="section"><b>x</b> In section</button>' +
    '<button data-do="tween"><b>d</b> Draw out the ’tween decks</button>' +
    '<button data-do="hold"><b>d</b> Draw out the hold</button>' +
    '<button data-do="down"><b>z</b> Look straight down</button>' +
    '<button data-do="rig">Her rig: standing</button>' +
    '<button data-do="leave"><b>v</b> Back aboard</button>';
  document.body.appendChild(bar);

  const tags = document.createElement('div');
  document.body.appendChild(tags);
  for (const l of labels) {
    l.el = document.createElement('div');
    l.el.className = 'room-tag';
    l.el.textContent = l.said;
    l.el.hidden = true;
    tags.appendChild(l.el);
  }

  const btn = (what) => bar.querySelector(`[data-do="${what}"]`);
  const show = (state) => {
    bar.hidden = !state.on;
    for (const m of ['whole', 'section', 'tween', 'hold']) btn(m).classList.toggle('on', state.mode === m);
    btn('down').classList.toggle('on', state.down);
    btn('down').lastChild.textContent = state.down ? ' Back to the angle' : ' Look straight down';
    btn('rig').textContent = `Her rig: ${RIG_SAID[state.rig]}`;
    if (!state.on) for (const l of labels) l.el.hidden = true;
  };

  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const what = b.dataset.do;
    if (what === 'leave') show(act.toggle(false));
    else if (what === 'down') show(act.down());
    else if (what === 'rig') show(act.rig());
    else show(act.mode(what));
    b.blur();
  });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = (e.key || '').toLowerCase();
    if (k === 'v') show(act.toggle());
    else if (!act.state.on) return;
    else if (k === 'x') show(act.mode(act.state.mode === 'section' ? 'whole' : 'section'));
    else if (k === 'd') show(act.mode({ tween: 'hold', hold: 'whole' }[act.state.mode] || 'tween'));
    else if (k === 'z') show(act.down());
    else return;
    e.preventDefault();
  });

  const v = new THREE.Vector3();
  return {
    frame(state, drawers) {
      for (const l of labels) {
        const out = state.mode === l.level && drawers[l.level].now > 0.95;
        l.el.hidden = !(state.mode === 'section' || out);
        if (l.el.hidden) continue;
        l.at.getWorldPosition(v).project(camera);
        l.el.style.left = `${(v.x + 1) / 2 * window.innerWidth}px`;
        l.el.style.top = `${(1 - v.y) / 2 * window.innerHeight}px`;
      }
    }
  };
}
