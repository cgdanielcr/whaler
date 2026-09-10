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

### M18 — Voyage two: working to windward

The mark lies dead to windward, so she will not point at it and you have to beat. `t` and
`w` come onto the board; missing stays is live; the mate already speaks when you try to
steer inside six points. The objective board shows miles made good beside miles sailed, so
the cost of beating is visible rather than merely felt.

*Test: steer straight at the mark. She stops. Tack her, and get there anyway.*

### M19 — Voyage three: shortening down

A fresh breeze, rising, and one squall summoned on cue a few minutes in — `weather.summon()`
already exists for exactly this. The royals, the topgallants and the topsail reefs come
onto the board, and the damage rule is live. The objective is to fetch the mark with every
sail whole. A short account at the end says what carried away and what did not.

*Test: see the dark line on the horizon, take in the royals, and come through with all your
canvas whole.*

### M20 — The shipping office, and voyages four and five

A first screen before the sea: the list of voyages, the ones you have done ticked off, the
next one open, and the whole cruise at the bottom. The browser remembers which are done —
one small entry in its own storage, no account and no login, and nothing else remembered,
because a voyage is short enough to finish in a sitting.

Two more voyages, which by now are mostly a few lines in the table:

- **Watch and watch** — through the night, all hands called, the watch bill and fatigue.
- **Something carried away** — a split sail, the stores, the carpenter, `m` to mend.

And the seventh card is the game as it stands today, unchanged: *A cruise*.

*Test: finish voyage three, come back to the office, and see three ticks and voyage four open.*

---

## Plan B — The ship in section

The cutaway, as a menu and not as a place. A drawn schematic in a panel, in the same ink
and paper as the other boards. Nothing below deck is ever entered in the world; this is a
diagram of her, which is a different thing and breaks no rule already set.

Drawn as SVG in the page rather than in Three.js: crisp at any size, hovers and clicks come
free, the glossary lights terms in it without new work, and it cannot break the sailing.
No image files, no build step, nothing new in the repo but one module.

### M21 — The ship in section

New: `src/cutaway.js`. Her forecastle, the steerage, the cabin, the hold, the deck, the
mastheads, and the boats on their davits. Every man is a small figure standing where he
actually is this minute — on deck if his watch is up, below if it is not, at a masthead if
he has the lookout, out on a yard if he is at an order, in a boat if the boats are down.

Hover a man for his card: name, berth, rating, watch, station, condition, and what he has
done this voyage. The record is already kept in `cruise.js`; this is the first place it can
be read while the voyage is still going.

It opens on `b` and takes the watch bill's place, with the bill's table moved to the side of
the same screen — one crew screen, not two.

*Test: press b. Twelve men on deck and twelve below. Wait for eight bells and watch them
change places.*

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
