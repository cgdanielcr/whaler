// The marks laid over the deck in hand: a gold badge with an icon at every
// station (hover it for the station's name and who works it; drop a man on it
// to set him there), the names of the rooms, and a nameplate over the head of
// the man chosen.
import * as THREE from 'three';
import { DECKS, STATIONS, SLOTS, LABELS, slotStation } from './stations.js';
import { icon, STATION_ICON } from './icons.js';

export function makeDeckMarks({ company, stage, layers, onStation }) {
  const box = document.getElementById('labels'), plate = document.getElementById('nameplate');
  const marks = [...STATIONS.map((s) => ({ deck: s.deck, at: [s.at[0], s.at[1] + 1.3, s.at[2]], station: s })), ...LABELS]
    .map((l) => {
      const el = document.createElement('div');
      if (l.station) {
        el.className = 'badge'; el.dataset.station = l.station.id;
        el.innerHTML = `${icon(STATION_ICON[l.station.id])}<span class="tip"></span>`;
        el.onclick = () => onStation(l.station.id);
      } else { el.className = 'label'; el.textContent = l.text; }
      box.append(el);
      return { ...l, el, deck: DECKS.findIndex((d) => d.id === l.deck) };
    });
  const v = new THREE.Vector3();

  // Who works each station, for the badge's hover; an empty station's badge shows red.
  function relabel() {
    for (const l of marks) {
      if (!l.station) continue;
      const who = SLOTS.filter((k) => slotStation(k).id === l.station.id)
        .map((k) => { const m = company.man(k); return m ? `${m.name[0]}. ${m.name.split(' ').pop()}` : null; });
      l.el.querySelector('.tip').innerHTML = `<b>${l.station.name}</b><br>${who.map((w) => w || '<em>nobody</em>').join(' / ')}`;
      l.el.classList.toggle('empty', who.includes(null));
    }
  }

  const put = (el, p, deck, lift = 0) => {
    v.set(p[0], p[1] + lift, p[2]).applyMatrix4(layers[deck].group.matrixWorld).project(stage.camera);
    el.style.left = `${((v.x + 1) / 2) * innerWidth}px`;
    el.style.top = `${((1 - v.y) / 2) * innerHeight}px`;
  };

  // settled: the carousel has stopped on deck `sel`. chosen: { name, deck, p } of the man chosen, or null.
  function update(sel, settled, chosen) {
    for (const l of marks) {
      const on = settled && l.deck === sel;
      l.el.hidden = !on;
      if (on) put(l.el, l.at, l.deck);
    }
    const show = settled && chosen && chosen.deck === sel;
    plate.hidden = !show;
    if (show) { plate.textContent = chosen.name; put(plate, chosen.p, chosen.deck, 1.2); }
  }

  return { relabel, update };
}
