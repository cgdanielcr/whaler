// The wind, and what she makes of it.
// Forces are named, never numbered -- a merchant master in 1841 would not have
// said "force six" and the Beaufort numbers were not yet in his mouth.

export const FORCE_NAMES = [
  'Calm', 'Light airs', 'Light breeze', 'Moderate breeze', 'Fresh breeze',
  'Strong breeze', 'Fresh gale', 'Strong gale', 'Whole gale', 'Storm'
];

// How hard each force drives her, with a moderate to fresh breeze as her best.
const DRIVE = [0, 0.22, 0.45, 0.72, 1.00, 1.18, 1.30, 1.38, 1.44, 1.48];

// A square-rigger cannot lie closer than six points -- 67.5 degrees -- to the wind.
const POINTS = [
  { to: 67,  name: 'In irons',     factor: 0.00, leeway: 0 },
  { to: 80,  name: 'Close-hauled', factor: 0.55, leeway: 5 },
  { to: 110, name: 'Close reach',  factor: 0.80, leeway: 0 },
  { to: 135, name: 'Beam reach',   factor: 0.95, leeway: 0 },
  { to: 160, name: 'Broad reach',  factor: 1.00, leeway: 0 },
  { to: 181, name: 'Running',      factor: 0.85, leeway: 0 }
];

export const pointOfSail = (offWind) => POINTS.find((p) => offWind < p.to);

export const MAX_SPEED = 9;   // knots, at her best point with all plain sail in a fresh breeze

// She scales with her point of sail, with how much canvas she shows, and with
// the force. Canvas counts less than proportionally: close-reefed in a whole
// gale she still runs off at six knots.
export function speed(offWind, canvas, force) {
  if (canvas <= 0) return 0;
  return MAX_SPEED * pointOfSail(offWind).factor * Math.pow(canvas, 0.4) * DRIVE[force];
}

const COMPASS = [
  'north', 'north by east', 'north-north-east', 'north-east by north',
  'north-east', 'north-east by east', 'east-north-east', 'east by north',
  'east', 'east by south', 'east-south-east', 'south-east by east',
  'south-east', 'south-east by south', 'south-south-east', 'south by east',
  'south', 'south by west', 'south-south-west', 'south-west by south',
  'south-west', 'south-west by west', 'west-south-west', 'west by south',
  'west', 'west by north', 'west-north-west', 'north-west by west',
  'north-west', 'north-west by north', 'north-north-west', 'north by west'
];

export const compassPoint = (bearing) => COMPASS[Math.round(wrap(bearing) / 11.25) % 32];

// Bearings into 0-360, and differences into -180..180.
export const wrap = (deg) => ((deg % 360) + 360) % 360;
export const signedDiff = (a, b) => { const d = wrap(a - b); return d > 180 ? d - 360 : d; };
