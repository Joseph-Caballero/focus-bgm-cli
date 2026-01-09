export interface HistoryEntry {
  url: string;
  title: string;
}

export interface LibraryEntry {
  url: string;
  title: string;
  filePath: string;
  fileSize: number;
  downloadedAt: number;
}

export interface ChannelState {
  id: 0 | 1;
  url: string | null;
  title: string | null;
  playing: boolean;
  volume: number;
  loading: boolean;
  error: string | null;
  history: HistoryEntry[];
  downloading: boolean;
  downloadProgress: number;
  loopEnabled: boolean;
  library: LibraryEntry[];
}

export type ChannelIndex = 0 | 1;
