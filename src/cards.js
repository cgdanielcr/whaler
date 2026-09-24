// The moments every voyage has: raising a port, raising whales, a gale, the
// Horn. Each is a card with a choice; the drawn events are in events.js.

import { STOPS } from './stops.js';
import { note, sound, pick, boatsCanLower, log } from './ledger.js';
import { EVENTS } from './events.js';

const chance = (p) => Math.random() < p;
const QUIET = [
  'A month of empty sea. The mastheads relieve each other every two hours and see nothing.',
  'Flying fish, a turtle asleep on the swell, and not a spout from one horizon to the other.',
  'The cooper sets up casks against the oil she has not yet taken. The men scrimshaw in the dog watches.',
  'Calms and cat’s-paws. The sails slat against the masts for days together.'
];

export const CARDS = {
  ...EVENTS,

  arrive: {
    head: (l) => STOPS[l.at].said,
    text: (l) => STOPS[l.at].about + (l.news[l.at] ? ` The gams said it was ${l.news[l.at]}.` : ''),
    choices: (l) => {
      const s = STOPS[l.at];
      if (s.kind === 'port') return [{ said: 'Come to anchor' }];
      const out = [{ said: 'Begin the cruise' }];
      if (s.fresh) {
        out.unshift({ said: 'Send the boats ashore for terrapin', do: () => {
          l.fresh = 0; l.flags.scurvy = false; l.weary = Math.min(100, l.weary + 10);
          for (const m of l.men) if (m.health === 'sick') m.health = 'sound';
          log(l, 'Took terrapin at the Galápagos.');
          return 'Two days of hauling tortoises down the lava to the boats, some of them heavier than ' +
            'three men. Stowed alive in the hold, they will keep for months. The scurvy is beaten back.';
        } });
      }
      return out;
    }
  },

  raised: {
    head: 'There she blows!',
    text: (c_l, c) => (c.right
      ? 'A right whale, off the ground to the north. Not the fish she came for: his oil fetches ' +
        'a third of the price of sperm, and fills a cask just the same.'
      : 'From the masthead: a school of sperm whales, spouting forward and low, two points on the lee bow.'),
    choices: (l, c) => {
      const boats = boatsCanLower(l);
      if (l.weary >= 85) return [{ said: 'The men are spent. Let them go', do: () => 'They watch the spouts go down to leeward, too tired to care.' }];
      if (!boats) return [{ said: 'Not a boat can be manned. Let them go', do: () => 'No boats, or no men to pull them.' }];
      return [
        { said: `Lower ${boats} boat${boats > 1 ? 's' : ''}`, lower: c.right ? 'right' : 'sperm' },
        ...(c.right ? [] : [{ said: 'Lower, and work the ship yourself', crisis: 'lowering' }]),
        { said: 'Let them go', do: () => 'The spouts go down to leeward and the mastheads take up the watch again.' }
      ];
    }
  },

  gale: {
    head: (l, c) => (c.typhoon ? 'A typhoon' : 'A gale of wind'),
    text: (l, c) => (c.typhoon
      ? 'The glass falls as you watch it, the swell comes from the south-east against the wind, and the sky goes the colour of brass.'
      : 'It comes on to blow from the westward: a strong gale by the forenoon, and rising.'),
    choices: (l, c) => [
      { said: 'Heave to under close-reefed topsails', do: () => {
        l.weary = Math.min(100, l.weary + 10);
        if (chance(c.typhoon ? 0.5 : 0.15)) { l.hull = Math.min(2, l.hull + 1); return 'She rides it out hove to, but she labours, and the carpenter sounds the well twice a watch now.'; }
        return 'She lies to it like a gull, and three days later it blows itself out.';
      } },
      { said: 'Carry sail and keep her on the ground', do: () => {
        let said = '';
        if (chance(0.5)) { l.hull = Math.min(2, l.hull + 1); said += 'She is strained, and makes water. '; }
        const green = pick(sound(l).filter((m) => m.rate === 'green hand'));
        if (green && chance(0.35)) { green.health = 'hurt'; note(green, 'fell from aloft in a gale'); said += `${green.name} fell from the topsail yard and is badly hurt. `; }
        return said || 'She carries it, and you do not lose a day on the ground.';
      } },
      { said: 'Take the deck yourself', crisis: 'squall' }
    ]
  },

  horn: {
    head: 'Off the Horn',
    text: () => 'Three weeks of westerly gales, sleet and snow, and she has not made fifty miles to the good.',
    choices: (l) => [
      { said: 'Keep beating to the westward', do: () => {
        l.hull = Math.min(2, l.hull + 1); l.weary = Math.min(100, l.weary + 20);
        return 'She claws her way round at last, with the men worn out and the pumps going.';
      } },
      { said: 'Heave to and wait for a slant', do: () => {
        l.month += 1; l.water = Math.max(0, l.water - 1); l.provisions = Math.max(0, l.provisions - 1);
        return 'A month lost, and the water with it, before the wind comes round and carries her past.';
      } },
      { said: 'Work her through the squalls yourself', crisis: 'squall' }
    ]
  },

  scurvy: {
    head: 'The scurvy',
    text: (l, c) => {
      const sick = l.men.find((m) => m.id === c.man);
      return `${sick ? sick.name : 'A hand'} has soft gums and old scars opening, and others are going the same way. ` +
        'Nothing cures it but fresh food: a port, or the terrapin at the Galápagos.';
    },
    choices: () => [{ said: 'Carry on' }]
  },

  dry: { head: 'The water is out', choices: () => [{ said: 'Carry on' }],
    text: () => 'The last cask is stove in and scraped. Every month without water now, men fall sick.' },
  shortAllowance: { head: 'Short allowance', choices: () => [{ said: 'Carry on' }],
    text: () => 'The bread is gone and the beef nearly so. The men are on short allowance and can do little.' },
  quiet: { head: 'Nothing raised', choices: () => [{ said: 'Carry on' }],
    text: () => QUIET[Math.floor(Math.random() * QUIET.length)] },
  said: { head: (l, c) => c.head || '', text: (l, c) => c.text, choices: () => [{ said: 'Carry on' }] }
};
