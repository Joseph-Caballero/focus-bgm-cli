import * as blessed from 'blessed';
import { ChannelState } from '../audio/types';
import { UI_STYLES } from './styles';
import { truncateURL, formatVolume, formatProgress } from '../utils/youtube';

const STATUS_BAR_HEIGHT = 3;

export class ChannelPanel {
  private box: blessed.Widgets.BoxElement;
  private channelId: number;
  private headerScrubX: number | null = null;

  constructor(channelId: number, parent: blessed.Widgets.Node) {
    this.channelId = channelId;
    
    this.box = blessed.box({
      parent,
      left: 0,
      right: 0,
      height: '50%',
      top: channelId === 0 ? 0 : '50%',
      tags: true,
      border: { type: 'line' as any, fg: 'blue' } as any,
      style: {
        fg: 'white',
        border: { fg: 'blue' },
      },
    } as any);

    this.updateContent({
      id: channelId as 0 | 1,
      url: null,
      title: null,
      playing: false,
      volume: 80,
      loading: false,
      error: null,
      history: [],
      downloading: false,
      downloadProgress: 0,
      loopEnabled: true,
      loopIndicatorUntil: null,
      library: [],
    });
  }

  update(state: ChannelState, active: boolean): void {
    const isActive = active;
    const borderColor = isActive ? UI_STYLES.COLORS.BORDER_ACTIVE : UI_STYLES.COLORS.BORDER;
    
    this.box.style.border.fg = borderColor;
    this.updateContent(state);
  }

  private updateContent(state: ChannelState): void {
    const statusText = this.getStatusText(state);
    const volumeBar = formatVolume(state.volume);
    const urlDisplay = truncateURL(state.url, 100);
    const titleDisplay = state.title ?? '';
    
    let content = '';

    const shouldShowLoopIndicator =
      state.loopEnabled &&
      state.loopIndicatorUntil !== null &&
      Date.now() < state.loopIndicatorUntil &&
      state.playing;
    const loopIndicator = shouldShowLoopIndicator ? ' {green-fg}[LOOP ON]{/green-fg}' : '';
    const headerLeft = `{bold}${UI_STYLES.ICONS.ACTIVE} Channel ${this.channelId + 1}{/bold}`;
    const headerCenter = `${statusText}${loopIndicator}`;
    content += `${this.buildHeaderLine(headerLeft, headerCenter)}\n\n`;

    if (state.error) {
      content += `{${UI_STYLES.COLORS.ERROR}-fg}Error: ${state.error}{/${UI_STYLES.COLORS.ERROR}-fg}\n\n`;
    } else if (state.loading) {
      content += `{${UI_STYLES.COLORS.WARNING}-fg}${UI_STYLES.ICONS.LOADING} Loading...{/${UI_STYLES.COLORS.WARNING}-fg}\n\n`;
    }

    const titleLine = state.title ? `{cyan-fg}${titleDisplay}{/cyan-fg}` : '';
    content += `${titleLine}\n\n`;
    
    if (state.url) {
      content += `{cyan-fg}${urlDisplay}{/cyan-fg}\n\n`;
    } else {
      content += `\n\n`;
    }
    
    if (state.downloading) {
      content += `{yellow-fg}[DOWNLOADING ${state.downloadProgress}%]{/yellow-fg}\n`;
      const progress = formatProgress(state.downloadProgress);
      content += `${progress}\n\n`;
    }

    content += `Volume: {green-fg}${volumeBar}{/green-fg} ${state.volume}%\n\n`;
    
    if (state.history.length > 0) {
      content += `{bold}History:{/bold}\n`;
      state.history.forEach((entry, index) => {
        content += `  ${index + 1}. {cyan-fg}${entry.title}{/cyan-fg}\n`;
      });
      content += '\n';
    }
    
    if (state.library.length > 0) {
      content += `{bold}Library:{/bold}\n`;
      state.library.forEach((entry, index) => {
        const sizeStr = this.formatFileSize(entry.fileSize);
        content += `  ${index + 1}. ${entry.title} (${sizeStr})\n`;
      });
    }

    this.box.setContent(content);
  }
  
  private buildHeaderLine(left: string, center: string): string {
    const width = this.getInnerWidth();
    if (width <= 0) {
      return `${left} ${center}`;
    }

    const leftLen = this.visibleLength(left);
    const centerLen = this.visibleLength(center);
    const rawCenterStart = Math.floor((width - centerLen) / 2);
    const centerStart = Math.max(rawCenterStart, leftLen + 1);
    const gap = Math.max(1, centerStart - leftLen);
    const line = left + ' '.repeat(gap) + center;
    this.headerScrubX = Math.min(width - 1, centerStart + centerLen);
    return this.padLine(line, width);
  }

  private getInnerWidth(): number {
    if (typeof this.box.width !== 'number') {
      return 0;
    }
    return Math.max(0, this.box.width - 2);
  }

  private padLine(line: string, width: number): string {
    const visible = this.visibleLength(line);
    if (visible >= width) {
      return line;
    }
    return line + ' '.repeat(width - visible);
  }

  private visibleLength(text: string): number {
    const box = this.box as any;
    if (box && typeof box.strWidth === 'function') {
      return box.strWidth(text);
    }
    return this.stripTags(text).length;
  }

  private stripTags(text: string): string {
    return text.replace(/\{[^}]+\}/g, '');
  }

  getHeaderScrubPosition(): { x: number; y: number } | null {
    if (this.headerScrubX === null) {
      return null;
    }
    const coords = (this.box as any)._getCoords?.();
    if (!coords) {
      return null;
    }
    const x = coords.xi + (this.box.ileft || 0) + this.headerScrubX;
    const y = coords.yi + (this.box.itop || 0);
    return { x, y };
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private getStatusText(state: ChannelState): string {
    if (state.error) return `{${UI_STYLES.COLORS.ERROR}-fg}Error{/${UI_STYLES.COLORS.ERROR}-fg}`;
    if (!state.loading && state.url && !state.playing) return `{${UI_STYLES.COLORS.WARNING}-fg}Paused{/${UI_STYLES.COLORS.WARNING}-fg}`;
    if (state.loading) return `{${UI_STYLES.COLORS.WARNING}-fg}Loading{/${UI_STYLES.COLORS.WARNING}-fg}`;
    if (state.playing) return `{${UI_STYLES.COLORS.SUCCESS}-fg}Playing{/${UI_STYLES.COLORS.SUCCESS}-fg}`;
    return '{gray-fg}No media{/gray-fg}';
  }

  showError(message: string): void {
    const currentContent = this.box.getContent() || '';
    this.box.setContent(`${currentContent}\n\n{${UI_STYLES.COLORS.ERROR}-fg}${message}{/${UI_STYLES.COLORS.ERROR}-fg}`);
  }

  clearError(): void {
    // Will be cleared on next update
  }

  setActive(active: boolean): void {
    const borderColor = active ? UI_STYLES.COLORS.BORDER_ACTIVE : UI_STYLES.COLORS.BORDER;
    this.box.style.border.fg = borderColor;
  }

  getElement(): blessed.Widgets.BoxElement {
    return this.box;
  }
}
