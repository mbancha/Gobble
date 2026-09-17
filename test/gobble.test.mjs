// Smoke + property tests for Gobble (index.html), driven through real Chromium.
//   node test/gobble.test.mjs
// Requires: npm i -D playwright   (browsers preinstalled)
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const fails = [];
const ok = (cond, msg) => { if (cond) console.log(`  ✓ ${msg}`); else { console.log(`  ✗ ${msg}`); fails.push(msg); } };

const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : process.platform === 'win32' ? {channel: 'chrome'} : {}) });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`); });

// The page must be fully self-contained: no CDN, no sibling assets, nothing
// fetched at runtime. Anything the browser asks for beyond index.html itself
// is a bug that would break GitHub Pages / offline / file:// play.
const externalHits = [];
await page.route('**/*', async (route) => {
  const url = route.request().url();
  if (url.startsWith('http')) { externalHits.push(url); return route.abort(); }
  if (url.startsWith('file://') && !url.endsWith('/index.html')) externalHits.push(url);
  return route.fallback();
});

await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(800);

console.log('\n— load —');
ok(consoleErrors.length === 0, `no console/page errors on load ${consoleErrors.length ? JSON.stringify(consoleErrors) : ''}`);
ok(externalHits.length === 0, `page is self-contained: zero extra requests ${externalHits.join(',')}`);
ok(await page.evaluate(() => !!window.Gobble?.Engine), 'window.Gobble API exported');
ok(await page.evaluate(() => {
  const d = document.createElement('div');
  d.className = 'px-2.5 rounded-lg';
  document.body.appendChild(d);
  const cs = getComputedStyle(d);
  const pad = cs.paddingLeft, radius = cs.borderRadius;   // read before detaching
  const bg = getComputedStyle(document.body).backgroundColor;
  d.remove();
  return pad === '10px' && radius === '8px' && bg !== 'rgba(0, 0, 0, 0)';
}), 'compiled Tailwind is applied (utilities resolve, body is painted)');
ok(!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('cdn.jsdelivr.net'),
  'no CDN reference left in index.html');

console.log('\n— rules scenarios —');
const sc = await page.evaluate(() => {
  const { Engine, makeConfig } = window.Gobble;
  const out = {};
  const K = (x, y) => (y << 6) | x;
  const mkRng = (s = 42) => { let a = s; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const mk = (over = {}) => {
    // These collision fixtures use an 8x8 board; other seats remain unplaced.
    const e = new Engine(makeConfig({ playerCount: 4, ...over }),
      ['A','B','C','D'].map(name=>({name,isBot:true})), mkRng());
    e.setup(); e.spots.clear(); e.food.clear();
    return e;
  };
  const put = (p, cells, facing) => { p.body = cells.map((c) => ({ ...c })); p.alive = true; p.facing = facing; };
  const run = (e, ticks = 1) => { for (let t = 0; t < ticks; t++) { e.beginTick(t); while (e.stepTick().more) {} e.finishTick(); } };

  // 1) food grows you and scores a point per segment; printed spots persist
  {
    const e = mk();
    const A = e.players[0];
    put(A, [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 2 }], 'right');
    e.spots.set(K(6, 2), { kind: 'food', value: 2 });
    A.commands = [{ dir: 'right', boost: false }];
    run(e);
    out.growLen = A.body.length;                 // 4 + 2
    out.growStack = A.body[1].x === A.body[2].x && A.body[1].y === A.body[2].y;
    out.growSpot = e.spots.has(K(6, 2));         // printed food never depletes
    out.growScore = A.score;                     // 2 points for 2 segments
  }
  // 2) a printed SPECIAL space draws a Special card and persists
  {
    const e = mk();
    const A = e.players[0];
    put(A, [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 2 }], 'right');
    e.food.set(K(6, 2), { kind: 'special', value: 2 });
    A.commands = [{ dir: 'right', boost: false }];
    run(e);
    out.spLen = A.body.length;                   // unchanged
    out.spHand = A.specials.length;              // drew 1 card
    out.spDeck = e.specialDeck.length;           // 18 − 1
    out.spStays = e.food.has(K(6, 2));
  }
  // 3) continuous scoring: +1 per segment, +2 per food at max, dying adds nothing
  {
    const e = mk({ maxSnakeLength: 5, startingLength: 4, maxLengthFoodBonus: 2 });
    const A = e.players[0];
    put(A, [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 2 }], 'right');
    e.spots.set(K(6, 2), { kind: 'food', value: 1 });
    A.commands = [{ dir: 'right', boost: false }];
    run(e);
    out.contGrow = A.score;                      // 1
    e.spots.set(K(7, 2), { kind: 'food', value: 1 });
    A.commands = [{ dir: 'right', boost: false }];
    run(e);
    out.contMax = A.score;                       // 1 + 2
    const before = A.score;
    e.killSnake(A, 'wall', null, [], { x: 0, y: 0 });
    out.contDeath = A.score - before;            // 0
  }
  // 4) milestones: boost tiles at the 3rd, 6th and 10th growth step
  {
    const e = mk({ startingLength: 4 });
    const A = e.players[0];
    put(A, [{ x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }], 'right');
    for (let i = 2; i <= 7; i++) e.spots.set(K(i, 2), { kind: 'food', value: 1 });
    A.commands = Array.from({ length: 6 }, () => ({ dir: 'right', boost: false }));
    run(e, 6);
    out.msLen = A.body.length;                   // 4 + 6 = 10
    out.msBoosts = A.boosts;                     // milestones at lengths 7 and 10
  }
  // 5) placement: configured 4 cells, no corner requirement, spots coverable, pickups block
  {
    const e = mk({startingLength: 4});
    out.plFour = e.spawnFootprint() === 4;
    out.plCorner = e.validChain([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
    out.plInterior = e.validChain([{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }]);
    out.plBent = e.validChain([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 4, y: 1 }, { x: 3, y: 1 }]);
    e.spots.set(K(1, 0), { kind: 'food', value: 1 });
    out.plOverSpot = e.validChain([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
    e.food.set(K(2, 0), { kind: 'bounty', value: 2 });
    out.plBlocked = !e.validChain([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
    out.plGap = !e.validChain([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }]);
    const chain = e.smartPlacement();
    out.plSmart = !!(chain && e.validChain(chain));
  }
  // 6) modular geometry: 3 players → an L, with the missing quadrant walled off
  {
    const e3 = new Engine(makeConfig({ tileSize: 4, playerCount: 3 }),
      [0, 1, 2].map((i) => ({ name: 'P' + i, isBot: true })), mkRng(7));
    e3.setup();
    out.geoWH = `${e3.W}x${e3.H}`;
    out.geoCells = e3.valid.size;
    out.geoHole = e3.inBounds(7, 7);
    out.geoCorners = e3.corners.size;
    out.geoFood = [...e3.spots.values()].filter((f) => f.kind === 'food').length;
    out.geoSpecial = [...e3.food.values()].filter((f) => f.kind === 'special').length;
  }
  // 7) boosts resolve before steppers, so a booster claims a contested cell
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0], B = e.players[1];
    put(A, [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }], 'right');
    put(B, [{ x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }], 'up');
    A.commands = [{ dir: 'right', boost: true }];
    B.commands = [{ dir: 'up', boost: false }];
    e.startRound(); run(e);
    out.bpBooster = A.alive && A.body[0].x === 5 && A.body[0].y === 2;
    out.bpStepper = !B.alive;
  }
  // 8) one free boost per round; extras downgrade; refreshes next round
  {
    const e = mk({ commandSlots: 2 });
    const A = e.players[0];
    put(A, [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }], 'right');
    A.commands = [{ dir: 'right', boost: true }, { dir: 'right', boost: true }];
    e.startRound(); run(e, 2);
    out.fbX = A.body[0].x;                       // 1 + 3 + 1
    e.startRound();
    A.commands = [{ dir: 'right', boost: true }, { dir: null, boost: false }];
    run(e);
    out.fbX2 = A.body[0].x;                      // + 3
  }
  // 9a) Specials: Rev Up, Vroom Vroom, Careful Slither
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0];
    put(A, [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }], 'up');
    A.specials = ['rev-up', 'vroom-vroom'];
    e.playSpecial(A, 'rev-up');
    out.revBank = A.boosts;                       // +4 spare tiles
    e.playSpecial(A, 'vroom-vroom');
    A.commands = [{ dir: 'right', boost: true }];
    e.startRound2 = null;                         // (keep fx armed: no startRound here)
    run(e);
    out.vroomX = A.body[0].x;                     // boost went 3+1 = 4 cells
  }
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0];
    put(A, [{ x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }], 'up');
    A.specials = ['careful-slither'];
    e.playSpecial(A, 'careful-slither');
    A.commands = [{ dir: 'right', boost: true }];  // 3 cells right would hit the wall at x=12? no: 8→11 ok; use wall
    put(A, [{ x: 5, y: 1 }, { x: 5, y: 4 }, { x: 5, y: 3 }, { x: 5, y: 2 }], 'up');
    run(e);
    out.carefulX = A.body[0].x;                   // 9→11 then stops: 3rd cell is the wall
    out.carefulAlive = A.alive;
  }
  // 9b) Star Power: lone holder survives a head-on; double holders both die
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0], B = e.players[1];
    put(A, [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }], 'right');
    put(B, [{ x: 6, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }], 'left');
    A.specials = ['star-power']; e.playSpecial(A, 'star-power');
    A.commands = [{ dir: 'right', boost: false }];
    B.commands = [{ dir: 'left', boost: false }];
    run(e);
    out.starA = A.alive; out.starB = B.alive;     // A lives at (5,2), B dies
    out.starAx = A.body[0].x;
  }
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0], B = e.players[1];
    put(A, [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }], 'right');
    put(B, [{ x: 6, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }], 'left');
    A.specials = ['star-power']; e.playSpecial(A, 'star-power');
    B.specials = ['star-power']; e.playSpecial(B, 'star-power');
    A.commands = [{ dir: 'right', boost: false }];
    B.commands = [{ dir: 'left', boost: false }];
    run(e);
    out.star2 = !A.alive && !B.alive;             // mutual Star Power cancels
  }
  // 9c) Bounce reverses instead of dying; Flip Flop swaps ends; Victory Lap pays
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0];
    put(A, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], 'left');
    A.specials = ['bounce']; e.playSpecial(A, 'bounce');
    A.commands = [{ dir: 'left', boost: false }];  // straight into the wall
    run(e);
    out.bounceAlive = A.alive;
    out.bounceHead = `${A.body[0].x},${A.body[0].y}`;  // head now at old tail (3,2)
    out.bounceFacing = A.facing;                        // pointing right, away from neck
  }
  {
    const e = mk();
    const A = e.players[0];
    put(A, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], 'left');
    A.specials = ['flip-flop'];
    e.playSpecial(A, 'flip-flop');
    out.flipHead = `${A.body[0].x},${A.body[0].y}`;     // (3,2)
    out.flipFacing = A.facing;                          // right
    A.specials = ['victory-lap'];
    e.playSpecial(A, 'victory-lap');
    const before = A.score;
    e.nextRound();
    out.vlGain = A.score - before;                      // alive: score current length
  }
  // 9d) Whoopsie auto-rotates a fatal movement tile
  {
    const e = mk({ commandSlots: 1 });
    const A = e.players[0];
    put(A, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], 'left');
    A.specials = ['whoopsie'];
    A.commands = [{ dir: 'left', boost: false }];       // would hit the wall
    run(e);
    out.whoopsAlive = A.alive;
    out.whoopsUsed = !A.specials.includes('whoopsie');
    out.whoopsDiscard = e.specialDiscard.includes('whoopsie');
  }
  // 9e) deck recycles its discards
  {
    const e = mk();
    const A = e.players[0];
    e.specialDeck = []; e.specialDiscard = ['rev-up'];
    const ev = e.drawSpecial(A, { x: 0, y: 0 });
    out.recycled = ev.length === 1 && A.specials.length === 1 && e.specialDiscard.length === 0;
  }
  // 9) the player board's ten spaces
  {
    out.target = makeConfig().pointsToWin;
    out.panic = makeConfig().panicSeconds;
    out.start = makeConfig().startingLength;
  }
  return out;
});
ok(sc.growLen === 6 && sc.growStack && sc.growSpot && sc.growScore === 2,
   `food: +2 growth, spot persists, scores 2 as it grows (len ${sc.growLen}, score ${sc.growScore})`);
ok(sc.spLen === 6 && sc.spHand === 1 && sc.spDeck === 17 && !sc.spStays,
   `special food: grows 2, draws a card, is consumed (hand ${sc.spHand}, deck ${sc.spDeck})`);
ok(sc.contGrow === 1 && sc.contMax === 3 && sc.contDeath === 0,
   `continuous scoring: +1 per segment, +2 per food at max (${sc.contGrow}→${sc.contMax}), dying adds ${sc.contDeath}`);
ok(sc.msLen === 10 && sc.msBoosts === 2,
   `milestones at the 3rd and 6th growth step gave ${sc.msBoosts} boost tiles by length ${sc.msLen}`);
ok(sc.plFour && sc.plCorner && !sc.plInterior && sc.plBent && sc.plOverSpot && sc.plBlocked && sc.plGap && sc.plSmart,
   'placement: requires an edge, not a corner; spots coverable, snake food blocks, smart placement legal');
ok(sc.geoWH === '8x8' && sc.geoCells === 64 && sc.geoHole && sc.geoCorners === 4 && sc.geoFood === 20 && sc.geoSpecial === 1,
   `geometry: 3 players → full 8x8 (${sc.geoWH}, ${sc.geoCells} cells, ${sc.geoFood} food, ${sc.geoSpecial} special)`);
ok(sc.bpBooster && sc.bpStepper, 'boost priority: the booster claims the contested cell, the stepper dies');
ok(sc.fbX === 4 && sc.fbX2 === 7, `free boost: 1/round, extras downgrade, refreshes (x=${sc.fbX}→${sc.fbX2})`);
ok(sc.revBank === 4 && sc.vroomX === 4, `Rev Up banks 4 tiles; Vroom Vroom boost covers 4 cells (x=${sc.vroomX})`);
ok(sc.carefulX === 7 && sc.carefulAlive, `Careful Slither stops the boost at 2 cells instead of hitting the wall (x=${sc.carefulX})`);
ok(sc.starA && !sc.starB && sc.starAx === 5 && sc.star2, 'Star Power: lone holder survives the head-on; mutual holders both die');
ok(sc.bounceAlive && sc.bounceHead === '3,2' && sc.bounceFacing === 'right', `Bounce: head lands on the tail and lives (${sc.bounceHead} facing ${sc.bounceFacing})`);
ok(sc.flipHead === '3,2' && sc.flipFacing === 'right' && sc.vlGain === 4, `Flip Flop reverses; surviving Victory Lap pays +${sc.vlGain}`);
ok(sc.whoopsAlive && sc.whoopsUsed && sc.whoopsDiscard, 'Whoopsie auto-rotates a fatal tile and is spent');
ok(sc.recycled, 'the Special deck reshuffles its discards when empty');
ok(sc.target === 30 && sc.panic === 15 && sc.start === 3,
   `defaults: first to ${sc.target}, ${sc.panic}s timer, start length ${sc.start}`);

console.log('\n— invariants over instrumented games —');
const inv = await page.evaluate(() => {
  const { Engine, makeConfig, Bot } = window.Gobble;
  const problems = [];
  const mkRng = (s) => { let a = s; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  let games = 0, substeps = 0;
  for (const cfg of [makeConfig(), makeConfig({ playerCount: 6 }), makeConfig({ tileSize: 6, playerCount: 2, pointsToWin: 15 })]) {
    for (let seed = 0; seed < 12; seed++) {
      const e = new Engine(cfg, Array.from({ length: cfg.playerCount }, (_, i) => ({ name: 'P' + i, isBot: true })), mkRng(seed + 1));
      e.setup(); games++;
      const check = (where) => {
        const seen = new Map();
        for (const p of e.players) if (p.alive) {
          if (p.body.length > cfg.maxSnakeLength) problems.push(`${where}: over max length`);
          for (const c of p.body) {
            const k = (c.y << 6) | c.x;
            if (!e.valid.has(k)) problems.push(`${where}: segment off-board`);
            const owner = seen.get(k);
            if (owner !== undefined && owner !== p.seat) problems.push(`${where}: two snakes on one cell`);
            seen.set(k, p.seat);
          }
        }
        const food = [...e.spots.values()].filter((f) => f.kind === 'food').length;
        if (food !== (cfg.playerCount===2?12:cfg.playerCount<=4?20:28))
          problems.push(`${where}: printed food changed`);
        for (const f of e.food.values()) if (!['bounty','special'].includes(f.kind)) problems.push(`${where}: stray pickup`);
        if (e.players.some((p) => p.score < 0)) problems.push(`${where}: negative score`);
      };
      let guard = 0;
      while (!e.gameOver && guard++ < 500) {
        e.startRound(); e.respawnDead(); check('respawn');
        for (const p of e.players) if (p.alive) Bot.playSpecials(e, p);
        for (const p of e.players) if (p.alive) p.commands = Bot.plan(e, p);
        for (let t = 0; t < cfg.commandSlots && !e.gameOver; t++) {
          e.beginTick(t);
          while (e.stepTick().more) substeps++;
          e.finishTick(); check(`r${e.round}t${t}`);
        }
        if (!e.gameOver) e.nextRound();
      }
      if (!e.gameOver) problems.push('game never ended');
    }
  }
  return { problems: [...new Set(problems)].slice(0, 5), games, substeps };
});
ok(inv.problems.length === 0, `invariants held across ${inv.games} games / ${inv.substeps} sub-steps ${inv.problems.join(' | ')}`);

console.log('\n— batch sanity & fairness —');
const agg = await page.evaluate(() => {
  const { makeConfig, runHeadlessGame } = window.Gobble;
  const cfg = makeConfig();
  let wins = Array(cfg.playerCount).fill(0), rounds = 0, deaths = 0, causeSum = 0, winners = 0;
  const N = 300;
  for (let i = 0; i < N; i++) {
    const g = runHeadlessGame(cfg, (i * 2654435761) >>> 0);
    if (g.winnerSeat != null) { wins[g.winnerSeat]++; winners++; }
    rounds += g.rounds;
    deaths += g.deaths.reduce((a, b) => a + b, 0);
    causeSum += g.causes.wall + g.causes.head + g.causes.body;
  }
  return { wins, rounds: rounds / N, deaths, causeSum, winners, N };
});
ok(agg.winners === agg.N, `every game produced a winner (${agg.winners}/${agg.N})`);
ok(agg.deaths === agg.causeSum, `death causes sum to deaths (${agg.causeSum} = ${agg.deaths})`);
ok(agg.rounds > 1 && agg.rounds < 100, `average game length sane (${agg.rounds.toFixed(1)} rounds)`);
const dev = Math.max(...agg.wins) - Math.min(...agg.wins);
ok(dev <= agg.N * 0.12, `wins by seat within noise: [${agg.wins}] (spread ${dev})`);

console.log('\n— live UI flow —');
// countdown: overlay shows during the 3-2-1-GOBBLE! and hides after
const cd = await page.evaluate(async () => {
  const L = Gobble.LIVE;
  L.countdownMs = 50;
  const run = L.runCountdown();
  await new Promise((r) => setTimeout(r, 80));
  const during = { hidden: document.getElementById('countdownOverlay').classList.contains('hidden'),
                   text: document.getElementById('countdownText').textContent };
  await run;
  const after = document.getElementById('countdownOverlay').classList.contains('hidden');
  L.countdownMs = 0;                                   // instant rounds for the rest of the tests
  return { during, after };
});
ok(!cd.during.hidden && ['3', '2', '1', 'GOBBLE!'].includes(cd.during.text) && cd.after,
   `countdown overlay runs 3-2-1-GOBBLE! then hides (saw "${cd.during.text}")`);

await page.click('#btnNewGame');
await page.waitForTimeout(400);
ok(await page.isVisible('#stripArea'), 'game started and the command strip area is showing');
const placed = await page.evaluate(async () => {
  const e = Gobble.LIVE.engine;
  if (!e) return 'no engine';
  const chain = e.smartPlacement();
  if (!chain) return 'no placement';
  return e.validChain(chain) ? 'ok' : 'illegal chain';
});
ok(placed === 'ok', `auto-placement produces a legal ${await page.evaluate(() => Gobble.LIVE.engine.spawnFootprint())}-cell chain`);

// death → respawn prompt with a frozen panic timer and a ghost while placing
const rf = await page.evaluate(async () => {
  const L = Gobble.LIVE, e = L.engine;
  L.clearTimers();
  const h = e.players.find((p) => !p.isBot);
  if (!h.alive) L.autoPlace();                         // finish round-1 placement first
  e.killSnake(h, 'wall', null, [], { x: 0, y: 0 });    // …then die for real
  L.startProgramming();                                // dead human respawns first
  const prompt = !document.getElementById('respawnOverlay').classList.contains('hidden');
  startPanic(30);                                      // a bot "locked" while they place
  const bornPaused = L.panic && L.panic.pausedLeft != null;
  document.getElementById('btnRespawn').click();
  const stripIsPlacement = document.getElementById('stripArea').textContent.includes('panic timer paused');
  // grow a 2-cell ghost from a legal corner chain
  const chain = e.allChains(true)[0];
  L.tryExtendChain(chain[0]);
  L.tryExtendChain(chain[1]);
  const ghost = Renderer.highlight && Renderer.highlight.cells.length === 2;
  const stillPaused = L.panic && L.panic.pausedLeft != null;
  const beforeRoundStart = L.roundStarted;             // countdown hasn't run yet
  L.autoPlace();                                       // finish placement
  const resumed = L.panic && L.panic.pausedLeft == null;
  const promptGone = document.getElementById('respawnOverlay').classList.contains('hidden');
  await new Promise((r) => setTimeout(r, 30));         // let startRoundNow settle
  const afterRoundStart = L.roundStarted;
  stopPanic();
  return { prompt, bornPaused, stripIsPlacement, ghost, stillPaused, resumed, promptGone,
           beforeRoundStart, afterRoundStart };
});
ok(rf.prompt, 'a dead player gets the respawn prompt at the top of their turn');
ok(rf.bornPaused && rf.stillPaused, 'the panic timer freezes while they respawn');
ok(rf.stripIsPlacement && rf.ghost, 'placement shows the paused note and a ghost silhouette of the chain');
ok(rf.resumed && rf.promptGone, 'placing the snake resumes the timer and clears the prompt');
ok(!rf.beforeRoundStart && rf.afterRoundStart, 'the round (and its countdown) only starts once everyone has respawned');

console.log('\n— final error sweep —');
ok(consoleErrors.length === 0, `no console/page errors across the session ${consoleErrors.slice(0, 3).join(' | ')}`);

await browser.close();
console.log(fails.length ? `\nFAILED: ${fails.length} check(s)` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
