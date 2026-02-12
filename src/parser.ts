import * as fs from 'fs';
import * as path from 'path';
import { marked, Renderer } from 'marked';

/**
 * Strips all markdown syntax, returning only the readable plain text.
 * Uses a custom marked Renderer so we get clean text without an
 * HTML-intermediate step and the entity-decoding issues that come with it.
 */
function stripMarkdown(input: string): string {
  // Remove YAML front matter
  const withoutFrontMatter = input.replace(/^---[\s\S]*?---\s*\n/m, '');

  const renderer = new Renderer();
  renderer.heading = (text: string) => text + ' ';
  renderer.paragraph = (text: string) => text + ' ';
  renderer.strong = (text: string) => text;
  renderer.em = (text: string) => text;
  renderer.codespan = (text: string) => text;
  renderer.code = (text: string) => text + ' ';
  renderer.link = (_href: string, _title: string | null | undefined, text: string) => text;
  renderer.image = () => '';
  renderer.list = (body: string) => body;
  renderer.listitem = (text: string) => text + ' ';
  renderer.blockquote = (quote: string) => quote;
  renderer.html = () => '';
  renderer.hr = () => ' ';
  renderer.br = () => ' ';

  marked.use({ renderer });

  // marked's lexer still HTML-encodes special characters in token text,
  // so we need to decode entities even though we bypassed full HTML output.
  return (marked.parse(withoutFrontMatter) as string)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isMarkdown(filePath: string): boolean {
  return ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
}

/**
 * Splits plain text into an array of non-empty words.
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return isMarkdown(filePath) ? stripMarkdown(content) : content;
}

/**
 * Reads text from a file argument or from piped stdin.
 * Throws if neither is available.
 */
export async function readInput(args: string[], stdinIsTTY: boolean): Promise<string> {
  if (args.length > 0) {
    return readFile(args[0]);
  }
  if (!stdinIsTTY) {
    return readStdin();
  }
  throw new Error(
    'No input provided.\nUsage: tuider <file.md>  or  cat file.txt | tuider'
  );
}