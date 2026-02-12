# Tuider - Terminal UI Speed Reader

A speed reading TUI tool that displays text one word at a time using the RSVP (Rapid Serial Visual Presentation) technique. The optimal recognition point (ORP) of each word is highlighted in red to help focus your reading.

## Installation

```bash
npm install
npm run build
```

## Usage

### Read from a file:
```bash
node dist/index.js file.md
# or
./dist/index.js file.md
```

### Read from piped input:
```bash
cat file.md | node dist/index.js
echo "Some text to read" | node dist/index.js
```

## Controls

- **Space**: Pause/Resume playback
- **← / b**: Jump one word backward
- **→ / f**: Jump one word forward  
- **Shift+←**: Jump 10 words backward
- **Shift+→**: Jump 10 words forward
- **↑ / +**: Increase speed by 50 WPM
- **↓ / -**: Decrease speed by 50 WPM
- **r**: Restart from beginning
- **q / ESC**: Quit application

## Features

- **Markdown Support**: Automatically extracts plain text from markdown files
- **Adjustable Speed**: Default 250 WPM, adjustable from 50 to 1000 WPM
- **Smart Pausing**: Longer pauses after punctuation marks
- **Progress Tracking**: Shows current position and progress bar
- **Optimal Recognition Point**: Highlights the character at ~30% of word length in red

## Development

```bash
npm run dev    # Watch mode for TypeScript
npm run build  # Build the project
npm start      # Run the compiled application
```

## How It Works

The RSVP technique reduces eye movement and subvocalization by presenting words one at a time at a fixed position. The ORP (Optimal Recognition Point) is highlighted to help your eye focus on the most important part of each word, typically around 30% from the start of the word.

This allows reading speeds of 250-500+ words per minute compared to typical reading speeds of 200-250 WPM.