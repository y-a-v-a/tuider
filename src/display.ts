// ANSI escape code constants
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR_SCREEN = '\x1b[2J\x1b[H';
const RESET = '\x1b[0m';
// DEC synchronized output (mode 2026): tells the terminal to hold all rendering
// until the end marker, so every frame is painted atomically in one pass.
// Terminals that don't support it silently ignore these sequences.
const SYNC_START = '\x1b[?2026h';
const SYNC_END   = '\x1b[?2026l';
const BRIGHT_WHITE = '\x1b[97m';
const DIM = '\x1b[90m';           // dark gray for secondary info
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

// Maps common color names to their bold ANSI SGR sequences.
// Bold is always applied to make the ORP character stand out clearly.
const ORP_COLOR_MAP: Record<string, string> = {
  red:     '\x1b[1;31m',
  green:   '\x1b[1;32m',
  yellow:  '\x1b[1;33m',
  blue:    '\x1b[1;34m',
  magenta: '\x1b[1;35m',
  purple:  '\x1b[1;35m',  // alias for magenta
  cyan:    '\x1b[1;36m',
  white:   '\x1b[1;37m',
  orange:  '\x1b[1;93m',  // bright yellow — closest standard ANSI approximation
};

export const VALID_ORP_COLORS = Object.keys(ORP_COLOR_MAP);

function orpStyle(colorName: string): string {
  return ORP_COLOR_MAP[colorName] ?? ORP_COLOR_MAP['red'];
}

function moveTo(row: number, col: number): string {
  return `\x1b[${row};${col}H`;
}

function clearLine(row: number): string {
  return `${moveTo(row, 1)}\x1b[2K`;
}

// Unicode block fill for the progress bar
function progressBar(progress: number, width: number): string {
  const inner = width - 2;
  const filled = Math.round(Math.max(0, Math.min(1, progress)) * inner);
  return (
    '[' +
    '\u2588'.repeat(filled) +        // █  filled block
    '\u2591'.repeat(inner - filled) + // ░  light shade
    ']'
  );
}

// Renders the word with its ORP character at the horizontal screen center.
// Characters before/after ORP are white; ORP itself is bold in the chosen color.
// The ORP character is pinned to the horizontal center so the eye never moves.
function renderWordLine(
  word: string,
  orpIndex: number,
  row: number,
  centerCol: number,  // 0-indexed screen center column
  colorName: string
): string {
  const wordStartCol = centerCol - orpIndex; // 0-indexed
  const ansiStartCol = Math.max(1, wordStartCol + 1); // clamp to screen edge, 1-indexed

  const before = word.slice(0, orpIndex);
  const orp = word[orpIndex] ?? '';
  const after = word.slice(orpIndex + 1);

  return (
    moveTo(row, ansiStartCol) +
    BRIGHT_WHITE + before +
    orpStyle(colorName) + orp + RESET +
    BRIGHT_WHITE + after + RESET
  );
}

export interface DisplayState {
  word: string;
  orpIndex: number;
  currentIndex: number;
  totalWords: number;
  wpm: number;
  paused: boolean;
  done: boolean;
  orpColor: string;
}

export function initScreen(): void {
  process.stdout.write(CLEAR_SCREEN + HIDE_CURSOR);
}

export function restoreScreen(): void {
  process.stdout.write(CLEAR_SCREEN + SHOW_CURSOR + RESET);
}

// Builds the frame output string without writing it.
// Kept separate so callers can prepend content (e.g. a screen clear on resize)
// inside the same synchronized block.
function buildFrame(state: DisplayState): string {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2); // 0-indexed

  let out = '';

  // --- Progress + WPM line (2 rows above center) ---
  const progressRow = centerRow - 2;
  const barWidth = Math.max(20, Math.floor(cols * 0.4));
  const progress =
    state.totalWords > 0 ? state.currentIndex / state.totalWords : 0;
  const bar = progressBar(progress, barWidth);
  const countStr = `${state.currentIndex + 1}/${state.totalWords}`;
  const wpmStr = `${state.wpm} WPM`;
  const infoVisible = bar.length + 1 + countStr.length + 3 + wpmStr.length;
  const infoStartCol = Math.max(1, Math.floor((cols - infoVisible) / 2) + 1);

  out += clearLine(progressRow);
  out +=
    moveTo(progressRow, infoStartCol) +
    DIM + bar + RESET +
    ' ' +
    DIM + countStr + RESET +
    ' | ' +
    GREEN + wpmStr + RESET;

  // --- Word line (center row) ---
  out += clearLine(centerRow);
  if (!state.done) {
    out += renderWordLine(state.word, state.orpIndex, centerRow, centerCol, state.orpColor);
  }

  // --- Status line (2 rows below center) ---
  const statusRow = centerRow + 2;
  out += clearLine(statusRow);
  if (state.done) {
    const msg = '── End of text ──';
    const col = Math.max(1, Math.floor((cols - msg.length) / 2) + 1);
    out += moveTo(statusRow, col) + DIM + msg + RESET;
  } else if (state.paused) {
    const msg = '⏸  PAUSED';
    const col = Math.max(1, Math.floor((cols - msg.length) / 2) + 1);
    out += moveTo(statusRow, col) + CYAN + msg + RESET;
  }

  // --- Control hints (bottom row) ---
  const hints =
    DIM +
    '[space] pause  [b/←] back  [f/→] fwd  ' +
    '[↑/+] faster  [↓/-] slower  [r] restart  [q] quit' +
    RESET;
  const hintsVisible =
    '[space] pause  [b/←] back  [f/→] fwd  [↑/+] faster  [↓/-] slower  [r] restart  [q] quit'
      .length;
  const hintsCol = Math.max(1, Math.floor((cols - hintsVisible) / 2) + 1);
  out += clearLine(rows);
  out += moveTo(rows, hintsCol) + hints;

  return out;
}

// Paints one frame atomically using synchronized output mode so the terminal
// never shows partial state (e.g. white text before the ORP color is applied).
export function render(state: DisplayState): void {
  process.stdout.write(SYNC_START + buildFrame(state) + SYNC_END);
}

// Clears and re-renders after a terminal resize, all inside one sync block.
export function handleResize(state: DisplayState): void {
  process.stdout.write(SYNC_START + CLEAR_SCREEN + buildFrame(state) + SYNC_END);
}
