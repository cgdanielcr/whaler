// The chances of the sea: things that happen on a quiet day and want a
// decision from the master. Each is put to him as a choice, and the world
// waits for his answer. Every choice costs something.
import { cheer } from './morale.js';
import { room } from './stores.js';
import { hud } from './hud.js';

const rand = Math.random;
const pick = (a) => a[Math.floor(rand() * a.length)];

export function makeEvents(g) {
  const { v, company, whales, helm, season } = g;
  let quiet = 4;                               // days before anything more may happen
  const hand = () => pick(company.alive().filter((m) => !m.officer));
  const day = (n) => { v.eat += n; v.date.setDate(v.date.getDate() + n); v.days += n; };

  const EVENTS = [
    { when: () => true, run: () => ['A sail', 'A sail to leeward: the Abigail of New Bedford, eleven months out. Her master signals to gam: to heave to, and visit, and trade the news.', [
      ['Heave to and gam', () => {
        day(1); cheer(company, 6);
        for (const w of whales.list) if (w.state === 'free' && Math.hypot(w.group.position.x - helm.pos.x, w.group.position.z - helm.pos.z) < 260) w.sighted = true;
        hud.toast('A day lost, and well lost. The men trade yarns and newspapers, and her master marks your chart with where he raised whales.');
      }, 'A day lost. The men are cheered, and you learn where whales lie.'],
      ['Stand on', () => { cheer(company, -2); hud.toast('She dips her ensign as you pass. The men watch her out of sight.'); }, 'No time lost. The men would have liked it.'],
    ]] },
    { when: () => true, run: () => {
      const m = hand();
      return ['Fever in the forecastle', `${m.name} is down with a fever, and cannot stand his watch. The steward asks leave to nurse him aft on the cabin stores.`, [
        ['Nurse him aft', () => { v.stores = Math.max(0, v.stores - 2); m.health = Math.max(m.health - 15, 20); cheer(company, 2); hud.toast(`${m.name} is carried aft. Two days' provisions go to broth and arrowroot.`); }, "Two days' provisions. He will mend."],
        ['Keep him to his duty', () => {
          m.health = Math.max(5, m.health - 55); cheer(company, -4);
          hud.toast(`${m.name} is turned to with the rest, shaking. The forecastle does not like it.`);
        }, 'Nothing spent. He may not mend, and the men will remember it.'],
      ]];
    } },
    { when: () => true, run: () => {
      const a = hand(), b = hand();
      return ['A fight forward', `${a.name} has laid ${a === b ? 'a shipmate' : b.name} out with a belaying pin over a stolen plug of tobacco. The mate has him by the collar and looks to you.`, [
        ['Seize him up and flog him', () => { a.health -= 20; a.spirits = Math.max(0, a.spirits - 25); cheer(company, -4); hud.toast(`A dozen lashes at the gangway, all hands to witness. There will be no more fighting, and no singing either.`); }, 'Order is kept. The men are cowed and sullen.'],
        ['Stop his tobacco and his watch below', () => { a.weary = Math.min(100, (a.weary || 0) + 40); a.spirits = Math.max(0, a.spirits - 8); hud.toast(`${a.name} is kept on deck through his watch below, and the matter is closed.`); }, 'He is worn out for days. The rest think it fair.'],
        ['Let it pass', () => { if (rand() < 0.5) { cheer(company, -6); hud.toast('It does not pass. There are two parties in the forecastle now, and neither speaks to the other.'); } else hud.toast('By the dog watch they are sharing a pipe.'); }, 'It may blow over, or it may fester.'],
      ]];
    } },
    { when: () => room(v) >= 25, run: () => ['A dead whale', 'A dead whale adrift, a week gone and blown up like a bladder: a stinker. There is oil in her yet, and the chance of ambergris in her gut, worth its weight in gold.', [
      ['Cut her in', () => {
        const bbl = Math.min(room(v), 15 + Math.floor(rand() * 20)); v.whale += bbl; cheer(company, -4);
        if (rand() < 0.2) { v.sperm += Math.min(room(v), 12); hud.toast(`${bbl} barrels of dark oil, and in her gut a grey lump the size of a man's head. Ambergris!`); }
        else hud.toast(`${bbl} barrels of dark, rank oil. The men will smell of her for a week.`);
      }, 'Some oil for no chase. Foul work: the men will hate it.'],
      ['Leave her to the birds', () => hud.toast('She is left astern, and the gulls come down on her again.'), 'Nothing gained, nothing spent.'],
    ]] },
    { when: () => season.edge - helm.pos.z > -90 || rand() < 0.3, run: () => ['Fog', 'The fog comes down thick as wool. From the forecastle head a man cannot see the foremast.', [
      ['Heave to until it lifts', () => { day(1); hud.toast('She lies to under a backed topsail, the bell going every two minutes. A day lost.'); }, 'A day lost. Nothing risked.'],
      ['Stand on under easy sail', () => {
        if (rand() < (season.edge - helm.pos.z > -90 ? 0.55 : 0.15)) { v.hull = Math.max(1, v.hull - 14); cheer(company, -2); hud.toast('Ice under the bows! She strikes before the helm can answer, and the carpenter is sent below to sound the well.'); }
        else hud.toast('She feels her way through it, a man in the chains with the lead. By noon it burns off.');
      }, 'No time lost. Near the ice, she may strike.'],
    ]] },
    { when: () => company.count < 27, run: () => {
      const n = Math.min(3, 29 - company.count);
      return ['Men on the ice', `A whaleboat hauled up on a floe, and ${n} men beside it waving a shirt on an oar: the last of a stove boat's crew from some other ship.`, [
        ['Take them aboard', () => { const names = company.ship(n); v.crew = company.count; cheer(company, 3); hud.toast(`${names.join(', ')} ${n > 1 ? 'are' : 'is'} taken aboard and signed on the articles.`); }, `${n} more hands, and ${n} more mouths.`],
        ['Leave provisions and stand on', () => { v.stores = Math.max(0, v.stores - 1); cheer(company, -5); hud.toast('A cask of bread is left on the floe. No man aboard will meet your eye.'); }, "A day's provisions. The men will think the worse of you."],
      ]];
    } },
  ];

  return {
    // Each quiet morning at sea there is some chance of one.
    newDay() {
      if (--quiet > 0 || season.gale || rand() > 0.3) return;
      const e = pick(EVENTS.filter((x) => x.when()));
      const [title, text, options] = e.run();
      quiet = 6;
      v.paused = true;
      hud.decide(text, options.map(([label, fn, note]) => [label, () => { v.paused = false; fn(); }, note]), title);
    },
  };
}
