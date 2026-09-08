// The men at the mastheads.
//
// On a whaling ground the lookouts go aloft at sunrise and stay there until
// sunset, two men at a time, relieved every two hours. They stand on the
// topgallant crosstrees with their arms over the topgallant yard, and they
// are looking for a spout. It is where "there she blows" comes from.
//
// The cost of it is that two hands are aloft and useless for anything else
// through every hour of daylight, which is a real weight on a short-handed
// watch. That is the point of having it in the game at all.

const SUNRISE = 5.5, SUNSET = 18.5;    // her hours, near enough for the tropics
const TRICK = 2 * 3600;                // two hours at the masthead, then relieved

export function makeLookouts(company) {
  let posted = [];
  let since = -1;

  const clear = () => {
    for (const m of posted) { m.standing = null; m.employed = null; }
    posted = [];
  };

  return {
    get posted() { return posted; },

    // The men aloft, and the masts they are on.
    get said() {
      if (!posted.length) return '';
      return posted.map((m, i) => `${m.name} at the ${i ? 'main' : 'fore'}`).join(', ');
    },

    tick(gameSeconds, watchUp) {
      const hour = (gameSeconds / 3600) % 24;
      const daylight = hour >= SUNRISE && hour < SUNSET;
      if (!daylight) { if (posted.length) clear(); since = -1; return; }

      const trick = Math.floor(gameSeconds / TRICK);
      const stillSound = posted.every((m) => m.health === 'sound');
      if (trick === since && posted.length === 2 && stillSound) return;

      // Relieve the masthead. The lookout is a young man's job, so the green
      // hands and ordinary seamen of the watch on deck go up.
      clear();
      since = trick;
      const up = company.all
        .filter((m) => m.health === 'sound' && m.watch === watchUp && !m.employed &&
                       (m.rate === 'green hand' || m.rate === 'ordinary seaman' ||
                        m.rate === 'able seaman'))
        .sort((a, b) => (a.rate === 'green hand' ? -1 : 0) - (b.rate === 'green hand' ? -1 : 0));

      posted = up.slice(0, 2);
      posted.forEach((m, i) => {
        m.standing = i ? 'main masthead' : 'fore masthead';
        m.employed = `at the ${i ? 'main' : 'fore'} masthead`;
      });
    }
  };
}
