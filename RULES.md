# GOBBLE

For 2–6 players.

## Goal and scoring

First to 30 points. Score immediately when eating: 1 point per segment added, and
2 points per segment that cannot fit at maximum length 13. Regular food is worth 1
segment; super and special food are worth 2. At maximum length, regular food scores
2 and super/special food scores 4. At length 12, a value-2 pickup grows one segment
and scores 3. Death and the end of the game award no extra points. Finish the current
simultaneous movement beat when someone reaches 30; highest score wins, ties shared.
The digital target is adjustable. The printed score track goes to 50.

## Print and assemble

Print the complete PDF at 100% on Letter paper, single-sided. Cut solid component
outlines. Join board quadrants A B / C D, making a 12×12 footprint with one-inch cells.
For 2 players use the white 6×6 center. For 3–4 use white plus light gray (8×8).
For 5–6 use all 116 colored cells, including the dark gray arms. The blank cut-out
corners are outside the board and act as walls. Cut the player kits and cards.
Fold each food token on its dotted middle line
and glue: gold SUPER on one side, purple SPECIAL on the other. Spin a paperclip around
a pencil on the printed three-sector spinner to randomize death food. Supply scissors,
glue, pencil, paperclip and a 15-second timer (a phone is fine).

The kit contains four board quadrants; six player mats; six heads and 72 body pieces;
36 arrows; six personal and 36 expendable boost markers; six score markers; a 0–50
score track; 18 special cards (two of each), with matching backs to cut and glue;
100 reversible food tokens (enough for
normal play); and a spinner. No other game components are needed.

## Setup

Permanent food spots are printed across the zones, more concentrated in the center:
12 accessible spots for 2 players, 20 for 3–4, and 28 for 5–6. They never run out.
Moving onto one feeds you; staying still does not. Food covered by a snake is
inaccessible. Place exactly one special food on START 1, one of the four central
cells, for every player count. This removable token does not replenish; its outline
does nothing after eating.
Shuffle the 18 special cards, leaving room for discards.

Take a matching color-and-letter player kit. Set score to 0. Place your head and two
body pieces on any three contiguous empty cells with at least one segment touching
an outer edge of the active board. The head, middle or tail may touch; a corner is
not required. On the larger board the stepped perimeter counts as an outer edge.
Bends are allowed. The head faces
away from its neck. Printed food may be covered but is not eaten during placement;
removable food and other snakes block placement. Keep ten body pieces on the numbered
growth spaces on your mat. Start with one personal boost and no expendable boosts.
Choose the first placer randomly, then place clockwise.

## Program and resolve

Secretly arrange two to six arrows in order, rotated to the directions you want.
Unused slots are stays. Put a boost marker on an arrow to move three cells instead
of one. Your one personal boost returns every round; extra boosts are spent when used
and returned to supply. The first player finished starts the 15-second timer. Lock all
programs when it expires, then reveal together.

Resolve each slot in two phases: boosted arrows first, one simultaneous cell-step at
a time, then normal arrows together. Nonmoving snakes remain obstacles. For each step,
lift tails unless growing, check destinations, move surviving heads, then resolve food.
Never reverse into your neck. Extra growth beyond the first segment stacks behind the
head and spreads out on later moves. A removable pickup overrides printed food beneath
it: eat only the pickup this step, revealing the printed food for later visits.

A wall or occupied body kills a moving snake. Moving heads entering the same cell kill
each other; moving into a stationary head kills only the mover. A tail that clears this
step is safe. Each time you empty growth space 3, 6 or 10 (lengths 6, 9, 13), gain one
expendable boost. Milestones reset on respawn. Unspent extras survive death; hold at
most six. There are no printed boost-recharge spaces.

## Food, death and respawn

Super food grows two segments. Special food grows two AND draws one special card.
Special food uses the multicolored icon printed on the backs of the special cards.
Remove either after eating. If the deck is empty, reshuffle discards; if all cards are
held, skip the draw but still grow and score.

When a snake dies, remove its entire body. Leave food only at its head and tail cells
from immediately BEFORE the fatal step. Spin separately for each: one of three equal
sectors makes SPECIAL food (about 33%), the other two SUPER. Never place outside the
board. Coincident endpoints leave one token. A new drop replaces a removable token
already there; tokens never stack. Food underneath a surviving snake waits until
uncovered. Intermediate body cells leave nothing. Keep all points already scored.

Respawn next round at length 3 using the setup placement rules. Keep score, held cards
and unspent extra boosts. If no legal placement exists, wait until a later round.
Refresh personal boosts and program again.

## Special cards

Discard cards when played. Different effects may combine; duplicate round effects do
not stack. Round effects expire before the next programming phase.

- **Flip Flop — between rounds:** swap head and tail; face away from the new neck.
- **Whoopsie — before a single unboosted arrow resolves:** rotate that arrow.
- **Vroom Vroom — while programming:** all boosts move one extra cell this round.
- **Nom Nom — while programming:** super and special food are worth one extra segment
  this round, with normal capped scoring.
- **Bounce — while programming:** prevent your first crash this round. Restore the
  lifted tail and swap head and tail. Stop this arrow, then continue your program.
- **Star Power — while programming:** head collisions do not kill you this round unless
  the other head also has Star Power. Bodies and walls still kill you.
- **Rev Up — while programming:** gain four expendable boosts, up to the six-boost cap.
- **Careful Slither — while programming:** you may stop a boost after two cells this
  round, including a boost extended by Vroom Vroom.
- **Victory Lap — while programming:** at the end of this round, score points equal
  to your current length if you are still alive; score nothing if dead. Food scores
  normally. This card is the exception to scoring only when eating.

## Digital adaptation

Open index.html, choose seats and New game. Click three adjacent cells, at least one
touching an outer edge, to place your
snake, or Auto-place. Program with arrow buttons or arrow keys/WASD; B toggles boost,
Backspace undoes a slot, and Lock in confirms. Pass-and-play hides each player's program.
Use special-card controls while programming. Respawn pauses the panic timer.

Whoopsie automatically avoids a fatal single move; Careful Slither automatically stops
at two only if the next step would crash. These are convenience adaptations of the
tabletop choices. The simulation round limit uses current scores, without cash-out.

## Revision decisions

Retains the latest local print's length 3 start, length 13 cap and 15-second timer.
The designer's clarification replaces its death-scoring ladder and 150-point goal
with immediate scoring and a 30-point goal. Milestones refer to growth spaces 3/6/10
as on the previous mat. Fixed coordinates, pre-fatal-step endpoints and one-third
randomization are implementation rulings shared by print and digital. Board data is
in print/board.json. The nested board follows the designer's September layout, with
one central starting special food for every player count.
