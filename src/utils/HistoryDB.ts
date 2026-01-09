import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import { HistoryEntry, ChannelIndex } from '../audio/types';

export class HistoryDB {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.focus-bgm');
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

  close(): void {
    this.db.close();
  }
}
