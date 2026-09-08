// Putting her to rights at sea.
//
// A ship three years from home mends herself or does without. A split sail is
// unbent and a new one bent in its place out of the spare canvas. A sprung
// yard is fished -- splinted with a spare spar and woolded round with rope --
// which is the carpenter's work. A sprung topmast has to be sent down and a
// new one sent up, which is the heaviest job she ever does at sea short of
// losing a mast altogether.
//
// The hands and hours are inferred. The relative costs are the point: bending
// a sail is an afternoon, fishing a yard is longer, and sending up a topmast
// costs you the better part of a day and a spar you may want again.

export const MENDING = {
  'split sail': {
    name: 'Bend a new sail',
    wants: { canvas: 1 },
    hands: 8, hours: 3,
    tradesman: null,
    said: (s) => `A new sail is bent in place of the ${s.toLowerCase()}.`,
    lacking: 'There is no canvas left in the sail locker.'
  },
  'sprung yard': {
    name: 'Fish the yard',
    wants: { spars: 1, cordage: 1 },
    hands: 6, hours: 6,
    tradesman: 'Carpenter',
    said: (s) => `The ${s.toLowerCase()} yard is fished, and will bear a sail again.`,
    lacking: 'She has no spare spar to fish it with.'
  },
  'sprung topmast': {
    name: 'Send up a new topmast',
    wants: { spars: 1, cordage: 2 },
    hands: 12, hours: 10,
    tradesman: 'Carpenter',
    said: (s) => `A new topmast is sent up on the ${s.split(' ')[0].toLowerCase()}mast.`,
    lacking: 'She has no spare spar to send up.'
  }
};

// Worst first: a sprung topmast costs her three sails, a split sail only one.
const WORST = ['sprung topmast', 'sprung yard', 'split sail'];

export function makeRepairs({ rig, crew, stores, company, say }) {
  // One job at a time. She has one carpenter and one set of hands.
  let inHand = null;

  const workable = () => rig.broken()
    .filter((s) => MENDING[s.gone])
    .sort((a, b) => WORST.indexOf(a.gone) - WORST.indexOf(b.gone));

  return {
    get busy() { return !!inHand; },

    // What she could put right next, if anything.
    get next() {
      const [sail] = workable();
      return sail ? { sail, job: MENDING[sail.gone] } : null;
    },

    // Turn to. The mate says plainly why she cannot, when she cannot.
    turnTo() {
      if (inHand) { say(`${inHand.name} is in hand already.`); return false; }

      const up = this.next;
      if (!up) { say('There is nothing of hers wanting repair.'); return false; }
      const { sail, job } = up;

      for (const what in job.wants) {
        if (!stores.has(what, job.wants[what])) { say(job.lacking); return false; }
      }

      const man = job.tradesman ? company.tradesman(job.tradesman) : null;
      if (job.tradesman && !man) {
        say(`The ${job.tradesman.toLowerCase()} is in no state to work.`);
        return false;
      }
      if (job.hands > crew.onDeck) {
        say(`${job.name} wants ${job.hands} hands, and the watch has ${crew.onDeck}. Call all hands.`);
        return false;
      }

      for (const what in job.wants) stores.take(what, job.wants[what]);
      if (man) company.setJob(man, job.name);

      inHand = job;
      crew.issue({
        name: `${job.name} — ${sail.name.toLowerCase()}`,
        hands: job.hands, minutes: job.hours * 60, mending: true,
        onDone: () => {
          const back = rig.mend(sail);
          if (man) company.setJob(man, null);
          inHand = null;
          say(job.said(sail.name) + (back.length > 1 ? ` She has ${back.length} sails back.` : ''));
        }
      });
      return true;
    }
  };
}
