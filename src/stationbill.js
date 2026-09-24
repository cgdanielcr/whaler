// The station bill: which man goes where when there is work to do.
//
// A ship's station bill was a sheet posted aft, drawn up by the mates when a
// crew came aboard, naming every man's place for every piece of work. This is
// the plain version of it: four rows, and the men on each. An order draws its
// hands from the row its work belongs to -- the topmen go aloft, the waisters
// haul in the waist, the afterguard tend the braces aft, and one man steers.

const ROWS = [
  { key: 'topman', said: 'Topmen',
    does: 'Go aloft to loose, reef and furl. The best seamen, and the youngest.' },
  { key: 'waister', said: 'Waisters',
    does: 'Haul in the waist: the windlass, the halyards, the sheets. Muscle before seamanship.' },
  { key: 'afterguard', said: 'Afterguard',
    does: 'Tend the braces and the spanker, aft under the mate’s eye.' },
  { key: 'helmsman', said: 'At the wheel',
    does: 'Steers her. An older, steady hand.' }
];

// How the mate would station a man, if you leave it to him.
const MATE_WOULD = {
  boatsteerer: 'topman', 'able seaman': 'topman',
  'ordinary seaman': 'afterguard', 'green hand': 'waister'
};

const onBill = (m) => m.rate !== 'mate' && !m.idler;
const rowOf = (m) => (ROWS.some((r) => r.key === m.station) ? m.station : null);

export function makeStationBill(company, { mark }) {
  const sheet = document.createElement('div');
  sheet.id = 'station-bill';
  sheet.hidden = true;
  document.body.appendChild(sheet);
  let row = 'topman';

  const man = (m, cls) =>
    `<button class="${cls}" data-id="${m.id}">${m.name}` +
    `<em>${m.rate}, ${m.age}, ${m.strength}</em></button>`;

  function draw() {
    const hands = company.all.filter(onBill);
    const loose = hands.filter((m) => !rowOf(m));
    sheet.innerHTML =
      '<h2>The station bill</h2>' +
      '<p class="note">Pick a row, then click a man below to put him on it. ' +
      'Click a man on a row to take him off again.</p>' +
      ROWS.map((r) => {
        const on = hands.filter((m) => m.station === r.key);
        return `<section class="row${r.key === row ? ' picked' : ''}" data-row="${r.key}">` +
          `<h3><span>${r.said}</span><span class="n">${on.length}</span></h3>` +
          `<p class="does">${r.does}</p>` +
          `<div class="men">${on.map((m) => man(m, 'on')).join('') || '<i>nobody yet</i>'}</div>` +
          '</section>';
      }).join('') +
      `<h3 class="loose"><span>Not yet on the bill</span><span class="n">${loose.length}</span></h3>` +
      `<div class="men">${loose.map((m) => man(m, 'off')).join('') ||
        '<i>Every hand has his station.</i>'}</div>` +
      (loose.length ? '<button class="rest">Leave the rest to the mate</button>' : '');
  }

  sheet.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (b) {
      const m = company.all.find((x) => x.id === Number(b.dataset.id));
      m.station = b.classList.contains('on') ? null : row;
      mark(null);
      draw();
      return;
    }
    if (e.target.closest('.rest')) {
      for (const m of company.all) if (onBill(m) && !rowOf(m)) m.station = MATE_WOULD[m.rate] || 'waister';
      draw();
      return;
    }
    const r = e.target.closest('[data-row]');
    if (r) { row = r.dataset.row; draw(); }
  });

  // Point at a man on the bill, and he is pointed out on the ship.
  sheet.addEventListener('mouseover', (e) => {
    const b = e.target.closest('button[data-id]');
    mark(b ? company.all.find((x) => x.id === Number(b.dataset.id)) : null);
  });
  sheet.addEventListener('mouseleave', () => mark(null));

  const show = (on) => {
    sheet.hidden = !on;
    if (on) draw(); else mark(null);
  };

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.isContentEditable) return;
    if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') { show(sheet.hidden); e.preventDefault(); }
    else if (e.key === 'Escape' && !sheet.hidden) show(false);
  });

  return {
    show,
    get open() { return !sheet.hidden; },
    // Pick a row for the next men clicked, as the pilot does for you.
    pick(key) { if (row !== key) { row = key; if (!sheet.hidden) draw(); } },
    count: (key) => company.all.filter((m) => onBill(m) && m.station === key).length
  };
}
