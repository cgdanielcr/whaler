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
