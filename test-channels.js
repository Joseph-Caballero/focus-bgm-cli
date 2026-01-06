#!/usr/bin/env node
const { ChannelManager } = require('./dist/audio/ChannelManager');

async function test() {
  console.log('Testing dual-channel audio...');
  
  const manager = new ChannelManager();
  await manager.initialize();
  
  // Test loading two different URLs
  try {
    console.log('\nLoading URL 1 to channel 0...');
    await manager.playOnChannel(0, 'https://www.youtube.com/watch?v=test1');
    console.log('✓ Channel 0 started');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\nLoading URL 2 to channel 1...');
    await manager.playOnChannel(1, 'https://www.youtube.com/watch?v=test2');
    console.log('✓ Channel 1 started');
    
    const states = manager.getAllStates();
    console.log('\nChannel states:');
    console.log('Channel 0:', states[0].playing ? 'PLAYING' : 'STOPPED');
    console.log('Channel 1:', states[1].playing ? 'PLAYING' : 'STOPPED');
    
    console.log('\nTesting volume control...');
    await manager.adjustVolume(10);
    console.log('✓ Volume adjusted on channel', manager.getActiveChannelIndex());
    
    console.log('\nTesting pause control...');
    await manager.togglePause();
    console.log('✓ Toggled pause on channel', manager.getActiveChannelIndex());
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await manager.togglePause();
    console.log('✓ Toggled pause again on channel', manager.getActiveChannelIndex());
    
    console.log('\nCleaning up...');
    await manager.cleanup();
    console.log('✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    await manager.cleanup();
  }
}

test();
