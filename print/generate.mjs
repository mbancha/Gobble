// Gobble — printable prototype asset generator (borderless, print-ready).
// Renders four PDFs via headless Chromium's page.pdf(); all art inline SVG.
//   gobble-player-cards.pdf  — 6 arrows × 8 colours + generic boost deck
//   gobble-tokens.pdf        — 40 fold-over tokens (sequentially numbered)
//   gobble-player-boards.pdf — length-row tracker + quick rules, per colour
//   gobble-score-track.pdf   — shared 0–200 score track
// Cards/tokens are squared, edge-to-edge with shared cut lines: one straight
// cut separates two neighbours. Print at 100% / borderless.
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
const VIOLET = '#7c3aed', VIOLET_BG = '#f5f3ff';

/* ── inline SVG icons ── */
const arrowSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><path d="M50 6 L88 50 H66 V94 H34 V50 H12 Z" fill="${color}"/></svg>`;
const boostSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="18,42 50,14 82,42"/><polyline points="18,62 50,34 82,62"/><polyline points="18,82 50,54 82,82"/></g></svg>`;
const boltSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><path d="M58 4 L20 56 H44 L36 96 L82 40 H54 Z" fill="${color}"/></svg>`;
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

/* ════════════ 1) PLAYER CARDS — 5 × 1.7in across, squared, no gaps ════════════ */
function cardsHTML() {
  const css = `
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
  const boostCard = () => `
    <div class="card" style="background:${GOLD_BG}">
      <span class="frame" style="border-color:${GOLD}"></span>
      <span class="dot tl" style="background:${GOLD_BRIGHT}"></span><span class="dot tr" style="background:${GOLD_BRIGHT}"></span>
      <span class="dot bl" style="background:${GOLD_BRIGHT}"></span><span class="dot br" style="background:${GOLD_BRIGHT}"></span>
      <div class="tag" style="color:${GOLD}">BOOST</div>
      ${boostSVG(GOLD)}
      <div class="foot" style="color:${GOLD}">MOVE ×3</div>
    </div>`;
  let body = `<div class="grid">`;
  for (const p of PLAYERS) for (let i = 0; i < 6; i++) body += arrowCard(p);   // 48 arrows
  for (let i = 0; i < 48; i++) body += boostCard();                            // boost deck
  body += `</div>`;
  return page('Gobble — Player Cards', css, body);
}

/* ════════════ 2) TOKENS — fold-over strips, 10 × 0.85in across ════════════ */
function tokensHTML() {
  // Sequential numbering (the number only tells you where the NEXT token
  // goes, so no shuffle is needed in print): 1–20 food · 21–30 ×2 food ·
  // 31–40 ×2 energy.
  const tokens = [];
  for (let n = 1; n <= 40; n++) tokens.push({ num: n, type: n <= 20 ? 'food' : n <= 30 ? 'food2' : 'energy2' });

  const css = `
    .grid { display:flex; flex-wrap:wrap; width:8.5in; }
    .tok { width:0.85in; height:2.2in; border:1.5px solid #6b7280; margin:-0.75px;
           display:flex; flex-direction:column; break-inside:avoid; overflow:hidden; background:#fff; }
    .half { height:1.06in; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1pt; }
    .fold { height:0.08in; border-top:1.5px dashed #9ca3af; border-bottom:1.5px dashed #9ca3af; }
    .tok .ico { width:0.36in; height:0.36in; }
    .amt { font-size:13pt; font-weight:900; line-height:1; }
    .lbl { font-size:6pt; font-weight:800; letter-spacing:.08em; }
    .sub { font-size:6pt; font-weight:700; color:#78350f; }
    .back { transform:rotate(180deg); background:#f3f4f6; }
    .num { font-size:24pt; font-weight:900; color:#374151; line-height:1; }
    .backbrand { font-size:5.5pt; letter-spacing:.15em; color:#9ca3af; }
  `;
  const face = (t) => {
    if (t === 'energy2') return `<div class="half" style="background:${VIOLET_BG}">
        ${boltSVG(VIOLET)}<div class="amt" style="color:${VIOLET}">+2</div>
        <div class="lbl" style="color:${VIOLET}">ENERGY</div></div>`;
    const two = t === 'food2';
    return `<div class="half" style="background:${GOLD_BG}">
        ${foodSVG()}<div class="amt" style="color:${GOLD}">+${two ? 2 : 1}</div>
        <div class="lbl" style="color:${GOLD}">GROW</div>
        <div class="sub">⚡ +1 energy</div></div>`;
  };
  const tok = (t) => `<div class="tok">
      ${face(t.type)}
      <div class="fold"></div>
      <div class="half back"><div class="num">${t.num}</div><div class="backbrand">GOBBLE</div></div>
    </div>`;
  return page('Gobble — Tokens', css, `<div class="grid">${tokens.map(tok).join('')}</div>`);
}

/* ════════════ 3) PLAYER BOARDS — length row on top, brief rules ════════════ */
function boardsHTML() {
  // boxes big enough to park a snake piece on; points read below them
  const LADDER = [
    { len: 3, pts: 0 }, { len: 4, pts: 0 }, { len: 5, pts: 1 }, { len: 6, pts: 2 },
    { len: 7, pts: 4 }, { len: 8, pts: 6 }, { len: 9, pts: 10 }, { len: 10, pts: 15 },
    { len: 11, pts: 20 }, { len: 12, pts: 25 }, { len: 13, pts: 30 },
  ];
  const css = `
    .board { width:8.5in; height:5.5in; overflow:hidden; break-inside:avoid; display:flex;
             flex-direction:column; background:#fff; border-bottom:1.5px solid #9ca3af; }
    .hdr { display:flex; align-items:center; gap:10px; padding:8pt 22pt; color:#fff; }
    .hdr .ico { width:22pt; height:22pt; }
    .hdr h1 { font-size:16pt; margin:0; letter-spacing:.04em; }
    .hdr .pname { font-size:12pt; font-weight:800; padding:2pt 10pt; border:2px solid #fff; border-radius:20px; }
    .hdr .sub { margin-left:auto; font-size:8pt; opacity:.9; letter-spacing:.18em; }
    .lenrow { display:flex; justify-content:space-between; padding:10pt 22pt 0; }
    .slot { text-align:center; }
    .box { width:0.62in; height:0.62in; border:2px solid #374151; border-radius:6px; margin:0 auto; }
    .slot.max .box { border-color:${GOLD}; background:${GOLD_BG}; }
    .slot .l { font-size:6.5pt; color:#6b7280; font-weight:800; letter-spacing:.05em; margin:2pt 0 1pt; }
    .slot .p { font-size:13pt; font-weight:900; }
    .slot .p.zero { color:#d1d5db; }
    .cap { font-size:8pt; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#6b7280; padding:8pt 22pt 0; }
    .ref { padding:4pt 22pt 0; columns:2; column-gap:20pt; }
    .ref p { margin:0 0 4pt; font-size:9pt; line-height:1.35; break-inside:avoid; }
    .callout { margin:6pt 22pt 0; font-size:9pt; background:${GOLD_BG}; border:1.5px solid ${GOLD};
               border-radius:8px; padding:4pt 8pt; color:#78350f; }
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
      <div class="cap">Track your length — points below are banked when you die at that length</div>
      <div class="lenrow">${LADDER.map(slot).join('')}</div>
      <div class="callout"><b>At MAX (13):</b> no more growth — each food scores <b>+10 points instantly</b> (×2 food or bounty = +20).</div>
      <div class="cap">Round in brief</div>
      <div class="ref">
        <p><b>Program</b> 2–6 cards face-down (left first). Arrow = move 1 · Boost = slide 3 (discard the card). First lock starts the <b>15-sec timer</b>.</p>
        <p><b>Resolve each slot:</b> boosts slide first (cell by cell), then all arrows step together. Same square, same moment = both die; hitting anything sitting still kills only the mover.</p>
        <p><b>Tokens:</b> food +1 grow · ×2 food +2 grow (each also +1 energy) · ×2 energy +2 energy. Energy = boost cards. Bounty chips = +2 grow, +1 energy.</p>
        <p><b>Death:</b> bank your length (above), flip every other segment to bounty, respawn next round on any 3 contiguous empty cells (head not facing food).</p>
        <p><b>Win:</b> first to the target ends the game — every living snake then banks its length; highest total wins.</p>
      </div>
    </div>`;
  return page('Gobble — Player Boards', css, PLAYERS.map(board).join(''));
}

/* ════════════ 4) SCORE TRACK — shared, 0 to 200 ════════════ */
function scoreHTML() {
  const css = `
    .wrap { width:8.5in; padding:0.45in 0.4in; }
    h1 { font-size:16pt; margin:0 0 2pt; letter-spacing:.05em; }
    .sub { font-size:8.5pt; color:#6b7280; margin:0 0 10pt; }
    .row { display:flex; }
    .cell { width:0.385in; height:0.5in; border:1px solid #9ca3af; margin:-0.5px;
            display:flex; align-items:center; justify-content:center;
            font-size:7.5pt; font-weight:700; color:#374151; background:#fff; }
    .cell.ten { background:#f3f4f6; }
    .cell.fifty { background:#fde68a; font-weight:900; color:#78350f; }
    .cell.start { background:#111827; color:#fff; font-weight:900; }
    .legend { display:flex; gap:12pt; margin-top:10pt; align-items:center; }
    .legend .chip { width:12pt; height:12pt; border-radius:50%; border:1.5px solid rgba(0,0,0,.2); }
    .legend span { font-size:8pt; color:#374151; font-weight:700; }
  `;
  let rows = '';
  // 0 + 1..200 in rows of 20, serpentine so markers walk a continuous path
  const nums = Array.from({ length: 201 }, (_, i) => i);
  const chunks = [nums.slice(0, 21)];                  // 0–20 (START row)
  for (let i = 21; i <= 200; i += 20) chunks.push(nums.slice(i, i + 20));
  chunks.forEach((chunk, r) => {
    const cells = (r % 2 === 1 ? [...chunk].reverse() : chunk).map((v) => {
      const cls = v === 0 ? 'start' : v % 50 === 0 ? 'fifty' : v % 10 === 0 ? 'ten' : '';
      return `<div class="cell ${cls}">${v === 0 ? 'START' : v}</div>`;
    }).join('');
    rows += `<div class="row" style="${r % 2 === 1 ? 'justify-content:flex-end' : ''}">${cells}</div>`;
  });
  const legend = PLAYERS.map((p) => `<span class="chip" style="background:${p.fill}"></span>`).join('');
  const body = `<div class="wrap">
      <h1>🐍 GOBBLE — SCORE TRACK</h1>
      <p class="sub">One marker per player. Move when you bank points (death, max-length food, final cash-out). First to the target ends the game — highest total after the living-snake cash-out wins.</p>
      ${rows}
      <div class="legend">${legend}<span>player markers</span></div>
    </div>`;
  return page('Gobble — Score Track', css, body);
}

/* ── render all ── */
const jobs = [
  { name: 'gobble-player-cards.pdf', html: cardsHTML() },
  { name: 'gobble-tokens.pdf', html: tokensHTML() },
  { name: 'gobble-player-boards.pdf', html: boardsHTML() },
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
