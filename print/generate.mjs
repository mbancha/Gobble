// Gobble — printable prototype asset generator.
// Renders three print-ready PDFs (player cards, token sheet, player boards)
// via headless Chromium's page.pdf(). No external assets; all art is inline SVG.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = process.argv[2] || path.dirname(fileURLToPath(import.meta.url));

/* ── palette: bright (fills) + ink (borders/text, legible on white) ── */
const PLAYERS = [
  { name: 'Green',  bright: '#4ade80', ink: '#15803d' },
  { name: 'Blue',   bright: '#60a5fa', ink: '#2563eb' },
  { name: 'Red',    bright: '#f87171', ink: '#dc2626' },
  { name: 'Yellow', bright: '#facc15', ink: '#a16207' },
  { name: 'Purple', bright: '#c084fc', ink: '#9333ea' },
  { name: 'Cyan',   bright: '#22d3ee', ink: '#0e7490' },
  { name: 'Orange', bright: '#fb923c', ink: '#ea580c' },
  { name: 'Pink',   bright: '#f472b6', ink: '#db2777' },
];
const GOLD = '#b45309', GOLD_BG = '#fffbeb', GOLD_BRIGHT = '#f59e0b';
const VIOLET = '#7c3aed', VIOLET_BG = '#f5f3ff';

/* ── inline SVG icons ── */
const arrowSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><path d="M50 6 L88 50 H66 V94 H34 V50 H12 Z" fill="${color}"/></svg>`;
const boostSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="18,42 50,14 82,42"/><polyline points="18,62 50,34 82,62"/><polyline points="18,82 50,54 82,82"/></g></svg>`;
const boltSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><path d="M58 4 L20 56 H44 L36 96 L82 40 H54 Z" fill="${color}"/></svg>`;
const snakeSVG = (color) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M16 78 Q16 52 40 52 Q64 52 64 32 Q64 16 82 16"/></g><circle cx="84" cy="16" r="9" fill="${color}"/></svg>`;

/* ── shared print CSS ── */
const baseCSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html,body { margin:0; padding:0; font-family: "Helvetica Neue", Arial, system-ui, sans-serif; color:#111827; }
  .ico { width:100%; height:100%; display:block; }
  .sheet-note { font-size:9pt; color:#6b7280; padding:0 0 8pt; }
  @page { size: Letter; margin: 0.4in; }
`;

const page = (title, css, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${baseCSS}${css}</style></head><body>${body}</body></html>`;

/* ════════════ 1) PLAYER CARDS ════════════ */
function cardsHTML() {
  const css = `
    .grid { display:flex; flex-wrap:wrap; gap:0.12in; align-content:flex-start; }
    .card { width:1.7in; height:1.7in; border-radius:12px; position:relative;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            break-inside:avoid; background:#fff; overflow:hidden; }
    .card .ico { width:0.95in; height:0.95in; }
    .dot { position:absolute; width:11px; height:11px; border-radius:50%; }
    .dot.tl{top:7px;left:7px} .dot.tr{top:7px;right:7px} .dot.bl{bottom:7px;left:7px} .dot.br{bottom:7px;right:7px}
    .tag { font-size:8pt; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    .foot { font-size:8.5pt; font-weight:700; margin-top:2pt; }
    .name { font-size:8pt; font-weight:800; letter-spacing:.05em; }
    h2 { font-size:12pt; margin:14pt 0 6pt; width:100%; border-bottom:2px solid #e5e7eb; padding-bottom:3pt; }
    .brand { color:#9ca3af; font-size:7pt; letter-spacing:.15em; position:absolute; top:6px; left:0; right:0; text-align:center; }
  `;
  const arrowCard = (p) => `
    <div class="card" style="border:4px solid ${p.ink}">
      <span class="dot tl" style="background:${p.bright}"></span><span class="dot tr" style="background:${p.bright}"></span>
      <span class="dot bl" style="background:${p.bright}"></span><span class="dot br" style="background:${p.bright}"></span>
      <div class="brand">GOBBLE</div>
      ${arrowSVG(p.ink)}
      <div class="name" style="color:${p.ink}">${p.name.toUpperCase()}</div>
      <div class="foot" style="color:${p.ink}">MOVE 1</div>
    </div>`;
  const boostCard = () => `
    <div class="card" style="border:4px solid ${GOLD}; background:${GOLD_BG}">
      <span class="dot tl" style="background:${GOLD_BRIGHT}"></span><span class="dot tr" style="background:${GOLD_BRIGHT}"></span>
      <span class="dot bl" style="background:${GOLD_BRIGHT}"></span><span class="dot br" style="background:${GOLD_BRIGHT}"></span>
      <div class="brand">GOBBLE</div>
      <div class="tag" style="color:${GOLD}">BOOST</div>
      ${boostSVG(GOLD)}
      <div class="foot" style="color:${GOLD}">MOVE ×3</div>
    </div>`;

  let body = `<div class="sheet-note"><b>PLAYER ARROW CARDS</b> — cut out. Each player gets 6 arrows in their colour; rotate a card to aim it. Corner dots keep the owner clear at any rotation.</div>`;
  // 6 arrows per player, grouped
  body += `<h2>Arrow cards — 6 per player (rotate to aim)</h2><div class="grid">`;
  for (const p of PLAYERS) for (let i = 0; i < 6; i++) body += arrowCard(p);
  body += `</div>`;
  // generic boost deck
  body += `<h2 style="page-break-before:always">Boost deck — generic (each player takes 1 to start; draw more from boost tokens)</h2>`;
  body += `<div class="sheet-note">A Boost card replaces an arrow for one slot and slides the snake <b>3 cells</b> in its direction (rotate to aim), then is discarded.</div><div class="grid">`;
  for (let i = 0; i < 48; i++) body += boostCard();
  body += `</div>`;
  return page('Gobble — Player Cards', css, body);
}

/* ════════════ 2) TOKEN SHEET (fold-over dominoes) ════════════ */
function tokensHTML() {
  // 40 tokens, interleaved so numbers aren't clustered by type
  const types = [];
  const add = (t, n) => { for (let i = 0; i < n; i++) types.push(t); };
  add('1food', 14); add('2food', 8); add('1boost', 12); add('2boost', 6);
  // interleave
  const order = ['1food','1boost','2food','1food','2boost','1boost','1food','2food','1boost','1food'];
  const buckets = { '1food': [], '2food': [], '1boost': [], '2boost': [] };
  types.forEach((t) => buckets[t].push(t));
  const seq = [];
  let guard = 0;
  while (seq.length < types.length && guard++ < 1000) {
    for (const t of order) if (buckets[t].length) { seq.push(buckets[t].shift()); if (seq.length >= types.length) break; }
  }
  const tokens = seq.map((t, i) => ({ type: t, num: i + 1 }));

  const css = `
    .grid { display:flex; flex-wrap:wrap; gap:0.1in; align-content:flex-start; }
    .tok { width:0.92in; height:1.9in; border:2px solid #374151; border-radius:8px;
           display:flex; flex-direction:column; break-inside:avoid; overflow:hidden; }
    .half { height:0.92in; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1pt; }
    .fold { height:0.06in; border-top:2px dashed #9ca3af; position:relative; }
    .fold::after { content:"fold"; position:absolute; top:-6pt; left:0; right:0; text-align:center; font-size:6pt; color:#9ca3af; }
    .tok .ico { width:0.42in; height:0.42in; }
    .amt { font-size:15pt; font-weight:900; line-height:1; }
    .lbl { font-size:6.5pt; font-weight:800; letter-spacing:.1em; }
    .back { transform:rotate(180deg); background:#f3f4f6; }
    .num { font-size:26pt; font-weight:900; color:#374151; line-height:1; }
    .backbrand { font-size:5.5pt; letter-spacing:.15em; color:#9ca3af; }
  `;
  const face = (t) => {
    const two = t[0] === '2';
    const boost = t.includes('boost');
    const c = boost ? VIOLET : GOLD;
    const bg = boost ? VIOLET_BG : GOLD_BG;
    return `<div class="half" style="background:${bg}">
      ${boost ? boltSVG(c) : `<svg viewBox="0 0 100 100" class="ico"><circle cx="50" cy="50" r="40" fill="${GOLD_BRIGHT}"/><circle cx="38" cy="38" r="12" fill="#fde68a"/></svg>`}
      <div class="amt" style="color:${c}">+${two ? 2 : 1}</div>
      <div class="lbl" style="color:${c}">${boost ? 'BOOST' : 'GROW'}</div>
    </div>`;
  };
  const tok = (t) => `<div class="tok">
      ${face(t.type)}
      <div class="fold"></div>
      <div class="half back"><div class="num">${t.num}</div><div class="backbrand">GOBBLE</div></div>
    </div>`;

  let body = `<div class="sheet-note"><b>TOKENS</b> — cut each strip, fold along the dashed line and glue back-to-back for a 2-sided token: <b>content</b> on one face, its <b>number</b> on the other (printed upside-down so it reads upright once folded). Food grows the snake; boost tokens let you draw boost cards. 40 tokens: 14×+1 food, 8×+2 food, 12×+1 boost, 6×+2 boost.</div>`;
  body += `<div class="grid">${tokens.map(tok).join('')}</div>`;
  return page('Gobble — Tokens', css, body);
}

/* ════════════ 3) PLAYER BOARDS ════════════ */
function boardsHTML() {
  const LADDER = [
    { len: 3, pts: 0 }, { len: 4, pts: 0 }, { len: 5, pts: 1 }, { len: 6, pts: 2 },
    { len: 7, pts: 4 }, { len: 8, pts: 6 }, { len: 9, pts: 10 }, { len: 10, pts: 15 },
    { len: 11, pts: 20 }, { len: 12, pts: 25 }, { len: 13, pts: 30 },
  ];
  const css = `
    .board { width:7.7in; height:4.85in; border:3px solid #111827; border-radius:14px;
             margin:0 auto 0.18in; overflow:hidden; break-inside:avoid; display:flex; flex-direction:column; background:#fff; }
    .hdr { display:flex; align-items:center; gap:10px; padding:8pt 14pt; color:#fff; }
    .hdr .ico { width:26pt; height:26pt; }
    .hdr h1 { font-size:18pt; margin:0; letter-spacing:.03em; }
    .hdr .sub { margin-left:auto; font-size:9pt; opacity:.9; letter-spacing:.15em; }
    .body { display:flex; flex:1; }
    .col { padding:9pt 13pt; }
    .col.left { width:3.05in; border-right:2px solid #e5e7eb; }
    .col.right { flex:1; }
    .cap { font-size:9pt; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#6b7280; margin:0 0 5pt; }
    .ladder { display:flex; flex-wrap:wrap; gap:4pt; }
    .rung { width:0.52in; border-radius:7px; border:1.5px solid #e5e7eb; padding:3pt 0; text-align:center; }
    .rung .l { font-size:7pt; color:#6b7280; font-weight:700; }
    .rung .p { font-size:13pt; font-weight:900; }
    .rung.max { border-color:${GOLD}; background:${GOLD_BG}; }
    .callout { margin-top:7pt; font-size:8.5pt; background:${GOLD_BG}; border:1.5px solid ${GOLD};
               border-radius:8px; padding:5pt 7pt; color:#78350f; }
    .ref p { margin:0 0 4.5pt; font-size:8.7pt; line-height:1.32; }
    .ref b { }
    .k { display:inline-block; font-weight:900; border-radius:4px; padding:0 4px; font-size:8pt; color:#fff; }
    .track { display:flex; flex-wrap:wrap; gap:3pt; margin-top:6pt; }
    .pip { width:0.29in; height:0.19in; border:1px solid #d1d5db; border-radius:4px; font-size:6.5pt; text-align:center; color:#9ca3af; line-height:0.19in; }
  `;
  const rung = (r) => `<div class="rung ${r.len === 13 ? 'max' : ''}">
      <div class="l">${r.len === 13 ? 'MAX 13' : 'len ' + r.len}</div>
      <div class="p" style="color:${r.len >= 5 ? '#111827' : '#d1d5db'}">${r.pts}</div>
    </div>`;
  const track = Array.from({ length: 16 }, (_, i) => `<div class="pip">${i * 10}</div>`).join('');

  const board = (p) => `
    <div class="board">
      <div class="hdr" style="background:${p.ink}">
        ${snakeSVG('#fff')}
        <h1>GOBBLE</h1>
        <span style="font-size:12pt;font-weight:800;padding:2pt 9pt;border:2px solid #fff;border-radius:20px">${p.name}</span>
        <span class="sub">PLAYER BOARD</span>
      </div>
      <div class="body">
        <div class="col left">
          <div class="cap">Points when your snake dies at length</div>
          <div class="ladder">${LADDER.map(rung).join('')}</div>
          <div class="callout"><b>At MAX (13):</b> the snake stops growing — each food eaten instead scores <b>+10 points now</b> (a +2 food = +20).</div>
          <div class="cap" style="margin-top:8pt">Score track</div>
          <div class="track">${track}</div>
        </div>
        <div class="col right ref">
          <p class="cap" style="color:${p.ink}">How a round works</p>
          <p><b>1 · Program</b> 2–6 cards face-down in a row (left = first move). The instant the first player locks, start the <b>15-second timer</b>; everyone else must lock when it ends.</p>
          <p><b>2 · Reveal &amp; resolve</b> one slot at a time, all snakes together: clear your tail, slide your head 1 cell, check crashes, then eat.</p>
          <p><span class="k" style="background:${p.ink}">▲ ARROW</span> move 1 &nbsp; <span class="k" style="background:${GOLD}">⇑ BOOST</span> slide 3 (discard the card)</p>
          <p><b>Food</b> +1 or +2 length (new pieces behind the head). <b>Boost token</b> draw 1 or 2 boost cards.</p>
          <p><b>Crash</b> (wall / any body / two heads to one cell) = death. Flip <b>every other</b> segment to your bounty food (worth ×2), score your length above, then respawn next round on any <b>3 contiguous empty cells</b> — head not facing food.</p>
          <p><b>Win:</b> first to the target score ends the game; every living snake then banks its current length and the highest total wins.</p>
        </div>
      </div>
    </div>`;

  let body = `<div class="sheet-note"><b>PLAYER BOARDS</b> — one per player (2 per page). Snakes start at length 3.</div>`;
  body += PLAYERS.map((p, i) => board(p) + (i % 2 === 1 && i < 7 ? '<div style="page-break-after:always"></div>' : '')).join('');
  return page('Gobble — Player Boards', css, body);
}

/* ── render all three ── */
const jobs = [
  { name: 'gobble-player-cards.pdf', html: cardsHTML() },
  { name: 'gobble-tokens.pdf', html: tokensHTML() },
  { name: 'gobble-player-boards.pdf', html: boardsHTML() },
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await browser.newPage();
for (const j of jobs) {
  await pg.setContent(j.html, { waitUntil: 'networkidle' });
  await pg.pdf({ path: path.join(OUT, j.name), format: 'Letter', printBackground: true,
    margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  // preview PNG (full-page) to eyeball layout
  await pg.setViewportSize({ width: 850, height: 1100 });
  await pg.screenshot({ path: path.join(OUT, j.name.replace('.pdf', '-preview.png')), fullPage: true });
  console.log('wrote', j.name);
}
await browser.close();
console.log('done');
