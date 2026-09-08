# HANDOVER

Notes for a session picking this up cold. Read `SPEC.md` first — it is the
source of truth. Read `CLAUDE.md` for the working rules. This file only covers
what those two cannot: what was actually built, which decisions were judgement
calls, which numbers were invented, and what will bite you.

---

## Where it stands

All seven milestones (M0–M6) are built, deployed and live at
**https://cgdanielcr.github.io/whaler/**, plus an in-game tutorial that was
asked for after M6. About 2,100 lines across `index.html` and nineteen ES
modules. No build step. Three.js from CDN via import map, pinned to 0.185.1.
GitHub Pages deploys from `main`, so push equals deploy.

**The owner has not confirmed most of it by playing.** He confirmed M0 and M1.
From roughly M2 to M4 his preview was pointed at `file:///…/index.html`, which
cannot load ES modules, so he was looking at a blank blue page while saying
"go on". Do not assume anything after M1 has been seen by a human. If he
reports something odd, check the address bar before checking the code.

---

## The file map

| File | What it owns |
|---|---|
| `index.html` | The page, the import map, and every scrap of CSS |
| `src/main.js` | Scene, lights, the frame loop, her state, tacking and wearing, what happens when something carries away |
| `src/sky.js` | Gradient sky dome |
| `src/sea.js` | The sea plane and the wave field |
| `src/hull.js` | Hull geometry from stations; exports `deckAt(z)` so masts know where the deck is |
| `src/rig.js` | Masts, yards, sails, bracing, and damage to the rig |
| `src/sails.js` | Sail state maps (hoist and spread) and the geometry builders |
| `src/wind.js` | Force names, point-of-sail table, the speed model, 32-point compass |
| `src/wake.js` | The wake astern |
| `src/clock.js` | Ship's time: watches, bells, which watch has the deck |
| `src/crew.js` | Hands, all-hands, fatigue, and the order queue |
| `src/evolutions.js` | The order table: what each evolution costs in hands and minutes |
| `src/orders.js` | The keyboard. Issues orders; owns no state |
| `src/boards.js` | The DOM boards, plus the account written up on arrival |
| `src/instruments.js` | The wind dial and the navigation readouts |
| `src/weather.js` | The weather timeline: drifting force, squalls, wind shifts |
| `src/squall.js` | The dark line on the horizon |
| `src/damage.js` | What she may carry at each force, and the damage rule |
| `src/passage.js` | Destination, reckoning, arrival, and the account's figures |
| `src/tutorial.js` | The guided first passage |

---

## Things that will bite you

**1. `file://` does not work.** ES modules need a server. This is in
`CLAUDE.md` but it is the single most likely thing to waste your time, because
it presents as "a blue screen" rather than as an error.

**2. There is no Python and no Node on the owner's machine.** `CLAUDE.md` says
to use `python3 -m http.server`; that command fails there. A PowerShell
`HttpListener` script works. **Send `Cache-Control: no-store`** — without it
the browser serves stale modules and you will debug code that is not running.
That cost real time during M2.

**3. GitHub Pages takes 45–90 seconds to publish.** After pushing, poll for a
file you just changed until it returns 200 before testing the live URL.

**4. There are two clocks, deliberately.** In `main.js`:

- `seen` — what your eye sees, at life speed × the speed-up multiplier
- `gameDt` — `seen × 30`, what her clock counts

The sea streaming, the wave animation and the wake use `seen`. Evolutions,
weather, damage and the passage reckoning use `gameDt`. **Do not "fix" this
into one clock.** At 30× the water would stream past at 139 m/s and she would
look like a speedboat. The spec's 30× is about compressing *work*, not motion.

**5. Vertex colours are in the working (linear) colour space.** Pushing 0.13
into a colour attribute gives you mid-grey, not dark grey. Use
`new THREE.Color('#1b2026').convertSRGBToLinear()`. The squall was invisible
until this was found.

**6. A raw `ShaderMaterial` skips tone mapping and colour conversion.** The sky
needs `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`
after setting `gl_FragColor`, or it will not match the fogged sea and you get a
bright band at the horizon.

**7. She never moves in the scene.** She sits at the origin and only rotates;
the wave field is sampled at an offset (`runX`, `runZ`) so the swell streams
past her. Anything you add to the world must be positioned *relative to her*,
not in absolute coordinates.

**8. Square sails seen from abeam are nearly edge-on** and look as though they
have vanished. That is geometry, not a bug.

**9. Sail geometry hangs from the yard downward.** Reefing lowers the yard;
furling gathers the sail up to it. Each tier's foot follows the yard below, so
lowering a topsail yard carries the topgallant and royal down bodily with it.
`rig.applyAll()` therefore redraws bottom-up.

---

## Decisions that were judgement calls

**Topgallants are set-or-furled, not reefable.** §7.2 says only courses and
royals lack reef states, which would put topgallants on the reef ladder. But
§7.3's order table has "take in topgallants" and no reef order for them, and
§7.4 says "topgallants in" as one step. M4 forced the question because every
evolution has to be named. **The owner has not ruled on this.** It is a
one-word change in `rig.js` (`ladder: tier === 'topsail' ? REEFABLE : PLAIN`).

**Headsails are set-or-furled; the spanker takes the full reef ladder.** The
spec is silent on both. A jib is hauled down, not reefed; a spanker has reef
bands.

**Tacking is refused outside 67°–95° off the wind** — she must be by the wind
to stay. Inside six points she is in irons and must wear. Wearing is the way
out of irons and never fails, as the spec says.

**Leeway is applied close-hauled only** (5°), because that is the only figure
the spec documents.

**There is no strain gauge.** Over-pressing is reported in the mate's words
("she is carrying more than this wind will bear") rather than as a number,
because a gauge would be an anachronism on an 1841 deck.

**The tutorial holds the weather quiet for 90 minutes of ship's time, then
raises a squall on cue with a full 15-minute warning.** This is the only place
anything outside the simulation touches it, and it stops once the lesson is
over. Without it, whether the core lesson lands at all is left to chance.

---

## Numbers that were invented

The spec marks its own figures **documented** or **inferred**. Everything below
is a further inference by the assistant and is meant to be tuned.

| Where | What |
|---|---|
| `evolutions.js` | Entries marked `// inferred` — setting light sails, furling and setting topsails, everything for the spanker and jibs. Entries marked `// Dana` come from the spec's table |
| `crew.js` | Fatigue rises over 6 hours of all-hands, falls over 8; weary men take up to 60% longer |
| `damage.js` | The strain rate (`/170`), the breaking point (10), and the relief after a break (−5). Tuned down twice after playtesting — see below |
| `weather.js` | Squall cadence (25–70 min apart), jump (2–3 forces), shift, and the slow swell in the base force |
| `wind.js` | The `DRIVE` table: how hard each force drives her |
| `passage.js` | 60 miles at 225°, arrival within 1 mile |

**On the damage rate specifically:** the first version was far too savage. A
playtest lost every topsail she had to a single gale, even while shortening
sail as fast as the hands could work. It now builds at about a third of that
rate and a break relieves it. One step over costs you something in about half
an hour; two steps in about nine minutes. The spec wants damage to be partly
unavoidable — §7.6 makes the warning deliberately shorter than the time to
shorten sail — but not ruinous.

---

## Known gaps

**No repair.** A split sail is gone for the rest of the passage. The spec says
"gone until repaired" and no milestone ever gave the owner a repair order.
After a bad squall she finishes crippled. **This is the most valuable thing
left to build.**

**Gales and calms are thin.** §2 lists weather events as "squalls, gales,
calms". Squalls are fully built. Gales only ever arrive *inside* a squall,
lasting 10–30 minutes; the background wind runs between light airs and a strong
breeze and never reaches gale force on its own. Calms do not occur at all — the
force never drops low enough for "no steerage way". Both are small changes to
the base force range and cadence in `weather.js`.

**No standing rigging** — no shrouds, stays or backstays. Cosmetic only.

**The full 60-mile arrival was verified on a 3-mile version** of the identical
code, not by sailing the whole passage. About a quarter of the real passage was
sailed and the reckoning tracked correctly throughout. If the arrival
misbehaves at 60 miles it will be a number, not a mechanism.

**The tutorial runs on every page load.** Remembering that it has been seen
would take one line of `localStorage`, which was not added because §3 rules out
save games and the owner has not been asked.

---

## Working with the owner

`SPEC.md` §8 covers this and should be followed literally. The two that matter
most in practice:

- **He is a novelist doing detailed historical research.** He will notice wrong
  terminology instantly and will not notice wrong architecture at all. Spend
  care on the words in the UI and in your reports.
- **Do not start the next milestone until he confirms the previous one works.**
  This was not honoured in this session — "go on" was taken as confirmation
  when he could not actually see the game. Ask him what he saw, not whether to
  continue.
