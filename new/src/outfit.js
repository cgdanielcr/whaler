// The outfit: what the master may lay out his own purse on before a voyage,
// over and above what the owners put aboard. Each thing lasts the one voyage.
export const OUTFIT = [
  { id: 'copper', name: 'New copper on her bows', price: 160, note: 'The ice does her a third less harm.' },
  { id: 'canvas', name: 'A spare suit of sails', price: 110, note: 'Canvas carries longer before it goes, and is sooner replaced.' },
  { id: 'boat', name: 'A third spare boat', price: 90, note: 'One more boat on the skids against a stove one.' },
  { id: 'line', name: 'Two extra tubs of whale line', price: 70, note: 'A sounding whale is less often lost.' },
  { id: 'casks', name: 'Seasoned casks', price: 80, note: 'No provisions spoil, and no oil leaks in the stowing.' },
  { id: 'medicine', name: 'A full medicine chest', price: 60, note: 'The sick mend faster, and scurvy bites less.' },
  { id: 'tobacco', name: 'Tobacco and molasses', price: 50, note: 'The men keep their spirits better.' },
];

// What the gear does to the day's reckoning of the stations (see effects.js).
export function gearEffects(fx, gear) {
  if (gear.copper) fx.iceHarm *= 0.66;
  if (gear.casks) { fx.spoil = 0; fx.stow = 1; }
  if (gear.medicine) { fx.care *= 1.5; fx.scurvy *= 0.7; }
  return fx;
}
