// Gobble — illustrated rulebook → gobble-rulebook.pdf (US Letter).
// Every illustration is drawn from the SAME icon code as the printed
// components, so the diagrams always match what's on the table.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = process.argv[2] || path.dirname(fileURLToPath(import.meta.url));

const P = {
  red:    { fill: '#ef4444', ink: '#b91c1c' },
  green:  { fill: '#22c55e', ink: '#15803d' },
  blue:   { fill: '#3b82f6', ink: '#1d4ed8' },
  orange: { fill: '#f97316', ink: '#c2410c' },
  silver: { fill: '#b7bcc4', ink: '#6b7280' },
  brown:  { fill: '#a0622d', ink: '#7c4a1e' },
};
const GOLD = '#b45309', GOLD_BG = '#fffbeb', GOLD_BRIGHT = '#f59e0b';

/* ── icons (identical to the component sheets) ── */
const arrowSVG = (c) => `<svg viewBox="0 0 100 100" class="ico"><path d="M50 6 L88 50 H66 V94 H34 V50 H12 Z" fill="${c}"/></svg>`;
const boostSVG = (c) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="18,42 50,14 82,42"/><polyline points="18,62 50,34 82,62"/><polyline points="18,82 50,54 82,82"/></g></svg>`;
const foodSVG = () => `<svg viewBox="0 0 100 100" class="ico"><circle cx="50" cy="50" r="40" fill="${GOLD_BRIGHT}"/><circle cx="38" cy="38" r="12" fill="#fde68a"/></svg>`;
const snakeSVG = (c) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${c}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M16 78 Q16 52 40 52 Q64 52 64 32 Q64 16 82 16"/></g><circle cx="84" cy="16" r="9" fill="${c}"/></svg>`;

/* ── diagram pieces ── */
const head = (col, dir = 'up') => `<span class="pc head" style="background:${col}"><i class="nose ${dir}"></i></span>`;
const body = (col) => `<span class="pc body" style="background:${col}"></span>`;
const bounty = (col) => `<span class="pc bounty" style="background:${col}"><b>×2</b></span>`;
const food = () => `<span class="pc food">${foodSVG()}</span>`;
const boost = () => `<span class="pc boost">${boostSVG(GOLD)}</span>`;
const crash = () => `<span class="pc crash">✕</span>`;

/** A small grid diagram. `cells` maps "x,y" → piece html. */
function dgrid(w, h, cells = {}, { px = 30, void: voids = [], mark = {} } = {}) {
  let out = `<div class="dg" style="width:${w * px}px;height:${h * px}px">`;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = `${x},${y}`;
    const isVoid = voids.includes(k);
    out += `<div class="dc${isVoid ? ' wall' : ''}" style="left:${x * px}px;top:${y * px}px;width:${px}px;height:${px}px">
      ${isVoid ? '' : (cells[k] || '')}${mark[k] ? `<span class="mk${mark[k] === '✕' ? ' crash' : ''}">${mark[k]}</span>` : ''}</div>`;
  }
  return out + `</div>`;
}
/** A whole mini-board shown as one square (for setup arrangements). */
const tile = (label = '') => `<span class="tile">${label}</span>`;
const fig = (inner, caption) => `<figure>${inner}<figcaption>${caption}</figcaption></figure>`;
const card = (inner, label, col, bg = '#fff') =>
  `<span class="mini-card" style="border-color:${col};background:${bg}"><span class="mc-ico">${inner}</span><b style="color:${col}">${label}</b></span>`;

const CSS = `
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  html,body { margin:0; padding:0; font-family:"Helvetica Neue",Arial,system-ui,sans-serif; color:#111827; }
  .ico { width:100%; height:100%; display:block; }
  .page { width:8.5in; height:11in; padding:0.55in 0.6in; page-break-after:always; position:relative; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  h1 { font-size:34pt; margin:0; letter-spacing:.06em; }
  h2 { font-size:15pt; margin:0 0 5pt; padding-bottom:3pt; border-bottom:2.5px solid #111827; letter-spacing:.02em; }
  h3 { font-size:10.5pt; margin:9pt 0 3pt; color:#111827; }
  p, li { font-size:9.5pt; line-height:1.42; margin:0 0 5pt; }
  ul, ol { margin:0 0 6pt; padding-left:15pt; }
  b { font-weight:800; }
  .lede { font-size:11pt; line-height:1.45; }
  .muted { color:#6b7280; }
  .foot { position:absolute; bottom:0.32in; left:0.6in; right:0.6in; display:flex; justify-content:space-between;
          font-size:7.5pt; color:#9ca3af; letter-spacing:.1em; border-top:1px solid #e5e7eb; padding-top:4pt; }
  .row { display:flex; gap:14pt; align-items:flex-start; }
  .col { flex:1; }
  figure { margin:0; text-align:center; }
  figcaption { font-size:7.8pt; color:#4b5563; margin-top:3pt; line-height:1.3; max-width:2.3in; }
  .figs.tight { gap:9pt; }
  .figs.tight figcaption { max-width:1.3in; }
  .figs { display:flex; gap:13pt; flex-wrap:wrap; justify-content:flex-start; align-items:flex-start; margin:5pt 0 7pt; }
  /* grid diagrams */
  .dg { position:relative; border:2px solid #111827; background:#fff; margin:0 auto; }
  .dc { position:absolute; border:1px solid #d1d5db; display:flex; align-items:center; justify-content:center; }
  .dc.void { background:#f3f4f6; border-color:#e5e7eb; }
  .mk { position:absolute; font-size:8pt; font-weight:900; color:#111827; }
  .mk.crash { font-size:17pt; color:#dc2626; line-height:1; }
  .dc.wall { background:repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 3px,#f9fafb 3px,#f9fafb 6px); }
  .pc { display:block; position:relative; }
  .pc.head { width:76%; height:76%; border-radius:50%; }
  .pc.head .nose { position:absolute; width:0; height:0; border:4.5px solid transparent; }
  .pc.head .nose.up    { border-bottom-color:#fff; top:11%;    left:50%; margin-left:-4.5px; }
  .pc.head .nose.down  { border-top-color:#fff;    bottom:11%; left:50%; margin-left:-4.5px; }
  .pc.head .nose.left  { border-right-color:#fff;  left:11%;   top:50%;  margin-top:-4.5px; }
  .pc.head .nose.right { border-left-color:#fff;   right:11%;  top:50%;  margin-top:-4.5px; }
  .pc.body { width:64%; height:64%; border-radius:4px; opacity:.9; }
  .pc.bounty { width:74%; height:74%; border-radius:3px; transform:rotate(45deg); border:1.5px solid #fff;
               display:flex; align-items:center; justify-content:center; }
  .pc.bounty b { transform:rotate(-45deg); color:#fff; font-size:6.5pt; }
  .pc.food { width:56%; height:56%; }
  .pc.boost { width:64%; height:64%; }
  .pc.crash { color:#dc2626; font-size:15pt; font-weight:900; line-height:1; }
  .tile { display:inline-block; width:34px; height:34px; border:2px solid #111827; background:#fff;
          font-size:7pt; color:#9ca3af; text-align:center; line-height:32px; }
  .tiles { display:grid; grid-auto-flow:row; gap:2px; justify-content:center; }
  /* card mini-illustrations */
  .mini-card { display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2pt;
               width:0.72in; height:0.72in; border:2.5px solid; border-radius:3px; }
  .mc-ico { width:0.3in; height:0.3in; }
  .mini-card b { font-size:5.6pt; letter-spacing:.04em; }
  /* tables & callouts */
  table { border-collapse:collapse; width:100%; font-size:9pt; margin:3pt 0 7pt; }
  th, td { border:1px solid #d1d5db; padding:3.5pt 5pt; text-align:left; }
  th { background:#f3f4f6; font-size:8pt; text-transform:uppercase; letter-spacing:.06em; }
  td.c, th.c { text-align:center; }
  .callout { background:${GOLD_BG}; border:1.5px solid ${GOLD}; border-radius:7px; padding:6pt 9pt; color:#78350f;
             font-size:9pt; margin:6pt 0; line-height:1.4; }
  .steps { counter-reset:s; padding:0; list-style:none; margin:0; }
  .steps > li { counter-increment:s; position:relative; padding-left:20pt; margin-bottom:5pt; }
  .steps > li::before { content:counter(s); position:absolute; left:0; top:0; width:14pt; height:14pt; border-radius:50%;
                        background:#111827; color:#fff; font-size:8pt; font-weight:800; text-align:center; line-height:14pt; }
  .ladder { display:flex; gap:2px; margin:4pt 0 2pt; }
  .lg { flex:1; text-align:center; }
  .lg .bx { height:0.34in; border:1.5px solid #374151; border-radius:4px; }
  .lg.max .bx { border-color:${GOLD}; background:${GOLD_BG}; }
  .lg .pt { font-size:9pt; font-weight:900; }
  .lg .bi { height:11px; }
  .lg .bi .ico { width:9px; height:9px; margin:0 auto; }
  .strip { display:flex; gap:3px; }
  .slot { width:0.44in; height:0.44in; border:2px solid #374151; border-radius:4px; display:flex;
          align-items:center; justify-content:center; background:#fff; }
  .slot .ico { width:0.24in; height:0.24in; }
  .slot.empty { border-style:dashed; color:#9ca3af; font-size:7pt; }
`;

const foot = (n, txt) => `<div class="foot"><span>GOBBLE · ${txt}</span><span>${n}</span></div>`;

/* ═══════════ PAGE 1 — cover, overview, components ═══════════ */
const page1 = `<div class="page">
  <div style="display:flex;align-items:center;gap:12pt">
    <span style="width:0.6in;height:0.6in">${snakeSVG('#15803d')}</span>
    <div><h1>GOBBLE</h1>
      <div class="muted" style="font-size:10pt;letter-spacing:.14em">SIMULTANEOUS-PROGRAMMING SNAKE · 2–6 PLAYERS · ~20 MIN</div></div>
  </div>
  <p class="lede" style="margin-top:12pt">Everyone programs their moves <b>in secret</b>, then all the snakes move <b>at once</b>.
  Eat to grow. The longer your snake, the more points it banks <b>when it dies</b> — and dying is how you score.
  So grow as fat as you dare, cash out at the right moment, and get straight back on the board.</p>
  <div class="callout"><b>The tension:</b> a short snake is safe and worth almost nothing. A long snake is worth a lot
  but can barely turn around — and at <b>maximum length</b> every scrap of food it eats is worth points right now.</div>

  <h2 style="margin-top:12pt">What's in the box</h2>
  <div class="row">
    <div class="col">
      <div class="figs">
        ${fig(dgrid(4, 4, { '1,0': food(), '3,1': food(), '0,2': boost(), '2,3': food() }, { px: 34 }),
             '<b>Mini-board</b> — one per player. Food spots and boost spaces are <b>printed</b>: they never run out.')}
        ${fig(`<div style="display:flex;gap:4pt">${card(arrowSVG(P.blue.ink), 'MOVE 1', P.blue.ink)}${card(boostSVG(P.blue.ink), 'MOVE ×3', P.blue.ink)}${card(boostSVG(GOLD), 'MOVE ×3', GOLD, GOLD_BG)}</div>`,
             '<b>Your hand:</b> 6 arrows + your own permanent boost (left, in your colour). Gold boosts are drawn from the deck and discarded after use.')}
      </div>
    </div>
    <div class="col">
      <ul>
        <li><b>6 mini-boards</b> (4×4). Every board's food layout is different and rotationally asymmetric — turning a board changes the game. Four boards also carry a <b>boost space</b>.</li>
        <li><b>Arrow cards</b> — 6 per player, in their colour. Rotate one to aim it.</li>
        <li><b>1 personal boost card</b> per player — always yours, back in hand every round.</li>
        <li><b>Boost deck</b> — generic ×3 boosts you draw from boost spaces and growth milestones.</li>
        <li><b>Player board</b> each — your length track and what each length is worth.</li>
        <li><b>Score track</b> (1–100) and a marker per player.</li>
        <li><b>Snake pieces</b> — 1 head + up to 13 body segments per player, double-sided so they flip to <b>bounty</b>.</li>
        <li><b>A 15-second timer</b> — phone or sand.</li>
      </ul>
    </div>
  </div>

  <h2 style="margin-top:6pt">The pieces at a glance</h2>
  <div class="figs tight">
    ${fig(dgrid(1, 1, { '0,0': food() }, { px: 40 }), '<b>Food spot</b><br>printed · +1 segment')}
    ${fig(dgrid(1, 1, { '0,0': boost() }, { px: 40 }), '<b>Boost space</b><br>printed · draw 1 boost card')}
    ${fig(dgrid(1, 1, { '0,0': bounty(P.red.fill) }, { px: 40 }), '<b>Bounty chip</b><br>from a death · +2 segments, one-shot')}
    ${fig(dgrid(1, 1, { '0,0': head(P.green.fill, 'right') }, { px: 40 }), '<b>Head</b><br>leads the snake · the point shows its facing')}
    ${fig(dgrid(1, 1, { '0,0': body(P.green.fill) }, { px: 40 }), '<b>Body segment</b><br>flips over to bounty when you die')}
  </div>
  ${foot(1, 'OVERVIEW & COMPONENTS')}
</div>`;

/* ═══════════ PAGE 2 — setup ═══════════ */
const arrangement = (n, cols, rows, missing = []) => {
  let cells = '';
  for (let i = 0; i < cols * rows; i++) cells += missing.includes(i) ? `<span class="tile" style="border:none"></span>` : tile();
  return fig(`<div class="tiles" style="grid-template-columns:repeat(${cols},34px)">${cells}</div>`,
    `<b>${n} players</b>`);
};
const page2 = `<div class="page">
  <h2>Setup</h2>
  <ol class="steps">
    <li><b>Build the board.</b> Put out one mini-board per player, packed as close to an even square as possible.
        Any outside edge — including the notch where a board is missing — is a <b>wall</b>.</li>
    <li><b>Deal hands.</b> Each player takes their 6 arrows, their personal boost card, their snake pieces and a player board.
        Shuffle the gold boost deck into a draw stack. Put every score marker off the track (0 points).</li>
    <li><b>Place snakes</b> at length 3 (see below), in any order you like.</li>
  </ol>
  <div class="figs">
    ${arrangement(2, 2, 1)}
    ${arrangement(3, 2, 2, [3])}
    ${arrangement(4, 2, 2)}
    ${arrangement(5, 3, 2, [5])}
    ${arrangement(6, 3, 2)}
  </div>

  <h2 style="margin-top:8pt">Placing your snake</h2>
  <p>Your snake is <b>3 segments</b> on 3 <b>contiguous</b> cells — straight or bent. At least one of them must
  <b>touch a corner of any mini-board</b> (the ringed cells below). The head goes on one end and simply points away
  from its neck. You may cover printed food — <b>you never eat what you cover</b>.</p>
  <div class="figs">
    ${fig(dgrid(4, 4, { '0,0': head(P.blue.fill, 'right'), '0,1': body(P.blue.fill), '0,2': body(P.blue.fill), '2,1': food(), '3,3': food() },
      { px: 30, mark: { '3,0': '○', '0,3': '○', '3,3': '' } }), '<b>Legal</b> — the tail end sits on a corner cell.')}
    ${fig(dgrid(4, 4, { '0,0': head(P.orange.fill, 'down'), '1,0': body(P.orange.fill), '1,1': body(P.orange.fill), '3,2': food() }, { px: 30 }),
      '<b>Legal</b> — bends are fine, and the head is on the corner.')}
    ${fig(dgrid(4, 4, { '1,1': head(P.silver.fill, 'right'), '1,2': body(P.silver.fill), '2,2': body(P.silver.fill), '0,3': food() }, { px: 30 }),
      '<b>Illegal</b> — nothing touches a corner.')}
    ${fig(dgrid(4, 4, { '0,0': head(P.brown.fill, 'right'), '1,0': body(P.brown.fill), '3,0': body(P.brown.fill), '2,2': food() }, { px: 30, mark: { '2,0': '✕' } }),
      '<b>Illegal</b> — the three cells are not contiguous.')}
  </div>
  <div class="callout"><b>Respawning</b> works exactly the same way — a snake that died comes back next round at length 3,
  on any 3 contiguous cells touching a board corner, avoiding snakes and bounty chips.</div>
  ${foot(2, 'SETUP')}
</div>`;

/* ═══════════ PAGE 3 — the round ═══════════ */
const strip = (items) => `<div class="strip">${items.map((i) =>
  i === null ? `<span class="slot empty">stay</span>`
  : i === 'b' ? `<span class="slot" style="border-color:${GOLD};background:${GOLD_BG}">${boostSVG(GOLD)}</span>`
  : `<span class="slot" style="transform:rotate(${{ up: 0, right: 90, down: 180, left: 270 }[i]}deg)">${arrowSVG(P.blue.ink)}</span>`).join('')}</div>`;

const page3 = `<div class="page">
  <h2>Playing a round</h2>
  <h3>1 · Program, in secret</h3>
  <p>Lay <b>2 to 6 cards</b> face-down in a row in front of you. The leftmost resolves first. Rotate a card to aim it.
  If you lay fewer than 6, your snake simply <b>stops in place</b> for the rest of the round.</p>
  <div class="figs">
    ${fig(strip(['up', 'up', 'b', 'right', null, null]),
      'Four programmed moves: up, up, a <b>boost</b> (3 cells right, rotated), right — then two rounds of standing still.')}
  </div>
  <div class="callout"><b>⏱ The panic timer.</b> The instant the <b>first</b> player finishes their row, start the 15-second timer.
  When it runs out, everybody else locks <b>whatever they have</b> — finished or not. Fast programming is a weapon.</div>

  <h3>2 · Reveal and resolve, one slot at a time</h3>
  <p>Flip every row face-up. Resolve slot 1 for everyone, then slot 2, and so on. Inside a single slot:</p>
  <ol class="steps">
    <li><b>Boosts slide first.</b> Every boosting snake moves its full 3 cells, one cell at a time, together.</li>
    <li><b>Then arrows.</b> Every arrow snake steps 1 cell, all at the same time.</li>
  </ol>
  <p>And each individual move happens in this order:</p>
  <div class="figs">
    ${fig(dgrid(4, 3, { '0,1': head(P.green.fill, 'right'), '0,2': body(P.green.fill), '1,2': body(P.green.fill), '2,1': food() }, { px: 30 }),
      '<b>a.</b> Before the move.')}
    ${fig(dgrid(4, 3, { '0,1': head(P.green.fill, 'right'), '0,2': body(P.green.fill), '2,1': food() }, { px: 30, mark: { '1,2': '⌫' } }),
      '<b>b. Tail clears.</b> Lift your last segment — unless this move will grow you.')}
    ${fig(dgrid(4, 3, { '1,1': head(P.green.fill, 'right'), '0,1': body(P.green.fill), '0,2': body(P.green.fill), '2,1': food() }, { px: 30 }),
      '<b>c. Head slides</b> one cell, and the lifted segment fills the gap behind it.')}
    ${fig(dgrid(4, 3, { '2,1': head(P.green.fill, 'right'), '1,1': body(P.green.fill), '0,1': body(P.green.fill), '0,2': body(P.green.fill) }, { px: 30 }),
      '<b>d. Eat.</b> Landing on food adds a segment — the printed spot stays for next time.')}
  </div>

  <h3>3 · End of the round</h3>
  <p>There is <b>no upkeep</b> — the food is printed on the boards and never needs replacing. Respawn anyone who died,
  check whether anybody has hit the target score, and program the next round.</p>
  ${foot(3, 'THE ROUND')}
</div>`;

/* ═══════════ PAGE 4 — crashes ═══════════ */
const G = { red: P.red.fill, blue: P.blue.fill, green: P.green.fill, orange: P.orange.fill, silver: P.silver.fill, brown: P.brown.fill };
const page4 = `<div class="page">
  <h2>Crashing</h2>
  <p>A head that moves into a <b>wall</b>, into <b>any snake's body</b>, or into a <b>tail that hasn't cleared</b> — that snake <b>dies</b>.
  Your own body counts. The red ✕ marks the cell where the crash happens.</p>
  <div class="figs">
    ${fig(dgrid(5, 3, { '1,1': body(G.red), '2,1': body(G.red), '3,1': head(G.red, 'right') },
      { px: 30, void: ['4,0', '4,1', '4,2'], mark: { '4,1': '✕' } }),
      '<b>Wall.</b> The board edge — or the hatched gap where no board was placed — kills you.')}
    ${fig(dgrid(4, 3, { '0,1': body(G.blue), '1,1': head(G.blue, 'right'), '2,0': head(G.green, 'up'), '2,1': body(G.green), '2,2': body(G.green) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Body.</b> Blue drives into green\'s middle. <b>Only blue dies</b> — green is untouched.')}
    ${fig(dgrid(5, 3, { '0,1': body(G.orange), '1,1': head(G.orange, 'right'), '3,1': head(G.silver, 'left'), '4,1': body(G.silver) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Head-on.</b> Both enter the same cell in the same instant — <b>both die</b>.')}
    ${fig(dgrid(4, 3, { '0,1': body(G.brown), '1,1': head(G.brown, 'right'), '2,1': head(G.silver, 'up'), '2,2': body(G.silver), '3,2': body(G.silver) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Into a parked head.</b> Silver programmed no move this slot, so <b>only brown</b> — the one that moved — dies.')}
  </div>

  <div class="callout"><b>Boosts go first, and that matters.</b> A boosting snake reaches a contested cell before any
  arrow-mover does. The arrow snake arriving a beat later simply crashes into its side — the booster is safe.</div>
  <div class="figs">
    ${fig(dgrid(6, 3, { '0,1': body(G.blue), '1,1': head(G.blue, 'right'), '5,0': body(G.orange), '5,1': head(G.orange, 'left') },
      { px: 30, mark: { '4,1': '→' } }),
      '<b>1 · Before.</b> Blue programmed a <b>boost</b> (3 cells right); orange a single arrow left. Both want the marked cell.')}
    ${fig(dgrid(6, 3, { '3,1': body(G.blue), '4,1': head(G.blue, 'right'), '5,0': body(G.orange), '5,1': head(G.orange, 'left') }, { px: 30 }),
      '<b>2 · Boosts resolve first.</b> Blue slides its full 3 cells and now <b>occupies</b> the cell.')}
    ${fig(dgrid(6, 3, { '3,1': body(G.blue), '4,1': head(G.blue, 'right'), '5,0': bounty(G.orange) }, { px: 30, mark: { '5,1': '✕' } }),
      '<b>3 · Then arrows.</b> Orange moves into an occupied cell and <b>dies</b> — its head leaves and its segment flips to bounty. <b>Blue lives.</b>')}
  </div>
  <p class="muted" style="font-size:8.5pt">A boost is checked cell by cell: if it crashes on the 1st or 2nd cell it dies there and never finishes the slide.</p>
  ${foot(4, 'CRASHING')}
</div>`;

/* ═══════════ PAGE 5 — eating, growing, max length ═══════════ */
const PTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
const BOOST_AT = new Set([2, 4, 6, 8, 10, 15]);
const ladder = `<div class="ladder">${PTS.map((pts, i) => `
  <div class="lg ${i === PTS.length - 1 ? 'max' : ''}">
    <div class="bx"></div><div class="pt">${pts}</div>
    <div class="bi">${BOOST_AT.has(pts) ? boostSVG(GOLD) : ''}</div>
  </div>`).join('')}</div>`;

const page5 = `<div class="page">
  <h2>Eating &amp; growing</h2>
  <table>
    <tr><th style="width:1.1in">You entered</th><th class="c" style="width:0.9in">Growth</th><th class="c" style="width:1.1in">Boost cards</th><th>Notes</th></tr>
    <tr><td><span style="display:inline-block;width:13px;height:13px;vertical-align:-2px">${foodSVG()}</span> <b>Food spot</b></td><td class="c">+1 segment</td><td class="c">—</td><td>Printed — <b>never runs out</b>. A snake sitting on it just blocks it.</td></tr>
    <tr><td><span style="display:inline-block;width:13px;height:13px;vertical-align:-2px">${boostSVG(GOLD)}</span> <b>Boost space</b></td><td class="c">—</td><td class="c"><b>draw 1</b></td><td>Printed on 4 of the 6 boards — also never runs out.</td></tr>
    <tr><td><b>◆ Bounty chip</b></td><td class="c">+2 segments</td><td class="c">—</td><td>Dropped by a death. <b>One-shot</b> — remove it once eaten.</td></tr>
  </table>
  <p>New segments appear <b>behind the head</b> and unspool as you move. Anything that doesn't grow you resolves like a
  normal move — your tail piece just fills the gap.</p>
  <div class="callout"><b>Growth milestones ${'—'}</b> every time your snake <b>reaches an even length</b> (4, 6, 8, 10, 12, 14),
  take an extra boost card from the deck. Those lengths are marked with ${'<span style="display:inline-block;width:11px;height:11px;vertical-align:-1px">' + boostSVG(GOLD) + '</span>'} on your player board.
  You may hold at most <b>6</b> drawn boost cards (your personal one is always on top of that).</div>

  <h2 style="margin-top:10pt">Your player board</h2>
  <p>Move a marker along it as you grow. The number under each space is what you <b>bank if you die at that length</b>.</p>
  ${ladder}
  <p class="muted" style="font-size:8pt;text-align:center">length 3 → 14 · the gold space is maximum length</p>
  <div class="callout"><b>At maximum length (14)</b> your snake stops growing — and every food you eat instead scores
  <b>+2 points immediately</b> (a ×2 bounty chip scores <b>+4</b>). A maxed snake parked on good food spots simply
  prints points, which is why staying alive up there beats crashing on purpose.</div>
  <div class="figs">
    ${fig(dgrid(4, 3, { '1,1': head(P.green.fill, 'right'), '0,1': body(P.green.fill), '0,2': body(P.green.fill), '2,1': food() }, { px: 30, mark: { '2,1': '' } }),
      'A maxed snake about to eat…')}
    ${fig(dgrid(4, 3, { '2,1': head(P.green.fill, 'right'), '1,1': body(P.green.fill), '0,1': body(P.green.fill) }, { px: 30, mark: { '3,1': '+2' } }),
      '…doesn\'t grow, and scores <b>+2</b> on the spot. The food spot is still there for the next pass.')}
  </div>
  ${foot(5, 'EATING, GROWING & SCORING')}
</div>`;

/* ═══════════ PAGE 6 — death, winning, quick reference ═══════════ */
const page6 = `<div class="page">
  <h2>Dying — which is the point</h2>
  <ol class="steps">
    <li><b>Bank your length.</b> Score the number under your current space on the player board: length 3 = 1 point, all the way up to length 14 = <b>15 points</b>.</li>
    <li><b>Drop bounty.</b> Your head leaves the board. Flip <b>every other body segment</b> — the first one behind the head, then every second one after it — to its bounty side; remove the segments in between. Each chip is worth <b>×2 food</b> to whoever eats it.</li>
    <li><b>Respawn</b> next round at length 3, touching a board corner (see Setup).</li>
  </ol>
  <div class="figs">
    ${fig(dgrid(6, 3, { '0,1': head(P.red.fill, 'right'), '1,1': body(P.red.fill), '2,1': body(P.red.fill), '3,1': body(P.red.fill), '4,1': body(P.red.fill), '5,1': body(P.red.fill) }, { px: 30 }),
      'A red snake at length 6 — about to crash.')}
    ${fig(dgrid(6, 3, { '1,1': bounty(P.red.fill), '3,1': bounty(P.red.fill), '5,1': bounty(P.red.fill) }, { px: 30 }),
      'It banks 4 points and leaves <b>3 bounty chips</b> — every other segment. The rest go back in the box.')}
  </div>

  <h2 style="margin-top:6pt">Winning</h2>
  <p>The moment anybody reaches <b>70 points</b>, the game ends immediately — but it isn't over yet:</p>
  <ul>
    <li><b>Every snake still alive cashes out</b>, banking points for its current length off the same ladder.</li>
    <li>Compare totals. <b>Highest total wins.</b></li>
  </ul>
  <p>Crossing the line first does <b>not</b> guarantee the win — a rival sitting on a huge live snake can leapfrog you
  on the cash-out. <i>Ties:</i> whoever ate the most food this game takes it; still tied, share the victory.</p>

  <h2 style="margin-top:8pt">Quick reference</h2>
  <ol class="steps">
    <li><b>Program</b> 2–6 cards face-down. Arrow = 1 cell · Boost = 3 cells. Your own boost comes back every round; drawn ones are discarded.</li>
    <li>The first player to lock starts the <b>15-second timer</b>; everyone else locks whatever they have when it ends.</li>
    <li><b>Resolve slot by slot:</b> boosts slide first, then all arrows step together. Tail clears → head slides → check crashes → eat.</li>
    <li><b>Food</b> +1 segment (never runs out) · <b>boost space</b> draw 1 · <b>bounty chip</b> +2 segments. Even lengths draw a boost card. At <b>max 14</b>, every food is worth <b>2 points</b>.</li>
    <li><b>Crash</b> = death: bank your length, flip every other segment to bounty, respawn on a corner next round.</li>
    <li><b>First to 70</b> ends it — living snakes cash out, highest total wins.</li>
  </ol>
  <div class="callout" style="margin-top:10pt"><b>Three habits of a good Gobble player:</b> program a safe pair of moves
  before you program a greedy one; watch which rivals still hold boost cards; and never let a fat snake wander somewhere
  it can't turn around.</div>
  ${foot(6, 'DYING, WINNING & QUICK REFERENCE')}
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Gobble — Rulebook</title>
<style>${CSS}</style></head><body>${page1}${page2}${page3}${page4}${page5}${page6}</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await browser.newPage();
await pg.setContent(html, { waitUntil: 'networkidle' });
await pg.pdf({ path: path.join(OUT, 'gobble-rulebook.pdf'), format: 'Letter', printBackground: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' } });
await pg.setViewportSize({ width: 850, height: 1100 });
await pg.screenshot({ path: path.join(OUT, 'gobble-rulebook-preview.png'), fullPage: true });
await browser.close();
console.log('wrote gobble-rulebook.pdf');
