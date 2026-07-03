# 🐍 Gobble

A playable prototype and data-simulation sandbox for a **simultaneous-programming snake
board game**, contained in a single HTML file.

Every round, all players secretly program a strip of **2 to `commandSlots` moves** (with
optional energy-burning **Turbo** slides) — lock in fewer than the max and your snake simply
stops in place for the remaining ticks. The strip then resolves tick-by-tick simultaneously. Dying flips **every
other body piece** into double-value bounty food and **banks points based on your length**
(a halved-triangular table: 1, 2, 3, 5, 8 … per length step past your starting size). Dead
snakes re-enter by **placing onto any 3 contiguous empty cells** — bends allowed, facing
derives from the neck, and the head can't face food. A fifth of the food supply are
**2× tokens** worth double growth *and* double energy; snakes at max length convert every
extra growth unit into a **big instant bonus** (≈ a full-snake bank per food), so the
dominant plan is to get huge and keep eating. When someone reaches the target score every
living snake cashes out its length — the highest **total** wins.

## Run it

Open **`index.html`** in any modern browser. That's the whole app — no build step, no
server. (First load needs internet access for the Tailwind CDN; the game engine itself is
fully local.)

## What's inside

- **Live play** — human vs. bots, hot-seat pass-and-play (2–8 seats, any human/bot mix),
  or all-bot spectator games, with an animated board, click-to-place respawns, per-slot
  Turbo toggles, WebAudio sound effects (mutable, zero assets), and the 15-second
  **panic timer** that starts the moment the first player locks in.
- **Simulation Mode** — a headless toggle that hides the board and batch-runs hundreds of
  bot games in milliseconds, then reports: average game length, score distribution,
  deaths per player with wall / head-to-head / body cause breakdown, turbo efficiency
  (turbo moves vs. turbo crashes), and end-of-game food density.
- **Variable control panel** — board size, player count, command slots, starting length,
  turbo distance/cost, food & bounty energy yields, total/starting food tokens, 2× food
  share, food spawn node count, energy cap, points to win, max-length food bonus, and an
  editable length→points score table with a one-click triangular refill.
- **Bots** — lightweight non-cheating heuristic: self-preservation first, then Manhattan
  food-seeking, a 25% turbo chance when the lane is clear, and anti-enclosure spawn
  placement (flood-fill openness scoring).

Where the tabletop rules need a referee (simultaneous swaps, turbo sub-steps, spawning
onto food, etc.), the rulings are documented in the header comment of `index.html`.
A console/test API is exposed as `window.Gobble` (`runBatch`, `Engine`, `Bot`, …).
