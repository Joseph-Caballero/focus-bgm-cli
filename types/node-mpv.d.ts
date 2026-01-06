declare module 'node-mpv' {
  interface MPVOptions {
    audio_only?: boolean;
    binary?: string | null;
    debug?: boolean;
    ipcCommand?: string | null;
    socket?: string;
    time_update?: number;
    verbose?: boolean;
  }

  class MPV extends NodeJS.EventEmitter {
    constructor(options?: MPVOptions);
    load(url: string, mode?: string, options?: any): void;
    pause(): void;
    resume(): void;
    togglePause(): void;
    volume(level: number): void;
    stop(): void;
    quit(): void;

    on(event: 'started', callback: () => void): this;
    on(event: 'paused', callback: () => void): this;
    on(event: 'resumed', callback: () => void): this;
    on(event: 'stopped', callback: () => void): this;
    on(event: 'error', callback: (error: any) => void): this;
    on(event: 'statuschange', callback: (status: any) => void): this;
    on(event: 'timeposition', callback: (time: number) => void): this;
  }

  export = MPV;
}
