import * as blessed from 'blessed';
import { ChannelState } from '../audio/types';
import { UI_STYLES } from './styles';
import { truncateURL, formatVolume } from '../utils/youtube';

const STATUS_BAR_HEIGHT = 3;

export class ChannelPanel {
  private box: blessed.Widgets.BoxElement;
  private channelId: number;

  constructor(channelId: number, parent: blessed.Widgets.Screen) {
    this.channelId = channelId;
    
    this.box = blessed.box({
      parent,
      top: 0,
      bottom: STATUS_BAR_HEIGHT,
      width: '50%',
      left: channelId === 0 ? 0 : '50%',
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
      playing: false,
      volume: 80,
      loading: false,
      error: null,
    });
  }

  update(state: ChannelState, active: boolean): void {
    const isActive = active;
    const borderColor = isActive ? UI_STYLES.COLORS.BORDER_ACTIVE : UI_STYLES.COLORS.BORDER;
    
    this.box.style.border.fg = borderColor;
    this.updateContent(state);
  }

  private updateContent(state: ChannelState): void {
    const icon = this.getIcon(state);
    const statusText = this.getStatusText(state);
    const volumeBar = formatVolume(state.volume);
    const urlDisplay = truncateURL(state.url, 45);
    
    let content = '';

    content += `{bold}${UI_STYLES.ICONS.ACTIVE} Channel ${this.channelId + 1}{/bold}\n\n`;
    
    if (state.error) {
      content += `{${UI_STYLES.COLORS.ERROR}-fg}Error: ${state.error}{/${UI_STYLES.COLORS.ERROR}-fg}\n\n`;
    } else if (state.loading) {
      content += `{${UI_STYLES.COLORS.WARNING}-fg}${UI_STYLES.ICONS.LOADING} Loading...{/${UI_STYLES.COLORS.WARNING}-fg}\n\n`;
    }
    
    content += `${icon} ${statusText}\n\n`;
    
    if (state.url) {
      content += `URL: {cyan-fg}${urlDisplay}{/cyan-fg}\n\n`;
    } else {
      content += `URL: {gray-fg}(empty - paste YouTube URL){/gray-fg}\n\n`;
    }
    
    content += `Volume: {green-fg}${volumeBar}{/green-fg} ${state.volume}%`;

    this.box.setContent(content);
  }

  private getIcon(state: ChannelState): string {
    if (state.loading) return UI_STYLES.ICONS.LOADING;
    if (state.playing) return UI_STYLES.ICONS.PLAYING;
    return UI_STYLES.ICONS.PAUSED;
  }

  private getStatusText(state: ChannelState): string {
    if (state.error) return `{${UI_STYLES.COLORS.ERROR}-fg}Error{/fg}`;
    if (state.loading) return `{${UI_STYLES.COLORS.WARNING}-fg}Loading{/fg}`;
    if (state.playing) return `{${UI_STYLES.COLORS.SUCCESS}-fg}Playing{/fg}`;
    if (state.url) return `{${UI_STYLES.COLORS.WARNING}-fg}Paused{/fg}`;
    return '{gray-fg}No media{/fg}';
  }

  showError(message: string): void {
    const currentContent = this.box.getContent() || '';
    this.box.setContent(`${currentContent}\n\n{red-fg}${message}{/red-fg}`);
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
