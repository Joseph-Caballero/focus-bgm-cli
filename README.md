# Focus BGM CLI

Terminal audio player that streams audio from YouTube with dual-channel support for background focus music.

## Features

- Play 2 YouTube audio streams simultaneously
- Independent volume control for each channel
- Play/pause control per channel
- Channel switching with keyboard shortcuts
- Clean terminal UI with visual feedback
- Inline error display for invalid URLs
- Status indicators (playing/paused/loading)

## Installation

### Prerequisites

Install required system dependencies (macOS):

```bash
brew install mpv yt-dlp
```

### Install Node.js Dependencies

```bash
npm install
npm run build
```

Run setup verification:

```bash
./test-setup.sh
```

## Usage

### Development Mode

Start with TypeScript compilation (slower, but shows TypeScript errors):

```bash
npm start
```

### Production Mode

Start the pre-built JavaScript version (recommended):

```bash
node dist/index.js
```

## Keyboard Controls

- `1` / `2` - Select channel 1 or 2
- `Tab` - Toggle between channels
- `v` or `i` - Enter URL input mode for active channel
- `p` - Toggle play/pause on active channel
- `→` (Right Arrow) - Increase volume on active channel (+5%)
- `←` (Left Arrow) - Decrease volume on active channel (-5%)
- `q` - Quit application
- `Ctrl+C` - Force quit application

## Usage Example

1. Run `npm start` or `node dist/index.js` to launch the player
2. Press `v` to enter URL input mode for channel 1
3. Paste a YouTube URL and press Enter to load
4. Press `Tab` to switch to channel 2
5. Press `v` again and paste another URL
6. Use `→`/`←` to adjust volumes independently for each channel
7. Press `p` to pause/resume each channel individually

## Project Structure

```
src/
├── audio/              # Audio playback layer
│   ├── AudioChannel.ts   # Single MPV player instance
│   ├── ChannelManager.ts # Manages 2 channels
│   └── types.ts         # Audio-related types
├── input/              # Input handling
│   ├── KeyHandler.ts    # Keyboard input mapping
│   └── URLInput.ts      # URL input modal
├── ui/                 # UI components
│   ├── App.ts           # Main application
│   ├── ChannelPanel.ts   # Individual channel display
│   └── styles.ts        # UI styling
├── utils/              # Utilities
│   ├── constants.ts     # Constants and key bindings
│   └── youtube.ts       # URL validation helpers
└── index.ts            # Entry point
```

## Troubleshooting

### Terminal Color Warnings

If you see ANSI escape sequence warnings when starting, this is normal and won't affect functionality. The warnings appear in some terminal emulators but the UI will still render correctly. If the UI doesn't appear, try:
- iTerm2
- Terminal.app
- VS Code integrated terminal

### MPV Issues

If MPV fails to start or audio doesn't play:
- Verify `mpv --version` works
- Check that mpv is installed via Homebrew: `brew list mpv`
- Ensure yt-dlp is installed: `yt-dlp --version`
- Try running `mpv <youtube-url>` directly to test

### Audio Not Playing

- Verify YouTube URL is valid
- Check internet connection
- Ensure mpv and yt-dlp can access to URL
- Wait a few seconds for the stream to load

### TypeScript Compilation Errors

If you see TypeScript errors when running `npm start`:
- Ensure all dependencies are installed: `npm install`
- Run build separately: `npm run build`
- Use production mode: `node dist/index.js`

## Development

### Project Commands

```bash
npm run build    # Compile TypeScript to JavaScript
npm start        # Run with ts-node (development)
npm test         # Run setup verification
```

## License

MIT

