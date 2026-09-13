# Current rules and complete print-and-play

- Consolidated the latest local physical-alpha work into RULES.md and the new complete
  kit. Replaced its 12×12, two-reusable-boost and death-scoring assumptions with the
  designer's latest board, boost, food and immediate-scoring decisions.
- Digital and print share the same ten fixed food coordinates and designated special
  starts. Smaller games crop one outer row/column on each side of the printed board.
- Kept length 3/13 and the 15-second timer. Milestones are growth-space indices, giving
  extras at lengths 6, 9 and 13. Existing special effects remain, including Victory Lap.
- New death drops use the head and tail before the fatal step, including a tail already
  lifted by movement. Each unique endpoint rolls independently; no stacked pickups.
- Special food is consumable, grows two and draws a card. Nom Nom also increases its
  food value. Win detection stops after the winning simultaneous step; ties are shared.
- Removed the obsolete, unused death-score editor and all old print files/generators.
  The new PDF includes printable snakes and a spinner, so it is a complete tabletop kit.
- Validation: engine regressions, 36 invariant games, 300 simulations, multi-round GUI
  journey, desktop/tablet screenshots, and rendered PDF inspection. Tests remain local;
  this change is committed without a pull request or deployment.
