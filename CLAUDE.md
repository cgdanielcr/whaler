# CLAUDE.md

Read `SPEC.md` before doing anything. It is the source of truth for scope, stack, and the
historical model.

## Non-negotiables

- **No build step.** Plain JavaScript ES modules, Three.js from CDN via import map.
  Do not add npm, Vite, TypeScript, React, or a bundler. If a task seems to require one,
  stop and ask.
- **Three.js is the only dependency.**
- **`main` is always deployable and always playable.** Never commit a broken state.
  Revert instead.
- **Every milestone ends live on GitHub Pages**, with a one-line test written in plain
  language that the owner can perform in a browser.
- **No animated characters, no below-deck interiors, no whaling.** See SPEC section 3.

## Vocabulary

Period-correct terms only, in code and UI:

- Horizontal spars are **yards**. Vertical are **masts**.
- Sails are **set**, **reefed**, **furled**, **taken in**. Never opened or closed.
- **Larboard** and **starboard**, not port and starboard — the year is 1841.
- **Windward** and **leeward**.
- Wind force uses names, never Beaufort numbers: light airs, moderate breeze, fresh
  breeze, strong breeze, fresh gale, strong gale, whole gale, storm.

## Working style

The owner is a novelist, not a developer. He evaluates by playing.

- Explain changes in plain language.
- Never refactor or rename unprompted.
- Keep files under ~200 lines, one concern each.
- He is on a Pro plan with a rolling five-hour usage limit shared with the Claude app.
  Be economical: no unnecessary file reads, no large diffs for small changes, no questions
  the spec already answers.
- When you need a decision, offer two or three concrete options.

## Local testing

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. ES modules will not load from `file://`.
