const mpv = require('node-mpv');
import { ChannelState, ChannelIndex, HistoryEntry, LibraryEntry } from './types';
import { getVideoTitle } from '../utils/youtube'; 
import { HistoryDB } from '../utils/HistoryDB';
import { DownloadManager } from './DownloadManager';

export class AudioChannel {
  private mpv: any;
  private state: ChannelState;
  private initialized: boolean = false;
  private lockState: boolean = false;
  private historyDB: HistoryDB | null = null;
  private downloadManager: DownloadManager | null = null;
  
  constructor(channelId: ChannelIndex, historyDB?: HistoryDB) {
    this.historyDB = historyDB || null;
    this.downloadManager = new DownloadManager(channelId);
    
    const socketPath = channelId === 0 
      ? '/tmp/node-mpv-channel-0.sock'
      : '/tmp/node-mpv-channel-1.sock';
    
    this.mpv = new (mpv as any)(
      {
        audio_only: true,
        debug: false,
        verbose: false,
        socket: socketPath,
        loop_file: 'yes',
      },
      ['--input-terminal=no', '--input-default-bindings=no', '--input-conf=/dev/null']
    );
    
    this.state = {
      id: channelId,
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
    };
    
    this.loadHistory();
    this.loadLibrary();
    this.setupEventListeners();
  }
  
  private loadHistory(): void {
    if (this.historyDB) {
      this.state.history = this.historyDB.getHistory(this.state.id);
    }
  }
  
  private loadLibrary(): void {
    if (this.historyDB) {
      this.state.library = this.historyDB.getLibrary(this.state.id);
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
      
      const libraryEntry = this.state.library.find(e => e.url === url);
      if (libraryEntry && this.downloadManager && this.downloadManager['getDownloadsDir']) {
        const filePath = libraryEntry.filePath;
        if (require('fs').existsSync(filePath)) {
          try {
            this.mpv.stop();
          } catch (e) {
          }
          
          this.state.url = url;
          this.state.title = title;
          this.addToHistory({ url, title });
          
          this.mpv.load(filePath, 'replace');
          return;
        }
      }
      
      try {
        this.mpv.stop();
      } catch (e) {
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
      }
      return;
    }
    
    try {
      if (this.state.playing) {
        await this.pause();
      } else if (this.state.url) {
        await this.resume();
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
  
  getTitle(): string | null {
    return this.state.title;
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
  
  clearHistory(): void {
    this.state.history = [];
    if (this.historyDB) {
      this.historyDB.clearHistory(this.state.id);
    }
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
  
  async startDownload(url: string, title: string): Promise<void> {
    if (!this.downloadManager) {
      return;
    }
    
    if (this.state.downloading) {
      throw new Error('Already downloading');
    }
    
    if (this.historyDB && this.historyDB.isInLibrary(this.state.id, url)) {
      throw new Error('Already in library');
    }
    
    this.state.downloading = true;
    this.state.downloadProgress = 0;
    this.state.error = null;
    
    try {
      const result = await this.downloadManager.download(url, title, (progress) => {
        this.state.downloadProgress = progress;
      });
      
      const libraryEntry: LibraryEntry = {
        url: url,
        title: title,
        filePath: result.filePath,
        fileSize: result.fileSize,
        downloadedAt: Date.now(),
      };
      
      this.state.library.unshift(libraryEntry);
      
      if (this.historyDB) {
        this.historyDB.addToLibrary(this.state.id, libraryEntry);
      }
      
      this.state.downloading = false;
      this.state.downloadProgress = 0;
    } catch (error) {
      this.state.downloading = false;
      this.state.downloadProgress = 0;
      this.state.error = `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      throw error;
    }
  }
  
  cancelDownload(): void {
    if (this.downloadManager && this.state.downloading) {
      this.downloadManager.cancel();
      this.state.downloading = false;
      this.state.downloadProgress = 0;
    }
  }
  
  async restartPlayback(): Promise<void> {
    try {
      this.mpv.goToPosition(0);
    } catch (error) {
      this.state.error = `Failed to restart: ${error instanceof Error ? error.message : 'Unknown error'}`;
      throw error;
    }
  }
  
  toggleLoop(): void {
    this.state.loopEnabled = !this.state.loopEnabled;
    try {
      if (this.state.loopEnabled) {
        this.mpv.loop();
        this.state.loopIndicatorUntil = Date.now() + 3000;
      } else {
        this.mpv.clearLoop();
        this.state.loopIndicatorUntil = null;
      }
    } catch (error) {
      console.error('Failed to toggle loop:', error);
    }
  }
  
  async playFromLibrary(index: number): Promise<void> {
    if (index < 0 || index >= this.state.library.length) {
      throw new Error('Invalid library index');
    }
    
    const entry = this.state.library[index];
    
    if (!this.downloadManager) {
      throw new Error('Download manager not initialized');
    }
    
    const downloadsDir = this.downloadManager['getDownloadsDir']();
    const filePath = entry.filePath;
    
    if (!require('fs').existsSync(filePath)) {
      throw new Error('File not found on disk');
    }
    
    this.state.url = entry.url;
    this.state.title = entry.title;
    this.state.loading = true;
    this.state.error = null;
    
    try {
      await this.mpv.load(filePath, 'replace');
    } catch (error) {
      this.state.loading = false;
      this.state.error = `Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`;
      throw error;
    }
  }
  
  removeFromLibrary(index: number): void {
    if (index < 0 || index >= this.state.library.length) {
      return;
    }
    
    const entry = this.state.library[index];
    
    if (this.historyDB) {
      this.historyDB.removeFromLibrary(this.state.id, entry.url);
    }
    
    if (this.downloadManager && entry.filePath) {
      this.downloadManager.deleteFile(entry.filePath);
    }
    
    this.state.library.splice(index, 1);
  }
  
  isDownloading(): boolean {
    return this.state.downloading;
  }
  
  getDownloadProgress(): number {
    return this.state.downloadProgress;
  }
  
  isLoopEnabled(): boolean {
    return this.state.loopEnabled;
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
