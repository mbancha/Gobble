# Gobble

A simultaneous-programming snake game for 3–6 players, with a self-contained digital
prototype and one complete print-and-play package.

## Play

Open `index.html` in a browser; it works offline without downloads or a server.
Choose seats, start a game, place a three-segment snake, and program your arrows.
The prototype supports human/bot mixtures and pass-and-play; a two-player test mode
uses the smaller board. Full rules and digital convenience adaptations are in
[RULES.md](RULES.md).

- 3–4 players: central 8×8. 5–6: full 10×10.
- Exactly 10 permanent printed food spots; one starting special food per two players.
- One personal boost per round, plus expendable boosts at growth spaces 3, 6 and 10.
- Death leaves food only at the pre-step head and tail, each independently one-third
  special. Special food grows two and draws a card; super food grows two.
- Start length 3, maximum 13, 15-second panic timer. Score 1 per segment added or 2
  per segment that cannot fit. First to 30 by default; adjust the digital target.
  There is no death or endgame cash-out.

## Print and play

Print [the complete current kit](output/pdf/gobble-print-and-play.pdf): **17 Letter
pages, single-sided, at 100%**. It includes rules, the four-piece board, all six player
kits including paper snakes, special cards, reversible food tokens, a 0–50 scoreboard
and a spinner. Only crafting supplies and a timer are needed. All obsolete print
versions and preview files have been removed.

## Develop and verify

```sh
npm ci
npm run build:css
npm test
npm run test:browser
python -m pip install -r print/requirements.txt
npm run print
npm run test:print
```

Windows browser tests use installed Chrome. Elsewhere, install Playwright Chromium
with `npx playwright install chromium`. Set `CHROMIUM_PATH` to use another Chromium
executable. Set `PYTHON` to select the Python interpreter for print commands.

`npm test` checks self-contained loading, rule regressions, 36 instrumented games and
300 bot simulations. The browser journey programs three real rounds through GUI
controls, checks scoring and a six-player setup, and saves desktop/tablet screenshots
under ignored `artifacts/`. Inspect these screenshots before committing GUI changes.

The print generator reads the canonical rules and `print/board.json`; tests enforce
that the standalone HTML uses the same coordinates. PDF tests check page count,
component counts, text bounds and the single current output. Render and inspect the
PDF after changes, for example `pdftoppm -png -scale-to 1200 output/pdf/gobble-print-and-play.pdf artifacts/pnp`.

Tailwind is compiled into the HTML so playing needs no build step or network requests.
The digital engine, bot, renderer and controls remain in that file. Simulation Mode
runs seeded bot games and reports results; these are smoke/balance observations, not
proof of balanced competitive play. See [CHANGELOG.md](CHANGELOG.md) for this revision.
