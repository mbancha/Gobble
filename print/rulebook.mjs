// Gobble — illustrated rulebook → gobble-rulebook.pdf (US Letter).
// Every illustration is drawn from the SAME icon code as the printed
// components, so the diagrams always match what's on the table.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { SPECIALS } from './specials.mjs';

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
const foodSVG = () => {
  const grid = ['..OOOO..', '.OWWLOO.', 'OWWLLOOO', 'OWLLOOOO',
                'OLLOOOOD', 'OLOOOODD', '.OOOODD.', '..OODD..'];
  const C = { O: '#f97316', L: '#fdba74', W: '#ffedd5', D: '#c2410c' };
  let px = '';
  grid.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') px += `<rect x="${x * 12.5}" y="${y * 12.5}" width="12.5" height="12.5" fill="${C[ch]}"/>`;
  }));
  return `<svg viewBox="0 0 100 100" class="ico" shape-rendering="crispEdges">${px}</svg>`;
};
const swirlSVG = () => `<svg viewBox="0 0 100 100" class="ico">
  <g fill="none" stroke-width="9" stroke-linecap="round">
    <path d="M50 8 A42 42 0 0 1 92 50" stroke="#ef4444"/><path d="M92 50 A42 42 0 0 1 50 92" stroke="#f59e0b"/>
    <path d="M50 92 A42 42 0 0 1 8 50" stroke="#22c55e"/><path d="M8 50 A42 42 0 0 1 50 8" stroke="#3b82f6"/>
    <path d="M50 26 A24 24 0 0 1 74 50" stroke="#a855f7"/><path d="M74 50 A24 24 0 0 1 50 74" stroke="#ec4899"/>
    <path d="M50 74 A24 24 0 0 1 26 50" stroke="#06b6d4"/>
  </g><circle cx="50" cy="50" r="7" fill="#7c3aed"/></svg>`;
const snakeSVG = (c) => `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="${c}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M16 78 Q16 52 40 52 Q64 52 64 32 Q64 16 82 16"/></g><circle cx="84" cy="16" r="9" fill="${c}"/></svg>`;

/* ── diagram pieces ── */
const head = (col, dir = 'up') => `<span class="pc head" style="background:${col}"><i class="nose ${dir}"></i></span>`;
const body = (col) => `<span class="pc body" style="background:${col}"></span>`;
const beadSVG = () => `<svg viewBox="0 0 100 100" class="ico">
  <path d="M6 76 A44 44 0 0 1 94 76 Z" fill="#eab308"/>
  <ellipse cx="34" cy="50" rx="12" ry="7.5" fill="#fef9c3" opacity=".9"/>
  <rect x="4" y="74" width="92" height="7" rx="3.5" fill="#a16207"/></svg>`;
const bead = () => `<span class="pc bead">${beadSVG()}</span>`;
const food = () => `<span class="pc food">${foodSVG()}</span>`;
const boost = () => `<span class="pc boost">${boostSVG(GOLD)}</span>`;
const swirl = () => `<span class="pc boost">${swirlSVG()}</span>`;
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
const fig = (inner, caption, cls = '') => `<figure class="${cls}">${inner}<figcaption>${caption}</figcaption></figure>`;
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
  figure.ok .dg { border-color:#15803d; box-shadow:0 0 0 2px #dcfce7; }
  figure.no .dg { border-color:#dc2626; box-shadow:0 0 0 2px #fee2e2; }
  figure.ok figcaption b:first-child { color:#15803d; }
  figure.no figcaption b:first-child { color:#dc2626; }
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
  .pc.bead { width:74%; height:74%; }
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
  .spgrid { display:grid; grid-template-columns:1fr 1fr; gap:3pt 14pt; margin:5pt 0 2pt; }
  .sp { display:flex; gap:5pt; align-items:flex-start; break-inside:avoid; }
  .sp .spico { width:0.23in; height:0.23in; flex:none; margin-top:1pt; }
  .sp b { font-size:8.4pt; }
  .spwhen { font-size:6.8pt; letter-spacing:.06em; text-transform:uppercase; color:#7c3aed; font-weight:800; }
  .sptext { font-size:7.6pt; line-height:1.25; color:#4b5563; }
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
  <p class="lede" style="margin-top:14pt">Everyone programs their moves <b>in secret</b>, then all the snakes move <b>at once</b>.
  Eat to grow. The longer your snake, the more points it's worth!</p>
  <p class="muted" style="font-size:9pt;margin-top:-2pt">You always have points equal to how far your snake has grown, so dying never takes
  them away. Tick them off on the score board when you die, or as you eat — same total either way.</p>

  <h2 style="margin-top:14pt">What's in the box</h2>
  <div class="row">
    <div class="col">
      <div class="figs">
        ${fig(dgrid(4, 4, { '1,0': food(), '3,1': food(), '1,2': swirl(), '2,3': food() }, { px: 34 }),
             '<b>Mini-board</b> — one per player. Food spots and special swirls are <b>printed</b>: they never run out.')}
        ${fig(`<div style="display:flex;gap:4pt">${card(arrowSVG(P.blue.ink), 'MOVE 1', P.blue.ink)}${card(boostSVG(P.blue.ink), 'MOVE ×3', P.blue.ink)}${card(boostSVG(GOLD), 'MOVE ×3', GOLD, GOLD_BG)}</div>`,
             '<b>Your hand:</b> 6 movement tiles + your own permanent boost (left, in your colour). Spare gold boost tiles come from a shared stack at growth milestones.')}
      </div>
    </div>
    <div class="col">
      <ul>
        <li><b>6 mini-boards</b> (4×4). Every board's food layout is different and rotationally asymmetric — turning a board changes the game. Four boards also carry a <b>boost space</b>.</li>
        <li><b>Movement tiles</b> — 6 per player, in their colour. Rotate one to aim it.</li>
        <li><b>1 personal boost tile</b> per player — always yours, back in hand every round.</li>
        <li><b>Boost stack</b> — spare ×3 boost tiles taken at growth milestones. All identical, so they sit face-up in a stack.</li>
        <li><b>18 Special cards</b> — 9 effects, 2 copies each, shuffled into a face-down deck.</li>
        <li><b>Player board</b> each — ten boxes holding your snake sticks; the number under each is your score.</li>
        <li><b>Score track</b> (1–100) and a marker per player.</li>
        <li><b>Snake pieces</b> — 1 head + 13 wooden sticks per player.</li>
        <li><b>Snake food</b> — yellow glass beads, left behind when a snake dies.</li>
        <li><b>A 10-second timer</b> — phone or sand.</li>
      </ul>
    </div>
  </div>

  <h2 style="margin-top:6pt">The icons at a glance</h2>
  <div class="figs tight">
    ${fig(dgrid(1, 1, { '0,0': food() }, { px: 40 }), '<b>Food spot</b><br>printed · +1 segment, +1 point')}
    ${fig(dgrid(1, 1, { '0,0': swirl() }, { px: 40 }), '<b>Special space</b><br>printed · draw a Special card')}
    ${fig(dgrid(1, 1, { '0,0': bead() }, { px: 40 }), '<b>Snake food</b><br>a token from a death · +2 segments, picked up once eaten')}
    ${fig(dgrid(1, 1, { '0,0': head(P.green.fill, 'right') }, { px: 40 }), '<b>Head</b><br>leads the snake · the point shows its facing')}
    ${fig(dgrid(1, 1, { '0,0': body(P.green.fill) }, { px: 40 }), '<b>Body segment</b><br>leaves snake food when you die')}
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
    <li><b>Player setup.</b> Each player takes their <b>6 movement tiles</b>, their <b>personal boost tile</b>, their <b>snake head</b>
        and a <b>player board</b> — then fills all ten boxes on that board with their wooden snake sticks. Shuffle the
        <b>Special cards</b> into a face-down deck; leave the spare <b>boost tiles</b> face-up in a stack, since they're all the same.
        Put every score marker off the track at 0.</li>
    <li><b>Place snakes</b> at length 4 (see below), in any order you like.</li>
  </ol>
  <div class="figs">
    ${arrangement(2, 2, 1)}
    ${arrangement(3, 2, 2, [3])}
    ${arrangement(4, 2, 2)}
    ${arrangement(5, 3, 2, [5])}
    ${arrangement(6, 3, 2)}
  </div>

  <h2 style="margin-top:8pt">Placing your snake</h2>
  <p>Your snake is a <b>head plus 3 segments</b> on 4 <b>contiguous</b> cells — straight or bent. At least one of them must
  <b>touch a corner of any mini-board</b> (the ringed cells below). The head goes on one end and simply points away
  from its neck. You may cover printed food — <b>you never eat what you cover</b>.</p>
  <div class="figs">
    ${fig(dgrid(4, 4, { '0,0': head(P.blue.fill, 'right'), '0,1': body(P.blue.fill), '0,2': body(P.blue.fill), '0,3': body(P.blue.fill), '2,1': food() },
      { px: 30, mark: { '3,0': '○', '0,3': '○', '3,3': '' } }), '<b>Legal</b> — the tail end sits on a corner cell.', 'ok')}
    ${fig(dgrid(4, 4, { '0,0': head(P.orange.fill, 'down'), '1,0': body(P.orange.fill), '1,1': body(P.orange.fill), '1,2': body(P.orange.fill), '3,2': food() }, { px: 30 }),
      '<b>Legal</b> — bends are fine, and the head is on the corner.', 'ok')}
    ${fig(dgrid(4, 4, { '1,1': head(P.silver.fill, 'right'), '1,2': body(P.silver.fill), '2,2': body(P.silver.fill), '3,2': body(P.silver.fill), '0,3': food() }, { px: 30 }),
      '<b>Illegal</b> — nothing touches a corner.', 'no')}
    ${fig(dgrid(4, 4, { '0,0': head(P.brown.fill, 'right'), '1,0': body(P.brown.fill), '3,0': body(P.brown.fill), '3,1': body(P.brown.fill), '2,2': food() }, { px: 30, mark: { '2,0': '✕' } }),
      '<b>Illegal</b> — the three cells are not contiguous.', 'no')}
  </div>
  <div class="callout"><b>Respawning</b> works exactly the same way — a snake that died comes back next round at length 4,
  on any 3 contiguous cells touching a board corner, avoiding snakes and snake food. If <b>no corner placement is available
  at all</b>, place as close to a corner as you can.</div>
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
  <p>Lay <b>2 to 6 tiles</b> face-down in a row in front of you. The leftmost resolves first. Rotate a tile to aim it.
  If you lay fewer than 6, your snake simply <b>stops in place</b> for the rest of the round.</p>
  <div class="figs">
    ${fig(strip(['up', 'up', 'b', 'right', null, null]),
      'Four programmed moves: up, up, a <b>boost</b> (3 cells right, rotated), right — then two slots standing still.')}
  </div>
  <div class="callout"><b>⏱ The panic timer.</b> The instant the <b>first</b> player finishes their row, start the 10-second timer.
  When it runs out, everybody else locks <b>whatever they have</b> — finished or not. Program fast to hustle your opponents!</div>

  <h3>2 · Reveal and resolve, one slot at a time</h3>
  <p>Flip every row face-up. Resolve slot 1 for everyone, then slot 2, and so on. Inside a single slot:</p>
  <ol class="steps">
    <li><b>Boosts slide first.</b> Every boosting snake moves its full 3 cells, one cell at a time, together.</li>
    <li><b>Then movement cards.</b> Every stepping snake moves 1 cell, all at the same time.</li>
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
      '<b>d. Eat.</b> Landing on food adds a segment and scores a point — the printed spot stays for next time.')}
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
  <p>You die if you move into a <b>wall</b>, into a space <b>another snake moves into at the same time</b>, or into
  a <b>snake's body or the side of its head</b>. Heads are directional, so their sides count just like a body —
  and it makes no difference whether the other snake moved this slot or stood still. The red ✕ marks where the
  crash happens.</p>
  <div class="figs">
    ${fig(dgrid(5, 3, { '1,1': body(G.red), '2,1': body(G.red), '3,1': head(G.red, 'right') },
      { px: 30, void: ['4,0', '4,1', '4,2'], mark: { '4,1': '✕' } }),
      '<b>Wall.</b> The board edge — or the hatched gap where no board was placed — kills you.')}
    ${fig(dgrid(5, 3, { '0,1': body(G.orange), '1,1': head(G.orange, 'right'), '3,1': head(G.silver, 'left'), '4,1': body(G.silver) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Same space.</b> Two snakes moving into one space at the same time — <b>both die</b>.')}
    ${fig(dgrid(4, 3, { '0,1': body(G.blue), '1,1': head(G.blue, 'right'), '2,0': head(G.green, 'up'), '2,1': body(G.green), '2,2': body(G.green) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Body.</b> Blue drives into green\'s middle. <b>Only blue dies</b> — green is untouched.')}
    ${fig(dgrid(4, 3, { '0,1': body(G.brown), '1,1': head(G.brown, 'right'), '2,1': head(G.silver, 'up'), '2,2': body(G.silver), '2,3': body(G.silver) },
      { px: 30, mark: { '2,1': '✕' } }),
      '<b>Side of a head.</b> Brown hits silver from the side, so <b>only brown</b> dies — whether or not silver moved.')}
  </div>

  <div class="callout"><b>Boosts go first.</b> A boosting snake crosses a contested space
  <b>before</b> a stepping snake reaches it — and leaves its body sitting in the way.</div>
  <div class="figs">
    ${fig(dgrid(6, 4, { '0,2': body(G.blue), '1,2': head(G.blue, 'right'), '3,0': body(G.orange), '3,1': head(G.orange, 'down') },
      { px: 28, mark: { '3,2': '✛' } }),
      '<b>1 · Before.</b> Blue plays a <b>boost</b> (3 cells right). Orange plays a single move down. Their paths cross at the marked space.')}
    ${fig(dgrid(6, 4, { '3,2': body(G.blue), '4,2': head(G.blue, 'right'), '3,0': body(G.orange), '3,1': head(G.orange, 'down') }, { px: 28 }),
      '<b>2 · The boost slides first</b>, straight across orange\'s path — and blue\'s <b>body</b> now fills the crossing space.')}
    ${fig(dgrid(6, 4, { '3,2': body(G.blue), '4,2': head(G.blue, 'right'), '3,0': bead() }, { px: 28, mark: { '3,2': '✕' } }),
      '<b>3 · Then the steppers move.</b> Orange moves down into blue\'s body and <b>dies</b>, leaving snake food behind. <b>Blue is unharmed.</b>')}
  </div>
  <p class="muted" style="font-size:8.5pt">A boost is checked cell by cell: if it crashes on the 1st or 2nd cell it dies there and never finishes the slide.</p>
  ${foot(4, 'CRASHING')}
</div>`;

/* ═══════════ PAGE 5 — eating, growing, max length ═══════════ */
const PTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BOOST_AT = new Set([3, 6, 10]);
const ladder = `<div class="ladder">${PTS.map((pts, i) => `
  <div class="lg ${i === PTS.length - 1 ? 'max' : ''}">
    <div class="bx"></div><div class="pt">${pts}</div>
    <div class="bi">${BOOST_AT.has(pts) ? boostSVG(GOLD) : ''}</div>
  </div>`).join('')}</div>`;

const page5 = `<div class="page">
  <h2>Eating &amp; growing</h2>
  <table>
    <tr><th style="width:1.1in">You entered</th><th class="c" style="width:0.9in">Growth</th><th class="c" style="width:1.1in">Also</th><th>Notes</th></tr>
    <tr><td><span style="display:inline-block;width:13px;height:13px;vertical-align:-2px">${foodSVG()}</span> <b>Food spot</b></td><td class="c">+1 segment</td><td class="c"><b>+1 point</b></td><td>Printed — <b>never runs out</b>. A snake sitting on it just blocks it.</td></tr>
    <tr><td><span style="display:inline-block;width:13px;height:13px;vertical-align:-2px">${swirlSVG()}</span> <b>Special space</b></td><td class="c">—</td><td class="c"><b>draw a Special</b></td><td>Printed on 4 of the 6 boards — also never runs out.</td></tr>
    <tr><td><span style="display:inline-block;width:13px;height:13px;vertical-align:-2px">${beadSVG()}</span> <b>Snake food</b></td><td class="c">+2 segments</td><td class="c"><b>+2 points</b></td><td>A yellow bead left by a death. It's a <b>token</b> — pick it up once eaten.</td></tr>
  </table>
  <p>New segments appear <b>behind the head</b> and unspool as you move. Anything that doesn't grow you resolves like a
  normal move — your tail piece just fills the gap.</p>
  <div class="callout"><b>Growth milestones ${'—'}</b> boxes <b>3, 6 and 10</b> on your player board have a
  ${'<span style="display:inline-block;width:11px;height:11px;vertical-align:-1px">' + boostSVG(GOLD) + '</span>'} printed inside them.
  The moment that stick comes out, take a <b>boost tile</b> from the stack. You may hold at most <b>6</b> spare boost tiles
  (your personal one is always on top of that).</div>

  <h2 style="margin-top:10pt">Your player board</h2>
  <p>Ten upright boxes, each holding one of your wooden snake sticks at setup. <b>Every time you eat, take a stick out</b>
  and add it to your snake — the number under the box you just emptied is your score. Boxes <b>3, 6 and 10</b> have a boost
  icon printed inside, revealed as that stick comes out.</p>
  ${ladder}
  <p class="muted" style="font-size:8pt;text-align:center">ten growth steps · the gold box is maximum length</p>
  <div class="callout"><b>You always have points equal to how far your snake has grown</b>, so dying never takes them away.
  It's easiest to move your marker when your snake dies, but you can tick each food off as you eat if you prefer — the total
  is the same. Once the <b>last stick is out</b> you're at maximum length: your snake stops growing and every food you eat
  is worth <b>2 points</b> instead (snake food <b>4</b>).</div>
  <div class="figs">
    ${fig(dgrid(4, 3, { '1,1': head(P.green.fill, 'right'), '0,1': body(P.green.fill), '0,2': body(P.green.fill), '2,1': food() }, { px: 30, mark: { '2,1': '' } }),
      'A maxed snake about to eat…')}
    ${fig(dgrid(4, 3, { '2,1': head(P.green.fill, 'right'), '1,1': body(P.green.fill), '0,1': body(P.green.fill) }, { px: 30, mark: { '3,1': '+2' } }),
      '…doesn\'t grow, and scores <b>+2</b> instead. The food spot is still there for the next pass.')}
  </div>
  ${foot(5, 'EATING, GROWING & SCORING')}
</div>`;

/* ═══════════ PAGE 6 — death, winning, quick reference ═══════════ */
const page6 = `<div class="page">
  <h2>Dying</h2>
  <ol class="steps">
    <li><b>Record your score</b> if you haven't been ticking it off as you ate — the number under the last box you emptied, plus 2 for every food eaten at maximum length. Your points are already yours; dying doesn't take any away.</li>
    <li><b>Leave snake food.</b> Your head leaves the board. Put a <b>yellow bead</b> on <b>every other body segment</b> — the first one behind the head, then every second one after it — and remove the segments in between. Each bead is worth <b>×2 food</b> to whoever eats it.</li>
    <li><b>Refill your player board</b> with all ten sticks, and <b>respawn</b> next round at length 4, touching a board corner (see Setup).</li>
  </ol>
  <div class="figs">
    ${fig(dgrid(6, 3, { '0,1': head(P.red.fill, 'right'), '1,1': body(P.red.fill), '2,1': body(P.red.fill), '3,1': body(P.red.fill), '4,1': body(P.red.fill), '5,1': body(P.red.fill) }, { px: 30 }),
      'A red snake at length 6 — about to crash.')}
    ${fig(dgrid(6, 3, { '1,1': bead(), '3,1': bead(), '5,1': bead() }, { px: 30 }),
      'Its <b>2 points</b> are already scored. It leaves <b>3 beads of snake food</b> — every other segment — and the rest go back in the box.')}
  </div>

  <h2 style="margin-top:6pt">Winning</h2>
  <p>The moment anybody reaches <b>30 points</b>, the game ends immediately. Everyone's score is already up to date,
  so simply compare totals — <b>highest wins</b>. <i>Ties:</i> the tied player with the longest snake takes it; still tied,
  share the victory.</p>

  <h2 style="margin-top:8pt">Special cards</h2>
  <p>Crossing a swirl lets you draw one Special. Each card says when you may play it. Cards that last a round are
  <b>discarded at the end of that round</b>; if the deck runs out, shuffle the discards into a new one. If two specials
  ever collide, resolve them in <b>player order, starting with whoever flipped the timer last</b>.</p>
  <div class="spgrid">
    ${SPECIALS.map((sp) => `<div class="sp">
      <span class="spico">${sp.icon}</span>
      <span><b>${sp.name}</b><span class="spwhen"> · ${sp.when}</span><br><span class="sptext">${sp.text}</span></span>
    </div>`).join('')}
  </div>

  ${foot(6, 'DYING, WINNING & SPECIALS')}
</div>

<div class="page">
  <h2>Quick reference</h2>
  <ol class="steps">
    <li><b>Program</b> 2–6 tiles face-down. Movement = 1 cell · Boost = 3 cells. Your own boost always comes back.</li>
    <li>The first player to lock starts the <b>10-second timer</b>; everyone else locks whatever they have when it ends.</li>
    <li><b>Resolve slot by slot:</b> boosts slide first, then all steppers move together. Tail clears → head slides → check crashes → eat.</li>
    <li><b>Food</b> +1 segment and +1 point (never runs out) · <b>swirl</b> draw a Special · <b>snake food</b> +2 segments and +2 points. Boxes 3, 6 and 10 give a boost tile. At <b>maximum length</b> every food is worth <b>2 points</b>.</li>
    <li><b>Crash</b> = death: your points are already yours; leave snake food on every other segment, refill your board, respawn on a corner.</li>
    <li><b>First to 30</b> ends it — highest total wins.</li>
  </ol>
  <div class="callout" style="margin-top:10pt"><b>Three habits of a good Gobbler:</b> program a safe pair of moves
  before you program a greedy one; watch which rivals still hold boost tiles; and never let a fat snake wander somewhere
  it can't turn around.</div>
  ${foot(7, 'QUICK REFERENCE')}
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
