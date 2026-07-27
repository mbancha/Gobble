// Gobble — printable prototype asset generator (borderless, print-ready).
// Renders six PDFs via headless Chromium's page.pdf(); all art inline SVG.
//   gobble-mini-boards.pdf   — 6 boards (5.9in square, one per sheet), each
//                              own randomized food layout; 4 have a boost space
//   gobble-player-cards.pdf  — 6 arrows + 1 personal boost per colour,
//                              plus 20 generic boost cards
//   gobble-card-update.pdf   — ONLY the 8 player-coloured boost cards
//   gobble-temp-cards.pdf    — six colours' full hands (6 arrows + boost) on
//                              ONE sheet, for a quick temporary PnP
//   gobble-player-boards.pdf — 3 boards per Letter sheet, full-width track
//   gobble-score-track.pdf   — uniform 10-per-row track to 100
// Cards/tokens are squared, edge-to-edge with shared cut lines. Print at
// 100% / borderless.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = process.argv[2] || path.dirname(fileURLToPath(import.meta.url));

/* ── player palette: fill (bright) + ink (borders/text on white) ── */
const PLAYERS = [
  { name: 'Red',    fill: '#ef4444', ink: '#b91c1c' },
  { name: 'Green',  fill: '#22c55e', ink: '#15803d' },
  { name: 'Blue',   fill: '#3b82f6', ink: '#1d4ed8' },
  { name: 'Yellow', fill: '#eab308', ink: '#a16207' },
  { name: 'Orange', fill: '#f97316', ink: '#c2410c' },
  { name: 'Brown',  fill: '#a0622d', ink: '#7c4a1e' },
  { name: 'Silver', fill: '#b7bcc4', ink: '#6b7280' },
  { name: 'Purple', fill: '#a855f7', ink: '#7e22ce' },
];
const GOLD = '#b45309', GOLD_BG = '#fffbeb', GOLD_BRIGHT = '#f59e0b';

/* ── seeded RNG so every run produces the same printed boards ── */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (rng, arr) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};

/* ── inline SVG icons ── */
const arrowSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><path d="M50 6 L88 50 H66 V94 H34 V50 H12 Z" fill="${color}"/></svg>`;
const boostSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="18,42 50,14 82,42"/><polyline points="18,62 50,34 82,62"/><polyline points="18,82 50,54 82,82"/></g></svg>`;
const foodSVG = () => `<svg viewBox="0 0 100 100" class="ico"><circle cx="50" cy="50" r="40" fill="${GOLD_BRIGHT}"/><circle cx="38" cy="38" r="12" fill="#fde68a"/></svg>`;
const snakeSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M16 78 Q16 52 40 52 Q64 52 64 32 Q64 16 82 16"/></g><circle cx="84" cy="16" r="9" fill="${color}"/></svg>`;

/* ── shared print CSS (borderless) ── */
const baseCSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html,body { margin:0; padding:0; font-family: "Helvetica Neue", Arial, system-ui, sans-serif; color:#111827; }
  .ico { width:100%; height:100%; display:block; }
  @page { size: Letter; margin: 0; }
`;
const page = (title, css, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${baseCSS}${css}</style></head><body>${body}</body></html>`;

/* ════════════ 0) BOARD FOOD LAYOUTS ════════════
   Six 4×4 layouts of `count` spots each. Constraints were chosen against a
   full enumeration of all 4368 five-spot subsets:
     • rotational asymmetry ≥3 of 5 spots move under EVERY 90° rotation
       (≥4 is possible per-board, but then six boards can only be 2/5 apart;
        ≥5 is mathematically impossible — 0 subsets qualify)
     • every pair of boards differs by ≥3 of 5 spots under ANY rotation
       (the max such set is 8 boards, so six is comfortable)
     • food touches ≥3 of the four quadrants and barely clumps (≤2 adjacent
       pairs)
   Among sets that satisfy all of it, we keep the one with the most
   rotational asymmetry overall. */
function makeLayouts(t = 4, count = 5, boards = 6, seed = 20240719) {
  const rng = mulberry32(seed);
  const all = Array.from({ length: t * t }, (_, i) => ({ x: i % t, y: Math.floor(i / t) }));
  const rot = (c) => ({ x: t - 1 - c.y, y: c.x });                 // 90° clockwise
  const key = (c) => c.y * t + c.x;
  const rotations = (cells) => {                                    // [0°,90°,180°,270°]
    const out = [cells]; let cur = cells;
    for (let r = 0; r < 3; r++) { cur = cur.map(rot); out.push(cur); }
    return out;
  };
  const asymOf = (p) => {
    const set = new Set(p.map(key));
    return Math.min(...rotations(p).slice(1).map((r) => r.filter((c) => !set.has(key(c))).length));
  };
  const distOf = (a, b) => {
    const set = new Set(b.map(key));
    return Math.min(...rotations(a).map((r) => r.filter((c) => !set.has(key(c))).length));
  };
  // candidate pool: asymmetric, spread across quadrants, barely clumped
  const pool = [];
  const rec = (start, cur) => {
    if (cur.length === count) {
      if (asymOf(cur) < 3) return;
      const quads = new Set(cur.map((c) => `${Math.floor(c.x / (t / 2))},${Math.floor(c.y / (t / 2))}`));
      if (quads.size < Math.min(3, count)) return;
      let adj = 0;
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++)
        if (Math.abs(cur[i].x - cur[j].x) + Math.abs(cur[i].y - cur[j].y) === 1) adj++;
      if (adj > 2) return;
      pool.push(cur.slice());
      return;
    }
    for (let i = start; i < all.length; i++) { cur.push(all[i]); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  // randomized restarts: build a mutually-distinct set, keep the most asymmetric
  let bestSet = null, bestAsym = -1;
  for (let restart = 0; restart < 3000; restart++) {
    const shuffled = shuffle(rng, pool.slice());
    const set = [];
    for (const p of shuffled) {
      if (set.every((q) => distOf(p, q) >= 3)) set.push(p);
      if (set.length === boards) break;
    }
    if (set.length < boards) continue;
    const total = set.reduce((n, p) => n + asymOf(p), 0);
    if (total > bestAsym) { bestAsym = total; bestSet = set; }
  }
  return bestSet;
}

/** One printed BOOST space for `howMany` of the boards, on a cell that has no
    food, placed to sit somewhere different on each board. */
function makeBoostSpots(layouts, howMany = 4, t = 4, seed = 991) {
  const rng = mulberry32(seed);
  const key = (c) => c.y * t + c.x;
  const chosen = [];
  return layouts.map((layout, i) => {
    if (i >= howMany) return null;
    const taken = new Set(layout.map(key));
    const free = shuffle(rng, Array.from({ length: t * t }, (_, k) => k).filter((k) => !taken.has(k)));
    // spread the boost spaces: prefer a cell far from the ones already used
    let best = free[0], bestD = -1;
    for (const k of free) {
      const c = { x: k % t, y: Math.floor(k / t) };
      const d = chosen.length
        ? Math.min(...chosen.map((p) => Math.abs(p.x - c.x) + Math.abs(p.y - c.y)))
        : 99;
      if (d > bestD) { bestD = d; best = k; }
    }
    chosen.push({ x: best % t, y: Math.floor(best / t) });
    return best;
  });
}

/* ════════════ 1) MINI-BOARDS — one per sheet ════════════ */
function boardsHTML(layouts, boostSpots, t = 4, SIDE = 5.9) {
  const css = `
    .sheet { width:8.5in; height:11in; padding:0.6in 0.75in; display:flex; flex-direction:column;
             align-items:center; }
    .cap { width:${SIDE}in; font-size:9pt; color:#6b7280; margin-bottom:0.16in; }
    .mb { width:${SIDE}in; height:${SIDE}in; border:2.5px solid #111827; position:relative; background:#fff; }
    .cell { position:absolute; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; }
    .spot { width:${SIDE * 0.114}in; height:${SIDE * 0.114}in; }
    .bspot { width:${SIDE * 0.111}in; height:${SIDE * 0.111}in; }
    .blabel { position:absolute; bottom:0.06in; left:0; right:0; text-align:center;
              font-size:6.5pt; font-weight:800; letter-spacing:.1em; color:${GOLD}; }
    .bid { position:absolute; top:4px; left:7px; font-size:8pt; font-weight:800; color:#d1d5db; letter-spacing:.12em; }
  `;
  const cellIn = SIDE / t;                               // 1.475in cells at 5.9in / 4×4
  const board = (layout, idx) => {
    const spots = new Set(layout.map((c) => c.y * t + c.x));
    const boost = boostSpots[idx];
    let cells = '';
    for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) {
      const k = y * t + x;
      let inner = '';
      if (spots.has(k)) inner = `<span class="spot">${foodSVG()}</span>`;
      else if (k === boost) inner = `<span class="bspot">${boostSVG(GOLD)}</span><span class="blabel">BOOST</span>`;
      cells += `<div class="cell" style="left:${x * cellIn}in;top:${y * cellIn}in;width:${cellIn}in;height:${cellIn}in">${inner}</div>`;
    }
    return `<div class="mb">${cells}<span class="bid">BOARD ${idx + 1}</span></div>`;
  };
  return page('Gobble — Mini-boards', css, layouts.map((l, i) => `
    <div class="sheet">
      <div class="cap"><b>MINI-BOARD ${i + 1} OF ${layouts.length}</b> — cut on the outer border; boards butt together
      edge-to-edge. One per player. Food spots are printed and never run out; every board's arrangement is different
      and rotationally asymmetric${boostSpots[i] !== null ? ', and this board has a <b>BOOST</b> space' : ''}.</div>
      ${board(l, i)}
    </div>`).join(''));
}

/* ════════════ 2) PLAYER CARDS (+ 3) card-update export) ════════════ */
const cardCSS = `
  .grid { display:flex; flex-wrap:wrap; width:8.5in; }
  .card { width:1.7in; height:1.7in; border:1.5px solid #9ca3af; position:relative;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          break-inside:avoid; background:#fff; overflow:hidden; margin:-0.75px; }
  .frame { position:absolute; inset:5px; border:4px solid; pointer-events:none; }
  .card .ico { width:0.9in; height:0.9in; }
  .dot { position:absolute; width:11px; height:11px; border-radius:50%; }
  .dot.tl{top:12px;left:12px} .dot.tr{top:12px;right:12px} .dot.bl{bottom:12px;left:12px} .dot.br{bottom:12px;right:12px}
  .tag { font-size:8pt; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
  .foot { font-size:8.5pt; font-weight:700; margin-top:1pt; }
  .name { font-size:8pt; font-weight:800; letter-spacing:.05em; }
`;
const arrowCard = (p) => `
  <div class="card">
    <span class="frame" style="border-color:${p.ink}"></span>
    <span class="dot tl" style="background:${p.fill}"></span><span class="dot tr" style="background:${p.fill}"></span>
    <span class="dot bl" style="background:${p.fill}"></span><span class="dot br" style="background:${p.fill}"></span>
    ${arrowSVG(p.ink)}
    <div class="name" style="color:${p.ink}">${p.name.toUpperCase()}</div>
    <div class="foot" style="color:${p.ink}">MOVE 1</div>
  </div>`;
/** A player's personal boost — same chevron, but in their colour and named,
    so it's obviously locked to them and returns to their hand each round. */
const ownBoostCard = (p) => `
  <div class="card">
    <span class="frame" style="border-color:${p.ink}"></span>
    <span class="dot tl" style="background:${p.fill}"></span><span class="dot tr" style="background:${p.fill}"></span>
    <span class="dot bl" style="background:${p.fill}"></span><span class="dot br" style="background:${p.fill}"></span>
    <div class="tag" style="color:${p.ink}">${p.name} · BOOST</div>
    ${boostSVG(p.ink)}
    <div class="foot" style="color:${p.ink}">MOVE ×3 · KEEP</div>
  </div>`;
const boostCard = () => `
  <div class="card" style="background:${GOLD_BG}">
    <span class="frame" style="border-color:${GOLD}"></span>
    <span class="dot tl" style="background:${GOLD_BRIGHT}"></span><span class="dot tr" style="background:${GOLD_BRIGHT}"></span>
    <span class="dot bl" style="background:${GOLD_BRIGHT}"></span><span class="dot br" style="background:${GOLD_BRIGHT}"></span>
    <div class="tag" style="color:${GOLD}">BOOST</div>
    ${boostSVG(GOLD)}
    <div class="foot" style="color:${GOLD}">MOVE ×3</div>
  </div>`;

function cardsHTML() {
  let body = `<div class="grid">`;
  for (const p of PLAYERS) { for (let i = 0; i < 6; i++) body += arrowCard(p); body += ownBoostCard(p); }
  for (let i = 0; i < 20; i++) body += boostCard();
  body += `</div>`;
  return page('Gobble — Player Cards', cardCSS, body);
}
function cardUpdateHTML() {
  const body = `<div class="grid">${PLAYERS.map(ownBoostCard).join('')}</div>`;
  return page('Gobble — Card Update (personal boosts)', cardCSS, body);
}

/* ════════════ 3b) TEMP CARD SHEET — six players' hands on ONE sheet ════════════
   6 arrows + 1 personal boost per colour = 42 cards. A 6×7 grid of 1.4167in
   squares is exactly 42 slots and the largest square that fits a Letter sheet
   (7 across would force 1.21in). Cards are smaller than the main deck's 1.7in
   — that's the price of one sheet. */
function tempCardsHTML(names) {
  const chosen = names.map((n) => PLAYERS.find((p) => p.name.toLowerCase() === n.toLowerCase()));
  const S = 8.5 / 6;                                    // 1.4167in
  const css = cardCSS + `
    .grid { width:8.5in; }
    .card { width:${S}in; height:${S}in; }
    .card .ico { width:0.72in; height:0.72in; }
    .frame { inset:4px; border-width:3px; }
    .dot { width:9px; height:9px; }
    .dot.tl{top:9px;left:9px} .dot.tr{top:9px;right:9px}
    .dot.bl{bottom:9px;left:9px} .dot.br{bottom:9px;right:9px}
    .tag { font-size:6.5pt; }
    .name { font-size:6.5pt; }
    .foot { font-size:7pt; }
  `;
  let body = `<div class="grid">`;
  for (const p of chosen) {                             // 6 arrows then that colour's boost
    for (let i = 0; i < 6; i++) body += arrowCard(p);
    body += ownBoostCard(p);
  }
  body += `</div>`;
  return page('Gobble — Temp Card Sheet', css, body);
}

/* ════════════ 4) PLAYER BOARDS — 3 per Letter sheet ════════════ */
function playerBoardsHTML() {
  // one space per point value; a boost icon marks the lengths that award an
  // extra boost card (points 2, 4, 6, 8, 10 and 15)
  const PTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
  const BOOST_AT = new Set([2, 4, 6, 8, 10, 15]);
  const START_LEN = 3;                       // first space = the starting snake
  const LADDER = PTS.map((pts, i) => ({ len: START_LEN + i, pts, boost: BOOST_AT.has(pts) }));
  const LAST = LADDER[LADDER.length - 1];
  const css = `
    .board { width:8.5in; height:3.62in; overflow:hidden; break-inside:avoid; display:flex;
             flex-direction:column; justify-content:space-between; padding-bottom:9pt;
             background:#fff; border-bottom:1.5px dashed #9ca3af; }
    .hdr { display:flex; align-items:center; gap:8px; padding:5pt 16pt; color:#fff; }
    .hdr .ico { width:17pt; height:17pt; }
    .hdr h1 { font-size:13pt; margin:0; letter-spacing:.04em; }
    .hdr .pname { font-size:10pt; font-weight:800; padding:1pt 8pt; border:1.5px solid #fff; border-radius:20px; }
    .hdr .sub { margin-left:auto; font-size:7pt; opacity:.9; letter-spacing:.18em; }
    .cap { font-size:7pt; font-weight:800; text-transform:uppercase; letter-spacing:.09em; color:#6b7280; padding:6pt 0.2in 0; }
    .lenrow { display:flex; padding:3pt 0.2in 0; }
    .slot { width:0.675in; text-align:center; }
    .box { width:0.6in; height:0.6in; border:2px solid #374151; border-radius:6px; margin:0 auto; }
    .slot.max .box { border-color:${GOLD}; background:${GOLD_BG}; border-width:2.5px; }
    .slot .p { font-size:12pt; font-weight:900; line-height:1.15; margin-top:1pt; }
    .slot .bi { height:0.19in; display:flex; align-items:center; justify-content:center; }
    .slot .bi .ico { width:0.17in; height:0.17in; }
    .notes { display:flex; justify-content:space-between; padding:1pt 0.2in 0; }
    .note { display:flex; align-items:flex-start; gap:3pt; max-width:3.4in; }
    .note .up { width:0.675in; text-align:center; font-size:11pt; line-height:1; color:${GOLD}; flex:none; }
    .note .txt { font-size:7.6pt; line-height:1.25; color:#374151; padding-top:1pt; }
    .note.right { text-align:right; }
  `;
  const slot = (r) => `<div class="slot ${r.len === LAST.len ? 'max' : ''}">
      <div class="box"></div>
      <div class="p">${r.pts}</div>
      <div class="bi">${r.boost ? boostSVG(GOLD) : ''}</div>
    </div>`;
  const board = (p) => `
    <div class="board">
      <div class="hdr" style="background:${p.ink}">
        ${snakeSVG('#fff')}<h1>GOBBLE</h1><span class="pname">${p.name}</span><span class="sub">PLAYER BOARD</span>
      </div>
      <div>
        <div class="cap">Track your length — the number is what you bank if you die there · ${boostSVG(GOLD).replace('class="ico"','style="width:8pt;height:8pt;display:inline-block;vertical-align:-1px"')} = take an extra boost card</div>
        <div class="lenrow">${LADDER.map(slot).join('')}</div>
      </div>
      <div class="notes">
        <div class="note"><span class="up">↑</span><span class="txt">When you eat a food, <b>add a segment</b> — move up one space.</span></div>
        <div class="note right"><span class="txt">At <b>maximum length</b>, every food is worth <b>2 points!</b></span><span class="up">↑</span></div>
      </div>
    </div>`;
  return page('Gobble — Player Boards', css, PLAYERS.map(board).join(''));
}

/* ════════════ 5) SCORE TRACK — uniform, 10 per row, to 100 ════════════ */
function scoreHTML() {
  const css = `
    .wrap { width:8.5in; padding:0.5in 0.55in; }
    h1 { font-size:15pt; margin:0 0 2pt; letter-spacing:.05em; }
    .sub { font-size:8.5pt; color:#6b7280; margin:0 0 12pt; }
    .row { display:flex; }
    .cell { width:0.72in; height:0.52in; border:1px solid #9ca3af; margin:-0.5px;   /* 1.83 × 1.32 cm */
            display:flex; align-items:center; justify-content:center;
            font-size:10pt; font-weight:700; color:#374151; background:#fff; }
    .cell.ten { background:#f3f4f6; font-weight:900; }
    .cell.fifty { background:#fde68a; color:#78350f; font-weight:900; }
    .legend { display:flex; gap:10pt; margin-top:12pt; align-items:center; }
    .legend .chip { width:13pt; height:13pt; border-radius:50%; border:1.5px solid rgba(0,0,0,.2); }
    .legend span { font-size:8pt; color:#374151; font-weight:700; }
  `;
  let rows = '';
  for (let r = 0; r < 10; r++) {
    let cells = '';
    for (let c = 1; c <= 10; c++) {
      const v = r * 10 + c;
      cells += `<div class="cell ${v % 50 === 0 ? 'fifty' : v % 10 === 0 ? 'ten' : ''}">${v}</div>`;
    }
    rows += `<div class="row">${cells}</div>`;
  }
  const legend = PLAYERS.map((p) => `<span class="chip" style="background:${p.fill}"></span>`).join('');
  const body = `<div class="wrap">
      <h1>🐍 GOBBLE — SCORE TRACK</h1>
      <p class="sub">Markers start off the track at 0. Move when you bank points (death, max-length food, final cash-out).
      First to the target ends the game — highest total after the living-snake cash-out wins.</p>
      ${rows}
      <div class="legend">${legend}<span>player markers</span></div>
    </div>`;
  return page('Gobble — Score Track', css, body);
}

/* ── render all ── */
const layouts = makeLayouts();
const boostSpots = makeBoostSpots(layouts);
const jobs = [
  { name: 'gobble-mini-boards.pdf', html: boardsHTML(layouts, boostSpots) },
  { name: 'gobble-player-cards.pdf', html: cardsHTML() },
  { name: 'gobble-card-update.pdf', html: cardUpdateHTML() },
  { name: 'gobble-temp-cards.pdf', html: tempCardsHTML(['Silver', 'Brown', 'Blue', 'Orange', 'Red', 'Green']) },
  { name: 'gobble-player-boards.pdf', html: playerBoardsHTML() },
  { name: 'gobble-score-track.pdf', html: scoreHTML() },
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await browser.newPage();
const only = process.argv[3];                          // optional: render just one file
for (const j of jobs) {
  if (only && !j.name.includes(only)) continue;
  await pg.setContent(j.html, { waitUntil: 'networkidle' });
  await pg.pdf({ path: path.join(OUT, j.name), format: 'Letter', printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  await pg.setViewportSize({ width: 850, height: 1100 });
  await pg.screenshot({ path: path.join(OUT, j.name.replace('.pdf', '-preview.png')), fullPage: true });
  console.log('wrote', j.name);
}
await browser.close();
console.log('done');
