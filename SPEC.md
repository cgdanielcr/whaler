# Ship — v1 specification

A browser game about sailing a square-rigged ship. Real-time with pause. Runs in a
browser tab, no install, no login.

This document is the source of truth for scope, stack, and the historical model. Read it
before writing code. If something here conflicts with a later instruction in chat, say so
rather than silently picking one.

---

## 1. What this is

You command a ship-rigged vessel of about 350 tons with a crew of 30, in the Pacific in
1841. You set a heading, you decide how much canvas to carry, and the weather changes
faster than your crew can work.

**The core tension:** every order takes real time and needs a minimum number of hands.
Reefing topsails takes twelve minutes. A squall becomes visible eight minutes before it
hits. You have to decide early, on incomplete information, and you are punished for both
timidity and bravado — carry too little and you crawl, carry too much and you split a
sail or spring a mast.

That decision is the whole game. Everything else is decoration until it works.

## 2. v1 scope — what is IN

- One ship, seen from outside, on open sea
- Full sail plan with visible per-sail states
- Wind direction and force, changing over time
- Heading control, speed derived from point of sail
- Orders that take time to execute and require hands
- A crew represented as **numbers and a hands-available counter** — not characters
- Weather events on a timeline: squalls, gales, calms
- Damage: split sails, sprung spars, from carrying too much canvas
- One passage with a destination and an arrival condition

## 3. v1 scope — what is OUT

Do not build these, do not scaffold for them, do not add "hooks for later":

- Animated sailors, characters, or any humanoid model
- Below-deck interiors
- Whaling, whaleboats, harpooning
- Multiplayer, accounts, save games, leaderboards
- Procedural world generation, islands, ports
- Cutting-in, gunnery, boarding
- Audio (v2)
- Mobile touch controls (v2 — desktop keyboard and mouse only)

If you think one of these is needed for something in scope, stop and ask.

## 4. Stack — locked

| Choice | Value | Why |
|---|---|---|
| Renderer | Three.js from CDN via import map | No install step |
| Build | **None** | Fewer moving parts the owner can't debug |
| Language | Plain JavaScript, ES modules | No TypeScript, no transpile |
| Hosting | GitHub Pages from `main` | Push equals deploy |
| Files | `index.html` + `src/*.js` modules | Small files, one concern each |
| Shapes | Procedural geometry from Three.js primitives | No modelling software needed |
| Surfaces | Drawn sheets in `art/`, loaded as textures | Hatching cannot be faked in code |
| Dependencies | Three.js only | Every added dependency is a new failure mode |

**Do not introduce Vite, npm, TypeScript, a bundler, React, or a physics engine.** If a
task genuinely cannot be done without one, stop and explain why before adding it.

The Surfaces line was rewritten on 12 September 2026. It used to say art was procedural
and forbid image files, and that was never a decision the owner made -- it was a habit
that hardened into a rule. Her *shapes* are still built from primitives and always will
be. But an engraved line has to be drawn by someone who can draw, so the hatching, the
paper and the ornament are picture files in `art/`, listed in `ART.md`. Keep that folder
small: it is served from GitHub Pages and the page must still open on a telephone.

Local testing: `python3 -m http.server 8000`, then open `http://localhost:8000`. ES
modules will not load from `file://`.

## 5. Deploy-first working method

**This is a hard requirement, not a preference.** The owner is not a developer and
evaluates the project by playing it in a browser. Code he cannot see running is worthless
to him.

- **Milestone 0 is deployment**, before any game code exists. A repo, a blank page, a
  live GitHub Pages URL. Nothing else starts until that URL loads.
- **Every milestone ends deployed and playable.** Not "ready to deploy" — actually live.
- **Never leave `main` broken.** If a change doesn't work, revert rather than commit a
  half-finished state.
- **Every milestone ends with a one-line test the owner can perform**, written in plain
  language. "Load the page, press R, the topsails should visibly shrink over about twelve
  seconds." Not "verify the reef state machine transitions correctly."
- Commit in small steps with plain-language messages.

## 6. Milestones

Each is a session's work or less. Do them in order. Do not start the next until the owner
confirms the previous one works.

**M0 — It's live.**
Repo, `index.html`, GitHub Pages deploy from `main`. Page shows a coloured background and
the text "Ship".
*Test: the URL loads on your phone.*

**M1 — A ship on the sea.**
Sea as a large plane with a simple shader or flat colour. Low-poly hull built from
primitives. Sky. Camera orbits with the mouse.
*Test: you can see a ship floating, and drag to look around it.*

**M2 — The rig.**
Three masts, yards, and sails as flat planes. Each sail has a state: set, reefed,
close-reefed, furled. Keyboard keys change states instantly, no timing yet.
*Test: press a key, a sail visibly shrinks or disappears.*

**M3 — Wind and motion.**
Wind vector with direction and force. Ship has a heading you steer. Speed calculated from
point of sail and canvas set. Wind shown as an on-screen arrow. A wake or drift indicator
so motion is visible.
*Test: steer close to the wind and watch the ship slow down.*

**M4 — Time and orders.**
Real-time clock with pause on spacebar. Orders are issued, take time, occupy hands, and
complete. An orders panel shows what's in progress and how many hands are free.
*Test: order a reef, unpause, watch a twelve-minute timer run while the sail changes.*

**M5 — Weather and consequence.**
A weather timeline. Wind force rises and falls. Squalls appear on the horizon with a
visible warning time. Carrying too much canvas for the force causes damage.
*Test: ignore an approaching squall and split a topsail.*

**M6 — A passage.**
A destination, a distance made good, an arrival. A short summary at the end.
*Test: sail from A to B and see how long it took.*

---

## 7. The historical model

The numbers below are the reason this game is worth building. Use them as given. Where a
value is marked **inferred**, it is a reasonable reconstruction rather than a documented
figure, and can be tuned for play. Where it is marked **documented**, don't change it
without asking.

### 7.1 The ship

Ship-rigged (three masts, square-rigged on all three), about 350 tons burthen, roughly
110 ft on deck, crew of 30. Modelled on the American whaleships of the 1840s.
*Documented.*

Watches: crew divided in two, starboard and larboard, four hours on and four off. So
**about 15 hands are available at any moment**; calling all hands gets 30 at a fatigue
cost. *Documented.*

### 7.2 Sail plan

Bottom to top on each mast:

| Mast | Sails, lowest first |
|---|---|
| Fore | Fore course (foresail), fore topsail, fore topgallant, fore royal |
| Main | Main course (mainsail), main topsail, main topgallant, main royal |
| Mizzen | Spanker (gaff, fore-and-aft), mizzen topsail, mizzen topgallant, mizzen royal |

Plus headsails on the bowsprit: fore topmast staysail, jib, flying jib.

**Vocabulary — use these exact words in the UI.** Not "front sail", not "middle mast".

- The horizontal spars are **yards**, not beams or poles
- Sails are **set**, **reefed**, **furled**, **taken in** — never "opened" or "closed"
- Reduce canvas from the top down: royals first, then topgallants, then reef topsails
- Left is **larboard** in 1841, not port (the Royal Navy order replacing larboard came in
  1844). Right is **starboard**
- Toward the wind is **windward** or **to weather**; away is **leeward**, said "loo-ard"

Sail states, in order: `set` → `1st reef` → `2nd reef` → `close-reefed` → `furled`.
Courses and royals have no reef states — they are `set` or `furled`.

### 7.3 Evolution durations and manning

These are the heart of M4. Durations are **inferred** from the procedures described in
Richard Henry Dana Jr., *The Seaman's Friend* (1841) — the correct manual for this exact
year — and Darcy Lever, *The Young Sea Officer's Sheet Anchor* (1808). Period manuals
describe the sequence of orders but rarely state clock times, so treat the ranges as
tunable. The **relative** costs are the important part and should be preserved.

| Order | Hands | Time | Notes |
|---|---|---|---|
| Take in royals | 4 | 3 min | Topmen aloft |
| Take in topgallants | 6 | 5 min | |
| Single-reef topsails | 14 | 12 min | Effectively all hands |
| Second reef | 14 | 15 min | From single-reefed |
| Close-reef topsails | 16 | 20 min | Brutal in a blow |
| Shake out a reef | 10 | 8 min | Faster than taking one in |
| Furl a course | 8 | 10 min | |
| Set a course | 8 | 8 min | |
| Tack ship | 16 | 4 min | Can fail — see below |
| Wear ship | 12 | 9 min | Slower, safer, loses ground to leeward |
| Send down topgallant yards | 10 | 25 min | Storm preparation |
| Man the pumps | 6 | continuous | |

**Tacking can fail.** If the ship is under-canvassed, the sea is high, or she is moving
slowly, she may **miss stays** — fail to come through the wind and stall head-to-wind,
"in irons". Recovery takes 5–10 minutes and she loses all way. Failure chance rises
sharply below 4 knots. Wearing never fails but costs ground. *Documented that this
happens; the probability curve is inferred.*

### 7.4 Wind force

**Do not use Beaufort numbers.** The scale was devised in 1805 but not made standard in
the Royal Navy until 1838, and numbered forces would read wrong in a merchant ship's
mouth in 1841. Use these names in the UI.

| Force | Name | Canvas she can carry |
|---|---|---|
| 0 | Calm | Everything, and no steerage way |
| 1 | Light airs | All plain sail |
| 2 | Light breeze | All plain sail |
| 3 | Moderate breeze | All plain sail — best sailing |
| 4 | Fresh breeze | Royals in |
| 5 | Strong breeze | Topgallants in |
| 6 | Fresh gale | Topsails single-reefed, courses in |
| 7 | Strong gale | Topsails double-reefed |
| 8 | Whole gale | Close-reefed main topsail only |
| 9 | Storm | Storm staysails, or scud before it |

**The damage rule:** if the canvas set exceeds what the force allows, damage accumulates
each minute. One step over is risky; two steps over is very likely to break something.

Damage ladder, cheapest first: **split sail** (that sail is gone until repaired) →
**sprung yard** (that sail unusable) → **sprung topmast** (whole mast's upper sails gone)
→ **broach** (ship thrown broadside to the sea, severe). *Documented as real failure
modes; the thresholds are inferred.*

### 7.5 Speed and points of sail

A square-rigged ship cannot sail closer than **6 points (67.5°)** to the wind, and makes
significant leeway doing it. *Documented.*

| Point of sail | Angle off wind | Speed factor |
|---|---|---|
| In irons | 0–67° | 0 |
| Close-hauled | 67–80° | 0.55, plus 5° leeway |
| Close reach | 80–110° | 0.80 |
| Beam reach | 110–135° | 0.95 |
| Broad reach | 135–160° | 1.00 — a square-rigger's best |
| Running | 160–180° | 0.85, and she rolls badly |

Maximum speed at factor 1.0 with full plain sail: **9 knots** in a moderate to fresh
breeze. Typical passage speed 4–5 knots. A good day's run is 150–200 nautical miles.
*Documented range.*

Speed also scales with canvas set and with wind force, so a ship close-reefed in a whole
gale may make 6 knots while a ship under all plain sail in light airs makes 2.

**To reach a point upwind you must beat** — sail close-hauled on alternating tacks. Net
progress toward the destination is roughly 55–60% of distance sailed. This should feel
expensive; it was.

### 7.6 Squalls — the core timer

A squall is visible as a dark line on the horizon before it arrives. Warning time is
**5–20 minutes**, shorter at night and in poor visibility. It brings a sudden jump of
2–3 forces lasting 10–30 minutes, often with a wind shift.

This is the mechanism that makes the game work: the warning time must be shorter than the
time to fully shorten sail, so the player is always choosing which reduction to make
rather than making all of them.

*Warning-time range is documented in seamanship practice; exact values are tunable.*

### 7.7 Time scale

Game time runs faster than real time — suggest **1 real second = 30 game seconds**, so a
twelve-minute reef takes 24 seconds to watch. Pause on spacebar. The player should be
able to speed up to 8× during quiet stretches, but **speed-up must be disabled while a
squall is visible.**

---

## 8. Working with the owner

He is not a developer. He is a novelist doing detailed historical research, so he will
notice wrong terminology immediately and won't notice wrong architecture at all.

- Explain what you did in plain language. Not "refactored the state machine" but "the
  sails now remember whether they're reefed."
- Never refactor, restructure, or rename unprompted. He can't evaluate it and it burns
  his usage limits.
- Keep files under about 200 lines. Small files are cheaper to send you later.
- He is on Claude Code with a Pro plan, which has a rolling five-hour usage limit shared
  with the Claude app. Be economical: don't re-read files you already have, don't produce
  large diffs for small changes, and don't ask questions the spec already answers.
- When you need a decision from him, ask one specific question with two or three concrete
  options, not an open-ended one.

## 9. Sources

Real, and worth quoting terminology from:

- Richard Henry Dana Jr., *The Seaman's Friend* (Boston, 1841) — a working manual of
  seamanship from the exact year, including a dictionary of sea terms
- Darcy Lever, *The Young Sea Officer's Sheet Anchor* (1808) — illustrated rigging and
  evolutions
- William Falconer, *Universal Dictionary of the Marine* (1769) — terminology, earlier
  but foundational
- The *Charles W. Morgan* at Mystic Seaport — a surviving 1841 whaleship, dimensions and
  rig

Do not invent citations or attribute period quotations you cannot verify.
