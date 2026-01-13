declare module 'node-mpv' {
  interface MPVOptions {
    audio_only?: boolean;
    binary?: string | null;
    debug?: boolean;
    ipcCommand?: string | null;
    socket?: string;
    time_update?: number;
    verbose?: boolean;
    loop_file?: string;
  }

  interface MPVLoadOptions {
    [key: string]: string | number | boolean;
  }

  interface MPVStatus {
    mute: boolean;
    pause: boolean;
    duration: number | null;
    volume: number;
    filename: string | null;
    path: string | null;
    'media-title': string | null;
    'playlist-pos': number;
    'playlist-count': number;
    loop: string;
  }

  class MPV extends NodeJS.EventEmitter {
    constructor(options?: MPVOptions, args?: string[]);
    load(url: string, mode?: string, options?: MPVLoadOptions): void;
    pause(): void;
    resume(): void;
    togglePause(): void;
    volume(level: number): void;
    stop(): void;
    quit(): void;
    loop(): void;
    clearLoop(): void;
    goToPosition(seconds: number): void;

    on(event: 'started', callback: () => void): this;
    on(event: 'paused', callback: () => void): this;
    on(event: 'resumed', callback: () => void): this;
    on(event: 'stopped', callback: () => void): this;
    on(event: 'error', callback: (error: Error) => void): this;
    on(event: 'statuschange', callback: (status: MPVStatus) => void): this;
    on(event: 'timeposition', callback: (time: number) => void): this;
  }

  export = MPV;
}
