# GOBBLE — Rules

*A simultaneous-programming snake game for 2–6 players. Everyone programs their moves in secret, then all the snakes move at once. Eat to grow. The longer your snake, the more points it's worth!*

---

## Components

- **6 × Mini-boards** — 4×4 boards (5.9″ square), one per player. Each has **5 food spots printed on it**, and **4 of the 6 also have a SPECIAL space** (a colourful swirl). Every board's arrangement is different and rotationally asymmetric, so turning a board around changes the game. Everything printed is permanent — it never runs out and nothing is ever placed or removed. Printed food is **+1**; ×2 food comes only from snake food.
- **8 × Movement tile sets** — 6 movement tiles per player, in the player's colour. (Tile sets exist for 8 colours; the printed set has 6 mini-boards, so print two more boards to play 7–8.)
- **8 × Personal boost tiles** — every player permanently owns **one boost tile** (part of their hand, like the movement tiles — it comes back every round).
- **1 × Boost stack** — spare "×3" boost tiles, taken at growth milestones. They're all identical, so keep them in a face-up stack. Spent boost tiles go back to the stack.
- **18 × Special cards** — 9 effects, 2 copies each. Shuffled into a face-down deck; drawn when you cross a **special space**.
- **8 × Player boards** — ten upright boxes that hold your snake sticks. Take one out each time you grow; the number under it is your score. Boxes **3, 6 and 10** have a boost icon printed inside, revealed as that stick comes out.
- **1 × Score track sheet** — a shared 1–100 track; every player moves a marker on it (start off the track at 0).
- **Snake pieces** — per player, 1 head marker + 13 wooden body sticks in your colour (3 on the board at the start, 10 waiting on your player board).
- **Snake food** — yellow glass beads. Dropped when a snake dies; worth **×2 food** to whoever eats them.
- **A 10-second timer** — a phone timer or sand timer (the "panic timer").

---

## The goal

Be the first to reach the **target score (default 30 points)**. **You always have points equal to how long your snake has grown** — every segment you add is a point. It's simplest to move your marker on the score track when your snake dies, but you can move it every time you eat if you prefer; either way the total is the same. Once you're at **maximum length**, every food you eat is worth **2 points**.

---

## Setup

1. **Build the board:** place one mini-board per player, arranged **as close to an even square as possible** (2 players = a 2×1 strip, 3 = an L, 5 = a P, and so on). Edges with no board beyond them are walls.
2. **Player setup.** Each player takes their **6 movement tiles**, their **personal boost tile**, their **snake head**, and a **player board** — then fills all ten boxes on the board with their wooden snake sticks. Shuffle the **Special cards** into a face-down deck; leave the spare **boost tiles** in a face-up stack (they're all the same).
3. **Place each snake** at length **4** — a head plus 3 segments — on any 4 contiguous cells (bends fine) free of snakes and snake food, with **at least one piece touching a corner of any mini-board** (if no corner placement is available at all, place as close to a corner as you can). Placing over printed food is fine — **you never eat what you cover**.

---

## Playing a round

### 1. Program (in secret)

Lay **2 to 6 tiles** face-down in a row in front of you — the left one resolves first.

- A **Movement tile** = move **1 cell** in the direction it points (rotate it to aim).
- A **Boost tile** = slide **3 cells** in one direction (rotate to aim). Your personal boost returns to your hand for next round; boost tiles taken from the stack go back to the stack after use.
- You must program **at least 2** tiles. If you program fewer than 6, your snake simply **stops in place** for the remaining moves.

**The panic timer:** the instant the **first** player locks their row, start the **10-second timer**. When it runs out, everyone else must lock **whatever they have** immediately.

### 2. Reveal & resolve

Flip all rows face-up. Resolve **one slot at a time**. Within each slot:

1. **Boosts go first.** Every boosting snake runs its full 3-cell slide, cell by cell (boosters move simultaneously with each other). A boost that crashes on the 1st or 2nd cell dies there and doesn't finish.
2. **Then movement tiles.** Every stepping snake moves 1 cell, all together.

For each move: **tails clear** (lift your last tail piece unless this move grows you) → **heads slide** → **check crashes** → **pick up / eat**.

**Crashes:** you die if you move into a **wall**, into a space **another snake moves into at the same time**, or into a **snake's body or the side of its head** (heads are directional, so the side counts as a wall). Whether the other snake is moving makes no difference. Because boosts resolve first, a booster crosses a contested space before a stepping snake reaches it — and leaves its body in the way.

### 3. End of the round

There is no upkeep — the food is printed on the boards. Just **respawn** dead players (see *Dying*) and check for a **winner** (see *Winning*).

---

## Food, specials & snake food

When your head enters an uncovered printed spot or a bead of snake food (and you didn't crash):

| You entered | Growth | Also |
|---|---|---|
| **Food spot** (printed orange ball) | +1 segment | **+1 point** |
| **Special space** (printed swirl, on 4 boards) | — | **draw a Special card** |
| **Snake food** (yellow bead, from a death) | +2 segments | **+2 points** |

**Growth milestones:** the **3rd, 6th and 10th** boxes on your player board have a boost icon printed inside them. The moment you take that stick out, **take a boost tile** from the stack.

- **Printed food and special spaces never deplete.** Eating doesn't remove them; a snake sitting on a spot just blocks it until the cell frees up. The same spot can feed snake after snake.
- **Snake food is a token** — pick the bead up once eaten and put it back in the supply. A bead sitting on a printed spot covers it (you get the bead, and the spot is available again afterwards).
- New segments appear **behind the head** (they stack on the gap and unspool as you move). Anything that doesn't grow you resolves like a normal move — your tail piece fills the gap.
- Hand limit for spare boost tiles: **6**.

### At maximum length

When the **last stick comes off your player board** your snake stops growing — and every food you eat from then on is worth **2 points** instead (snake food = **4**).

---

## Special cards

Crossing a **swirl** lets you draw one Special card. Each card says when you may play it — play it whenever that moment comes. Cards that last a round are **discarded at the end of that round**; if the deck runs out, shuffle the discards into a new one.

If two specials ever collide — same timing, contradictory effects — resolve them in **player order, starting with whoever flipped the timer last**.

| Card | When | Effect |
|---|---|---|
| **Flip Flop** | Between rounds | Swap your head and tail — your snake now runs the other way. |
| **Whoopsie** | Before resolving | Rotate one of your single movement tiles before it resolves. |
| **Vroom Vroom** | While programming | All of your boost tiles move +1 extra space this round. |
| **Nom Nom** | While programming | Every snake food bead you eat this round grows you +1 extra. |
| **Bounce** | While programming | If you would crash this round, put your head on your tail instead and keep going. |
| **Star Power** | While programming | Colliding with another snake's head doesn't kill you this round — unless they also played Star Power. |
| **Rev Up** | Any time | Take 4 boost tiles from the stack. |
| **Careful Slither** | While programming | When a boost tile resolves this round you may move only 2 spaces instead of 3. |
| **Victory Lap** | While programming | At the end of this round, score points equal to your length — or nothing if you are dead. |

---

## Dying

When a snake dies:

1. **Record your score** if you haven't been tracking it as you ate — it's simply the number under the last box you emptied on your player board (1 through 10), plus 2 for every food you ate at maximum length.
2. **Drop snake food.** The head leaves the board. Replace **every other body segment** (starting behind the head) with a **yellow bead** — a token worth ×2 food to whoever eats it. Remove the segments in between.
3. **Reset your player board:** put all ten sticks back in their boxes.
4. **Respawn** next round: place at length **4** on any 4 contiguous cells free of snakes and snake food, **touching a corner of any mini-board** — or as close to a corner as possible if none are available — covering printed spots freely (you don't eat them).

> Dying costs you nothing you've already earned — the points are banked. It just puts your snake back to the start.

---

## Winning

The moment any player reaches **30 points**, the game **ends immediately**. Everyone's score is already up to date, so compare totals — **highest wins**.

*Ties:* the tied player with the longest snake wins; if still tied, share the victory.

---

## Adjustable variables (tune to taste)

| Variable | Default | Notes |
|---|---|---|
| Players | 2–6 | One mini-board each |
| Mini-board size | 4×4 | |
| Food spots per board | 5 | All +1; every board's layout differs |
| Special spaces | 1 on 4 of the 6 boards | Printed swirl — draw a Special card |
| Command slots (cards/round) | 6 | Minimum 2 programmed |
| Starting length | 4 | Head + 3 segments |
| Maximum length | 14 | 10 growth steps; then +2 pts per food |
| Boost distance | 3 cells | |
| Free boosts per round | 1 | Your personal boost card |
| Milestone boosts | Boxes 3, 6, 10 | Take a boost tile as that stick comes out |
| Target score | 30 | First to trigger ends the game |
| Score track | 1–100 | Markers start off the track |
| Panic timer | 10 seconds | Starts when the first player locks |

---

## Quick reference

1. **Program** 2–6 tiles face-down · **movement = 1**, **boost = 3** (your own boost always comes back).
2. First lock starts the **10-second** timer; everyone locks when it ends.
3. **Reveal** slot by slot: **boosts slide first**, then all stepping snakes move together — tails clear → heads slide → crashes → eat.
4. **Printed food** grows you +1 and scores **+1 point**, and never runs out; **swirls** draw a **Special card**; **snake food** beads are ×2 food. Boxes 3, 6 and 10 award a boost tile. At **maximum length** every food is worth **2 points**.
5. **Crash** = death: your points are already yours; leave snake food on every other segment, refill your player board, respawn next round **touching a board corner**.
6. **First to 30** ends it — **highest total wins**.
