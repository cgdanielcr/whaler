// The crew bar: every man down the left of the ship screen, with his face,
// his name, how he is in body and spirits, and his watch. Click a man to
// choose him; press and drag to carry him to a station or a boat.
import { portrait } from './portrait.js';

const GROUPS = [['Officers', (m) => m.officer], ['Larboard watch', (m) => m.watch === 'larboard'],
  ['Starboard watch', (m) => m.watch === 'starboard'], ['Idlers', (m) => !m.officer && !m.watch]];
const tint = (n, good, fair) => (n > good ? '#7fb069' : n > fair ? '#d9a441' : '#e2674f');

export function makeCrewBar({ company, drag }) {
  const box = document.getElementById('crewbar');
  let chosen = null;

  function render() {
    const alive = company.alive();
    box.innerHTML = GROUPS.map(([title, f]) => {
      const men = alive.filter(f);
      return men.length ? `<div class="cgrp">${title}</div>` + men.map((m) => {
        const short = `${m.name.split(' ')[0][0]}. ${m.name.split(' ').slice(1).join(' ')}`;
        return `<div class="hand${m.id === chosen ? ' on' : ''}" data-id="${m.id}" title="${m.name}, ${m.title.toLowerCase()}">` +
          `<img src="${portrait(m)}" alt="" draggable="false"><div class="cn"><b>${short}</b>` +
          `<i class="cb"><i style="width:${m.health}%;background:${tint(m.health, 60, 30)}"></i></i>` +
          `<i class="cb"><i style="width:${m.spirits}%;background:${tint(m.spirits, 55, 40)}"></i></i></div></div>`;
      }).join('') : '';
    }).join('');
  }

  box.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('.hand');
    if (!row) return;
    e.preventDefault();
    drag.begin(Number(row.dataset.id), e);
  });

  return {
    render,
    choose(id) { chosen = id; render(); },
  };
}
