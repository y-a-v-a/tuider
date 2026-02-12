import * as tty from 'tty';
import * as fs from 'fs';
import * as readline from 'readline';
import { calculateOrp } from './orp';
import { render, initScreen, restoreScreen, handleResize, DisplayState } from './display';

const DEFAULT_WPM = 250;
const MIN_WPM = 60;
const MAX_WPM = 1000;
const WPM_STEP = 25;
// Words skipped per "jump multiple" action (shift+arrow)
const JUMP_MULTIPLE = 10;

interface ReaderState {
  words: string[];
  index: number;
  wpm: number;
  paused: boolean;
  done: boolean;
  timer: NodeJS.Timeout | null;
}

// Converts words-per-minute into milliseconds-per-word.
// Applies progressive delays so the brain has time to process natural language breaks:
//   - sentence end (.!?)    → 2× base delay
//   - clause pause (,;:)    → 1.5× base delay
//   - long word (>10 chars) → additional 1.2× multiplier on top of the above
function wordDelay(word: string, wpm: number): number {
  const base = 60000 / wpm;
  // Strip trailing closing punctuation like )"'] before checking sentence end
  const stripped = word.replace(/['")\]]+$/, '');

  let delay = base;
  if (/[.!?]$/.test(stripped)) {
    delay *= 2;
  } else if (/[,;:]$/.test(stripped)) {
    delay *= 1.5;
  }

  if (word.length > 10) {
    delay *= 1.2;
  }

  return delay;
}

function buildDisplayState(state: ReaderState): DisplayState {
  const { words, index, wpm, paused, done } = state;
  const word = done ? '' : words[index];
  const orpIndex = done ? 0 : calculateOrp(word);
  return {
    word,
    orpIndex,
    currentIndex: Math.min(index, words.length - 1),
    totalWords: words.length,
    wpm,
    paused,
    done,
  };
}

function showCurrentWord(state: ReaderState): void {
  render(buildDisplayState(state));
}

function scheduleNext(state: ReaderState): void {
  if (state.paused || state.done) return;

  const delay = wordDelay(state.words[state.index], state.wpm);
  state.timer = setTimeout(() => {
    state.index++;
    if (state.index >= state.words.length) {
      state.done = true;
      state.timer = null;
      showCurrentWord(state);
      return;
    }
    showCurrentWord(state);
    scheduleNext(state);
  }, delay);
}

function cancelTimer(state: ReaderState): void {
  if (state.timer !== null) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

function pause(state: ReaderState): void {
  if (state.done) return;
  cancelTimer(state);
  state.paused = true;
  showCurrentWord(state);
}

function resume(state: ReaderState): void {
  if (state.done) return;
  state.paused = false;
  showCurrentWord(state);
  scheduleNext(state);
}

function togglePause(state: ReaderState): void {
  if (state.paused) {
    resume(state);
  } else {
    pause(state);
  }
}

function jumpTo(state: ReaderState, newIndex: number): void {
  cancelTimer(state);
  state.index = Math.max(0, Math.min(newIndex, state.words.length - 1));
  state.done = false;
  showCurrentWord(state);
  if (!state.paused) {
    scheduleNext(state);
  }
}

function adjustSpeed(state: ReaderState, delta: number): void {
  state.wpm = Math.max(MIN_WPM, Math.min(MAX_WPM, state.wpm + delta));
  showCurrentWord(state);
}

function restart(state: ReaderState): void {
  jumpTo(state, 0);
}

// Opens /dev/tty for keyboard input when stdin is occupied by piped data.
function openTTY(): tty.ReadStream {
  const fd = fs.openSync('/dev/tty', 'r+');
  return new tty.ReadStream(fd);
}

/**
 * Starts the RSVP reader. Initialises the terminal, sets up keyboard handling,
 * and begins advancing words according to the current WPM setting.
 *
 * Resolves when the user quits.
 */
export function startReader(words: string[], stdinIsTTY: boolean): Promise<void> {
  return new Promise((resolve) => {
    const state: ReaderState = {
      words,
      index: 0,
      wpm: DEFAULT_WPM,
      paused: false,
      done: false,
      timer: null,
    };

    initScreen();

    // Restore terminal state on any exit path
    function cleanup(): void {
      cancelTimer(state);
      restoreScreen();
      if (!stdinIsTTY) {
        // keyboard stream is not stdin; it will be destroyed below
      } else {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }
    }

    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });

    process.on('exit', () => {
      restoreScreen();
    });

    // Redraw when terminal is resized
    process.stdout.on('resize', () => {
      handleResize(buildDisplayState(state));
    });

    // Set up keyboard stream: stdin if it's a TTY, /dev/tty if stdin was piped
    const keyStream = stdinIsTTY ? (process.stdin as tty.ReadStream) : openTTY();
    keyStream.setRawMode(true);
    readline.emitKeypressEvents(keyStream);
    keyStream.resume();

    keyStream.on('keypress', (_str: string, key: readline.Key) => {
      if (!key) return;

      const name = key.name;
      const shift = key.shift;

      // Quit
      if (name === 'q' || name === 'escape') {
        cleanup();
        if (!stdinIsTTY) keyStream.destroy();
        resolve();
        return;
      }

      // Pause / resume
      if (name === 'space') {
        togglePause(state);
        return;
      }

      // Speed: faster
      if (name === 'up' || _str === '+') {
        adjustSpeed(state, WPM_STEP);
        return;
      }

      // Speed: slower
      if (name === 'down' || _str === '-') {
        adjustSpeed(state, -WPM_STEP);
        return;
      }

      // Navigate backward
      if (name === 'left' || name === 'b') {
        const amount = shift ? JUMP_MULTIPLE : 1;
        jumpTo(state, state.index - amount);
        return;
      }

      // Navigate forward
      if (name === 'right' || name === 'f') {
        const amount = shift ? JUMP_MULTIPLE : 1;
        jumpTo(state, state.index + amount);
        return;
      }

      // Restart
      if (name === 'r') {
        restart(state);
        return;
      }
    });

    // Show the first word immediately so the reader can orient,
    // then auto-play after a brief delay.
    showCurrentWord(state);
    setTimeout(() => {
      if (!state.paused && !state.done) {
        scheduleNext(state);
      }
    }, 1000);
  });
}
