# 🐍 Gobble

A playable prototype and data-simulation sandbox for a **simultaneous-programming snake
board game**, contained in a single HTML file.

Every round, all players secretly program a strip of **2 to `commandSlots` cards** — arrows
(move 1) and **Boost** cards (spend a card to slide 3) — and lock in fewer than the max to
stop in place for the remaining ticks. The strip then resolves tick-by-tick simultaneously.
Snakes start at length 3. **Every token pays energy (boost cards): food = +1 grow/+1 energy,
×2 food = +2 grow/+1 energy, ×2 energy = +2 energy (no growth).** Boosts resolve before
arrow moves each slot, so a booster claims contested squares first. Dying flips **every other body piece** into ×2 bounty food and **banks points by
length** (a stepped ladder: 5→1, 6→2 … 13→30). Dead snakes re-enter by **placing onto any 3
contiguous empty cells** — bends allowed, facing derives from the neck, and the head can't
face food. At **max length (13)** the snake stops growing and each food eaten instead scores
**+10 points on the spot** (a +2 food = +20), so the dominant plan is to get huge and keep
eating. When someone reaches the target score every living snake cashes out its length — the
highest **total** wins. Mirrors the physical prototype in `RULES.md`.

## Run it

Open **`index.html`** in any modern browser. That's the whole app — no build step, no
server. (First load needs internet access for the Tailwind CDN; the game engine itself is
fully local.)

## What's inside

- **Live play** — human vs. bots, hot-seat pass-and-play (2–8 seats, any human/bot mix),
  or all-bot spectator games, with an animated board, click-to-place respawns, per-slot
  **Boost** toggles (spending boost cards), WebAudio sound effects (mutable, zero assets),
  and the 15-second **panic timer** that starts the moment the first player locks in.
- **Simulation Mode** — a headless toggle that hides the board and batch-runs hundreds of
  bot games in milliseconds, then reports: average game length, score distribution,
  deaths per player with wall / head-to-head / body cause breakdown, boost efficiency
  (cards spent vs. boost crashes), and end-of-game token density.
- **Variable control panel** — board size, player count, command slots, starting length,
  boost distance, starting & max energy, total/starting tokens, ×2 food & ×2 energy
  shares, token spawn nodes, points to win, max snake length, max-length food bonus, and an
  editable length→points score table with a one-click triangular refill.
- **Bots** — lightweight non-cheating heuristic: self-preservation first, then Manhattan
  token-seeking, a 25% boost chance when the lane is clear, and anti-enclosure spawn
  placement (flood-fill openness scoring).

Where the tabletop rules need a referee (simultaneous swaps, boost sub-steps, spawning
onto food, etc.), the rulings are documented in the header comment of `index.html`.
A console/test API is exposed as `window.Gobble` (`runBatch`, `Engine`, `Bot`, …).
