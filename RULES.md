# GOBBLE — Rules

*A simultaneous-programming snake game for 2–8 players. Program your moves in secret, reveal at once, and grow fat before you crash — because dying is how you score.*

---

## Components

- **8 × Arrow card sets** — 6 arrow cards per player, in the player's colour.
- **1 × Boost deck** — a shared stack of generic “×3” boost cards.
- **40 × Tokens** — double-sided: a **number** on one face, its **content** on the other (**20× food · 10× ×2 food · 10× ×2 energy**).
- **8 × Player boards** — a length row to track your snake, with death points under each box, plus a quick reference.
- **1 × Score track sheet** — a shared 0–200 track; every player moves a marker on it.
- **The board** — a 12×12 grid with **40 numbered spaces** (any evenly-spread numbering works; the numbers are only used to place tokens).
- **Snake pieces** — per player, 1 head marker + up to 12 body/tail segments in your colour (cubes, discs, or printed chips).
- **A 15-second timer** — a phone timer or sand timer (the “panic timer”).

---

## The goal

Be the first to reach the **target score (default 150 points)**. You score almost entirely by **dying** — the longer your snake when it dies, the more points it banks. So the game is a dance: grow as big as you dare, cash out at the right moment, and get back on the board.

---

## Setup

1. Lay out the board where everyone can reach it. Give each player a **player board**, their **6 arrow cards**, and their **snake pieces**.
2. Shuffle the **boost deck**. Each player takes **1 boost card** to start; the rest is the draw stack.
3. Put all **tokens** in a bag or face-down pile (number side hidden).
4. **Place each snake** at length **3**: on your turn, set your snake on any **3 contiguous empty cells** (straight or bent), with the **head not facing a food token**.
5. **Seed the board** with **20 tokens** using the placement chain (below). The remaining 20 tokens are the **reserve**.

---

## Placing tokens (the number chain)

Tokens are placed by letting each token tell you where the *next* one goes — no dice needed.

1. Start on the **lowest-numbered empty space**. Draw a token and place it there **content-side up**.
2. Read the **number** on the token you just placed. The **next** token drawn goes on the **numbered space that matches**.
3. Repeat, chaining from each placed token's number, until you've placed the required count.
4. **If a target space is already occupied** (by a snake, a token, or a bounty chip): place that token on the nearest **empty diagonally-adjacent** space — choose the one **closest to the board's centre**; if that's blocked too, continue **clockwise** to the next open diagonal.

*(Because you never know which content will land where, the board seeds differently every game.)*

---

## Playing a round

### 1. Program (in secret)

Lay **2 to 6 cards** face-down in a row in front of you — left card resolves first.

- An **Arrow card** = move **1 cell** in the direction the card points (rotate it to aim).
- A **Boost card** = slide **3 cells** in one direction (rotate to aim); **discard the boost card** after the round.
- You must program **at least 2** cards. If you program **fewer than 6**, your snake simply **stops in place** for the remaining moves.

**The panic timer:** the instant the **first** player finishes and locks their row, start the **15-second timer**. When it runs out, everyone else must lock **whatever they have** immediately.

### 2. Reveal & resolve

Flip all rows face-up. Resolve **one slot at a time**. Within each slot:

1. **Boosts go first.** Every boosting snake runs its full 3-cell slide, cell by cell (boosters move simultaneously with each other). A boost that crashes on the 1st or 2nd cell dies there and doesn't finish.
2. **Then arrows.** Every arrow snake steps 1 cell, all together.

For each move: **tails clear** (lift your last tail piece unless this move grows you) → **heads slide** → **check crashes** → **pick up tokens** (or drop the lifted tail piece into the gap behind the head).

**Crashes:** a head that enters a **wall**, **any snake's body**, or a **remaining tail** → that snake dies — including moving into the **side of a stationary snake's head** (only the mover dies). **Both** snakes die only when they move **into the same square at the same time**. Because boosts resolve first, a booster claims a contested square — an arrow snake arriving a beat later just crashes into its side.

### 3. End of the round

1. **Refill food:** place **half of the reserve tokens (rounded up)** onto the board using the number chain. A token whose space is fully blocked stays in the reserve.
2. **Respawn** every dead player (see *Death*).
3. Check for a **winner** (see *Winning*). If none, program the next round.

---

## Tokens & energy

When your head enters a token's cell (and you didn't crash), you pick it up. **Energy = boost cards** — every gain means drawing that many boost cards from the deck.

| Token | Growth | Energy |
|---|---|---|
| **Food** | +1 segment | +1 |
| **×2 food** | +2 segments | +1 |
| **×2 energy** | — | +2 |
| **Bounty chip** (from a death) | +2 segments | +1 |

New segments appear **behind the head** (they stack on the gap and unspool as you move). A pickup that doesn't grow you resolves like a normal move — your tail piece fills the gap.

### At maximum length (13)

Your snake **stops growing**, but the game **doesn't** stop for you. Every unit of **food** you eat now scores **+10 points immediately** instead of growing you (so a **+2 food = +20 points**, a **bounty chip = +20**). ×2 energy tokens still pay energy.

> This is the engine of the game: once you're maxed, staying alive and eating is pure profit. Crashing on purpose to reset is almost always a mistake.

---

## Death, bounty & scoring

When a snake dies:

1. **Score it.** Bank points based on the snake's **length at the moment of death**, from your player board:

   | Length | 3–4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | **13 (max)** |
   |---|---|---|---|---|---|---|---|---|---|---|
   | Points | 0 | 1 | 2 | 4 | 6 | 10 | 15 | 20 | 25 | **30** |

2. **Drop bounty.** The head leaves the board. Flip **every other body segment** (starting with the piece right behind the head) to its **bounty** side — these act like **×2 food** (+2 growth, +1 energy; +20 points at max length) for whoever eats them. Remove the segments in between.
3. **Respawn** next round: place the snake at length **3** on any **3 contiguous empty cells**, head not facing food. (If the board is completely jammed, sit out one round.)

---

## Winning

The moment any player reaches the **target score (default 150)**, the game **ends immediately** — but it isn't over yet:

- **Every snake still alive cashes out**, banking points for its **current length** from the same ladder.
- Compare **total scores**. **Highest total wins.**

Because the trigger only *starts* the count, the player who crossed the line doesn't automatically win — a rival sitting on a huge live snake can leapfrog them on the cash-out.

*Ties:* the tied player who has **eaten the most food** this game wins; if still tied, share the victory.

---

## Adjustable variables (tune to taste)

| Variable | Default | Notes |
|---|---|---|
| Players | 2–8 | |
| Command slots (cards/round) | 6 | Minimum 2 programmed |
| Starting length | 3 | |
| Maximum length | 13 | Food converts to +10 pts each above this |
| Boost distance | 3 cells | |
| Target score | 150 | First to trigger ends the game |
| Tokens | 40 | 20× food · 10× ×2 food · 10× ×2 energy |
| Starting food on board | 20 | Rest is the reserve |
| Bounty value | ×2 | Player-coloured food from a death |

---

## Quick reference

1. **Program** 2–6 cards face-down · **arrow = 1**, **boost = 3** (discard).
2. First lock starts the **15-second** timer; everyone locks when it ends.
3. **Reveal** and resolve slot by slot: **boosts slide first**, then all arrows step together — tails clear → heads slide → crashes → pick up.
4. **Food** grows you (+1/+2) and pays **+1 energy**; **×2 energy** pays **+2** (energy = boost cards). At **max length 13**, food = **+10 points each**.
5. **Crash** (wall / body / two heads) = **death**: score your length, flip **every other** segment to ×2 bounty, respawn at length 3.
6. **Refill** half the reserve each round. **First to 150** ends it; **living snakes cash out**; **highest total wins**.
