function suppressStrayDots(): void {
  const wrapWrite = (writeFn: typeof process.stdout.write) => {
    return ((chunk: any, ...args: any[]) => {
      const text = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? '';
      const stripped = text.replace(/[\r\n\s]/g, '');
      if (stripped === '.') {
        return true;
      }
      return writeFn(chunk, ...args);
    }) as typeof process.stdout.write;
  };

  process.stdout.write = wrapWrite(process.stdout.write.bind(process.stdout));
  process.stderr.write = wrapWrite(process.stderr.write.bind(process.stderr));
}

function silenceMpvSpawnOutput(): void {
  // Patch spawn before node-mpv is loaded so mpv doesn't write to the TTY.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process') as typeof import('child_process');
  const originalSpawn = childProcess.spawn;

  childProcess.spawn = ((command: any, args?: any, options?: any) => {
    const cmd = typeof command === 'string' ? command : '';
    const isMpv =
      cmd === 'mpv' ||
      cmd.endsWith('/mpv') ||
      cmd.endsWith('/mpv-silent') ||
      cmd.includes('/mpv');
    if (isMpv) {
      const nextOptions = { ...(options || {}) };
      if (!nextOptions.stdio) {
        nextOptions.stdio = 'ignore';
      } else if (Array.isArray(nextOptions.stdio)) {
        nextOptions.stdio = ['ignore', 'ignore', 'ignore'];
      } else {
        nextOptions.stdio = 'ignore';
      }
      nextOptions.detached = true;
      const child = originalSpawn(command, args, nextOptions);
      if (typeof child.unref === 'function') {
        child.unref();
      }
      return child;
    }
    return originalSpawn(command, args, options);
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
