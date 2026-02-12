#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import { SpeedReader } from './speedReader';

async function main() {
  program
    .name('tuider')
    .description('Terminal UI Speed Reader - Display text one word at a time using RSVP technique')
    .version('1.0.0')
    .argument('[file]', 'markdown file to read')
    .parse(process.argv);

  const filePath = program.args[0];
  let content: string;

  if (filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    content = fs.readFileSync(filePath, 'utf-8');
  } else {
    if (process.stdin.isTTY) {
      console.error('Error: No input provided. Pipe content or provide a file path.');
      console.error('Usage: cat file.md | tuider');
      console.error('       tuider file.md');
      process.exit(1);
    }
    
    content = await readStdin();
  }

  if (!content.trim()) {
    console.error('Error: Empty input');
    process.exit(1);
  }

  const reader = new SpeedReader(content);
  reader.start();
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});