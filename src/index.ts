import { App } from './ui/App';

async function main(): Promise<void> {
  try {
    console.log('Starting Focus BGM Player...');
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
