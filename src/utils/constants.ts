export const CONSTANTS = {
  VOLUME_STEP: 5,
  MIN_VOLUME: 0,
  MAX_VOLUME: 100,
  DEFAULT_VOLUME: 80,
  STATUS_BAR_HEIGHT: 3,
};

export const KEY_BINDINGS = {
  CHANNEL_1: '1',
  CHANNEL_2: '2',
  TAB: 'tab',
  TOGGLE_PAUSE: 'p',
  VOLUME_UP: 'right',
  VOLUME_DOWN: 'left',
  QUIT: 'q',
  QUIT_CTRL_C: 'C-c',
  ENTER: 'enter',
  ESCAPE: 'escape',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
  RESTART: 'r',
  DOWNLOAD: 'd',
  TOGGLE_LOOP: 'l',
  PLAY_LIBRARY_BASE: 'S-1',
  REMOVE_FROM_LIBRARY: 'C-x',
} as const;

export const HELP_TEXT = {
  p: 'Play/Pause',
  r: 'Restart',
  d: 'Download',
  l: 'Loop',
  leftRight: 'Volume',
  tab: 'Switch',
  oneTwo: 'Select',
  q: 'Quit',
  lib: 'Library',
  clear: 'Clear History',
};
