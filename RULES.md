# GOBBLE — Rules

*A simultaneous-programming snake game for 2–8 players. Program your moves in secret, reveal at once, and grow fat before you crash — because dying is how you score.*

---

## Components

- **6 × Mini-boards** — 4×4 boards (5.9″ square), one per player. Each has **5 food spots printed on it**, and **4 of the 6 also have a BOOST space**. Every board's arrangement is different and rotationally asymmetric, so turning a board around changes the game. Everything printed is permanent — it never runs out and nothing is ever placed or removed. Printed food is **+1**; ×2 food comes only from bounty.
- **8 × Arrow card sets** — 6 arrow cards per player, in the player's colour.
- **8 × Personal boost cards** — every player permanently owns **one boost card** (part of their hand, like the arrows — it comes back every round).
- **1 × Boost deck** — a shared stack of generic "×3" boost cards, drawn from boost spaces and length milestones; these are **discarded after use**.
- **8 × Player boards** — a length row to track your snake, with the points banked under each space and a ⇑ marking the lengths that award an extra boost card.
- **1 × Score track sheet** — a shared 1–100 track; every player moves a marker on it (start off the track at 0).
- **Snake pieces** — per player, 1 head marker + up to 13 body/tail segments in your colour.
- **A 15-second timer** — a phone timer or sand timer (the "panic timer").

---

## The goal

Be the first to reach the **target score (default 70 points)**. You score mostly by **dying** — the longer your snake when it dies, the more points it banks — and by **feeding at max length**. Grow as big as you dare, cash out at the right moment, and get back on the board.

---

## Setup

1. **Build the board:** place one mini-board per player, arranged **as close to an even square as possible** (2 players = a 2×1 strip, 3 = an L, 5 = a P, and so on). Edges with no board beyond them are walls.
2. Give each player their **6 arrow cards + 1 personal boost card**, their **snake pieces**, and a **player board**. Shuffle the boost deck into a draw stack.
3. **Place each snake** at length **3**: any 3 contiguous cells (bends fine) free of snakes and tokens, with **at least one piece touching a corner of any mini-board**. Placing over printed food is fine — **you never eat what you cover**.

---

## Playing a round

### 1. Program (in secret)

Lay **2 to 6 cards** face-down in a row in front of you — left card resolves first.

- An **Arrow card** = move **1 cell** in the direction the card points (rotate it to aim).
- A **Boost card** = slide **3 cells** in one direction (rotate to aim). Your personal boost returns to your hand for next round; **drawn** boost cards are discarded after the round.
- You must program **at least 2** cards. If you program fewer than 6, your snake simply **stops in place** for the remaining moves.

**The panic timer:** the instant the **first** player locks their row, start the **15-second timer**. When it runs out, everyone else must lock **whatever they have** immediately.

### 2. Reveal & resolve

Flip all rows face-up. Resolve **one slot at a time**. Within each slot:

1. **Boosts go first.** Every boosting snake runs its full 3-cell slide, cell by cell (boosters move simultaneously with each other). A boost that crashes on the 1st or 2nd cell dies there and doesn't finish.
2. **Then arrows.** Every arrow snake steps 1 cell, all together.

For each move: **tails clear** (lift your last tail piece unless this move grows you) → **heads slide** → **check crashes** → **pick up / eat**.

**Crashes:** a head that enters a **wall** (any edge with no board beyond it), **any snake's body**, or a **remaining tail** → that snake dies — including moving into the **side of a stationary snake's head** (only the mover dies). **Both** snakes die only when they move **into the same square at the same time**. Because boosts resolve first, a booster claims a contested square — an arrow snake arriving a beat later just crashes into its side.

### 3. End of the round

No token upkeep — the food is printed on the boards. Just **respawn** dead players (see *Death*) and check for a **winner** (see *Winning*).

---

## Food, tokens & energy

When your head enters an uncovered food spot or a token (and you didn't crash):

| You entered | Growth | Boost cards |
|---|---|---|
| **Food spot** (printed) | +1 segment | — |
| **Boost space** (printed, on 4 boards) | — | **draw 1** |
| **Bounty chip** (from a death, one-shot) | +2 segments | — |

**Growth milestones:** whenever your snake **reaches an even length** (4, 6, 8, 10, 12, 14 — marked with a ⇑ on your player board) **draw an extra boost card**.

- **Printed food and boost spaces never deplete.** Eating doesn't remove them; a snake sitting on a spot just blocks it until the cell frees up. The same spot can feed snake after snake.
- **Bounty chips are one-shot** — remove them when eaten. A chip sitting on a printed spot covers it (you get the chip, and the spot is available again afterwards).
- New segments appear **behind the head** (they stack on the gap and unspool as you move). A pickup that doesn't grow you resolves like a normal move — your tail piece fills the gap.
- Hand limit for drawn boost cards: **6**.

### At maximum length (14)

Your snake **stops growing** — every unit of food you eat instead scores **+2 points immediately** (a ×2 bounty chip = **+4**).

> This is the engine of the game: a maxed snake camping good food spots prints points. Staying alive at max is nearly always better than resetting.

---

## Death, bounty & scoring

When a snake dies:

1. **Score it.** Bank points for the snake's **length at the moment of death**:

   | Length | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | **14 (max)** |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Points | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | **15** |

2. **Drop bounty.** The head leaves the board. Flip **every other body segment** (starting behind the head) to its **bounty** side — one-shot ×2 food for whoever eats it. Remove the segments in between.
3. **Respawn** next round: place at length **3** on any 3 contiguous cells free of snakes and bounty chips, **touching a corner of any mini-board**, covering printed spots freely (you don't eat them).

---

## Winning

The moment any player reaches the **target score (default 70)**, the game **ends immediately** — then:

- **Every snake still alive cashes out**, banking points for its **current length** from the same ladder.
- Compare **total scores**. **Highest total wins.**

The player who crossed the line doesn't automatically win — a rival sitting on a huge live snake can leapfrog them on the cash-out.

*Ties:* the tied player who ate the most food this game wins; if still tied, share the victory.

---

## Adjustable variables (tune to taste)

| Variable | Default | Notes |
|---|---|---|
| Players | 2–8 | One mini-board each |
| Mini-board size | 4×4 | |
| Food spots per board | 5 | All +1; every board's layout differs |
| Boost spaces | 1 on 4 of the 6 boards | Printed, +1 card, never depletes |
| Command slots (cards/round) | 6 | Minimum 2 programmed |
| Starting length | 3 | |
| Maximum length | 14 | Food = +2 pts each at max |
| Boost distance | 3 cells | |
| Free boosts per round | 1 | Your personal boost card |
| Milestone boosts | Even lengths | +1 card at 4, 6, 8, 10, 12, 14 |
| Target score | 70 | First to trigger ends the game |
| Score track | 1–100 | Markers start off the track |

---

## Quick reference

1. **Program** 2–6 cards face-down · **arrow = 1**, **boost = 3** (your own boost returns; drawn ones discard).
2. First lock starts the **15-second** timer; everyone locks when it ends.
3. **Reveal** slot by slot: **boosts slide first**, then all arrows step together — tails clear → heads slide → crashes → eat.
4. **Printed food** grows you (+1) and never runs out; **boost spaces** draw a boost card; **bounty chips** are one-shot ×2 food. Even lengths award a boost card. At **max 14**, food = **+2 points each**.
5. **Crash** = death: bank your length, flip every other segment to bounty, respawn next round **touching a board corner**.
6. **First to 70** ends it; living snakes cash out; **highest total wins**.
