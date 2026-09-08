// The keyboard, and the little board that shows what canvas she is carrying.
// In M2 an order takes effect the instant you press the key. Timing comes later.

const ROWS = [
  { tier: 'royal',       label: 'Royals',      key: '4' },
  { tier: 'topgallant',  label: 'Topgallants', key: '3' },
  { tier: 'topsail',     label: 'Topsails',    key: '2 or r' },
  { tier: 'course',      label: 'Courses',     key: '1' },
  { tier: 'spanker',     label: 'Spanker',     key: '5' },
  { tier: 'headsail',    label: 'Headsails',   key: '6' }
];

const BY_DIGIT = { Digit1: 'course', Digit2: 'topsail', Digit3: 'topgallant', Digit4: 'royal', Digit5: 'spanker', Digit6: 'headsail' };

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'canvas-panel';
  panel.innerHTML = '<h2>Canvas</h2><table></table>' +
    '<p class="note">shift and the key to let her out again' +
    '<br><b>a</b> all plain sail &nbsp; <b>f</b> furl all</p>';
  document.body.appendChild(panel);

  const table = panel.querySelector('table');
  const cells = {};
  for (const row of ROWS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="name">${row.label}</td><td class="state"></td><td class="key">${row.key}</td>`;
    table.appendChild(tr);
    cells[row.tier] = tr.querySelector('.state');
  }
  return cells;
}

export function bindOrders(rig) {
  const cells = buildPanel();

  const refresh = () => {
    for (const row of ROWS) {
      const state = rig.stateOf(row.tier);
      cells[row.tier].textContent = state;
      cells[row.tier].className = 'state' + (state === 'furled' ? ' furled' : state === 'set' ? '' : ' reefed');
    }
  };
  refresh();

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tier = BY_DIGIT[e.code] || (e.code === 'KeyR' ? 'topsail' : null);

    if (tier) (e.shiftKey ? rig.letOut : rig.takeIn)(tier);
    else if (e.code === 'KeyA') rig.setAll('set');
    else if (e.code === 'KeyF') rig.setAll('furled');
    else return;

    e.preventDefault();
    refresh();
  });
}
