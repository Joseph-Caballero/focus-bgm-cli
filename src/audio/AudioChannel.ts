const mpv = require('node-mpv');
import { ChannelState, ChannelIndex } from './types'; 

export class AudioChannel {
  private mpv: any;
  private state: ChannelState;
  private initialized: boolean = false;
  
  constructor(channelId: ChannelIndex) {
    // Use unique socket path for each channel to prevent interference
    const socketPath = channelId === 0 
      ? '/tmp/node-mpv-channel-0.sock'
      : '/tmp/node-mpv-channel-1.sock';
    
    this.mpv = new (mpv as any)({
      audio_only: true,
      debug: false,
      verbose: false,
      socket: socketPath,
    });
    
    this.state = {
      id: channelId,
      url: null,
      playing: false,
      volume: 80,
      loading: false,
      error: null,
    };
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.mpv.on('started', () => {
      this.state.playing = true;
      this.state.loading = false;
      this.state.error = null;
    });
    
    this.mpv.on('paused', () => {
      this.state.playing = false;
    });
    
    this.mpv.on('resumed', () => {
      this.state.playing = true;
      this.state.loading = false;
    });
    
    this.mpv.on('stopped', () => {
      this.state.playing = false;
      this.state.loading = false;
    });
    
    this.mpv.on('error', (error: any) => {
      this.state.error = error instanceof Error ? error.message : String(error);
      this.state.playing = false;
      this.state.loading = false;
    });
  }
  
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }
  
  async play(url: string): Promise<void> {
    try {
      this.state.loading = true;
      this.state.error = null;
      
      if (!this.initialized) {
        this.initialize();
      } 

      // Use "replace" mode - loads a single URL for this channel only
      // Stop any current playback first to ensure clean state
      try {
        this.mpv.stop();
      } catch (e) {
        // Ignore stop errors if nothing was playing
      }
      
      this.mpv.load(url, 'replace');
      
      this.state.url = url;
      this.state.playing = true;
      this.state.loading = false;
    } catch (error) {
      this.state.loading = false;
      this.state.error = `Failed to play URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.state.playing = false;
      throw error;
    }
  }
  
  async pause(): Promise<void> {
    try {
      this.mpv.pause();
      this.state.playing = false;
    } catch (error) {
      this.state.error = `Failed to pause: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  async resume(): Promise<void> {
    try {
      this.mpv.resume();
      this.state.playing = true;
    } catch (error) {
      this.state.error = `Failed to resume: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  async togglePause(): Promise<void> {
    try {
      // Use explicit pause/resume to ensure this only affects this channel
      if (this.state.playing) {
        this.mpv.pause();
        this.state.playing = false;
      } else {
        this.mpv.resume();
        this.state.playing = true;
      }
    } catch (error) {
      this.state.error = `Failed to toggle pause: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  async setVolume(level: number): Promise<void> {
    try {
      const clampedLevel = Math.max(0, Math.min(100, level));
      this.mpv.volume(clampedLevel);
      this.state.volume = clampedLevel;
    } catch (error) {
      this.state.error = `Failed to set volume: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  getVolume(): number {
    return this.state.volume;
  }
  
  async adjustVolume(delta: number): Promise<void> {
    const newVolume = this.state.volume + delta;
    await this.setVolume(newVolume);
  }
  
  isPlaying(): boolean {
    return this.state.playing;
  }
  
  isLoading(): boolean {
    return this.state.loading;
  }
  
  getError(): string | null {
    return this.state.error;
  }
  
  clearError(): void {
    this.state.error = null;
  }
  
  getURL(): string | null {
    return this.state.url;
  }
  
  async stop(): Promise<void> {
    try {
      this.mpv.stop();
      this.state.playing = false;
      this.state.loading = false;
    } catch (error) {
      this.state.error = `Failed to stop: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  getState(): ChannelState {
    return { ...this.state };
  }
  
  async dispose(): Promise<void> {
    try {
      this.mpv.quit();
      this.initialized = false;
      this.state.playing = false;
    } catch (error) {
      console.error('Error disposing MPV:', error);
    }
  }
}
