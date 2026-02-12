import * as blessed from 'blessed';
import { TextParser } from './textParser';

interface WordDisplay {
  word: string;
  orpIndex: number;
}

export class SpeedReader {
  private screen: blessed.Widgets.Screen;
  private wordBox: blessed.Widgets.BoxElement;
  private progressBox: blessed.Widgets.BoxElement;
  private controlsBox: blessed.Widgets.BoxElement;
  private speedBox: blessed.Widgets.BoxElement;
  
  private words: string[] = [];
  private currentIndex: number = 0;
  private wpm: number = 250;
  private isPaused: boolean = true;
  private timer: NodeJS.Timeout | null = null;

  constructor(content: string) {
    const parser = new TextParser(content);
    this.words = parser.parse();
    
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Tuider - Speed Reader'
    });

    this.wordBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: 3,
      align: 'center',
      valign: 'middle',
      tags: true,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });

    this.progressBox = blessed.box({
      parent: this.screen,
      bottom: 3,
      left: 0,
      width: '100%',
      height: 1,
      tags: true,
      style: {
        fg: 'cyan'
      }
    });

    this.speedBox = blessed.box({
      parent: this.screen,
      bottom: 2,
      left: 0,
      width: '100%',
      height: 1,
      tags: true,
      style: {
        fg: 'yellow'
      }
    });

    this.controlsBox = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      tags: true,
      style: {
        fg: 'gray'
      }
    });

    this.setupControls();
    this.updateUI();
  }

  private calculateORP(word: string): number {
    if (word.length <= 2) return 0;
    return Math.floor(word.length * 0.3);
  }

  private formatWord(word: string): string {
    const orpIndex = this.calculateORP(word);
    const before = word.substring(0, orpIndex);
    const orp = word[orpIndex];
    const after = word.substring(orpIndex + 1);
    
    return `{white-fg}${before}{/white-fg}{red-fg}${orp}{/red-fg}{white-fg}${after}{/white-fg}`;
  }

  private displayWord() {
    if (this.currentIndex >= this.words.length) {
      this.pause();
      this.currentIndex = this.words.length - 1;
      return;
    }

    const word = this.words[this.currentIndex];
    const formattedWord = this.formatWord(word);
    
    const orpIndex = this.calculateORP(word);
    const padding = Math.max(0, Math.floor((this.wordBox.width as number - word.length) / 2) - orpIndex);
    const paddedWord = ' '.repeat(padding) + formattedWord;
    
    this.wordBox.setContent(paddedWord);
    this.updateUI();
    this.screen.render();
  }

  private updateUI() {
    const progress = `Progress: ${this.currentIndex + 1}/${this.words.length} words`;
    const percentage = Math.round(((this.currentIndex + 1) / this.words.length) * 100);
    const progressBar = this.createProgressBar(percentage);
    this.progressBox.setContent(`${progress} ${progressBar}`);
    
    this.speedBox.setContent(`Speed: ${this.wpm} WPM | ${this.isPaused ? 'PAUSED' : 'PLAYING'}`);
    
    this.controlsBox.setContent(
      '{gray-fg}Controls: {/gray-fg}' +
      '{white-fg}Space{/white-fg}{gray-fg}=pause {/gray-fg}' +
      '{white-fg}←/→{/white-fg}{gray-fg}=navigate {/gray-fg}' +
      '{white-fg}↑/↓{/white-fg}{gray-fg}=speed {/gray-fg}' +
      '{white-fg}r{/white-fg}{gray-fg}=restart {/gray-fg}' +
      '{white-fg}q/ESC{/white-fg}{gray-fg}=quit{/gray-fg}'
    );
  }

  private createProgressBar(percentage: number): string {
    const width = 30;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[{cyan-fg}${'█'.repeat(filled)}{/cyan-fg}{gray-fg}${'░'.repeat(empty)}{/gray-fg}] ${percentage}%`;
  }

  private calculateDelay(word: string): number {
    let baseDelay = 60000 / this.wpm;
    
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      baseDelay *= 2;
    } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
      baseDelay *= 1.5;
    }
    
    if (word.length > 10) {
      baseDelay *= 1.2;
    }
    
    return baseDelay;
  }

  private play() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.updateUI();
    
    const advance = () => {
      if (this.isPaused || this.currentIndex >= this.words.length) {
        return;
      }
      
      this.displayWord();
      const delay = this.calculateDelay(this.words[this.currentIndex]);
      this.currentIndex++;
      
      this.timer = setTimeout(advance, delay);
    };
    
    advance();
  }

  private pause() {
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateUI();
    this.screen.render();
  }

  private togglePause() {
    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
    }
  }

  private jumpBackward(amount: number = 1) {
    this.currentIndex = Math.max(0, this.currentIndex - amount);
    this.displayWord();
  }

  private jumpForward(amount: number = 1) {
    this.currentIndex = Math.min(this.words.length - 1, this.currentIndex + amount);
    this.displayWord();
  }

  private increaseSpeed() {
    this.wpm = Math.min(1000, this.wpm + 50);
    this.updateUI();
    this.screen.render();
  }

  private decreaseSpeed() {
    this.wpm = Math.max(50, this.wpm - 50);
    this.updateUI();
    this.screen.render();
  }

  private restart() {
    this.pause();
    this.currentIndex = 0;
    this.displayWord();
  }

  private setupControls() {
    this.screen.key(['space'], () => this.togglePause());
    this.screen.key(['left', 'b'], () => this.jumpBackward());
    this.screen.key(['right', 'f'], () => this.jumpForward());
    this.screen.key(['S-left'], () => this.jumpBackward(10));
    this.screen.key(['S-right'], () => this.jumpForward(10));
    this.screen.key(['up', '+'], () => this.increaseSpeed());
    this.screen.key(['down', '-'], () => this.decreaseSpeed());
    this.screen.key(['r'], () => this.restart());
    this.screen.key(['q', 'escape', 'C-c'], () => {
      this.pause();
      process.exit(0);
    });
  }

  start() {
    this.displayWord();
    this.screen.render();
    
    setTimeout(() => {
      this.play();
    }, 1000);
  }
}