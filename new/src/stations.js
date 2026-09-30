// Where everything is aboard, deck by deck, laid out as the Charles W. Morgan
// was (MORGAN.md, section 3). Places are [x along her, bow forward; height
// above that deck; z across her, starboard positive], in the ship's own units.
// `known` is true where the place is documented, false where it is inferred.

export const DECKS = [
  { id: 'upper', name: 'Upper deck' },
  { id: 'tween', name: "'Tween deck" },
  { id: 'hold', name: 'Hold' },
];

// Bulkheads on the 'tween deck, bow to stern (the order is documented).
export const TWEEN = { forecastleAft: 4.4, blubberAft: -1.0, steerageAft: -3.8, mastersCabin: -5.7 };

// Stations: a place a man is set to work, and the stat that work calls on.
export const STATIONS = [
  { id: 'foreMast', deck: 'upper', name: 'Fore masthead', at: [3.9, 3.35, 0], uses: 'eye', known: true },
  { id: 'mainMast', deck: 'upper', name: 'Main masthead', at: [0.3, 3.35, 0], uses: 'eye', known: true },
  { id: 'wheel', deck: 'upper', name: 'Wheel', at: [-6.1, 0, 0.45], uses: 'seamanship', known: false },
  { id: 'tryworks', deck: 'upper', name: 'Tryworks', at: [2.4, 0, -1.35], uses: 'strength', known: true },
  { id: 'cutting', deck: 'upper', name: 'Cutting stage', at: [0.4, -0.3, 2.35], uses: 'strength', known: true },
  { id: 'galley', deck: 'upper', name: 'Galley', at: [-3.95, 0, 0.75], uses: 'cooking', known: false },
  { id: 'bench', deck: 'upper', name: "Carpenter's bench", at: [-2.2, 0, -0.7], uses: 'carpentry', known: false },
  { id: 'blubber', deck: 'tween', name: 'Blubber room', at: [1.7, 0, 0.6], uses: 'strength', known: true },
  { id: 'pantry', deck: 'tween', name: 'Pantry', at: [-5.15, 0, 1.25], uses: 'stewarding', known: true },
  { id: 'cooper', deck: 'hold', name: 'Cooper', at: [1.2, 0, 0], uses: 'coopering', known: false },
];

// Names shown on the decks for rooms and fittings that are not stations.
export const LABELS = [
  { deck: 'upper', text: 'Windlass', at: [6.1, 0.7, 0] },
  { deck: 'upper', text: 'Forecastle scuttle', at: [5.0, 0.4, 0] },
  { deck: 'upper', text: 'Main hatch', at: [1.2, 0.3, 0] },
  { deck: 'upper', text: 'After house', at: [-5.3, 1.1, 0] },
  { deck: 'upper', text: 'Spare boats on the skids', at: [-5.3, 1.9, 0] },
  { deck: 'tween', text: 'Forecastle', at: [5.5, 0.7, 0] },
  { deck: 'tween', text: 'Steerage', at: [-2.4, 0.7, 0] },
  { deck: 'tween', text: 'Cabin', at: [-4.2, 0.7, 0] },
  { deck: 'tween', text: "Mates' cabins", at: [-4.75, 0.7, -1.3] },
  { deck: 'tween', text: "Master's cabin", at: [-6.3, 0.7, 0] },
  { deck: 'tween', text: 'Medicine chest', at: [-6.3, 0.45, 0.75] },
  { deck: 'hold', text: 'Casks in tiers', at: [-3.5, 1.4, 0] },
];

// Berths, where each sort of man goes when he is below.
export const BERTHS = {
  forecastle: [[5.0, 0, -0.9], [5.0, 0, 0.9], [5.7, 0, -0.6], [5.7, 0, 0.6], [4.7, 0, 0.1], [5.3, 0, -0.2], [5.3, 0, 0.35], [6.1, 0, 0]],
  steerage: [[-1.5, 0, -1.1], [-1.5, 0, 1.1], [-2.3, 0, -1.1], [-2.3, 0, 1.1], [-3.1, 0, -1.1], [-3.1, 0, 1.1], [-2.7, 0, 0]],
  cabin: [[-6.3, 0, -0.5], [-4.3, 0, -1.35], [-5.2, 0, -1.35], [-4.2, 0, 0.45]],
};

export const station = (id) => STATIONS.find((s) => s.id === id);
