# 🐍 Gobble

A playable prototype and data-simulation sandbox for a **simultaneous-programming snake
board game**, contained in a single HTML file.

Every round, all players secretly program a strip of **2 to `commandSlots` tiles** — movement
tiles (move 1) and **Boost** tiles (slide 3; everyone owns one that refreshes each round,
extras come from growth milestones) — and locking in fewer than the max stops you in place.
The board is **one 4×4 mini-board per player**, tiled as close to a square as possible (3
players = an L), with **food and special swirls printed on fixed spots that never deplete**
(each board's layout differs and is rotationally asymmetric). Boosts resolve before stepping
moves each slot, so a booster crosses a contested space first and leaves its body in the way.
**Scoring is continuous:** every segment you grow is a point (ten of them on your player
board), and at **maximum length** each food is worth 2 instead — dying never takes points
away, it just resets your snake to length 4. Snakes leave **snake food** beads behind when
they die, and respawn touching a mini-board corner. First to **30** ends it; highest total
wins. Mirrors the physical prototype in `RULES.md`.

## Run it

Open **`index.html`** in any modern browser. That's the whole app — no build step, no
server. (First load needs internet access for the Tailwind CDN; the game engine itself is
fully local.)

## What's inside

- **Live play** — human vs. bots, hot-seat pass-and-play (2–8 seats, any human/bot mix),
  or all-bot spectator games, with an animated board, click-to-place respawns, per-slot
  **Boost** toggles (spending boost cards), WebAudio sound effects (mutable, zero assets),
  and the 10-second **panic timer** that starts the moment the first player locks in.
- **Simulation Mode** — a headless toggle that hides the board and batch-runs hundreds of
  bot games in milliseconds, then reports: average game length, score distribution,
  deaths per player with wall / head-to-head / body cause breakdown, boost efficiency
  (cards spent vs. boost crashes), and end-of-game token density.
- **Variable control panel** — player count, mini-board size, command slots, starting
  length, boost distance, free boosts per round, banked-energy cap, food spots per board,
  ×2 food share, points to win, max snake length, max-length food bonus, and an editable
  length→points score table.
- **Bots** — lightweight non-cheating heuristic: self-preservation first, then Manhattan
  token-seeking, a 25% boost chance when the lane is clear, and anti-enclosure spawn
  placement (flood-fill openness scoring).

Where the tabletop rules need a referee (simultaneous swaps, boost sub-steps, spawning
onto food, etc.), the rulings are documented in the header comment of `index.html`.
A console/test API is exposed as `window.Gobble` (`runBatch`, `Engine`, `Bot`, …).
