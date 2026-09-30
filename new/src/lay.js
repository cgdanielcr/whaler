// The lay: what every man aboard is paid, which is a share of the oil and
// nothing else. No wages. A man shipped for a fraction of whatever she brought
// home, a long lay for a green hand and a short one for the master, and if
// she came home light he might be paid nothing, and owe for his slops.
//
// The master's lay and the boy's are documented for the Charles W. Morgan
// (1/15 and 1/300; MORGAN.md). The rest are the usual lays of the 1840s as
// Hohman gives them in The American Whaleman (1928). Charges off the top and
// the slop chest are inferred.
import { worth } from './stores.js';

const CHARGES = 0.06;        // wharfage, pilotage and cooperage, taken off the top
const SLOPS_A_MONTH = 2;     // clothes and tobacco drawn from the slop chest, at the master's prices
const BY_TITLE = { 'First mate': 20, 'Second mate': 35, 'Third mate': 50 };
const BY_RANK = { master: 15, mate: 60, boatsteerer: 80, cooper: 50, carpenter: 90, cook: 110, steward: 120, boy: 300, able: 150, green: 190 };

export const layOf = (m) => BY_TITLE[m.title] || BY_RANK[m.rank] || 190;

// The whole reckoning at the end of a voyage: what the oil fetched, what each
// man is due after his slops, and what is left to the owners.
export function reckon(company, v) {
  const gross = worth(v), net = gross * (1 - CHARGES), months = Math.max(1, v.days / 30);
  const shares = company.men.map((m) => {
    const lay = layOf(m), share = net / lay;
    const slops = m.officer || ['cooper', 'carpenter', 'steward'].includes(m.rank) ? 0 : SLOPS_A_MONTH * months;
    return { m, lay, share, slops, due: share - slops, dead: !m.alive };
  });
  const crew = shares.reduce((a, s) => a + s.share, 0);
  return { gross, charges: gross - net, net, shares, crew, owners: net - crew, inDebt: shares.filter((s) => s.due < 0 && !s.dead).length };
}

const cents = (n) => (n < 0 ? '−$' : '$') + Math.abs(n).toFixed(2);

// The pay list, for the end of the voyage: officers first, the boy last.
export function payList(r) {
  const rows = [...r.shares].sort((a, b) => a.lay - b.lay).map((s) => {
    const note = s.dead ? 'to his family' : s.due < 0 ? `owes the ship ${cents(-s.due)}` : `paid off ${cents(s.due)}`;
    return `<tr class="${s.dead ? 'dead' : s.due < 0 ? 'owes' : ''}"><td>${s.m.name}</td><td>${s.m.title}</td><td>1/${s.lay}</td><td>${note}</td></tr>`;
  }).join('');
  return `<div class="pay"><table>${rows}</table></div>`;
}
