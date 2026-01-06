export interface ChannelState {
  id: 0 | 1;
  url: string | null;
  playing: boolean;
  volume: number;
  loading: boolean;
  error: string | null;
}

export type ChannelIndex = 0 | 1;
