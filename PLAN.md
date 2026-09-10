# PLAN — the voyages, and the ship in section

Read `SPEC.md` and `DESIGN.md` first. This file is narrower than either: it is the
agreed order of work from 9 September 2026 onward, in two plans, to be done in order.

**Plan A comes first, all of it, before Plan B is started.** The reason is in the
argument that produced them: a screen for managing men is only worth opening when
something you care about depends on how you managed them, and the voyages are what
create the something.

**What neither plan changes.** The game as it stands on 8 September — the thirty men,
the stations, the sprites, the boats, the chase, the cutting-in, the cruise and the
account — is not taken apart, not renamed, and not turned off. It becomes the last card
on the list. `main` stays playable at every step.

---

## Plan A — The owners' instructions

A whaling voyage began with written orders from the ship's owners to her master. That is
the frame: each voyage is a short one, ten or twenty minutes, with a plain objective, and
the teaching happens because you are trying to do the job rather than because a voice is
telling you what to press.

This is deliberately not the tutorial that was built after M6 and thrown away. That one
named things you could not find. These name a destination and let you find the rest, and
the glossary is underneath them the whole time.

Nearly all of it is the game you already have with pieces switched off. That is the point
of doing it this way: it is configuration, not new machinery, and it is the cheapest large
feature on the table.

### M17 — The instructions, and voyage one: getting the feel of her. BUILT.

New: `src/voyages.js`, the table of voyages — her wind at the start, what canvas she has
set, which orders are on the board, what the objective is, what ends it. And
`src/instructions.js`, which draws two things: the owners' letter when a voyage opens, and
a small standing board showing the objective and how far off it is.

Voyage one is a light breeze out of the north-west, fair weather, no squall, all plain sail
already set. A mark seven miles to the north-east. Fetch it and come home. On the board:
the helm, making and shortening sail, calling all hands, and her clock. Not on the board:
tacking, wearing, mending, the boats — and none of them is named anywhere either.

Small changes to what exists: `passage.js` takes a list of legs instead of one constant
destination, so a voyage can go out and come home; `weather.js` takes a steadiness, and is
told to keep quiet; `orders.js` refuses a key this voyage has not been given, with a word
from the mate; `boards.js` and the `?` card list only what is allowed. `cruise.js` and
`hunt.js` are untouched — on a short voyage they simply do not run.

Two things found by sailing it, and fixed:

- **She could be steered into the wind's eye and stay there for ever**, because a ship with
  no way on does not answer her helm. She now falls off of herself until her sails fill, as
  she really would. This was wrong on the cruise too.
- **Her clock carried the helm with it**, so at eight times a touch on an arrow swung her
  half round. While your helm is over she comes back to her own time, and fetching a mark
  brings her back to it as well.

*Test: load the page, read your orders, steer for the mark, and watch the miles come down.*

### M18 — Voyage two: working to windward. BUILT.

Six miles dead to windward, then six miles home before the wind — the same six miles twice,
and nothing like each other. `t` and `w` are on the board, missing stays is live, and the
mate speaks when you steer her inside six points.

The orders board gained two rows, **Sailed** and **Made good**, which part company the
moment you begin to beat. The account is now written leg by leg: *to the mark, 1 hour 52 —
10.4 miles sailed for 6*, then *to home, 51 minutes — 6.2 miles sailed for 6*. That
comparison is the whole voyage.

The mate's verdict is now judged against what the voyage can be sailed in, since seventy
per cent is poor on a reach and good on a beat.

One dead end fixed, which was in the cruise too: **ordering a tack with one watch on deck
queued an order that could never run**, and nothing said why she would not come round.
Tacking and wearing now refuse like the sail orders do, and tell you to call all hands.

*Test: steer straight at the mark. She stops. Call all hands, tack her, and get there anyway.*

### M19 — Voyage three: shortening down. BUILT.

Fourteen miles south, in a fresh breeze that freshens. She sails under all plain sail,
which is already more than the wind will bear, so the board says so from the first minute
and the royals want coming in before anything else happens.

Twenty minutes out, one squall on cue with ten minutes of warning. Single-reefing the
topsails takes twelve, so you cannot get it all off her in the time and must choose what
comes off first — which is the whole of the design in SPEC §7.6. Her clock is pinned to her
own time while a squall is in sight, so there is no running past it.

Sailed as a test without shortening: the squall came up a strong gale, the board read
*dangerously over-pressed*, and the main topsail yard sprang. Mending is not on this
voyage, so she carries the loss to the mark — which is the lesson.

*Test: see the dark line on the horizon, take in the royals and the topgallants, and come
through with all your canvas whole.*

### M20 — The shipping office, and voyages four and five. BUILT.

`src/office.js` is the first screen: the six voyages, what each one teaches, the ones you
have sailed ticked, and the next unsailed one marked. **Nothing is locked** — a master who
wants to go whaling on his first morning may. The browser remembers only which voyages you
finished, in one entry, and says so on the card.

Two more voyages:

- **Voyage four, watch and watch** — thirty miles, three squalls spread across the run, and
  the crew's weariness now on the orders board. All hands is every man aboard and it tires
  them; a weary crew is a slow one. Call them up and send them below again.
- **Voyage five, something carried away** — she *begins* with her fore topsail split, so the
  lesson is certain rather than left to the weather. `m` bends a new one out of the locker
  and you watch the canvas go from five bolts to four.

Note on voyage four: it is **not** a night voyage. The sky has no night in it, so claiming
one would have been a lie. The lesson is the crew's strength across a long run instead.

*Test: finish a voyage, come back to the office, and see it ticked.*

---

## Plan B — The ship in section

The cutaway, as a menu and not as a place. A drawn schematic in a panel, in the same ink
and paper as the other boards. Nothing below deck is ever entered in the world; this is a
diagram of her, which is a different thing and breaks no rule already set.

Drawn as SVG in the page rather than in Three.js: crisp at any size, hovers and clicks come
free, the glossary lights terms in it without new work, and it cannot break the sailing.
No image files, no build step, nothing new in the repo but one module.

### M21 — The ship in section. BUILT.

New: `src/cutaway.js`. Her forecastle, the steerage, the cabin, the hold, the deck, the
mastheads, and the boats on their davits. Every man is a small figure standing where he
actually is this minute — on deck if his watch is up, below if it is not, at a masthead if
he has the lookout, out on a yard if he is at an order, in a boat if the boats are down.

Hover a man for his card: name, berth, rating, watch, station, condition, and what he has
done this voyage. The record is already kept in `cruise.js`; this is the first place it can
be read while the voyage is still going.

It opens on `b` and takes the watch bill's place, with the bill's table moved to the side of
the same screen — one crew screen, not two.

Built as **boxes rather than a beautiful sheer plan**, on purpose: it is a berthing chart,
and a berthing chart wants to be read rather than admired. Bow to the right, as a ship's
plan is drawn. Aloft, the boats, on deck, then the cabin, steerage, blubber room and
forecastle below, and the hold under all of it. Each box carries its name and a tally.

A man is placed the way the ship places him: a boat's crew first, then the mastheads, then
whatever work he is posted to, then his watch, then his berth. Order a reef with all hands
and you watch eight men move up into the aloft box.

It shares the watch bill's sheet on **b** rather than taking a key of its own, with the
bill below it saying the same thing as a table.

**Open to the owner:** the layout is a guess made without him. It is meant to be argued
with.

*Test: press b. See where every man is. Order a reef and watch them go aloft.*

### M22 — Reassigning

Drag a man between the topmen, the afterguard and the waisters, and between the two
watches. `stations.js` already picks men by rating and condition; it gains the man's own
station as the first thing it looks at, so the change shows up immediately in who goes where.

Guard rails, because the ship still has to work: a watch that would drop below a working
number is refused, with a word from the mate saying why.

*Test: move a green hand up to the topmen, order the royals in, and see his name on the yard
in the orders board.*

### M23 — The refit

Between voyages, at the office. Barrels brought home become an allowance, and you spend it
before you sail again. All of these are real, and all of them touch something already in
the game:

- **Sheathe and dry the forecastle** — the men recover condition faster, so every job goes
  quicker. Whaleship forecastles were famously wet and foul; a ship where men slept was a
  ship whose men worked.
- **More water casks** — she turns for home when her water is down to a fortnight. More
  casks is more days on the ground.
- **A spare boat, more cordage, spare spars** — fewer disasters and a faster recovery.
- **A bigger try-works** — the oil rendered in less of the voyage.
- **Copper on her bottom** — faster, and she fouls less on a long cruise.

Each one shows on the cutaway, so the ship visibly becomes yours.

*Test: finish a voyage, sheathe the forecastle, and see your men turn out fresher next time.*

### M24 — Regard. Cut this if the first three are enough.

Not a morale system. Men who work the same station in the same watch build regard for one
another, and it pays in two visible places: a boat crew that has pulled together before does
better in the chase, and a station of men who know each other finishes faster. Shown as
faint lines between the figures in the section.

*Test: keep the same three men in a boat for three lowerings, and see them beat a scratch crew.*

---

## Assumptions taken, so they are on the record

- The mate's advice — a word when the glass is falling and she is still carrying royals —
  rides along with M18 rather than being a milestone of its own. He already speaks; he is
  given two or three more things to say.
- Money is barrels turned into an allowance. The lay, a man's fractional share of the
  voyage, is a later flourish and not part of this plan.
- No schooner. The ladder is built on the ship she is.

---

## M20b — The pilot, the pennant, and the wake. BUILT.

From the owner's first play of voyage one, 10 September 2026. His complaint: one card at
the start telling him everything, no sense of what to do next, no way to tell which way the
wind blew, and no way to tell whether she was moving at all.

- **`src/pilot.js`** — the first mate at your elbow. One step at a time, each naming one
  thing, giving you a **big button that does it**, and waiting for the ship herself to say
  it is done before moving on. The helm buttons are held down, not tapped. Voyage one has
  six steps: see the wind, set the courses, put her head on the mark, make more sail, run
  her down, and round for home. `I have the hang of her` closes it.
- **`src/vane.js`** — a red pennant at the main truck, streaming away from the wind. It is
  what a real officer of the watch read the wind off, and it is now the first thing the
  pilot points at. Its cloth hangs vertically; a flag lying flat is a hairline.
- **Voyage one now begins under her topsails only**, so that making sail is something you
  do rather than something already done for you.
- **The wall of keys is gone on a guided voyage** — no legend on the canvas board, no key
  list in the letter. The pilot hands you one button at a time instead.
- **The default view is lifted** so her mastheads stand clear of the boards. They were
  behind the canvas board, which is why the pennant could not be seen at first.
- **The wake is bolder and half as long again.** With the camera fixed on her and open sea
  all round, it is the one thing that says she is moving.
- **Fixed: glossary cards appeared behind the letter**, so a definition could not be read.

**Feedback, after the owner asked for it to be more evident (10 September).** The pilot now
*points* and *lands*:

- **He points at what he names.** The canvas he is talking about lights up on the ship
  herself (reusing the glossary's ), the pennant swells and pales, and the board
  carrying the figure is ringed with a slow pulse. He holds his finger there four seconds.
- **A closing gauge** on every steering step: a track with the mark at the centre and her
  head as a needle walking in from the side, reading *54° to larboard* and closing. Inside
  the tolerance the whole bar goes solid blue and reads **on the mark**.
- **The helm buttons fill solid and press in** while held, so the wheel feels held.
- **A step landing** stamps a filled tick beside the mate's word and rings the whole panel
  in rust; a step arriving slides up from below.

**Feedback, after the owner asked for it to be more evident (10 September).** He wanted
confirmation you can see and feel — "sparks flying would be too much, but think in that
direction". So the pilot now *points* and *lands*:

- **He points at what he names.** The canvas he is talking about lights up on the ship
  herself, reusing the glossary's `rig.mark`; the pennant swells and pales; the board
  carrying the figure is ringed with a slow pulse. He holds his finger there four seconds
  and lets go, so he does not fight the glossary's own hover.
- **A closing gauge** on every steering step: a track with the mark at its centre and her
  head as a needle walking in from the side, reading *54° to larboard* and closing as she
  comes round. Inside the tolerance the whole bar goes solid blue and reads **on the mark**.
- **The helm buttons fill solid and press in** while held, so the wheel feels held rather
  than clicked.
- **A step landing** stamps a filled tick beside the mate's word and rings the whole panel
  in rust. A step arriving slides up from below.

*Test: press Sail, and do what the mate tells you, one step at a time.*

## M20c — Making her move. BUILT.

The owner, twice: she does not look as though she is moving. The second time he named
it exactly — "white spots, not a real wake", and "does not look like the ship moves on
the surface of this water".

Three faults, in order of how much they mattered:

1. **The wake was drawn under the water.** The sea is a Gerstner field, so its surface is
   displaced sideways as well as up, and the height `waveHeight()` gives for a point is
   not the height the shader draws there. Twelve centimetres of clearance was not enough,
   so the wake had been rendering invisibly since M3. It now stands half a metre clear
   with a polygon offset behind it.
2. **The default camera sat ahead of her**, putting the hull between the eye and the one
   thing that says she is moving. It now stands off her quarter, astern. The bow wave was
   also drawn narrower than her own beam, so what showed of it was under the hull.
3. **A Gerstner sea cannot carry the cue at all.** Every wave looks like every other wave,
   and the crests run at ten metres a second of their own accord against her two and a
   half. The eye has nothing to hold on to. No wake fixes this on its own — which is why
   the first two fixes were not enough.

So `src/drift.js`: patches of weed, fixed in the world, riding the swell and going
nowhere. She runs past them, and because they are the only fixed things in sight the eye
tracks them and reads her motion off them. They recycle out of sight ahead of her.

The wake itself is now a **continuous track** rather than bands — cutting it up is what
made it read as white spots — with brighter water travelling aft down the inside of it at
the speed she is making.

**Open to the owner's taste:** how much weed. It is set thick enough to be unmistakable,
which may be thicker than a clean sea wants, and weed on the open Pacific is a stretch
even if it is fair in home water. Thinning it is one number.

*Test: make sail, and watch the weed go by.*

## M20d — The pilot on every voyage. BUILT.

Voyage one had the mate at your elbow; two to five still opened with a letter and a wall
of keys, which is the pattern the owner disliked. All five now have him.

- **Two, working to windward** (6 steps): see that the mark and the wind are the same
  bearing; come up until the board says close-hauled and stop before she is taken aback;
  stand on and watch *Sailed* and *Made good* part company; call all hands and put her
  about; beat up to the mark; run home before the wind.
- **Three, shortening down** (5): royals in, topgallants in, watch the compass for the
  squall, then all hands and a reef with less warning than the reef takes.
- **Four, watch and watch** (4): look at the bill and their ages; call all hands for the
  squall; **send them below again**; bring your people in with something left in them.
- **Five, something carried away** (4): see what is torn, look in the locker, set the
  hands to mend, and watch the canvas go from five bolts to four.

The letters shrank to two or three paragraphs each, because the pilot now teaches what
they used to explain. `conning()` grew the figures the steps read: how she lies to the
wind, which board she is on, the squall, all hands, weariness, and what has carried away.

Two faults found by loading them: **a step's nod was a single flag**, so a voyage with two
"I see it" steps skipped the second — it now resets per step. And **voyage two began
already close-hauled**, so the step asking you to come up to the wind completed before you
touched anything; she now starts well off it.

*Test: sail any voyage. The mate is there on all five.*

## M20e — The command bar. BUILT.

The owner asked for a usable menu the way *StarCraft II* and *Warcraft III* do it: anchored
along the bottom, with buttons you press rather than hotkeys you have to know.

`src/command.js` draws it. Her state on the left — head, speed, hands free — and the orders
themselves as a command card of three rows:

- **Shorten** — the six tiers, and all round
- **Make sail** — the same six with shift, and all round
- **Ship** — all hands, tack, wear, mend, lower away, cut in, bring her to

Each button carries **its key in the corner**, the way a command card does, so the buttons
teach the keyboard rather than replacing it. Each sail button also carries the tier's
current state as the same drawn glyph the canvas board uses, so the card shows what she is
wearing as well as what you may do.

**A button presses the same key you would**, so there is nothing it can do that the
keyboard cannot, and nothing to keep in step. Orders that would do nothing — royals already
furled, a tier the hands are working on — go faint and stop responding.

The card is filtered by the voyage, like everything else: voyage one shows no tack, wear,
mend or boats, because it has not been given them.

Rows never wrap. On a narrow window each row scrolls sideways rather than growing upward,
so the bar stays three rows tall and the sea stays visible. At 1366 wide nothing scrolls.

*Test: press a button instead of a key. Watch eight named men go to the sheets.*

## M20f — Her deck furniture. BUILT.

The owner noticed she had no helm. She had not — she had a hull, three masts, four boats,
a try-works and a cutting stage, and nothing else at all. No wheel to steer her, no
windlass to get her anchor, no hatch to go below by, no galley to cook in.

`src/deck.js` puts them aboard, all from Three.js primitives as the locked stack requires:

- **The wheel**, right aft abaft the mizzen, on its wheel box — a rim with eight spokes
  running out through it into handles, which is what makes a ship's wheel read as one.
  **It turns as you put the helm over**, and it is the only thing on deck that answers you
  directly.
- **The binnacle** just forward of it, where the man steering can see the compass.
- **The windlass** forward: the barrel her cable comes in over, on its bitts.
- **Three hatches** — the companion aft to the cabin, the main hatch, and the fore scuttle
  down to the forecastle. They are the only sign on deck that there is a below.
- **The galley** in a deckhouse, with its stovepipe. The cook's whole kingdom, and the only
  fire aboard except the try-works.
- **The skids** amidships, carrying **two spare boats bottom-up** — documented in
  `MORGAN.md`: she carried five on davits and two more stowed over the deck.

**On art assets.** The owner offered to get them. Declined, and why: `SPEC.md` §4 locks the
stack to procedural geometry from Three.js primitives with no image files. What would
actually help is **reference, not assets** — the Mystic deck plan sheet (Allyn, 1971), and
photographs of her wheel, binnacle, windlass, deckhouse and skids. With those the shapes
stop being inferred.

*Test: press c to go on deck. She has a galley, a hatch and a windlass now. Hold the helm
over and the wheel turns.*

## M20g — The chart. BUILT.

The owner asked whether she could sail on Google Earth. Feasibility answered first: yes
technically, no in practice. Google's Photorealistic 3D Tiles need an API key and a billing
account (uncapped exposure on a public page), a second dependency against `SPEC.md` §4's
Three.js-only rule, mandatory on-screen attribution, and they fight an art direction whose
whole premise is *she is drawn, not photographed*. The killer is simpler: a whaling voyage
is almost entirely open ocean, where photorealistic tiles are flat blue nothing.

What the question was really after was **real geography**, and that is free.

- `src/coast.js` — the coastlines of the world from **Natural Earth 1:50m**, which is
  public domain. Simplified to a tenth of a degree, outer rings only, islands under half a
  degree dropped. 427 rings, 11,481 points, about 149 KB of plain numbers. Generated by a
  throwaway script, not hand-edited.
- `src/chart.js` — the chart on **k**. Real land, a graticule, her real latitude and
  longitude, her track laid down every quarter-hour, the marks of her voyage, New Bedford,
  and a scale bar in sea miles.

**Drawn on Mercator, and that is not decoration.** On a Mercator chart a steady compass
course comes out a straight line, which is the entire reason every sea chart from 1569
onward used it. Any other projection would be a picture of the world rather than something
you could shape a course on.

Her reckoning — metres east and north of where she sailed — becomes a real fix off New
Bedford at 41.63° N, 70.93° W. The land around her is the real Cape Cod, Long Island,
Chesapeake and Nova Scotia.

One fault worth recording: **clipping the coastline point by point tore the rings open**,
and the closing stroke then cut straight across the gap, which turned North America into a
wedge. Every point is now drawn and the sheet does its own clipping.

*Test: press k. New Bedford is where New Bedford is.*

## M20h — The passage round the Horn. BUILT.

The chart made real geography possible; this makes the voyage real.

**`passage.js` now reckons in latitude and longitude.** It used to work in metres east and
north on a flat plane, which is fine for a mark seven miles off and quite wrong over ten
thousand, where a degree of longitude is fifty-two sea miles at New Bedford and thirty-four
off Cape Horn. She is worked by plane sailing on the middle latitude — dead reckoning, and
exactly what a log line and a compass give you. Legs may be a bearing and a distance, or a
real place.

**`src/route.js`** — the passage, and the wind belts.

- **The route**: New Bedford, windward of Bermuda, the north-east trades, the line at 30° W
  to weather Cape São Roque, the south-east trades, off the River Plate, the Falklands,
  **Cape Horn**, clear of it, and the Offshore Ground at 12° S 108° W. **10,657 sea miles**
  — every distance falling out of the coordinates, none of them invented. About 97 days at
  four and a half knots, which is what the passage really took.
- **The wind belts**: northern westerlies, horse latitudes, north-east trades, doldrums,
  south-east trades, southern horse latitudes, westerlies, roaring forties — each at its
  real latitude, interpolated between centres. Her wind is no longer her master's to choose:
  it is whatever the latitude she has reached happens to blow, easing over half a day.
  **This is why the route bends** instead of running straight, and the game now teaches
  that by making you sail it.

**Her clock runs to ×600** — five hours a second — because nothing happens for most of a
hundred days. It is **capped rather than stopped**: your hand on the helm brings her to her
own time, and a squall in sight or canvas she cannot carry holds her to ×8, which is fast
enough to cross an ocean and slow enough to shorten sail in.

Two faults found by sailing it: **a squall every half hour** pinned the clock at ×1 and made
the passage impossible, so a voyage now says how often the weather may throw one — days, on
a trade-wind passage. And **being over-pressed did not hold her back**, so at ×600 she tore
her royals, topgallants and a topsail to pieces in the westerlies before anything could be
seen to happen.

*Test: sail the Horn passage and press k. Ten thousand miles of real sea, and the wind backs
as you go south.*
