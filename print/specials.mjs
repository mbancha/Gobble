// The nine Special cards — shared by the card sheets and the rulebook so the
// two can never drift apart.
export const SPECIALS = [
  { name: 'Flip Flop',       when: 'Between rounds',   text: 'Swap your head and tail — your snake now runs the other way.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round">
      <path d="M20 36 H70 A14 14 0 0 1 70 64 H30"/></g>
      <path d="M34 20 L18 36 L34 52 Z" fill="#7c3aed"/><path d="M66 48 L82 64 L66 80 Z" fill="#7c3aed"/></svg>` },
  { name: 'Whoopsie',        when: 'Before resolving', text: 'Rotate one of your single movement tiles before it resolves.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><path d="M50 24 A26 26 0 1 1 24 50" fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round"/>
      <path d="M50 8 L66 24 L50 40 Z" fill="#7c3aed"/><circle cx="50" cy="50" r="7" fill="#7c3aed"/></svg>` },
  { name: 'Vroom Vroom',     when: 'While programming', text: 'All of your boost tiles move +1 extra space this round.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round">
      <path d="M14 34 H62"/><path d="M14 54 H48"/><path d="M14 74 H62"/></g>
      <path d="M60 20 L94 54 L60 88 Z" fill="#7c3aed"/></svg>` },
  { name: 'Nom Nom',         when: 'While programming', text: 'Every snake food bead you eat this round grows you +1 extra.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><circle cx="50" cy="56" r="30" fill="#eab308"/>
      <path d="M50 56 L92 34 A46 46 0 0 0 92 78 Z" fill="#fff"/>
      <circle cx="38" cy="46" r="7" fill="#fef9c3"/></svg>` },
  { name: 'Bounce',          when: 'While programming', text: 'If you would crash this round, put your head on your tail instead and keep going.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><rect x="76" y="10" width="14" height="80" fill="#9ca3af"/>
      <path d="M10 24 L70 50 L10 76" fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { name: 'Star Power',      when: 'While programming', text: "Colliding with another snake's head doesn't kill you this round — unless they also played Star Power.",
    icon: `<svg viewBox="0 0 100 100" class="ico"><path d="M50 8 L62 38 L94 40 L69 60 L78 92 L50 74 L22 92 L31 60 L6 40 L38 38 Z" fill="#f59e0b" stroke="#b45309" stroke-width="4" stroke-linejoin="round"/></svg>` },
  { name: 'Rev Up',          when: 'Any time',          text: 'Take 4 boost tiles from the stack.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18,34 50,10 82,34"/><polyline points="18,54 50,30 82,54"/><polyline points="18,74 50,50 82,74"/><polyline points="18,94 50,70 82,94"/></g></svg>` },
  { name: 'Careful Slither', when: 'While programming', text: 'When a boost tile resolves this round you may move only 2 spaces instead of 3.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><g fill="none" stroke="#7c3aed" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18,44 50,20 82,44"/><polyline points="18,72 50,48 82,72"/></g>
      <text x="50" y="96" font-size="26" font-weight="900" text-anchor="middle" fill="#7c3aed" font-family="Helvetica,Arial">2</text></svg>` },
  { name: 'Victory Lap',     when: 'While programming', text: 'At the end of this round, score points equal to your length — or nothing if you are dead.',
    icon: `<svg viewBox="0 0 100 100" class="ico"><path d="M30 14 H36 V90 H30 Z" fill="#7c3aed"/>
      <path d="M38 16 H86 V50 H38 Z" fill="#f59e0b" stroke="#b45309" stroke-width="3"/>
      <path d="M38 16 H62 V33 H38 Z M62 33 H86 V50 H62 Z" fill="#7c3aed"/></svg>` },
];

