const mpv = require('node-mpv');
import { ChannelState, ChannelIndex, HistoryEntry } from './types';
import { getVideoTitle } from '../utils/youtube'; 
import { HistoryDB } from '../utils/HistoryDB';

export class AudioChannel {
  private mpv: any;
  private state: ChannelState;
  private initialized: boolean = false;
  private lockState: boolean = false;
  private historyDB: HistoryDB | null = null;
  
  constructor(channelId: ChannelIndex, historyDB?: HistoryDB) {
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
    
    this.historyDB = historyDB || null;
    
    this.state = {
      id: channelId,
      url: null,
      title: null,
      playing: false,
      volume: 80,
      loading: false,
      error: null,
      history: [],
    };
    
    this.loadHistory();
    this.setupEventListeners();
  }
  
  private loadHistory(): void {
    if (this.historyDB) {
      this.state.history = this.historyDB.getHistory(this.state.id);
    }
  }
  
  private setupEventListeners(): void {
    this.mpv.on('started', () => {
      if (this.lockState) return;
      this.state.playing = true;
      this.state.loading = false;
      this.state.error = null;
    });
    
    this.mpv.on('paused', () => {
      if (this.lockState) return;
      this.state.playing = false;
      this.state.loading = false;
    });
    
    this.mpv.on('resumed', () => {
      if (this.lockState) return;
      this.state.playing = true;
      this.state.loading = false;
    });
    
    this.mpv.on('stopped', () => {
      if (this.lockState) return;
      this.state.playing = false;
      this.state.loading = false;
    });
    
    this.mpv.on('error', (error: any) => {
      if (this.lockState) return;
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
      this.state.playing = false;
      this.state.error = null;
      
      if (!this.initialized) {
        this.initialize();
      } 

      const title = await getVideoTitle(url);
      
      // Use "replace" mode - loads a single URL for this channel only
      // Stop any current playback first to ensure clean state
      try {
        this.mpv.stop();
      } catch (e) {
        // Ignore stop errors if nothing was playing
      }
      
      this.state.url = url;
      this.state.title = title;
      this.addToHistory({ url, title });
      
      this.mpv.load(url, 'replace');
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
    if (this.state.loading) {
      this.state.loading = false;
      try {
        this.mpv.stop();
      } catch (e) {
        // Ignore stop errors
      }
      return;
    }
    
    try {
      // Use explicit pause/resume to ensure this only affects this channel
      if (this.state.playing) {
        this.mpv.pause();
        this.state.playing = false;
      } else if (this.state.url) {
        // Only resume if there's a URL loaded
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
  
  getHistory(): HistoryEntry[] {
    return [...this.state.history];
  }
  
  addToHistory(entry: HistoryEntry): void {
    if (!this.state.history.find(h => h.url === entry.url)) {
      this.state.history.unshift(entry);
      if (this.state.history.length > 10) {
        this.state.history.pop();
      }
      
      if (this.historyDB) {
        this.historyDB.addEntry(this.state.id, entry);
      }
    }
  }

  setStateLock(locked: boolean): void {
    this.lockState = locked;
  }
  
  clearError(): void {
    this.state.error = null;
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
