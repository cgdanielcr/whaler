// Cutting in and trying out: what she does with a whale once he is alongside.
//
// Cutting in strips the blubber off him in one long spiral -- the blanket
// piece -- hoisted aboard by the cutting tackle at the mainmast while the
// mates stand on the stage over the water with their spades. It is a day's
// work for all hands and it cannot be hurried.
//
// Trying out is boiling the blubber down in the try-pots. It runs day and
// night until it is done, two or three days after a big whale, and the ship
// burns her own scraps for fuel and is a torch of smoke the whole time.
//
// Hours and manning are inferred. What is documented is the shape: cutting in
// is all hands and a day, trying out is watches and several days, and neither
// can be done while the boats are away.

export const WORK = {
  'cut in': {
    name: 'Cut in the whale', hands: 18, hours: 9,
    done: 'The blubber is all aboard and the carcass cast off. Now to boil him.'
  },
  'try out': {
    name: 'Try out the oil', hands: 10, hours: 34,
    done: 'The last of the oil is stowed down and the pots are cold.'
  }
};

export function makeWorkUp({ crew, hunt, cruise, stores, say, onFire }) {
  let stage = 'none';        // none | cutting | cut | trying
  let inHand = false;

  return {
    get stage() { return stage; },
    get trying() { return stage === 'trying'; },

    // What she has to show for herself just now.
    get said() {
      if (stage === 'cutting') return 'Cutting in. All hands, and it cannot be hurried.';
      if (stage === 'cut') return 'The blubber is aboard. The try-works want lighting.';
      if (stage === 'trying') return 'Trying out. The pots are going day and night.';
      return '';
    },

    // One key does whichever comes next.
    turnTo() {
      if (inHand) { say('That work is in hand already.'); return false; }
      if (hunt.down) { say('The boats are away. Nothing can be done with him until they are back.'); return false; }

      if (stage === 'none' || stage === 'cutting') {
        if (hunt.state !== 'alongside') { say('There is no whale alongside.'); return false; }
        return begin('cut in', () => {
          stage = 'cut';
          say(WORK['cut in'].done);
        });
      }
      if (stage === 'cut') {
        return begin('try out', () => {
          const got = hunt.barrels;
          cruise.stow(got);
          stage = 'none';
          hunt.finished();
          if (onFire) onFire(false);
          say(`${WORK['try out'].done} ${got} barrels stowed down.`);
        }, () => { stage = 'trying'; if (onFire) onFire(true); });
      }
      say('There is nothing of his left to do.');
      return false;
    }
  };

  function begin(key, whenDone, whenStarted) {
    const job = WORK[key];
    if (job.hands > crew.onDeck) {
      say(`${job.name} wants ${job.hands} hands, and she has ${crew.onDeck}. Call all hands.`);
      return false;
    }
    inHand = true;
    if (key === 'cut in') stage = 'cutting';
    crew.issue({
      name: job.name, hands: job.hands, minutes: job.hours * 60, whaling: true,
      onStart: whenStarted,
      onDone: () => { inHand = false; whenDone(); }
    });
    return true;
  }
}
