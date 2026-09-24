// The places a Pacific sperm-whaling voyage of the 1840s went, and how long it
// took to get between them.
//
// The circuit is the real one: out by the Azores, round the Horn, water at a
// Chilean port, the Offshore Ground, Honolulu in the spring and the autumn,
// and the Japan Ground in the northern summer. Positions are real. Passage
// times are the usual ones, rounded to the month. How thick the whales were on
// each ground is inferred and tuned for play; that the Japan Ground was a
// summer ground and the typhoons came after it is documented.

export const STOPS = {
  newbedford: { said: 'New Bedford', kind: 'home', lon: -70.9, lat: 41.6,
    about: 'Where she was fitted out, and where her owners wait for the oil.' },
  fayal: { said: 'Fayal', kind: 'port', lon: -28.7, lat: 38.5,
    about: 'In the Azores. Water, fresh fruit, and Portuguese boys eager to ship as green hands.',
    runs: 0.02, ships: { rate: 'green hand', most: 6, advance: 10 } },
  talcahuano: { said: 'Talcahuano', kind: 'port', lon: -73.1, lat: -36.7,
    about: 'On the coast of Chile. Water and wood and cheap provisions, and every grog-shop ' +
      'in the town is looking for a sailor who wants to stay.',
    runs: 0.06, ships: { rate: 'ordinary seaman', most: 2, advance: 15 }, repairs: true },
  offshore: { said: 'The Offshore Ground', kind: 'ground', lon: -112, lat: -7,
    about: 'A thousand miles off Peru. Sperm whales the year round, and nowhere to go ' +
      'for water nearer than the coast.',
    rich: () => 0.8, gales: 0.12 },
  galapagos: { said: 'The Galápagos', kind: 'ground', lon: -90.5, lat: -0.6,
    about: 'Thin whaling, but the islands have terrapin: great tortoises that live for ' +
      'months in the hold and are the best fresh meat in the Pacific.',
    rich: () => 0.4, gales: 0.05, fresh: true },
  honolulu: { said: 'Honolulu', kind: 'port', lon: -157.9, lat: 21.3,
    about: 'In the Sandwich Islands. The whaling fleet comes in each spring and autumn. ' +
      'Island men ship here as able seamen, and oil can be sent home by freighter.',
    runs: 0.12, ships: { rate: 'able seaman', most: 6, advance: 25 }, repairs: true,
    freight: true },
  japan: { said: 'The Japan Ground', kind: 'ground', lon: 150, lat: 33,
    about: 'The richest sperm-whale ground in the world, from May to September. ' +
      'After that the whales go and the typhoons come.',
    rich: (m) => (inMonths(m, 4, 8) ? 0.95 : 0.25),
    gales: 0.1, typhoons: (m) => inMonths(m, 6, 9) }
};

// Months apart. Going home from the Pacific means the Horn again.
export const LINKS = [
  ['newbedford', 'fayal', 1],
  ['fayal', 'talcahuano', 4, 'horn'],
  ['talcahuano', 'offshore', 1],
  ['offshore', 'galapagos', 1],
  ['galapagos', 'talcahuano', 1],
  ['offshore', 'honolulu', 2],
  ['galapagos', 'honolulu', 2],
  ['honolulu', 'japan', 2],
  ['talcahuano', 'newbedford', 4, 'horn'],
  ['offshore', 'newbedford', 5, 'horn'],
  ['japan', 'newbedford', 6, 'horn'],
  ['honolulu', 'newbedford', 5, 'horn']
];

// Where she may go from here, and what it costs.
export function linksFrom(at) {
  const out = [];
  for (const [a, b, months, via] of LINKS) {
    if (a === at) out.push({ to: b, months, via });
    else if (b === at && !via && a !== 'newbedford') out.push({ to: a, months, via });
  }
  // The only way out of New Bedford is by Fayal; the only way home from Fayal
  // is back the way she came.
  if (at === 'fayal') out.push({ to: 'newbedford', months: 1 });
  return out;
}

// The voyage begins in September 1841, as the Morgan's did.
const NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
export const monthOf = (m) => (8 + m) % 12;
export const dated = (m) => `${NAMES[monthOf(m)]} ${1841 + Math.floor((8 + m) / 12)}`;
function inMonths(m, from, to) { const k = monthOf(m); return k >= from && k <= to; }
