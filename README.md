# tuider

A terminal speed reader using **RSVP** (Rapid Serial Visual Presentation). Words flash one at a time at the center of the terminal. The **Optimal Recognition Point** (ORP) — the character your eye locks onto for fastest recognition — is highlighted in red, while the rest of the word is white.

## Usage

```sh
# Read a markdown file
tuider ./examples/sonnet-18.md

# Pipe plain text
cat article.txt | tuider
echo "The quick brown fox jumps" | tuider
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `space` | Pause / Resume |
| `↑` or `+` | Increase speed (+25 WPM) |
| `↓` or `-` | Decrease speed (−25 WPM) |
| `←` or `b` | Jump back 1 word |
| `→` or `f` | Jump forward 1 word |
| `shift+←` | Jump back 10 words |
| `shift+→` | Jump forward 10 words |
| `r` | Restart from beginning |
| `q` or `esc` | Quit |

## Display

- **Red character** — the Optimal Recognition Point (~30% into the word)
- **Progress bar** — shows position through the text + word count
- **WPM counter** — current reading speed

Default speed: **250 WPM**. Range: 60–1000 WPM.

## Installation

```sh
npm install
npm run build
npm link   # makes `tuider` available globally
```

Or run directly:

```sh
node dist/index.js examples/sonnet-18.md
```

## How RSVP works

By displaying one word at a time with the ORP pinned to a fixed screen position, your eye makes zero horizontal movements. This eliminates the saccadic motion that consumes most of your reading time, enabling speeds that feel effortless at 300–500 WPM.
