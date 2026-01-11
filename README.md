# Focus BGM CLI

Terminal audio player for YouTube with two independent channels. Stream, pause, loop, and download tracks per channel with a simple TUI.

## Features

- Dual-channel playback with independent volume and pause
- Per-channel history (last 10 items)
- Download to a local library and play offline
- Loop toggle and restart controls
- Lightweight terminal UI

## Requirements

- Node.js
- mpv
- yt-dlp

macOS install:

```bash
brew install mpv yt-dlp
```

## Install and Run

From this repo:

```bash
npm install
npm run build
node dist/index.js
```

Optional global install:

```bash
npm install -g .
focus
```

## Keyboard Controls

- `1` / `2` select channel 1 or 2
- `Tab` toggle active channel
- `v` or `i` enter URL input
- `p` play/pause
- `r` restart
- `l` toggle loop
- `d` download current track to library
- `→` / `←` volume up/down
- `Alt+1`..`Alt+9` play from history (active channel)
- `Shift+1`..`Shift+9` play from library (active channel)
- `Ctrl+X` delete most recent library item (active channel)
- `Alt+C` clear history (active channel)
- `q` or `Ctrl+C` quit

## Data Storage

- History and library metadata: `~/.focus-bgm/history.db`
- Downloads: `~/.focus-bgm/downloads-channel-0` and `~/.focus-bgm/downloads-channel-1`

## Troubleshooting

- If audio fails, verify `mpv --version` and `yt-dlp --version`.
- If a download fails, try another video or rerun `yt-dlp <url>` to verify access.
- If the UI does not render, try another terminal (iTerm2, Terminal.app, or VS Code).

## License

MIT
