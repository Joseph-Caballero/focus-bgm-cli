export const UI_STYLES = {
  COLORS: {
    DEFAULT: 'white',
    ACTIVE: 'green',
    INACTIVE: 'white',
    ERROR: 'red',
    WARNING: 'yellow',
    SUCCESS: 'green',
    BORDER: 'blue',
    BORDER_ACTIVE: 'cyan',
  },
  ICONS: {
    PLAYING: '▶',
    PAUSED: '⏸',
    LOADING: '⏳',
    EMPTY: '○',
    ACTIVE: '●',
  },
  BORDERS: {
    INACTIVE: { type: 'line' as const, fg: 'blue' },
    ACTIVE: { type: 'double' as const, fg: 'cyan' },
  },
} as const;
