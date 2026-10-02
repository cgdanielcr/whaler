// What a crisis shows: over each trouble on the deck in hand, its name, a bar
// for how it stands and the hands at it (drop a man on it to send him there);
// a red count on the tab of any other deck with trouble on it; and the banner
// along the top, with the time left, Hold or Let it run, and All hands.
import * as THREE from 'three';
import { DECKS } from './stations.js';

const $ = (id) => document.getElementById(id);

export function makeCrisisMarks({ crisis, stage, layers }) {
  const box = $('labels'), tabs = $('deckTabs'), els = new Map(), v = new THREE.Vector3();
  $('crisisPause').onclick = () => crisis.toggle();
  $('crisisAll').onclick = () => crisis.callAll();

  function mark(t) {
    let e = els.get(t.id);
    if (!e) {
      e = document.createElement('div');
      e.className = 'trouble'; e.dataset.trouble = t.id;
      e.innerHTML = '<b></b><div class="bar"><i></i></div><small></small>';
      box.append(e); els.set(t.id, e);
    }
    return e;
  }

  // sel: the deck in hand; settled: the carousel has stopped on it.
  function update(sel, settled) {
    const c = crisis.now;
    document.body.classList.toggle('crisis', !!c);
    if (!c) {
      for (const e of els.values()) e.remove();
      els.clear();
      for (const b of tabs.children) b.removeAttribute('data-n');
      return;
    }
    const count = DECKS.map(() => 0);
    for (const t of c.troubles) {
      const e = mark(t), deck = DECKS.findIndex((d) => d.id === t.deck), open = t.state === 'open';
      if (open) count[deck]++;
      e.hidden = !open || !settled || deck !== sel;
      if (e.hidden) continue;
      const task = t.type === 'task';
      e.querySelector('b').textContent = t.name;
      e.querySelector('i').style.width = `${(task ? t.p : t.m) * 100}%`;
      e.classList.toggle('task', task);
      e.classList.toggle('bad', task ? t.s > 0.65 : t.m > 0.6);
      e.querySelector('small').textContent = crisis.status(t);
      v.set(t.at[0], t.at[1] + 1.25, t.at[2]).applyMatrix4(layers[deck].group.matrixWorld).project(stage.camera);
      e.style.left = `${((v.x + 1) / 2) * innerWidth}px`;
      e.style.top = `${((1 - v.y) / 2) * innerHeight}px`;
    }
    [...tabs.children].forEach((b, i) => { if (count[i] && i !== sel) b.dataset.n = count[i]; else b.removeAttribute('data-n'); });

    $('crisisTitle').textContent = c.def.title(crisis.wind);
    $('crisisLine').textContent = c.line;
    $('crisisB').style.width = `${Math.max(0, 1 - c.t / c.lasts) * 100}%`;
    $('crisisHint').textContent = c.paused ? 'Held. Drag men onto the troubles, then press Space to let it run.' : 'Press Space to hold.';
    $('crisisPause').textContent = c.paused ? 'Let it run' : 'Hold';
    $('crisisAll').hidden = c.allHands;
  }

  return { update };
}
