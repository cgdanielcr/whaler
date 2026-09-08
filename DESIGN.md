# Ship — v2 design direction

SPEC.md describes v1, which is built. This document describes where the game goes next.
It does not replace SPEC.md: the historical model in §7 and the working rules in §8 still
stand. But it does override SPEC §3. The owner has now asked for the things §3 ruled out
— sailors you can see, named crew, and eventually whaling — so from here on §3 is the
v1 boundary, not the project boundary.

Nothing in this document is built. It is a direction, to be turned into numbered
milestones one at a time, each ending live and testable, exactly as v1 was.

**Gate before any of it:** the owner has not yet played M2–M6 in a working browser (see
the handover notes). Play the live game through one passage first. If v1 is wrong, v2
built on top of it will be wrong twice.

---

## 1. What the game is for

The owner's stated purpose, in his words: not hard simulation, but learning. When do you
set which sails, what work it takes, who does it. A fun game, yes, but one you come out
of knowing how a ship of 1841 was actually worked.

That gives a test for every design decision: **does this teach how it was really done,
and is it fun to watch?** If a feature is realistic but invisible, it fails the second
half. If it is fun but wrong, it fails the first. A crew of thirty named men who go where
the work is, seen from the deck, is the feature that passes both.

Inspirations named by the owner: *FTL* (a ship in cutaway, crew as small figures you send
to where they are needed, damage you can see) and *Heat Signature* (every person aboard
has a name, a face, a history, and stats, and you get attached to them). Neither is a
sailing game. What is borrowed is the *relationship* to the crew, not the mechanics.

## 2. The three pillars

### Pillar one — the deck as the stage

v1 is seen from a distance, as a sail plan. v2 brings the eye down to the deck. The ship
does not get bigger; the camera comes closer. A man is 1.7 m on a 33 m hull, and at the
current camera range that is a speck. At 25–40 m, looking along the deck from the
quarterdeck, he is a figure you can name.

Two camera modes, switched with one key:

- **Quarterdeck** — the existing orbit. Sees the whole sail plan and the horizon. For
  weather, canvas and the squall line.
- **Deck** — closer, lower, following the deck. For the crew, the boats, the work.

The rig must be complete for this to hold up. At deck range, three bare poles with yards
look wrong. Standing rigging — shrouds, ratlines, stays, backstays, the tops and
crosstrees — is the first thing to add, because it is where the men climb and because
half the vocabulary lives in it.

### Pillar two — thirty men, not a counter

`crew.js` today holds a number: fifteen on deck, thirty at all hands, one fatigue figure
for the lot. v2 makes each of the thirty a person.

**Who is aboard a whaleship of 350 tons in 1841** (documented, with the usual variation
from ship to ship):

| Station | How many | Notes |
|---|---|---|
| Master | 1 | The player. Lives aft, gives orders, does not haul on ropes |
| Mates | 3 | First, second, third. Each heads a whaleboat. The first mate runs the deck |
| Boatsteerers | 3–4 | Harpooners. Petty officers, berth in steerage. Rated as the best seamen aboard |
| Cooper | 1 | Makes and mends the casks the oil goes in. A tradesman, not a sailor |
| Carpenter | 1 | Often the cooper doubles. Fishes a sprung yard, repairs boats |
| Cook | 1 | |
| Steward | 1 | Serves the cabin |
| Cabin boy | 1 | |
| Foremast hands | 15–18 | Able seamen, ordinary seamen, and green hands who have never been to sea |

Whaling crews were famously mixed: New England farm boys, Azoreans and Cape Verdeans
shipped on the outward passage, Black Americans, Native Americans from the Vineyard and
Gay Head, Pacific islanders picked up on earlier voyages. The random name list should
reflect this. Names are editable by the player, as in *Heat Signature*.

**Stats. Few, and each must matter to something the player sees.**

| Stat | Values | What it changes |
|---|---|---|
| Rating | green hand → ordinary seaman → able seaman → boatsteerer | Whether he can be sent aloft in a blow; how fast his station finishes |
| Strength | weak → middling → strong | Hauling work: braces, halyards, the cutting tackle |
| Condition | fresh → willing → tiring → weary → spent | The existing fatigue ladder, but per man, so a hand who was aloft all night is slower than one who was below |
| Health | sound → hurt → sick → lost | Falls from aloft, frostbite, scurvy on a long cruise. A hurt man is off the watch bill |

No morale, no loyalty, no mutiny in the first pass. Those are a later layer if the first
one is fun.

**Watches and the watch bill.** The crew is already divided into starboard and larboard
watches. v2 shows the bill: which men are in which watch, and within each watch which
are the topmen (young, agile, go aloft), which are the afterguard (older hands, the
braces and the wheel), and which are the waisters (green hands, hauling on deck). The
mates divide the crew this way at the start of a voyage; the player can re-divide it
between evolutions. This is where the *FTL* feeling lives, and it is historically true:
you do not drag individual men about, you decide the stations, and the mate sends them.

**Stations, not hands.** Each evolution in `evolutions.js` today says "14 hands, 12
minutes". v2 says *where* those hands go:

> **Single-reef the topsails** — 6 aloft on each topsail yard (the best hand takes the
> weather earing), 8 on deck at the reef tackles, halyards and buntlines. First mate
> calls the order. 12 minutes with a fresh watch.

The time then comes from the men actually sent: green hands on the yard are slower and,
above a fresh gale, at risk. This is the learning content of the whole game and it
should be written with care from Dana and Lever, not invented.

### Pillar three — the whaler

The owner wants a whaleship eventually. The good news: she already is one. A whaleship of
1841 is a ship-rigged vessel of about 350 tons — the hull and rig do not change. What
changes is the **deck furniture** and the **work**:

- **Whaleboats** on davits — three or four, most hung on the larboard side, with spare
  boats overhead on the skids. This is the single most visible difference and should
  come first.
- **The try-works** — the brick furnace with two try-pots, on deck between the fore and
  main masts. Nothing below deck is ever shown (SPEC §3 stands on interiors).
- **The cutting stage** — planks rigged outboard on the starboard side, where the mates
  stand with their spades to cut the blubber from a whale chained alongside.
- **Masthead lookouts** — on the cruising ground, two men aloft at the mastheads from
  sunrise to sunset in two-hour tricks. This is a *standing station* that takes two hands
  off the watch all day, and it is where "there she blows" comes from.

**Lowering.** When a whale is raised, the boats go down. Each boat takes six men: a mate
as boatheader, a boatsteerer, and four at the oars. Three boats down means eighteen men
off a ship of thirty, leaving the shipkeepers — cooper, cook, steward, boy, and a hand or
two — to work her. **This is a real crew puzzle** and the reason the crew needs to be
people first: the ship must keep to windward of the boats with a dozen men aboard, and if
the wind gets up while the boats are down you have a genuine crisis with a historical
shape.

**The chase is watched, not played.** The owner's decision: the boats are seen on the sea
and the chase plays out on its own, with the outcome drawn at random from the things
that really happened. The player's part is the ship — keeping her to windward of the
boats, reading the signals, and deciding when to give up a boat that has been towed out
of sight. Outcomes, roughly from best to worst, all documented:

- The boat fastens, the whale is lanced and killed, and the boats tow it back to the ship
- The whale sounds and the line runs out; the boat cuts loose and comes back empty
- The whale runs and tows the boat to windward for hours — the "Nantucket sleigh ride" —
  and the ship must follow
- The iron draws, or the line parts; the whale is lost with the gear
- The boat is stove; the crew are in the water and another boat must pick them up
- Rarely, a man is lost

One kind of whale to begin with: the **sperm whale**, which is what a ship cruising the
Pacific in 1841 was there for, and whose oil was the prize. Right whales and others can
come later with their own odds and their own oil. The weights on the outcomes are
inferred and tuned for play; the list is not.

What follows the chase is the rest of the game: the whale brought alongside, fluke chain
on, the cutting-in (a day's work for all hands, with the blanket pieces hoisted by the
cutting tackle at the mainmast), and then the trying-out, which ran day and night for
two or three days, with watches at the try-pots and the ship a torch of smoke. These are
all evolutions with hands and minutes, exactly like reefing, and the existing order
machinery carries them.

The whale itself: a dark shape on the sea, then alongside, seen from the deck. No gore.
The spirit of the thing is the labour.

**Score.** A cruise, not a passage. Days on the ground, whales raised, barrels stowed
down, and men brought home sound. The passage of v1 becomes the first leg of it.

## 3. The glossary

The owner's request, and the cheapest high-value thing in this document: every nautical
term in the UI can be hovered for its definition, and hovering highlights the part of
the ship it names.

- One dictionary file, terms keyed by the exact word used in the UI.
- Definitions from Dana's *Seaman's Friend* (1841), which has a dictionary of sea terms,
  and Falconer. Public domain, the right year, and it stops anyone inventing a
  definition. Where Dana's wording is long, shorten it, but keep his meaning.
- Each term may name a part: `topsail yard` → the three topsail yards glow faintly;
  `shrouds` → the shrouds; `larboard` → the larboard rail. The rig already has one object
  per sail and yard, so this is a lookup, not new geometry.
- Terms are marked in the boards and the account automatically, so a sentence written in
  plain sailor's English becomes a lesson without anyone tagging it by hand.

This should be the first v2 milestone. It touches no simulation, it cannot break v1, and
it is the learning objective in its purest form.

## 4. Sprites

The owner has asked for sprites, not models. Three ways to do it within the locked stack
(Three.js only, no image files, no build step):

1. **Pixel figures drawn onto a canvas at load, shown as billboards.** Eight by sixteen
   pixels or so: head, shirt, trousers, one colour each, seeded from the man's stats so
   every hand looks slightly different. Always faces the camera. Cheap, and reads well at
   deck range. *Recommended.*
2. **Blocky low-poly figures** from three boxes. Have a facing, so they can be seen to
   look outboard or up the mast. Slightly more work, less charming.
3. **Coloured tokens with names**, like *FTL*'s dots. Fastest, but the owner has asked to
   *see* the sailors, so this is a fallback, not a plan.

Movement is **positions, not animation**. A man is at a spot; when he has a station he
moves to it along fixed paths (the deck, the ratlines, along the yard) at walking speed
in ship's time. No limbs, no walk cycle. SPEC §3's ban on animated characters becomes
"figures move, they do not animate" — which is also all the owner asked for.

Hovering a figure shows his name card. Clicking it opens his page: name (editable),
rating, watch, station, condition, and a one-line record of what he has done this voyage
("took the weather earing on the fore topsail in the gale of the 14th"). The record is
where attachment comes from, and it is a novelist's feature: the game writes the men's
stories from what they did.

## 5. What v2 is not

Carried forward from SPEC §3, still out:

- Below-deck interiors. The blubber room, the forecastle and the cabin are named and
  referred to, never shown.
- Multiplayer, accounts, leaderboards. A save is now worth discussing, since a cruise is
  longer than a passage, but it is a decision for the owner and a milestone of its own.
- Islands, ports, a procedural ocean.
- Combat of any kind.
- Audio, mobile.

And two new ones:

- **No harpooning as gameplay.** The chase is abstracted. See §2, pillar three.
- **No morale system** in the first pass.

## 6. Proposed milestones

Same rules as v1: in order, one session or less each, each ends live on GitHub Pages
with a one-line test in plain language, and the next does not start until the owner has
confirmed the last by playing. Numbering continues from M6.

**M7 — The glossary. BUILT, live 8 September.** Hover any sea term on the boards for its
meaning; the part of the ship it names lights up. Replaced the scripted tutorial, which
the owner did not like: his complaint was that it named things he could not find. `?`
opens a card of every order with its cost in hands and minutes.
*Test: hover "topsails" in the canvas board and see the three topsails glow.*

**M8 — Standing rigging and the deck camera. BUILT, live 8 September.** Shrouds,
ratlines, futtock and topmast shrouds, backstays, and the fore-and-aft stays. `c` puts
you on the forecastle, on the weather side, at a seventy-degree view.
*Test: press c and see the shrouds rising past you from the rail.*

**M9 — The crew list.** Thirty named men with ratings and watches. A watch bill board.
The counter in the crew board becomes a list of who is on deck. Names editable.
*Test: open the watch bill, rename a man, and see his name in the crew board.*

**M10 — Stations.** Each evolution names its stations. Men are picked for them by rating
and condition; the time to finish depends on who went. A green hand aloft in a gale is a
risk.
*Test: single-reef the topsails and see, in the orders board, which six men are on each
yard.*

**M11 — Sprites.** The men are visible on deck, go to their stations when an order is
given, lay aloft on the ratlines and out on the yards. Hover for a name.
*Test: order the royals in and watch four figures climb.*

**M12 — Repair.** The gap left by v1. Spare canvas in the sail locker; bending a new
topsail is an evolution; the carpenter fishes a sprung yard. A split sail is no longer
gone for good.
*Test: split a topsail in a squall, order it replaced, and sail on under it.*

**M13 — A whaler's deck.** Boats on davits, try-works, cutting stage. Masthead lookouts
as a standing station on the cruising ground.
*Test: two men are aloft at the mastheads from sunrise and the crew board says so.*

**M14 — Lowering.** "There she blows." Lower away; eighteen men leave; the ship is worked
short-handed until the boats return.
*Test: lower three boats and try to tack with twelve men. You cannot.*

**M14b — The chase.** The boats are seen pulling for the whale; the outcome is drawn at
random from the list in §2 and plays out on the sea. Sperm whales only.
*Test: lower twice on the same day and get two different endings.*

**M15 — Cutting-in and trying-out.** The whale alongside, the multi-day evolutions, the
casks stowed down.
*Test: bring a whale alongside and see the ship a torch of smoke through the night.*

**M16 — A cruise.** The voyage frame: weeks on the ground, barrels as the score, the
account at the end written up man by man.
*Test: finish a cruise and read what each man did.*

## 7. Decisions made (2026-09-08)

**Who is the player?** The master. He makes the calls and delegates; the mate picks the
hands from the watch bill. The owner also wants direct control "where it is fun" and
named *StarCraft* and *FTL* as references, so the door stays open: build the delegated
version first (M9–M10), and once he has played it, decide whether to add a click-a-man,
click-a-station override on top. Do not build the override first.

**How much whaling?** The chase is seen but not played. Boats on the sea, the outcome
random from a documented list, one kind of whale (sperm) to begin with. See §2.

**How do the men look?** Pixel figures on billboards.

**Still open — a save?** A cruise is longer than a sitting. Either the browser remembers where you
were (one small file, no accounts), or a cruise is short enough to finish in an hour of
play. This does not need deciding until M16, but it shapes how long the cruise is.

## 8. Notes for whoever builds it

- Do not scale the hull. She is 33 m and that is right. Move the camera.
- `crew.js` becomes a list of men. `free`, `onDeck` and `fatigue` keep their meaning
  as sums over the list so nothing that calls them breaks.
- `evolutions.js` grows a `stations` field per order. The `hands` figure stays as the
  total so v1 keeps working while stations are added one order at a time.
- Sprite textures are drawn on a `canvas` element at load and handed to Three.js as a
  texture. No PNGs in the repo.
- Each sea term in the glossary must be traceable to Dana or Falconer. Where neither has
  it, say so in a comment rather than invent.
- Files stay under about 200 lines. The crew alone will want three or four: the list and
  names, the watch bill, stations, and the sprites.
