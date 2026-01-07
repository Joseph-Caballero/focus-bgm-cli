import { AudioChannel } from './AudioChannel';
import { ChannelState, ChannelIndex } from './types';

export class ChannelManager {
  private channels: [AudioChannel, AudioChannel];
  private activeChannelIndex: ChannelIndex = 0;

  constructor() {
    this.channels = [
      new AudioChannel(0),
      new AudioChannel(1),
    ];
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.channels[0].initialize(),
      this.channels[1].initialize(),
    ]);
  }

  getChannel(index: ChannelIndex): AudioChannel {
    return this.channels[index];
  }

  setActiveChannel(index: ChannelIndex): void {
    this.activeChannelIndex = index;
  }

  getActiveChannelIndex(): ChannelIndex {
    return this.activeChannelIndex;
  }

  getActiveChannel(): AudioChannel {
    return this.channels[this.activeChannelIndex];
  }

  toggleActiveChannel(): void {
    this.activeChannelIndex = this.activeChannelIndex === 0 ? 1 : 0;
  }

  async togglePause(): Promise<void> {
    await this.getActiveChannel().togglePause();
  }

  async adjustVolume(delta: number): Promise<void> {
    await this.getActiveChannel().adjustVolume(delta);
  }

  getChannelState(index: ChannelIndex): ChannelState {
    return this.channels[index].getState();
  }

  getAllStates(): [ChannelState, ChannelState] {
    return [
      this.channels[0].getState(),
      this.channels[1].getState(),
    ];
  }

  async playOnChannel(index: ChannelIndex, url: string): Promise<void> {
    await this.channels[index].play(url);
    this.channels[index].clearError();
  }

  playFromHistory(index: ChannelIndex, historyIndex: number): string | null {
    const history = this.channels[index].getHistory();
    if (historyIndex >= 0 && historyIndex < history.length) {
      return history[historyIndex].url;
    }
    return null;
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.channels[0].dispose(),
      this.channels[1].dispose(),
    ]);
  }

  lockState(): void {
    this.channels[0].setStateLock(true);
    this.channels[1].setStateLock(true);
  }

  unlockState(): void {
    this.channels[0].setStateLock(false);
    this.channels[1].setStateLock(false);
  }
}
