#!/usr/bin/env node
import { Command } from 'commander';
import { readInput, tokenize } from './parser';
import { startReader, VALID_ORP_COLORS } from './reader';

const program = new Command();

program
  .name('tuider')
  .description('Terminal speed reader — displays text one word at a time using RSVP')
  .version('1.0.0')
  .argument('[file]', 'markdown or text file to read (omit to read from stdin)')
  .option(
    '-c, --orp-color <color>',
    `color of the highlighted recognition point (${VALID_ORP_COLORS.join(', ')})`,
    'red'
  )
  .parse(process.argv);

async function main(): Promise<void> {
  const opts = program.opts<{ orpColor: string }>();
  const orpColor = opts.orpColor.toLowerCase();

  if (!VALID_ORP_COLORS.includes(orpColor)) {
    process.stderr.write(
      `Unknown color "${orpColor}". Valid choices: ${VALID_ORP_COLORS.join(', ')}\n`
    );
    process.exit(1);
  }

  const args = program.args;
  const stdinIsTTY = Boolean(process.stdin.isTTY);

  let text: string;
  try {
    text = await readInput(args, stdinIsTTY);
  } catch (err) {
    process.stderr.write((err as Error).message + '\n');
    process.exit(1);
  }

  const words = tokenize(text);

  if (words.length === 0) {
    process.stderr.write('No words found in input.\n');
    process.exit(1);
  }

  await startReader(words, stdinIsTTY, orpColor);
}

main();
