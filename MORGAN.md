# The real ship

Research note, 10 September 2026. The owner asked to build the ship-in-section from the
real arrangement of a real vessel of this type rather than from a plausible-looking guess,
and to make it fun afterwards. This file is that real basis.

Everything here is marked **documented** or **inferred**, the same convention `SPEC.md`
uses. Nothing is quoted that has not been read; sources are at the foot.

---

## 1. The ship we are modelling

The **Charles W. Morgan**, launched 21 July 1841 from the yard of Jethro and Zachariah
Hillman, New Bedford. She is the only wooden whaleship surviving from the nineteenth-
century American fleet, and she is the right model for this game for one reason above all:
**she is the same year.** *Documented.*

She cost $48,849.85 to build, of live oak in frame and plank with yellow pine upper decks.
She carried no guns but had **false gunports painted black on her sides** to frighten off
pirates. *Documented — and worth having in the game, because she has them now and we do
not.*

### Dimensions

| | Figure | |
|---|---|---|
| Length overall | 113 ft | documented (present day) |
| Registered length at launch, 1841 | 106 ft 6 in | documented |
| Breadth at launch | 27 ft 2½ in | documented |
| Depth at launch | 13 ft 7¼ in | documented |
| Depth of hold, present | 17.1 ft | documented |
| Tonnage | 351.3 old tons / 313.8 new | documented |

`SPEC.md` §7.1 says "about 350 tons, roughly 110 ft on deck." **That is right**, and it is
right because it matches her old-measurement tonnage of 351.3 almost exactly. Do not change
it. Our hull is 33 m, which is 108 ft — inside the range.

### Rig in 1841 — this settles a question

> "Launched as a full-rigged ship, with single topsails, the Morgan was rerigged and
> outfitted in 1867 as a bark."

*Documented, National Historic Landmark nomination.* So **she was ship-rigged with single
topsails in 1841**, which is exactly what `SPEC.md` specifies and what is built. Every
photograph of her afloat today shows a **double-topsail bark**, which she became twenty-six
years after our year. If we ever work from photographs of her, this is the trap.

---

## 2. Her company

> "Crews averaged thirty-three men per voyage, including officers, seamen, greenhands and
> 'idlers' — the cooper, carpenter, cook, steward, and ship's boy, who remained aboard to
> keep the ship headed toward the boats while they were down for a whale."

*Documented.* Three things fall out of this, and all three are already in the game:

- **Thirty-three, not thirty.** `SPEC.md` says thirty and `company.js` ships twenty-nine
  under the master. The real average is a little higher. A tunable, not an error.
- **The five idlers are exactly right.** Cooper, carpenter, cook, steward, ship's boy —
  the same five, by name, as in `company.js`.
- **The shipkeepers mechanic is documented**, not invented. The idlers stayed aboard to
  work the ship toward the boats. That is precisely what `hunt.js` does.

On her **first voyage** she sailed from New Bedford on 6 September 1841 under Captain
Thomas Norton, aged thirty-four, with a crew of thirty, **twelve of them between fifteen
and nineteen years old**. She came home 1 January 1845 with 1,600 barrels of sperm oil,
800 of right whale oil and 10,000 lb of whalebone, on gross receipts of $69,591.
*Documented.* Our crew is too old: a third of a real whaleship's company were teenagers.

### The lay

> "The 'lay system' … usually allotted a 1/12 to a 1/16 lay to the captain … The smallest
> lay was that of the cabin boy, 1/300."

*Documented.* This is the score I proposed earlier and it now has real numbers behind it.
Norton's lay on that first voyage came to almost $11,000, and he retired from the sea on it.

---

## 3. The arrangement — what is actually documented

She has three levels: the **main deck**, the **'tween deck** below it, and the **hold**
below that.

### The 'tween deck, bow to stern

This order is documented, though the exact frames each bulkhead stands on are not:

1. **Forecastle**, right forward — "a narrow triangular-shaped room under the deck," bunks
   lining the walls, entered by a scuttle, lit by deck prisms. Where the foremast hands
   berthed. Described by the New Bedford Whaling Museum as black, slimy with filth, very
   small, and hot as an oven. *This is the space our refit lets you sheathe, and it is why
   that is worth money.*
2. **Blubber room**, amidships — where blubber was cut into horse pieces and bible leaves
   before going to the try-pots.
3. **Steerage**, aft of the blubber room — the boatsteerers and the idlers: cooper,
   carpenter, blacksmith, steward, ship's boy. Described as irregular in shape.
4. **The cabin**, right aft — the master's sleeping cabin at the after end, and a dining
   space with table and benches secured to the deck. The mates' cabins on the **port** side
   (first mate, then second and third sharing two berths); a **pantry** on the starboard
   side.

**The section as built has this order right.** What it has wrong is shape: the forecastle
is a *triangle* in the bow, not a box, and steerage is irregular, not rectangular.

### The main deck

Documented in pieces only: the **try-works** with its try-pots stands on deck and is
**forward** of amidships; **five whaleboats hang on davits** around her sides with **two
more stowed upside down on deck**; the windlass is forward. Beyond that, this note cannot
honestly place the deck house, galley, hatches, cutting stage or wheel from what is
published freely. *The rest is inferred and should be marked as such wherever we draw it.*

### The hold

Casks, in tiers — water and provisions outward, oil stowed down as it is made. Her first
voyage came home with 2,400 barrels in her. No published deck-by-deck cask plan was found.

---

## 4. Where the real sections are

They exist, and they are not free.

**Mystic Seaport's Daniel S. Gregory Ships Plans Library holds 113 sheets of plans for the
Morgan**, drawn by Mystic Seaport staff — including a deck plan and bulwarks drawn by
Robert C. Allyn in 1971, whaleboat handling arrangements, and davit construction details.
That is the real thing, and buying the few relevant sheets is the way to get a true
section.

The Library of Congress holds photographs of her but **no HAER measured drawings for this
vessel were found** — the drawings live at Mystic, not in the public federal record.

Also worth having in hard copy: John F. Leavitt, *The Charles W. Morgan* (Mystic Seaport,
1973), the standard monograph. Not consulted for this note.

---

## 5. What to do with it

1. **Do not redraw the section from this note alone.** The compartment *order* is solid;
   the *shapes and stations* are not, and drawing them confidently would be inventing.
2. **Get two or three sheets from Mystic** — a profile and the 'tween deck plan — and the
   section can be drawn true instead of plausible.
3. Three things this note says the game already gets right, and should not be "improved":
   ship rig with single topsails in 1841, the five idlers by name, and the shipkeepers.
4. Three things it said were wrong or missing have been **put right (10 September)**:
   she now ships two-and-thirty hands under the master for a company of thirty-three;
   every man has an age, and a third of them are boys; and she has **false gunports
   painted black along her buff sheer band**, which is the most recognisable thing about
   the real ship.

---

## Sources

- [Charles W. Morgan — National Historic Landmark nomination, NPS](https://npgallery.nps.gov/NRHP/GetAsset/NHLS/66000804_text) — rig at launch, build, company, lays, first voyage
- [Charles W. Morgan (ship) — Wikipedia](https://en.wikipedia.org/wiki/Charles_W._Morgan_(ship)) — dimensions and tonnage
- [Life Aboard — New Bedford Whaling Museum](https://www.whalingmuseum.org/research/research-resources/whaling-history/life-aboard/) — forecastle, steerage, cabin
- [Charles W. Morgan — Mystic Seaport](https://mysticseaport.org/explore/morgan/) — present dimensions, try-pots on deck
- [CHARLES W. MORGAN; whaleship — Mystic Seaport ships plans](http://mobius.mysticseaport.org/detail.php?module=objects&type=related&kv=455002) — the 113 sheets
- [Charles W. Morgan — New Bedford Whaling National Historical Park, NPS](https://www.nps.gov/nebe/learn/historyculture/charleswmorgan.htm)
