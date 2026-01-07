export interface HistoryEntry {
  url: string;
  title: string;
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
}

export type ChannelIndex = 0 | 1;
