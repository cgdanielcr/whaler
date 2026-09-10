# Art wanted

For the engraved-chart look, from the owner's reference of 10 September 2026. This is the
shopping list: exact enough to hand to an illustrator or to use as prompts.

**Put everything in a new `art/` folder** in the repo, with the filenames given below. All
of it is loaded directly by the page — no build step, no tool, nothing to install.

**Keep the whole folder under about 6 MB.** It is served from GitHub Pages and the page
must still open quickly on a phone.

**Everything is ink, and nothing is paper.** Ornament should be **black lines on
transparency**, never black-on-cream — the parchment is a separate layer underneath, and
the ink gets tinted in code so it can sit on a bright day or a dirty one. A drawing with
its own paper baked in cannot do that.

---

## Tier one — nothing works without these

### 1. The hatch set — `art/hatch-1.png` … `art/hatch-6.png`

**The single most important item on this list.** It is what makes the ship, the sea and
everything else read as an engraving rather than as flat colour.

- **Six images**, 1024 × 1024 each, PNG, 8-bit greyscale
- **Black lines on white.** No transparency, no colour
- **Seamlessly tileable** — the left edge must meet the right, the top the bottom
- **Copperplate burin lines**: strokes that swell in the middle and taper at both ends, as
  a graver cuts them. Not uniform pen strokes, not digital hairlines
- Primary direction about **45°**

The critical part, and the one an illustrator will not guess:

> **Each level must contain every line of the level before it, and then add more.**
> Sheet 2 is sheet 1 plus more lines. Sheet 3 is sheet 2 plus more. And so on.

If the six sheets are drawn independently the lines jump about as the light moves and the
whole surface flickers. This is called a tonal art map and the nesting is the whole trick.

| Sheet | Roughly |
|---|---|
| `hatch-1` | Lightest. Six or eight widely spaced lines across the tile |
| `hatch-2` | Those, plus as many again between them |
| `hatch-3` | Denser still, lines beginning to thicken |
| `hatch-4` | Dense, and **cross-hatching begins** — a second direction at about 135° |
| `hatch-5` | Both directions dense, a third at 90° coming in |
| `hatch-6` | Nearly solid black, with a little white still breathing through |

**If only one thing on this list gets made, make this.**

### 2. Parchment, seamless — `art/parchment.jpg`

- **2048 × 2048**, JPG, seamless tiling
- Aged cream, foxing spots, a little fibre and a few water stains
- **Low contrast.** It sits under everything and multiplies. A dramatic sheet will fight
  the drawing and make text unreadable — err toward too subtle

### 3. Parchment panel with a torn edge — `art/panel.png`

- About **1400 × 1000**, PNG **with transparency**
- One sheet of the same aged paper with a **deckled or torn edge on all four sides**
- Used behind the boards — Canvas, Orders, the clock — so they sit on the page as scraps
  of paper rather than as rectangles
- Needs enough plain area in the middle for text to sit on

---

## Tier two — the character of the thing

All **black on transparency**, PNG.

### 4. The wind-head — `art/wind-head.png`

- About **1024 × 1024**
- A period wind personified: a cheeked face in cloud, blowing a stream of curling breath,
  as on the reference
- **Draw it blowing to the right**, breath streaming out to the right edge, face on the
  left. It will be rotated in code to point wherever the wind actually is, so the breath
  must run along one axis
- This is not decoration — it becomes the wind indicator

### 5. Compass rose — `art/rose.png`

- **1024 × 1024**, square, centred, north up
- Thirty-two points, fleur-de-lis at north, engraved

### 6. A sea monster — `art/monster.png`

- About **1400 × 900**
- The whale-beast of the reference: breaching, jaws open, spouting
- Lives in an empty corner of the chart

### 7. Corner flourishes — `art/flourish-1.png`, `art/flourish-2.png`

- **512 × 512** each
- Engraved scrollwork for the corners of panels and the cartouche. Two different ones is
  plenty; they can be flipped and rotated

### 8. Cartouche frame — `art/cartouche.png`

- About **1200 × 600**, PNG with transparency
- An empty engraved frame with a clear middle, for the chart's title and for the account
  at the end of a voyage

---

## Tier three — later, and only if the rest lands

### 9. Engraved clouds — `art/clouds.png`

- **2048 × 1024**, black on transparency
- A strip of three or four separate engraved cloud masses, well apart so they can be cut
  up and scattered

### 10. An engraved sperm whale — `art/whale.png`

- About **1400 × 700**, side on, for when the boats go down

### 11. Engraved figures — `art/figures.png`

- A sheet of **eight to twelve small standing men**, side on, about 128 × 256 each on a
  grid, black on transparency
- Sailors in shirtsleeves and trousers, a couple in mates' coats, one boy
- They replace the pixel crew on deck. Lowest priority: the crew read fine at present

---

## Notes for whoever draws these

- **One ink colour only.** No wash, no grey fills — the tone comes from line density, which
  is what makes it an engraving
- Line weight should hold up **small**. The hatches will often be seen at a quarter size
- Nothing should have a background. Transparency everywhere except the hatches and the
  parchment
- Period is **1841**, American. Engraving style of the late eighteenth to early nineteenth
  century — Bowen, Moll, the plates in a book of voyages

## What changes in the code when these arrive

Recorded so it is not a surprise: this amends **`SPEC.md` §4**, which currently says art is
procedural geometry with no image files. Geometry stays procedural — the ship is still built
from primitives — but **textures become image files**, and that line in the spec will be
rewritten to say so. Three.js stays the only dependency and there is still no build step.
