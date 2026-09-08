// Ship's time. She keeps her hours in watches of four, and her half-hours in
// bells, one to eight. The two dog watches in the evening are of two hours
// each, so that the same men do not keep the same watch every night.
const WATCHES = [
  { from: 0,  hours: 4, name: 'middle watch' },
  { from: 4,  hours: 4, name: 'morning watch' },
  { from: 8,  hours: 4, name: 'forenoon watch' },
  { from: 12, hours: 4, name: 'afternoon watch' },
  { from: 16, hours: 2, name: 'first dog watch' },
  { from: 18, hours: 2, name: 'last dog watch' },
  { from: 20, hours: 4, name: 'first watch' }
];

const BELLS = ['', 'one bell', 'two bells', 'three bells', 'four bells',
               'five bells', 'six bells', 'seven bells', 'eight bells'];

const two = (n) => String(Math.floor(n)).padStart(2, '0');

export function readClock(seconds) {
  const dayMinutes = (seconds / 60) % 1440;
  const hour = dayMinutes / 60;
  const watch = [...WATCHES].reverse().find((w) => hour >= w.from);
  const intoWatch = dayMinutes - watch.from * 60;
  const bells = Math.min(watch.hours * 2, Math.floor(intoWatch / 30) + 1);

  return {
    time: `${two(hour)}:${two(dayMinutes % 60)}`,
    watch: watch.name,
    bells: BELLS[bells],
    // Starboard and larboard keep the deck turn and turn about.
    onDeck: WATCHES.indexOf(watch) % 2 === 0 ? 'starboard' : 'larboard',
    day: Math.floor(seconds / 86400)
  };
}

// Twelve game minutes to twenty-four seconds of your life, as the spec has it.
export const GAME_SECONDS_PER_SECOND = 30;
