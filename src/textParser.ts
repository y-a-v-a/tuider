import { marked } from 'marked';

export class TextParser {
  private text: string;
  private words: string[] = [];

  constructor(text: string) {
    this.text = text;
  }

  parse(): string[] {
    const plainText = this.extractPlainText(this.text);
    this.words = this.tokenize(plainText);
    return this.words;
  }

  private extractPlainText(text: string): string {
    const renderer = new marked.Renderer();
    
    renderer.heading = ({ text }: any) => text + ' ';
    renderer.paragraph = ({ text }: any) => text + ' ';
    renderer.list = ({ items }: any) => items.map((item: any) => item.text).join(' ');
    renderer.listitem = ({ text }: any) => text + ' ';
    renderer.strong = ({ text }: any) => text;
    renderer.em = ({ text }: any) => text;
    renderer.codespan = ({ text }: any) => text;
    renderer.blockquote = ({ text }: any) => text + ' ';
    renderer.code = ({ text }: any) => text + ' ';
    renderer.link = ({ href, title, text }: any) => text;
    renderer.image = () => '';
    renderer.html = () => '';
    renderer.br = () => ' ';
    renderer.hr = () => ' ';

    marked.setOptions({
      renderer: renderer,
      breaks: true,
      gfm: true
    });

    const plainText = marked.parse(text) as string;
    
    return plainText
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(text: string): string[] {
    const words = text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.trim());
    
    return words;
  }

  getWords(): string[] {
    return this.words;
  }

  getWordCount(): number {
    return this.words.length;
  }
}