import * as blessed from 'blessed';
import { ChannelManager } from '../audio/ChannelManager';
import { ChannelPanel } from './ChannelPanel';
import { URLInput } from '../input/URLInput';
import { KeyHandler, KeyHandlerCallbacks } from '../input/KeyHandler';
import { CONSTANTS, HELP_TEXT } from '../utils/constants';
import { isValidYouTubeURL } from '../utils/youtube';

export class App {
  private screen: blessed.Widgets.Screen;
  private channelManager: ChannelManager;
  private panels: [ChannelPanel, ChannelPanel];
  private panelContainer!: blessed.Widgets.BoxElement;
  private urlInput: URLInput;
  private keyHandler!: KeyHandler;
  private statusBarTop!: blessed.Widgets.BoxElement;
  private statusBarBottom!: blessed.Widgets.BoxElement;
  private running: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private scrubTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Focus BGM Player',
      autoPadding: true,
      terminal: 'xterm-256color',
      cursor: {
        artificial: true,
        blink: false,
        shape: 'block',
        color: 'default',
      },
    });
    (this.screen as any).cursor.shape = { ch: ' ' };
    const program = this.screen.program as any;
    if (program && typeof program.showCursor === 'function') {
      program._originalShowCursor = program.showCursor.bind(program);
      program.showCursor = () => {};
    }
    this.screen.program.hideCursor();

    this.channelManager = new ChannelManager();
    this.panelContainer = blessed.box({
      parent: this.screen,
      top: 1,
      left: 0,
      right: 0,
      bottom: 1,
    });
    this.panels = [
      new ChannelPanel(0, this.panelContainer),
      new ChannelPanel(1, this.panelContainer),
    ];

    this.urlInput = new URLInput(this.screen);
    
    this.setupStatusBar();
    this.setupKeyHandler();
    
    this.screen.render();
  }

  private setupStatusBar(): void {
    this.statusBarTop = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      tags: true,
      style: {
        fg: 'white',
      },
      content: this.getTopHelpText(),
    });
    this.statusBarBottom = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      tags: true,
      style: {
        fg: 'white',
      },
      content: this.getBottomHelpText(),
    });
  }

  private getTopHelpText(): string {
    return ` {bold}Cmd+V{/bold}:Paste Link  {bold}p{/bold}:${HELP_TEXT.p}  {bold}r{/bold}:${HELP_TEXT.r}  {bold}d{/bold}:${HELP_TEXT.d}  {bold}Tab{/bold}:${HELP_TEXT.tab}  {bold}q{/bold}:${HELP_TEXT.q} `;
  }

  private getBottomHelpText(): string {
    return ` {bold}Alt+1-9{/bold}:History  {bold}Shift+1-9{/bold}:${HELP_TEXT.lib}  {bold}Alt+C{/bold}:${HELP_TEXT.clear}  {bold}Ctrl+X{/bold}:Delete `;
  }

  private setupKeyHandler(): void {
    const callbacks: KeyHandlerCallbacks = {
      onChannelSelect: (index) => this.selectChannel(index),
      onToggleChannel: () => this.toggleChannel(),
      onTogglePause: () => this.togglePause(),
      onVolumeUp: () => this.adjustVolume(CONSTANTS.VOLUME_STEP),
      onVolumeDown: () => this.adjustVolume(-CONSTANTS.VOLUME_STEP),
      onQuit: () => this.quit(),
      onEnterURL: () => this.enterURLMode(),
      onPlayHistory: (index) => this.playHistory(index),
      onRestart: () => this.restartPlayback(),
      onDownload: () => this.downloadCurrent(),
      onToggleLoop: () => this.toggleLoop(),
      onPlayLibrary: (index) => this.playFromLibrary(index),
      onRemoveFromLibrary: (index) => this.removeFromLibrary(index),
      onClearHistory: () => this.clearHistory(),
    };

    this.keyHandler = new KeyHandler(this.screen, callbacks);
  }

  async initialize(): Promise<void> {
    try {
      await this.channelManager.initialize();
      this.running = true;
      this.startUpdateLoop();
      this.updateUI();
    } catch (error) {
      console.error('Failed to initialize:', error);
      process.exit(1);
    }
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      if (this.running) {
        this.updateUI();
      }
    }, 1000);
  }

  private updateUI(): void {
    const activeChannelIndex = this.channelManager.getActiveChannelIndex();
    const states = this.channelManager.getAllStates();

    this.panels[0].update(states[0], activeChannelIndex === 0);
    this.panels[1].update(states[1], activeChannelIndex === 1);

    this.screen.render();
    this.scrubHeaderArtifacts();
    if (this.scrubTimeout) {
      clearTimeout(this.scrubTimeout);
    }
    this.scrubTimeout = setTimeout(() => {
      this.screen.render();
      this.scrubHeaderArtifacts();
    }, 50);
    if (!this.urlInput.isVisible()) {
      this.screen.program.hideCursor();
    }
  }

  private scrubHeaderArtifacts(): void {
    const program = this.screen.program as any;
    const panels = [this.panels[0], this.panels[1]];
    panels.forEach((panel) => {
      const pos = panel.getHeaderScrubPosition();
      if (pos) {
        program.cup(pos.y, pos.x);
        program._write(' ');
      }
    });
  }

  private selectChannel(index: 0 | 1): void {
    this.channelManager.setActiveChannel(index);
    this.updateUI();
  }

  private toggleChannel(): void {
    this.channelManager.toggleActiveChannel();
    this.updateUI();
  }

  private async togglePause(): Promise<void> {
    if (this.urlInput.isVisible()) {
      return;
    }
    
    try {
      await this.channelManager.togglePause();
      this.updateUI();
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    }
  }

  private async adjustVolume(delta: number): Promise<void> {
    try {
      await this.channelManager.adjustVolume(delta);
      this.updateUI();
    } catch (error) {
      console.error('Failed to adjust volume:', error);
    }
  }

  private enterURLMode(): void {
    if (this.urlInput.isVisible()) {
      return;
    }

    this.keyHandler.disable();
    this.channelManager.lockState();

    const activeIndex = this.channelManager.getActiveChannelIndex();

    this.urlInput.show(
      async (url: string) => {
        if (isValidYouTubeURL(url)) {
          try {
            await this.channelManager.playOnChannel(activeIndex, url);
            this.updateUI();
          } catch (error) {
            this.panels[activeIndex].showError(
              `Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            this.updateUI();
          }
        } else {
          this.panels[activeIndex].showError('Invalid YouTube URL');
          this.updateUI();
        }
        this.keyHandler.enable();
        this.channelManager.unlockState();
      },
      () => {
        this.keyHandler.enable();
        this.channelManager.unlockState();
        this.updateUI();
      }
    );
  }

  private async playHistory(index: number): Promise<void> {
    const activeIndex = this.channelManager.getActiveChannelIndex();
    try {
      const url = this.channelManager.playFromHistory(activeIndex, index);
      if (url) {
        await this.channelManager.playOnChannel(activeIndex, url);
        this.updateUI();
      }
    } catch (error) {
      this.panels[activeIndex].showError(
        `Failed to play from history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.updateUI();
    }
  }

  private async quit(): Promise<void> {
    this.running = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    await this.channelManager.cleanup();
    this.screen.destroy();
    process.exit(0);
  }

  private async restartPlayback(): Promise<void> {
    try {
      await this.channelManager.restartPlayback();
      this.updateUI();
    } catch (error) {
      console.error('Failed to restart:', error);
    }
  }

  private async downloadCurrent(): Promise<void> {
    const activeIndex = this.channelManager.getActiveChannelIndex();
    const channel = this.channelManager.getChannel(activeIndex);
    const url = channel.getURL();
    const title = channel.getTitle();
    
    if (!url || !title) {
      this.panels[activeIndex].showError('No track playing');
      this.updateUI();
      return;
    }
    
    try {
      await this.channelManager.downloadCurrent(activeIndex);
      this.updateUI();
    } catch (error: any) {
      if (error.message === 'Already in library') {
        this.panels[activeIndex].showError('Track already in library - press Ctrl+X to remove');
      } else {
        this.panels[activeIndex].showError(
          `Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      this.updateUI();
    }
  }

  private async toggleLoop(): Promise<void> {
    try {
      await this.channelManager.toggleLoop();
      this.updateUI();
    } catch (error) {
      console.error('Failed to toggle loop:', error);
    }
  }

  private async playFromLibrary(index: number): Promise<void> {
    const activeIndex = this.channelManager.getActiveChannelIndex();
    try {
      await this.channelManager.playFromLibrary(activeIndex, index);
      this.updateUI();
    } catch (error) {
      this.panels[activeIndex].showError(
        `Failed to play from library: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.updateUI();
    }
  }

  private async removeFromLibrary(index: number): Promise<void> {
    const activeIndex = this.channelManager.getActiveChannelIndex();
    const library = this.channelManager.getLibrary(activeIndex);
    
    if (index >= 0 && index < library.length) {
      try {
        await this.channelManager.removeFromLibrary(activeIndex, index);
        this.updateUI();
      } catch (error) {
        this.panels[activeIndex].showError(
          `Failed to remove from library: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        this.updateUI();
      }
    }
  }

  private async clearHistory(): Promise<void> {
    const activeIndex = this.channelManager.getActiveChannelIndex();
    try {
      await this.channelManager.clearHistory(activeIndex);
      this.updateUI();
    } catch (error) {
      this.panels[activeIndex].showError(
        `Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.updateUI();
    }
  }
}
