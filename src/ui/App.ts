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
  private urlInput: URLInput;
  private keyHandler!: KeyHandler;
  private statusBar!: blessed.Widgets.BoxElement;
  private running: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Focus BGM Player',
      autoPadding: true,
      terminal: 'xterm-256color',
    });

    this.channelManager = new ChannelManager();
    this.panels = [
      new ChannelPanel(0, this.screen),
      new ChannelPanel(1, this.screen),
    ];

    this.urlInput = new URLInput(this.screen);
    
    this.setupStatusBar();
    this.setupKeyHandler();
    
    this.screen.render();
  }

  private setupStatusBar(): void {
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: CONSTANTS.STATUS_BAR_HEIGHT,
      tags: true,
      style: {
        fg: 'white',
      },
      content: this.getHelpText(),
    });
  }

  private getHelpText(): string {
    return ` {bold}p{/bold}:${HELP_TEXT.p}  {bold}←/→{/bold}:${HELP_TEXT.leftRight}  {bold}Tab{/bold}:${HELP_TEXT.tab}  {bold}1/2{/bold}:${HELP_TEXT.oneTwo}  {bold}v{/bold}:URL  {bold}Alt+1-9{/bold}:History  {bold}q{/bold}:${HELP_TEXT.q} `;
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
}
