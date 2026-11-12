# PLAN — from prototype to beta (the new approach)

Written 12 November 2026, after reading the code and playing a voyage. This covers
`new/` only. The original game is left alone.

## What the game is

Two games that feed each other.

- **Outside, the sea** — a roguelite. A voyage is a run: fit out, work the grounds,
  fill the hold before the ice comes down, get home. Each run is different and can
  be lost.
- **Inside, the ship** — a light real-time game with pause, in the manner of FTL.
  Twenty-nine named men, two watches, and never enough hands for everything at once.

**The rule that joins them: the sea asks, the ship answers.** Everything that happens
outside becomes work for particular men inside, and how well the work is done decides
what happens outside. If a thing on the sea needs no one aboard, or a job aboard
changes nothing on the sea, it does not belong in the beta.

## Where the prototype stands

What is good and stays: the look of the sea; the ship opened into three decks; the
company with faces, watches, lays and spirits; the season and the ice as a clock
running against you; the gale, which is the one place the two halves already meet.

What is missing, in order of how much it hurts:

1. **There is no sailing.** The wind is a word in the corner. She goes straight where
   she is clicked at the same speed whatever it blows. The thing the game is about is
   not in it yet.
2. **The ship is a diorama.** Stations are set once and forgotten. Only the gale ever
   makes you open her up, and there is only the one crisis.
3. **The hunt is a button and a bar.** You press Lower and watch. Nothing to decide.
4. **A run has no shape.** One sea, the same each time. Money buys nothing. Losing the
   ship costs a number.
5. **No finish.** No sound, no title, no teaching, nothing remembered between visits,
   a voyage is over in four or five minutes mostly spent waiting.

Small things seen while playing: the crew bar shows initials, so two men read as
"E. Norton" and two as "P. Sullivan"; the crisis banner lies over the ship's name.

## Decisions taken (the director may overrule any of them)

- **You command, the men sail.** You say where she is to go and how much canvas she
  carries; the watch does it, and it takes them time. No steering by hand. The wind
  decides what is possible: she cannot lie closer than six points, and must tack or
  wear to get to windward.
- **Canvas in four states**: all plain sail, topsails, close-reefed topsails, hove to.
  More canvas is faster and riskier as the wind rises. Wind by name, never by number.
- **The station bill is the heart of the inside game.** For each kind of work (tacking,
  reefing, lowering, cutting in, the pumps) you write down beforehand who goes where,
  as a real master did. In calm weather the bill runs itself. When men are hurt, away
  in the boats, or asleep below, the bill has holes, and you stop the clock and fill
  them by hand. Planning in the calm, scrambling in the trouble.
- **Pause anywhere at sea**, not only in a gale. Space holds and lets run.
- **The ice is the pursuer.** It already closes the sea behind the season; the run is
  built around getting out ahead of it.
- **A voyage should last twenty to thirty minutes** and the company carries over
  between voyages, so a man you have trained is a man you can lose.
- **Sound is made in the browser**, not loaded from files: wind, sea, the ship's bell
  striking the watches. No new dependency.

## Where it stands (12 November 2026)

All six milestones were built in one run, on the director's word to go ahead without
stopping between them. **None has yet been played by him.** What follows is what was
built, and where it falls short of the plan above.

| | Built | Short of the plan |
|---|---|---|
| B1 The wind | Wind with a direction; six points she cannot lie in; she beats and goes about of herself, and wears if she misses stays; four states of canvas; sails blow out if over-pressed; yards brace round; a wind dial | Nothing known |
| B2 The deck at work | Making and shortening sail take the watch time; all hands, and weariness for it; Space holds the world anywhere; full names | The station bill is a memory of how you last placed the hands in each trouble, called back with one button. It is not yet a page you write in calm weather |
| B3 The hunt | Pull or paddle up; haul up and lance or stern all, on a warning that is shorter for a sperm whale; irons draw if you lie off; a stove boat's men to save or leave | The ship does not follow a running whale |
| B4 Troubles | Squall, fire at the tryworks, man overboard, beset in the ice, beside the gale | Sickness and a fall from aloft are chances put as choices, not troubles fought on deck |
| B5 The run | The owners' standing and what they look for; dismissal ends a career; the master's purse and seven things to buy; the talk on the wharf says where whales lie this season (right four times in five); six chances of the sea | **No chart of separate grounds and no port of call.** It is still one sea, with the whales lying differently each voyage |
| B6 The finish | Title page; the mate's word, once for each new thing; sound made in the browser; the career, company and station bill remembered at the wharf; a finer picture as a switch | No hover-for-meaning on terms. A voyage is remembered only from the wharf, not mid-passage |

The look: a brighter sea with breaking crests and surf, cloud shadows and wind streaks
that run down the wind, light that turns with the season and darkens in a gale, rain,
pale ice under the floes, a bow wave, sails that catch the light, flames at the tryworks.

Numbers that were invented and want playing: every figure in `canvas.js`, `hands.js`,
`wind.js`, `troubles.js`, `outfit.js`, `owners.js`, and the temper of each whale in
`species.js`. A scripted hand that does everything right makes $1,500 to $3,000 a
voyage for the owners in about eight minutes; a person will be slower and lose more.

To try one trouble by itself, add `?crisis=squall` (or `fire`, `overboard`, `beset`,
`gale`) to the address.

## The second pass: the fifteen seconds (12 November 2026)

Asked for after the first build: the systems were there, but most moments were click
and wait. This pass went at the moments that repeat.

- **The dart is yours.** When the first boat is on her the boatsteerer stands with his
  iron raised and a mark runs to and fro; Space when it lies in the gold. A better
  boatsteerer has a wider gold. Dead centre is a deep iron and a head start on the kill.
- **The fight is felt.** The picture closes in on the boats, jolts when she lashes out
  or a boat is stove, each lance stroke is heard, and near the end she spouts blood.
- **Words rise over the sea** for the things that matter: Fast!, Stove!, 86 barrels!
- **Pass the time (F).** A quiet passage runs three times as fast, and stops of itself
  for a spout, a choice, strained canvas or the end of her course.
- **A trouble takes one click.** Click its plate and the best man to hand goes to it;
  Shift-click takes one off. Dragging a man of your choosing still works.
- **Barrels are heard** going below as she tries out.

Still click-and-wait: the passage itself. Sailing is ordered, not handled.

## The third pass: the look (12 November 2026)

Asked for after the second: more detail, more personality, more atmosphere.

- **The ship** is dressed: sailcloth sewn in cloths with reef bands and points, copper at
  her waterline, lit stern windows and a taffrail lantern, hatches, wheel, windlass,
  anchors, casks, and smoke from the galley stovepipe trailing down the wind.
- **The sea** has broad lighter and darker reaches, cat's-paws drifting over it, and
  glints where the sun strikes. A whale lying at the surface has white water about her.
- **The sky changes** every few days: fair, golden with long shadows, overcast, or mist
  with banks of it drifting and the edges of the picture whitened. Snow near the ice
  and late in the year.
- **Other lives**: seals on the floes, a white bear on the broadest, porpoises that come
  alongside when she is making good way.
- **The harbour** has a lighthouse on the point with a turning beam, brighter in thick
  weather, and smoke from the chimneys of the town.
- **The panels** are dressed as brass and varnish for the instruments and logbook paper
  for everything that is said or decided.

**Painted in oils (asked for next, the same day).** The whole picture is now finished
as an oil painting: laid down in flat dabs, with brush streaks, the weave of the canvas,
ridges of paint that catch the light, a richer and warmer palette, and varnish darkening
the corners. The panels stay crisp over it. `src/paint.js`. The switch on the title page
now turns between three finishes: painted (the usual), plain, and fine (the
model-on-a-table blur). How it runs on the owner's laptop has not been measured.

## The milestones

Each ends live and playable, with one test to perform in a browser. None is started
until the one before has been played and judged.

### B1 — The wind
An arrow for the wind on the sea and the chart. Her speed goes by her point of sail.
Sent to windward, she beats up in tacks of her own. Buttons to make and shorten sail.
Carry too much as it freshens and a sail blows out (the rule the gale already uses).
*Test: send her straight upwind and watch her tack to get there; then shorten sail
and see her slow.*

### B2 — The deck at work
The gale's machinery (a trouble, a place aboard, men walking to it, a bar) is made
general and called an evolution. Tacking, reefing and making sail become evolutions
done by the watch on deck from the station bill. A strip at sea shows the work in
hand; a hole in the bill shows red and opens the ship. Calling all hands tires the
watch below. Full names on the crew bar.
*Test: order a reef with the watch below asleep; see it go slowly, call all hands,
see it go fast, and see the men's weariness afterward.*

### B3 — The hunt
Lowering is an evolution. Then the chase is fought in stages with a choice at each:
come up from leeward or pull straight in; she sounds, hold on or cut; she runs, follow
with the ship or wait; a boat is stove, pick up the men or keep the whale. Each kind
of whale fights differently. Men in the boats are men missing from the ship.
*Test: lower for a sperm whale and a right whale and find they need different
handling.*

### B4 — Troubles
Six more, all on the B2 machinery: a squall with short warning; fire in the tryworks;
a man overboard; beset, and warping her out; a man fallen from aloft; sickness in the
forecastle. Each has its place aboard and wants particular men.
*Test: play a voyage and meet at least three troubles that are not the gale.*

### B5 — The run
The sea becomes three or four grounds on a chart, each with its whales, weather and
dangers, and a choice of which to work next as the season turns. A port between for
water, fresh men, and men who run. Short events with a choice (a gam with another
whaler; a sick man; a stranger's boat adrift). At the wharf the money matters: new
boats, better gear, a say in who ships. Lose the ship and you start again with a
green company and a harder owner.
*Test: make two voyages by different grounds and find they went differently.*

### B6 — The finish
A title page. A first voyage that teaches by the owners' letter and the mate's word,
one thing at a time. Hover any term for its meaning. Sound. The voyage remembered if
the page is closed. A pass over every panel, and over the numbers, so a careful
master usually comes home and a careless one does not.
*Test: give it to someone who has never seen it, say nothing, and see whether they
get a whale and get home.*

## Not in the beta

More than one ship. Other oceans. Animated men beyond what they do now. Anything
multiplayer. Steering by hand. These wait until the beta has been played.
