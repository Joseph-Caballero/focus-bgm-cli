import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { HistoryEntry, LibraryEntry, ChannelIndex } from '../audio/types';

export class HistoryDB {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.focus-bgm');
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    this.dbPath = path.join(configDir, 'history.db');
    
    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        UNIQUE(channel_id, url)
      );
      CREATE INDEX IF NOT EXISTS idx_channel_id ON history(channel_id);
      
      CREATE TABLE IF NOT EXISTS library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        downloaded_at INTEGER NOT NULL,
        UNIQUE(channel_id, url)
      );
      CREATE INDEX IF NOT EXISTS idx_library_channel ON library(channel_id);
    `);
  }

  addEntry(channelId: ChannelIndex, entry: HistoryEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO history (channel_id, url, title, played_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(channelId, entry.url, entry.title, Date.now());
  }

  getHistory(channelId: ChannelIndex, limit: number = 10): HistoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT url, title FROM history
      WHERE channel_id = ?
      ORDER BY played_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(channelId, limit) as { url: string; title: string }[];
    return rows.map(row => ({ url: row.url, title: row.title }));
  }

  clearHistory(channelId: ChannelIndex): void {
    const stmt = this.db.prepare('DELETE FROM history WHERE channel_id = ?');
    stmt.run(channelId);
  }

  addToLibrary(channelId: ChannelIndex, entry: LibraryEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO library (channel_id, url, title, file_path, file_size, downloaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(channelId, entry.url, entry.title, entry.filePath, entry.fileSize, entry.downloadedAt);
  }

  getLibrary(channelId: ChannelIndex): LibraryEntry[] {
    const stmt = this.db.prepare(`
      SELECT url, title, file_path, file_size, downloaded_at FROM library
      WHERE channel_id = ?
      ORDER BY downloaded_at DESC
    `);
    const rows = stmt.all(channelId) as { url: string; title: string; file_path: string; file_size: number; downloaded_at: number }[];
    return rows.map(row => ({ 
      url: row.url, 
      title: row.title, 
      filePath: row.file_path, 
      fileSize: row.file_size, 
      downloadedAt: row.downloaded_at 
    }));
  }

  removeFromLibrary(channelId: ChannelIndex, url: string): void {
    const stmt = this.db.prepare('DELETE FROM library WHERE channel_id = ? AND url = ?');
    stmt.run(channelId, url);
  }

  isInLibrary(channelId: ChannelIndex, url: string): boolean {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM library WHERE channel_id = ? AND url = ?');
    const result = stmt.get(channelId, url) as { count: number };
    return result.count > 0;
  }

  getLibraryEntry(channelId: ChannelIndex, url: string): LibraryEntry | null {
    const stmt = this.db.prepare(`
      SELECT url, title, file_path, file_size, downloaded_at FROM library
      WHERE channel_id = ? AND url = ?
    `);
    const row = stmt.get(channelId, url) as { url: string; title: string; file_path: string; file_size: number; downloaded_at: number } | undefined;
    if (!row) return null;
    return {
      url: row.url,
      title: row.title,
      filePath: row.file_path,
      fileSize: row.file_size,
      downloadedAt: row.downloaded_at
    };
  }

  close(): void {
    this.db.close();
  }
}
