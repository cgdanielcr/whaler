// The lay: what every man aboard is paid, which is a share of the oil and
// nothing else. No wages. A man shipped for a fraction of whatever she brought
// home -- a long lay for a green hand, a short one for the master -- and if
// she came home clean he was paid nothing at all, and might owe for his slops.
//
// The master's lay and the boy's are documented for the Morgan (1/12 to 1/16,
// and 1/300 -- see MORGAN.md). The rest are the usual lays of the 1840s as
// Hohman gives them in *The American Whaleman* (1928); ships varied, and a
// good hand bargained a shorter lay than a poor one. The price is the average
// for sperm oil in 1841 in Starbuck's tables, about 94 cents the gallon.

const GALLONS = 31.5;              // to the barrel
const PRICE = 0.94;                // dollars the gallon, sperm oil, 1841
const WHALE_PRICE = 0.34;          // whale oil, from the right whale, 1841 -- about
const CHARGES = 0.06;              // wharfage, pilotage, cooperage off the top -- inferred
const SLOPS_A_MONTH = 2;           // drawn from the slop chest at the master's prices -- inferred
const MASTER = 15;

// Shortest lay first. Keyed by berth, then by rating for the foremast hands.
const LAYS = {
  'First mate': 20, 'Second mate': 35, 'Third mate': 50, 'Boatsteerer': 80,
  'Cooper': 50, 'Carpenter': 90, 'Cook': 110, 'Steward': 120, 'Cabin boy': 300,
  'able seaman': 150, 'ordinary seaman': 170, 'green hand': 190
};

const layOf = (m) => LAYS[m.berth] || LAYS[m.rate] || 190;
const dollars = (n) => (n < 0 ? '−$' : '$') +
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// The whole reckoning, from the barrels stowed down and the days she was out.
// A whole voyage also brings whale oil at a lower price, money laid out in
// ports that comes off the top, and deserters, whose lay is forfeit.
export function reckon(men, barrels, days, extra = {}) {
  const { whale = 0, outlays = 0, ambergris = 0, master = MASTER } = extra;
  const gross = barrels * GALLONS * PRICE + whale * GALLONS * WHALE_PRICE + ambergris;
  const net = Math.max(0, gross * (1 - CHARGES) - outlays);
  const months = Math.max(1, days / 30);

  const shares = men.map((m) => {
    const lay = layOf(m);
    const share = m.health === 'ran' ? 0 : net / lay;
    // The mates and the tradesmen kept no account at the slop chest worth
    // reckoning; the foremast hands and the boy lived on it.
    const slops = /mate|Cooper|Carpenter|Steward/.test(m.berth) ? 0 : SLOPS_A_MONTH * months;
    const due = share - slops;
    const said = m.health === 'ran' ? `1/${lay} lay &mdash; <em>forfeit: he ran</em>`
      : `1/${lay} lay &mdash; ${owes(due)}${m.health === 'lost' ? ', to his family' : ''}`;
    return { name: m.name, lay, share, slops, due, said };
  });

  return {
    gross, net,
    master: { lay: master, share: net / master },
    shares,
    said: `The oil fetches <b>${dollars(gross)}</b>` +
      (whale ? ' (sperm at 94 cents the gallon, whale oil at 34)' : ' at 94 cents the gallon') +
      `; ${dollars(net)} after the charges of the voyage` +
      (outlays ? ` and ${dollars(outlays)} laid out in port` : '') +
      `. Your lay, at 1/${master}, is <b>${dollars(net / master)}</b>.`,
    inDebt: shares.filter((s) => s.due < 0).length
  };
}

export { dollars };

function owes(due) {
  if (due < 0) return `<em>owes the ship ${dollars(-due)}</em>`;
  return `paid off ${dollars(due)}`;
}
