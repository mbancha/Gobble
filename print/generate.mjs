// Gobble — printable prototype asset generator (borderless, print-ready).
// Renders six PDFs via headless Chromium's page.pdf(); all art inline SVG.
//   gobble-mini-boards.pdf   — 6 boards, each with its own randomized,
//                              rotationally-asymmetric food layout
//   gobble-player-cards.pdf  — 6 arrows + 1 personal boost per colour,
//                              plus 20 generic boost cards
//   gobble-card-update.pdf   — ONLY the 8 player-coloured boost cards
//   gobble-tokens.pdf        — 10 "+2 boost" + 10 "×2 food", numbered 1–10
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
   Six 4×4 layouts of `count` spots each, chosen so that (a) rotating a board
   90/180/270° genuinely moves the food, (b) spots don't clump, and (c) no two
   boards match — even after rotation. */
function makeLayouts(t = 4, count = 6, boards = 6, seed = 20240719) {
  const rng = mulberry32(seed);
  const all = Array.from({ length: t * t }, (_, i) => ({ x: i % t, y: Math.floor(i / t) }));
  const rot = (c) => ({ x: t - 1 - c.y, y: c.x });                 // 90° clockwise
  const key = (c) => c.y * t + c.x;
  const rotations = (cells) => {                                    // [0°,90°,180°,270°]
    const out = [cells]; let cur = cells;
    for (let r = 0; r < 3; r++) { cur = cur.map(rot); out.push(cur); }
    return out;
  };
  const chosen = [];
  while (chosen.length < boards) {
    let best = null, bestScore = -Infinity;
    for (let tries = 0; tries < 4000; tries++) {
      const pick = shuffle(rng, all.slice()).slice(0, count);
      const set = new Set(pick.map(key));
      // asymmetry: fewest spots that move under any rotation (higher = better)
      let asym = Infinity;
      rotations(pick).slice(1).forEach((r) => {
        asym = Math.min(asym, r.filter((c) => !set.has(key(c))).length);
      });
      if (asym < 4) continue;                                       // 4 of 6 spots must move under EVERY rotation
                                                                    // (5 is unreachable for 6 spots on a 4×4)
      // clumping penalty
      let adj = 0;
      for (let i = 0; i < pick.length; i++) for (let j = i + 1; j < pick.length; j++)
        if (Math.abs(pick[i].x - pick[j].x) + Math.abs(pick[i].y - pick[j].y) === 1) adj++;
      // quadrant spread (2×2 quadrants of a 4×4): reward using all four
      const quads = new Set(pick.map((c) => `${Math.floor(c.x / (t / 2))},${Math.floor(c.y / (t / 2))}`));
      // distinctness from boards already chosen, under every rotation
      let distinct = Infinity;
      for (const prev of chosen) {
        const prevSet = new Set(prev.map(key));
        rotations(pick).forEach((r) => {
          distinct = Math.min(distinct, r.filter((c) => !prevSet.has(key(c))).length);
        });
      }
      if (chosen.length && distinct < 3) continue;                  // ≥3 cells apart from every other board, under any
                                                                    // rotation (≥4 only yields 3 boards — verified)
      const score = asym * 6 + quads.size * 4 + Math.min(distinct, 6) * 3 - adj * 2 + rng();
      if (score > bestScore) { bestScore = score; best = pick; }
    }
    if (!best) break;                                               // (never hit at these settings)
    chosen.push(best);
  }
  return chosen;
}

/* ════════════ 1) MINI-BOARDS ════════════ */
function boardsHTML(layouts, t = 4) {
  const css = `
    .sheet { width:8.5in; height:11in; padding:0.15in; display:flex; flex-wrap:wrap;
             align-content:flex-start; gap:0.2in; }
    .mb { width:4in; height:4in; border:2px solid #111827; position:relative; background:#fff; }
    .cell { position:absolute; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; }
    .spot { width:0.46in; height:0.46in; }
    .bid { position:absolute; top:2px; left:4px; font-size:6.5pt; font-weight:800; color:#cbd5e1; letter-spacing:.1em; }
    .cap { width:100%; font-size:8.5pt; color:#6b7280; margin:0 0.2in -0.05in; }
  `;
  const cellIn = 4 / t;                      // 1.0in cells at the default 4×4
  const board = (layout, idx) => {
    const spots = new Set(layout.map((c) => c.y * t + c.x));
    let cells = '';
    for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) {
      cells += `<div class="cell" style="left:${x * cellIn}in;top:${y * cellIn}in;width:${cellIn}in;height:${cellIn}in">
        ${spots.has(y * t + x) ? `<span class="spot">${foodSVG()}</span>` : ''}
      </div>`;
    }
    return `<div class="mb">${cells}<span class="bid">BOARD ${idx + 1}</span></div>`;
  };
  let body = '';
  for (let p = 0; p < Math.ceil(layouts.length / 4); p++) {
    const slice = layouts.slice(p * 4, p * 4 + 4);
    body += `<div class="sheet">
      <div class="cap"><b>MINI-BOARDS</b> — cut on the outer border; boards butt together edge-to-edge. One per player.
      Every board has ${layouts[0].length} food spots in a different, rotationally-asymmetric arrangement:
      turning a board changes the game. Printed food never runs out.</div>
      ${slice.map((l, i) => board(l, p * 4 + i)).join('')}
    </div>`;
  }
  return page('Gobble — Mini-boards', css, body);
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

/* ════════════ 4) TOKENS ════════════ */
function tokensHTML() {
  const css = `
    .grid { display:flex; flex-wrap:wrap; width:8.5in; }
    .tok { width:0.85in; height:1.75in; border:1.5px solid #6b7280; margin:-0.75px;
           display:flex; flex-direction:column; break-inside:avoid; overflow:hidden; background:#fff; }
    .half { height:0.85in; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1pt; }
    .fold { height:0.05in; border-top:1.5px dashed #9ca3af; border-bottom:1.5px dashed #9ca3af; }
    .tok .ico { width:0.32in; height:0.32in; }
    .amt { font-size:12pt; font-weight:900; line-height:1; }
    .lbl { font-size:5.5pt; font-weight:800; letter-spacing:.07em; }
    .back { transform:rotate(180deg); background:#f3f4f6; }
    .num { font-size:20pt; font-weight:900; color:#374151; line-height:1; }
    .backbrand { font-size:5pt; letter-spacing:.15em; color:#9ca3af; }
  `;
  const face = (kind) => kind === 'boost'
    ? `<div class="half" style="background:${GOLD_BG}">${boostSVG(GOLD)}
         <div class="amt" style="color:${GOLD}">+2</div><div class="lbl" style="color:${GOLD}">BOOST</div></div>`
    : `<div class="half" style="background:${GOLD_BG}">${foodSVG()}
         <div class="amt" style="color:${GOLD}">×2</div><div class="lbl" style="color:${GOLD}">FOOD</div></div>`;
  const tok = (kind, n) => `<div class="tok">
      ${face(kind)}
      <div class="fold"></div>
      <div class="half back"><div class="num">${n}</div><div class="backbrand">GOBBLE</div></div>
    </div>`;
  let body = `<div class="grid">`;
  for (let n = 1; n <= 10; n++) body += tok('boost', n);   // +2 boost tokens
  for (let n = 1; n <= 10; n++) body += tok('food', n);    // ×2 food (testing)
  body += `</div>`;
  return page('Gobble — Tokens', css, body);
}

/* ════════════ 5) PLAYER BOARDS — 3 per Letter sheet ════════════ */
function playerBoardsHTML() {
  const LADDER = [
    { len: 3, pts: 0 }, { len: 4, pts: 0 }, { len: 5, pts: 1 }, { len: 6, pts: 2 },
    { len: 7, pts: 3 }, { len: 8, pts: 5 }, { len: 9, pts: 7 }, { len: 10, pts: 10 },
    { len: 11, pts: 13 }, { len: 12, pts: 16 }, { len: 13, pts: 20 },
  ];
  const css = `
    .board { width:8.5in; height:3.62in; overflow:hidden; break-inside:avoid; display:flex;
             flex-direction:column; justify-content:space-between; padding-bottom:8pt;
             background:#fff; border-bottom:1.5px dashed #9ca3af; }
    .mid { padding-bottom:2pt; }
    .hdr { display:flex; align-items:center; gap:8px; padding:5pt 16pt; color:#fff; }
    .hdr .ico { width:17pt; height:17pt; }
    .hdr h1 { font-size:13pt; margin:0; letter-spacing:.04em; }
    .hdr .pname { font-size:10pt; font-weight:800; padding:1pt 8pt; border:1.5px solid #fff; border-radius:20px; }
    .hdr .sub { margin-left:auto; font-size:7pt; opacity:.9; letter-spacing:.18em; }
    .cap { font-size:7pt; font-weight:800; text-transform:uppercase; letter-spacing:.09em; color:#6b7280; padding:5pt 16pt 0; }
    .lenrow { display:flex; justify-content:space-between; padding:3pt 16pt 0; }
    .slot { text-align:center; }
    .box { width:0.72in; height:0.72in; border:2px solid #374151; border-radius:6px; margin:0 auto; }
    .slot.max .box { border-color:${GOLD}; background:${GOLD_BG}; }
    .slot .l { font-size:6pt; color:#6b7280; font-weight:800; margin:1pt 0 0; }
    .slot .p { font-size:11.5pt; font-weight:900; line-height:1.1; }
    .slot .p.zero { color:#d1d5db; }
    .ref { padding:3pt 16pt 0; columns:2; column-gap:16pt; }
    .ref p { margin:0 0 2.5pt; font-size:7.4pt; line-height:1.3; break-inside:avoid; }
    .callout { margin:4pt 16pt 0; font-size:7.6pt; background:${GOLD_BG}; border:1px solid ${GOLD};
               border-radius:6px; padding:3pt 7pt; color:#78350f; }
  `;
  const slot = (r) => `<div class="slot ${r.len === 13 ? 'max' : ''}">
      <div class="box"></div>
      <div class="l">${r.len === 13 ? 'MAX' : ''} ${r.len}</div>
      <div class="p ${r.pts === 0 ? 'zero' : ''}">${r.pts}</div>
    </div>`;
  const board = (p) => `
    <div class="board">
      <div class="hdr" style="background:${p.ink}">
        ${snakeSVG('#fff')}<h1>GOBBLE</h1><span class="pname">${p.name}</span><span class="sub">PLAYER BOARD</span>
      </div>
      <div class="mid">
        <div class="cap">Track your length — points below are banked when you die at that length</div>
        <div class="lenrow">${LADDER.map(slot).join('')}</div>
      </div>
      <div class="callout"><b>At MAX (13):</b> no more growth — each food scores <b>+10 points instantly</b> (a ×2 bounty chip = +20).</div>
      <div class="ref">
        <p><b>Program</b> 2–6 cards face-down (left first). Arrow = 1 · Boost = 3. First lock starts the <b>15-sec timer</b>.</p>
        <p><b>Resolve:</b> boosts slide first, then all arrows step together. Same square same moment = both die; hitting anything sitting still kills only the mover.</p>
        <p><b>Food</b> is printed and never runs out (+1). <b>+2 boost token</b> = draw 2 boost cards. <b>Bounty chip</b> = ×2 food.</p>
        <p><b>Death:</b> bank your length, flip every other segment to bounty, respawn on 3 contiguous cells touching any board corner.</p>
      </div>
    </div>`;
  return page('Gobble — Player Boards', css, PLAYERS.map(board).join(''));
}

/* ════════════ 6) SCORE TRACK — uniform, 10 per row, to 100 ════════════ */
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
const jobs = [
  { name: 'gobble-mini-boards.pdf', html: boardsHTML(layouts) },
  { name: 'gobble-player-cards.pdf', html: cardsHTML() },
  { name: 'gobble-card-update.pdf', html: cardUpdateHTML() },
  { name: 'gobble-tokens.pdf', html: tokensHTML() },
  { name: 'gobble-player-boards.pdf', html: playerBoardsHTML() },
  { name: 'gobble-score-track.pdf', html: scoreHTML() },
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await browser.newPage();
for (const j of jobs) {
  await pg.setContent(j.html, { waitUntil: 'networkidle' });
  await pg.pdf({ path: path.join(OUT, j.name), format: 'Letter', printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  await pg.setViewportSize({ width: 850, height: 1100 });
  await pg.screenshot({ path: path.join(OUT, j.name.replace('.pdf', '-preview.png')), fullPage: true });
  console.log('wrote', j.name);
}
await browser.close();
console.log('done');
