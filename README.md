# 🐍 Gobble

A playable prototype and data-simulation sandbox for a **simultaneous-programming snake
board game**, contained in a single HTML file.

Every round, all players secretly program a strip of **2 to `commandSlots` tiles**: movement
tiles (1 space) and **boost tiles** (3 spaces, same rotation-to-aim). Everyone owns one
personal boost that refreshes each round; spare boost tiles come from the growth milestones
on the player board (boxes 3, 6 and 10). The board is **one 4×4 mini-board per player**,
tiled as close to a square as possible, with **pixel-art food and colourful special swirls
printed on fixed spots that never deplete**. Crossing a swirl draws from an **18-card
Special deck**, and all nine effects are implemented in the engine and played by the bots:
Flip Flop, Whoopsie, Vroom Vroom, Nom Nom, Bounce, Star Power, Rev Up, Careful Slither and
Victory Lap. Boosts resolve before stepping moves each slot. **Scoring is continuous**
(each segment grown is a point, 2 per food at max length) and dying just resets you to
length 4 leaving snake-food beads behind. First to **30** ends it; highest total wins.
Mirrors the physical prototype in `RULES.md`.

## Play it

**<https://mbancha.github.io/Gobble/>** — nothing to install, nothing to clone.

`index.html` is completely self-contained: styles, engine, artwork and sound all live in
that one file, and it makes **zero network requests**. So it works just as well saved to
your desktop and double-clicked, on a plane, or from a USB stick. Best on a laptop: the
layout is a three-pane desktop app and gets cramped on a phone.

### Print and play

The tabletop version is in [`RULES.md`](RULES.md), and the printable PDFs sit in
[`print/`](print/) (US Letter, borderless). Once Pages is live they download straight from
the browser, e.g. `https://mbancha.github.io/Gobble/print/gobble-rulebook.pdf`.

### Turning on GitHub Pages (one time)

Repo **Settings → Pages → Build and deployment → Source: _Deploy from a branch_**, pick
branch `claude/snake-game-prototype-80hmis` and folder `/ (root)`, then **Save**. The site
builds in a minute or two and redeploys on every push. Because this repo is private,
publishing a Pages site needs a paid plan (GitHub Pro or higher); on the free plan, make
the repo public first — and note that a Pages site is publicly readable either way unless
you're on Enterprise Cloud.

## What's inside

- **Live play** — human vs. bots, hot-seat pass-and-play (2–8 seats, any human/bot mix),
  or all-bot spectator games, with an animated board, click-to-place respawns, per-slot
  **Boost** toggles (spending boost cards), WebAudio sound effects (mutable, zero assets),
  and the 10-second **panic timer** that starts the moment the first player locks in.
- **Simulation Mode** — a headless toggle that hides the board and batch-runs hundreds of
  bot games in milliseconds, then reports: average game length, score distribution,
  deaths per player with wall / head-to-head / body cause breakdown, boost efficiency
  (tiles spent vs. boost crashes), and end-of-game token density.
- **Variable control panel** — player count, mini-board size, command slots, starting
  length, boost distance, personal boosts, spare-tile cap, food spots per board, special
  spaces, points to win, max snake length, max-length food bonus, and an editable
  length→points score table.
- **Bots** — lightweight non-cheating heuristic: self-preservation first, then Manhattan
  token-seeking, a 25% boost chance when the lane is clear, and anti-enclosure spawn
  placement (flood-fill openness scoring).

Where the tabletop rules need a referee (simultaneous swaps, boost sub-steps, spawning
onto food, etc.), the rulings are documented in the header comment of `index.html`.
A console/test API is exposed as `window.Gobble` (`runBatch`, `Engine`, `Bot`, …).

## Working on it

```sh
npm install        # playwright + the tailwind compiler (dev only; players need neither)
npm run build:css  # recompile the inlined <style> block after changing any class
npm test           # 36 checks in real Chromium: rules, invariants, balance, UI flow
npm run print      # regenerate the PDFs in print/
```

`npm test` also fails if the inlined CSS is stale, so a new Tailwind class can't silently
go unstyled. The PDF generators live in `print/generate.mjs` and `print/rulebook.mjs` and
share the Special-card text in `print/specials.mjs`, so the cards and the rulebook can't
drift apart.
