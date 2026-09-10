// The passage round the Horn, and the wind she finds on the way.
//
// A New Bedford whaler bound for the Pacific grounds in 1841 did not steer a
// straight line, because the wind will not let her. She stands south-east into
// the north-east trades, crosses the line well to the westward -- about
// thirty degrees, to weather Cape Sao Roque on the shoulder of Brazil -- runs
// south through the south-east trades, picks up the westerlies below thirty
// south, and beats round the Horn against everything the Southern Ocean has.
// Then north-west into the Pacific trades for the Offshore Ground.
//
// The waypoints are plausible reconstructions of that route rather than any
// particular ship's track, which is why they are marked inferred. The wind
// belts are not: the trades, the doldrums, the horse latitudes and the
// westerlies are where they are, and they are the reason the route has the
// shape it has.

// Where she goes. Distances fall out of the coordinates, so nothing here is a
// number anybody invented. *Route inferred; the places are real.*
export const ROUTE = [
  { lat: 32.0, lon: -64.5, said: 'windward of Bermuda' },
  { lat: 14.0, lon: -40.0, said: 'the north-east trades' },
  { lat: 0.0, lon: -29.5, said: 'the line' },
  { lat: -22.0, lon: -33.0, said: 'the south-east trades' },
  { lat: -38.0, lon: -50.0, said: 'off the River Plate' },
  { lat: -52.0, lon: -62.0, said: 'the Falklands' },
  { lat: -56.5, lon: -67.5, said: 'Cape Horn' },
  { lat: -40.0, lon: -85.0, said: 'clear of the Horn' },
  { lat: -12.0, lon: -108.0, said: 'the Offshore Ground' }
];

// The wind belts of the world, north to south. Each says what force she blows
// there, what quarter she blows from, and how settled she is.
//
// These are documented in every book of sailing directions there has ever
// been. The figures are rounded to what the game's force scale can say.
// Each belt is given by the latitude it is centred on, and what she blows
// there. Between two centres the wind is mixed from both, because a wind belt
// has no line painted on the sea and a ship works out of one and into the next
// over a few days' sailing.
const BELTS = [
  { at: 65, from: 250, force: 6.2, steady: 0.5, said: 'the northern westerlies' },
  { at: 45, from: 265, force: 4.6, steady: 0.7, said: 'the westerlies' },
  { at: 32, from: 200, force: 2.2, steady: 0.3, said: 'the horse latitudes' },
  { at: 18, from: 60, force: 4.0, steady: 1.0, said: 'the north-east trades' },
  { at: 4, from: 150, force: 1.4, steady: 0.2, said: 'the doldrums' },
  { at: -14, from: 120, force: 4.0, steady: 1.0, said: 'the south-east trades' },
  { at: -29, from: 340, force: 2.2, steady: 0.3, said: 'the southern horse latitudes' },
  { at: -42, from: 280, force: 5.4, steady: 0.8, said: 'the westerlies' },
  { at: -55, from: 285, force: 7.0, steady: 0.9, said: 'the roaring forties' }
];

export function beltAt(lat) {
  if (lat >= BELTS[0].at) return BELTS[0];
  const last = BELTS[BELTS.length - 1];
  if (lat <= last.at) return last;

  let i = 0;
  while (i < BELTS.length - 2 && lat < BELTS[i + 1].at) i += 1;
  const north = BELTS[i], south = BELTS[i + 1];
  const t = (north.at - lat) / (north.at - south.at);

  // The wind's quarter turns the short way round, not the long way.
  const turn = ((south.from - north.from + 540) % 360) - 180;
  return {
    from: (north.from + turn * t + 360) % 360,
    force: north.force + (south.force - north.force) * t,
    steady: north.steady + (south.steady - north.steady) * t,
    said: (t < 0.5 ? north : south).said
  };
}
