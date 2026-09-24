// The ship's side of a crisis: put the voyage's own men aboard her, watch for
// the end of it, and carry what happened back to the chart.

import { load, save } from './ledger.js';

// The company in the scene is the company on the chart: the same names in
// the same berths, the sick and hurt kept below, the dead and the runaways gone.
export function fitCrew(company) {
  const l = load();
  if (!l) return;
  const pool = l.men.filter((m) => m.health !== 'lost' && m.health !== 'ran');
  const used = new Set();
  const take = (f) => {
    const m = pool.find((x) => !used.has(x.id) && f(x));
    if (m) used.add(m.id);
    return m;
  };
  for (const c of company.all) {
    const m = take((x) => x.berth === c.berth && (c.berth !== 'Foremast hand' || x.rate === c.rate)) ||
      take((x) => x.berth === c.berth);
    if (!m) { c.health = 'lost'; c.absent = true; continue; }
    Object.assign(c, { ledgerId: m.id, name: m.name, rate: m.rate, age: m.age,
      health: m.health === 'sound' ? 'sound' : 'hurt', wasSound: m.health === 'sound', deeds: [] });
  }
}

export function makeCrisis({ V, company, rig, hunt }) {
  let done = false, seen = false, lowered = false;
  const boatMen = new Set();

  function finish() {
    if (done) return;
    done = true;
    const l = load();
    if (!l || !l.crisis) return;
    const men = company.all.filter((c) => c.ledgerId !== undefined);
    const hurt = men.filter((c) => c.health !== 'sound' && c.wasSound);
    l.crisis.result = {
      men: men.map((c) => ({ id: c.ledgerId, health: c.health, deeds: c.deeds || [] })),
      hurt: hurt.map((c) => c.name),
      damage: rig.hurt().length,
      barrels: hunt && hunt.state === 'alongside' ? hunt.barrels : 0,
      stove: lowered && hurt.some((c) => boatMen.has(c))
    };
    save(l);

    const box = document.createElement('div');
    box.id = 'voyage-done';
    box.innerHTML = `<h2>${V.crisis === 'lowering' ? 'The boats are back' : 'The blow is past'}</h2>` +
      `<p class="mate">${said(l.crisis.result)}</p>` +
      '<p class="go"><button class="back">Back to the chart</button></p>';
    document.body.appendChild(box);
    box.querySelector('.back').addEventListener('click', () => {
      location.hash = 'voyage';
      location.reload();
    });
  }

  return {
    get done() { return done; },
    finish,
    // A lowering is over when the whale is alongside, or the boats are back
    // with nothing, or he sounded before they were down.
    tick() {
      if (done || V.crisis !== 'lowering') return;
      if (hunt.state === 'raised') seen = true;
      if (hunt.down) { lowered = true; for (const b of hunt.boatCrews) for (const m of b) boatMen.add(m); }
      if (hunt.state === 'alongside' || (seen && hunt.state === 'none')) finish();
    }
  };
}

function said(r) {
  const bits = [];
  if (r.barrels) bits.push(`A whale alongside: ${r.barrels} barrels in him.`);
  if (r.hurt.length) bits.push(`${r.hurt.join(', ')} hurt or lost.`);
  bits.push(r.damage ? `${r.damage} thing${r.damage > 1 ? 's' : ''} carried away aloft.` : 'Every spar whole.');
  return bits.join(' ');
}
