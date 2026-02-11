# Tuider - Terminal UI Speed Reader

## Concept
A speed reading TUI tool that displays text one word at a time using RSVP (Rapid Serial Visual Presentation) technique. One character in each word is highlighted in red (the ORP - Optimal Recognition Point) while others are in white on a black background. This reduces distraction and enables much faster reading speeds.

## Core Requirements
- Display words one at a time in the exact center of the terminal
- Support both piped input and file arguments
- Extract text content from markdown files (strip metadata)
- Interactive controls for speed adjustment, pause/resume, and navigation
- Written in JavaScript/TypeScript using a TUI library

## Example Usage
```sh
cat shakespeare-sonnet-1.md | tuider
tuider ./shakespeare-sonnet-12.md
```

## Implementation Plan

### Setup & Infrastructure
- [ ] Initialize Node.js/TypeScript project
- [ ] Choose and install TUI library (blessed, ink, or terminal-kit)
- [ ] Set up build tooling (TypeScript, bundler if needed)
- [ ] Create main entry point with CLI argument parsing

### Core Reading Engine
- [ ] Implement text parser
  - [ ] Handle piped input from stdin
  - [ ] Handle file path arguments
  - [ ] Extract plain text from markdown (use marked or remark)
  - [ ] Tokenize text into words array
- [ ] Calculate ORP (Optimal Recognition Point)
  - [ ] Typically at ~30-33% of word length
  - [ ] Handle edge cases (1-2 letter words)
- [ ] Create word display renderer
  - [ ] Center word horizontally and vertically in terminal
  - [ ] Highlight ORP character in red
  - [ ] Display rest of word in white
  - [ ] Black background

### Timing & Flow Control
- [ ] Implement WPM (Words Per Minute) timer
  - [ ] Default speed: 250 WPM
  - [ ] Calculate delay between words based on WPM
  - [ ] Account for punctuation pauses (longer pause after . ! ?)
- [ ] Add speed controls
  - [ ] Increase speed (+ key or up arrow)
  - [ ] Decrease speed (- key or down arrow)
  - [ ] Display current WPM

### Navigation & Controls
- [ ] Pause/Resume (spacebar)
- [ ] Jump backward (left arrow or 'b')
  - [ ] Single word back
  - [ ] Multiple words back (shift+left)
- [ ] Jump forward (right arrow or 'f')
  - [ ] Single word forward
  - [ ] Multiple words forward (shift+right)
- [ ] Restart from beginning ('r' key)
- [ ] Quit application ('q' key or ESC)

### UI Elements
- [ ] Progress indicator
  - [ ] Current word position / total words
  - [ ] Progress bar
- [ ] Speed indicator (current WPM)
- [ ] Control hints at bottom of screen
- [ ] Handle terminal resize events gracefully

### Polish & Edge Cases
- [ ] Handle Unicode/emoji properly for centering
- [ ] Smooth timing at high speeds (500+ WPM)
- [ ] Long word handling (hyphenation or special display)
- [ ] Empty input handling
- [ ] Error messages for invalid files

### Testing & Documentation
- [ ] Add example text files for testing
- [ ] Create README with usage instructions
- [ ] Add keyboard shortcuts reference
- [ ] Performance testing at various speeds

## Technical Decisions

### Recommended Stack
- **Language**: TypeScript for type safety
- **TUI Library**: `blessed` (mature, full-featured) or `ink` (React-based, modern)
- **Markdown Parser**: `marked` (simple) or `remark` (powerful)
- **CLI Parser**: `commander` or native Node.js process.argv

### Key Algorithms
1. **ORP Calculation**: `Math.floor(word.length * 0.3)` with minimum of 0
2. **WPM to delay**: `60000 / wpm` milliseconds per word
3. **Center alignment**: Calculate based on `process.stdout.columns` and `process.stdout.rows`

