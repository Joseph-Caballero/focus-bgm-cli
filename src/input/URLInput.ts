import * as blessed from 'blessed';
import { isValidYouTubeURL } from '../utils/youtube';

export class URLInput {
  private box: blessed.Widgets.TextareaElement;
  private visible: boolean = false;
  private onConfirm: ((url: string) => void) | null = null;
  private onCancel: (() => void) | null = null;

  constructor(screen: blessed.Widgets.Screen) {
    this.box = blessed.textarea({
      parent: screen,
      top: 'center',
      left: 'center',
      width: 100,
      height: 5 as any,
      border: { type: 'line' as any, fg: 'yellow' } as any,
      label: ' {bold}Paste YouTube URL{/bold} ',
      tags: true,
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'yellow' },
        focus: { bg: 'gray' },
      },
      inputOnFocus: true,
      mouse: true,
      keys: true,
      vi: true,
      hidden: true,
      scrollable: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.box.key('enter', async () => {
      const url = this.getValue().trim();
      if (url && this.onConfirm) {
        this.hide();
        this.onConfirm(url);
      }
    });

    this.box.key('escape', () => {
      this.hide();
      if (this.onCancel) {
        this.onCancel();
      }
    });

    this.box.key(['C-c'], () => {
      this.hide();
      if (this.onCancel) {
        this.onCancel();
      }
    });
  }

  show(onConfirm: (url: string) => void, onCancel: () => void): void {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.visible = true;
    this.box.show();
    this.box.setValue('');
    this.box.focus();
    const program = this.box.screen.program as any;
    if (program?._originalShowCursor) {
      program._originalShowCursor();
    } else {
      this.box.screen.program.showCursor();
    }
    this.box.screen.render();
  }

  hide(): void {
    this.visible = false;
    this.box.hide();
    this.box.clearValue();
    this.box.screen.program.hideCursor();
  }

  getValue(): string {
    return this.box.getValue();
  }

  isVisible(): boolean {
    return this.visible;
  }

  focus(): void {
    this.box.focus();
  }

  blur(): void {
    this.box.screen.focusNext();
  }

  validate(): boolean {
    const url = this.getValue().trim();
    return isValidYouTubeURL(url);
  }
}
