// Things that happen in a month at sea, each with a choice and what it costs.
//
// Drafts, in the owner's keeping to rewrite. Each is something the logbooks
// and the memoirs record often enough to be ordinary: the gam, the fight in
// the forecastle, the man overboard, the leaking casks. Every choice trades
// two of three things: time, the ship, and the men.

import { STOPS } from './stops.js';
import { note, sound, pick, byId, log } from './ledger.js';
import { met } from './wants.js';

const chance = (p) => Math.random() < p;
const hands = (l) => sound(l).filter((m) => m.berth === 'Foremast hand');
const man = (l, c) => byId(l, c.man) || { name: 'a hand', deeds: [] };

export const EVENTS = {
  gam: { where: ['ground', 'passage'], w: 3,
    head: 'A sail in sight',
    text: () => 'A New Bedford ship, eighteen months out, heaves to and runs up her ensign. ' +
      'Her master would come aboard: a gam, as whalemen call it, the visiting of one ship by ' +
      'another in the middle of the ocean, for news, for letters, for company.',
    choices: () => [
      { said: 'Gam with her, and swap the news', do: (l) => {
        l.weary = Math.max(0, l.weary - 10);
        const g = pick(['offshore', 'galapagos', 'japan'].filter((k) => k !== l.at));
        const thick = STOPS[g].rich(l.month + 2) - (l.grounds[g] || 0) > 0.55;
        l.news[g] = thick ? 'thick' : 'thin';
        const glad = l.men.filter((m) => m.want === 'letters' && !m.wanted && m.health === 'sound' && chance(0.6));
        for (const m of glad) met(m, 'had a letter from home at a gam');
        log(l, `Gammed with a New Bedford ship: ${STOPS[g].said} ${thick ? 'thick with whales' : 'fished thin'}.`);
        return `Her master says ${STOPS[g].said} is ${thick ? 'thick with whales' : 'fished thin, and not worth the passage'}. ` +
          (glad.length ? `She has letters: ${glad.map((m) => m.name).join(', ')} ${glad.length > 1 ? 'have' : 'has'} news from home. ` : '') +
          'The men are the better for it.';
      } },
      { said: 'Dip your ensign and keep on', do: () => 'She falls astern. The men watch her go.' }
    ] },

  fight: { where: ['ground', 'passage'], w: 2,
    cast: (l) => { const a = pick(hands(l)); return a && { man: a.id }; },
    head: 'The forecastle',
    text: (l, c) => `${man(l, c).name} and another hand have fought over a stolen plug of tobacco, ` +
      'and one has a knife cut to show for it. The mate wants him seized up and flogged at the gangway.',
    choices: (l, c) => [
      { said: 'Flog him', do: () => {
        note(man(l, c), 'flogged at the gangway'); l.flags.flogged = true;
        return 'A dozen with the cat. The forecastle is quiet, and sullen, and remembers it. ' +
          'More of them will run at the next port.';
      } },
      { said: 'Stop his grog and let it lie', do: () => {
        l.weary = Math.min(100, l.weary + 10);
        return 'The mate thinks you soft, and the watch drags its feet for a week.';
      } }
    ] },

  overboard: { where: ['ground', 'passage'], w: 2, when: (l) => l.weary > 25,
    cast: (l) => { const a = pick(hands(l)); return a && { man: a.id }; },
    head: 'Man overboard',
    text: (l, c) => `Reefing in a squall, at night, in a heavy sea: ${man(l, c).name} is off the ` +
      'fore yard. The lookout hears him hail, once, from somewhere astern.',
    choices: (l, c) => [
      { said: 'Round to and lower a boat', do: () => {
        const m = man(l, c);
        if (chance(0.15) && l.boats > 0) l.boats -= 1;
        if (chance(0.6)) { note(m, 'went overboard off the fore yard and was picked up'); return `They find him, half drowned, holding to an oar. ${m.name} is aboard.`; }
        m.health = 'lost'; note(m, 'went overboard off the fore yard');
        return `They pull about in the dark for an hour and do not find him. ${m.name} is gone.`;
      } },
      { said: 'Keep on: no boat will live in this', do: () => {
        const m = man(l, c); m.health = 'lost'; note(m, 'went overboard off the fore yard');
        l.weary = Math.min(100, l.weary + 10);
        return `${m.name} is gone. Nobody in the forecastle says anything to you about it.`;
      } }
    ] },

  carpenter: { where: ['ground', 'passage'], w: 3,
    when: (l) => l.boats < l.ship.boats && (l.flags.planking ?? 2) > 0,
    head: 'The carpenter’s report',
    text: (l) => `She has ${l.boats} whaleboat${l.boats === 1 ? '' : 's'} fit to lower. The carpenter ` +
      'can build another from the spare planking, but it is the same planking he would want ' +
      'for the hull.',
    choices: (l) => [
      { said: 'Set him to build a boat', do: () => {
        l.boats += 1; l.flags.planking = (l.flags.planking ?? 2) - 1;
        note(l.men.find((m) => m.berth === 'Carpenter'), 'built a whaleboat at sea');
        return 'Three weeks of sawdust in the waist, and a new boat on the cranes.';
      } },
      { said: 'Keep the planking for her hull', do: () => {
        if (l.hull > 0) { l.hull -= 1; return 'He goes over the side on a stage and makes her tighter.'; }
        return 'The planking stays below.';
      } }
    ] },

  casks: { where: ['ground'], w: 2, when: (l) => l.sperm > 150,
    head: 'The cooper',
    text: () => 'The cooper says the casks in the lower tier are leaking: oil in the bilge. ' +
      'Every one of them must be wetted down and driven tight, which is a day’s work for all hands.',
    choices: (l) => [
      { said: 'Wet the hold and drive the hoops', do: () => {
        l.weary = Math.min(100, l.weary + 10);
        note(l.men.find((m) => m.berth === 'Cooper'), 'saved the lower tier from leaking');
        return 'A day in the hold, and the oil stays in the casks.';
      } },
      { said: 'Let it be: the men are worn enough', do: () => {
        const lost = Math.round(l.sperm * 0.05); l.sperm -= lost;
        return `${lost} barrels leak into the bilge and are pumped over the side.`;
      } }
    ] },

  greenhand: { where: ['ground'], w: 2,
    cast: (l) => { const a = pick(sound(l).filter((m) => m.want === 'boats' && !m.wanted)); return a && { man: a.id }; },
    head: 'A green hand',
    text: (l, c) => `${man(l, c).name}, who shipped as a green hand, asks to go in the boats instead ` +
      'of keeping ship. He has been aloft every trick and has never once been slow.',
    choices: (l, c) => [
      { said: 'Put him in the waist boat', do: () => {
        met(man(l, c), 'went in the boats, as he wanted');
        return 'He is at the bow oar of the waist boat before you have finished saying so.';
      } },
      { said: 'Keep him aboard', do: () => 'He says nothing, and does not ask again.' }
    ] },

  mutter: { where: ['ground'], w: 4, when: (l) => l.month > 20 && l.weary > 55 && !l.flags.promised,
    head: 'Talk in the forecastle',
    text: () => 'The men are saying the voyage is long enough. They send the oldest hand aft, ' +
      'cap in hand, to ask when she turns for home.',
    choices: (l) => [
      { said: 'Promise them home after this ground', do: () => {
        l.weary = Math.max(0, l.weary - 25); l.flags.promised = l.month;
        return 'They go forward cheering. They will remember the promise, and so should you.';
      } },
      { said: 'Send him forward with a flea in his ear', do: () => {
        l.weary = Math.min(100, l.weary + 10); l.flags.flogged = true;
        return 'He goes. The forecastle watches you now the way it watches the weather.';
      } }
    ] },

  rightwhale: { where: ['passage'], w: 2,
    head: 'A right whale',
    text: () => 'A right whale, close aboard, rolling on the swell. Not the fish she came for: ' +
      'his oil fetches a third of the price of sperm, and fills a cask just the same.',
    choices: () => [
      { said: 'Lower for him', lower: 'right' },
      { said: 'Let him go, and keep her hold for sperm', do: () => 'He blows once more, and goes down.' }
    ] }
};

// Draw one event that fits where she is and what state she is in.
export function drawEvent(l, where) {
  const can = Object.entries(EVENTS).filter(([, e]) => e.where.includes(where) && (!e.when || e.when(l)));
  let r = Math.random() * can.reduce((n, [, e]) => n + e.w, 0);
  for (const [key, e] of can) {
    if ((r -= e.w) >= 0) continue;
    const cast = e.cast ? e.cast(l) : {};
    if (cast) l.cards.push({ key, ...cast });
    return;
  }
}
