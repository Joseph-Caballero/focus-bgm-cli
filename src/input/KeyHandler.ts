import * as blessed from 'blessed';
import { CONSTANTS, KEY_BINDINGS } from '../utils/constants';

export interface KeyHandlerCallbacks {
  onChannelSelect: (index: 0 | 1) => void;
  onToggleChannel: () => void;
  onTogglePause: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onQuit: () => void;
  onEnterURL: () => void;
}

export class KeyHandler {
  private screen: blessed.Widgets.Screen;
  private callbacks: KeyHandlerCallbacks;
  private enabled: boolean = true;

  constructor(screen: blessed.Widgets.Screen, callbacks: KeyHandlerCallbacks) {
    this.screen = screen;
    this.callbacks = callbacks;
    this.setupKeyBindings();
  }

  private setupKeyBindings(): void {
    this.screen.key([KEY_BINDINGS.CHANNEL_1], () => {
      if (this.enabled) {
        this.callbacks.onChannelSelect(0);
      }
    });

    this.screen.key([KEY_BINDINGS.CHANNEL_2], () => {
      if (this.enabled) {
        this.callbacks.onChannelSelect(1);
      }
    });

    this.screen.key([KEY_BINDINGS.TAB], () => {
      if (this.enabled) {
        this.callbacks.onToggleChannel();
      }
    });

    this.screen.key([KEY_BINDINGS.TOGGLE_PAUSE], () => {
      if (this.enabled) {
        this.callbacks.onTogglePause();
      }
    });

    this.screen.key([KEY_BINDINGS.VOLUME_UP], () => {
      if (this.enabled) {
        this.callbacks.onVolumeUp();
      }
    });

    this.screen.key([KEY_BINDINGS.VOLUME_DOWN], () => {
      if (this.enabled) {
        this.callbacks.onVolumeDown();
      }
    });

    this.screen.key([KEY_BINDINGS.QUIT], () => {
      this.callbacks.onQuit();
    });

    this.screen.key([KEY_BINDINGS.QUIT_CTRL_C], () => {
      this.callbacks.onQuit();
    });

    this.screen.key(['v'], () => {
      if (this.enabled) {
        this.callbacks.onEnterURL();
      }
    });

    this.screen.key(['i'], () => {
      if (this.enabled) {
        this.callbacks.onEnterURL();
      }
    });
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
