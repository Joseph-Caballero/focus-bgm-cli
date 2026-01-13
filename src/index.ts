type WriteCallback = (err?: Error | null) => void;
type WriteFn = (
  chunk: string | Uint8Array,
  encodingOrCallback?: BufferEncoding | WriteCallback,
  callback?: WriteCallback
) => boolean;

function suppressStrayDots(): void {
  const wrapWrite = (writeFn: WriteFn): typeof process.stdout.write => {
    return function(
      this: NodeJS.WriteStream,
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | WriteCallback,
      callback?: WriteCallback
    ): boolean {
      const text = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? '';
      const stripped = text.replace(/[\r\n\s]/g, '');
      if (stripped === '.') {
        if (typeof encodingOrCallback === 'function') {
          encodingOrCallback(null);
        } else if (callback) {
          callback(null);
        }
        return true;
      }
      return writeFn(chunk, encodingOrCallback, callback);
    } as typeof process.stdout.write;
  };

  process.stdout.write = wrapWrite(
    process.stdout.write.bind(process.stdout) as WriteFn
  );
  process.stderr.write = wrapWrite(
    process.stderr.write.bind(process.stderr) as WriteFn
  );
}

function silenceMpvSpawnOutput(): void {
  // Patch spawn before node-mpv is loaded so mpv doesn't write to the TTY.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process') as typeof import('child_process');
  const originalSpawn = childProcess.spawn;

  childProcess.spawn = ((
    command: string,
    args?: readonly string[],
    options?: import('child_process').SpawnOptions
  ) => {
    const isMpv =
      command === 'mpv' ||
      command.endsWith('/mpv') ||
      command.endsWith('/mpv-silent') ||
      command.includes('/mpv');
    if (isMpv) {
      const nextOptions: import('child_process').SpawnOptions = { ...(options || {}) };
      if (!nextOptions.stdio) {
        nextOptions.stdio = 'ignore';
      } else if (Array.isArray(nextOptions.stdio)) {
        nextOptions.stdio = ['ignore', 'ignore', 'ignore'];
      } else {
        nextOptions.stdio = 'ignore';
      }
      return originalSpawn(command, args as string[], nextOptions);
    }
    return originalSpawn(command, args as string[], options ?? {});
  }) as typeof childProcess.spawn;
}

async function main(): Promise<void> {
  try {
    console.log('Starting Focus BGM Player...');
    silenceMpvSpawnOutput();
    suppressStrayDots();
    const { App } = await import('./ui/App');
    const app = new App();
    await app.initialize();
  } catch (error) {
    console.error('Failed to start application:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
