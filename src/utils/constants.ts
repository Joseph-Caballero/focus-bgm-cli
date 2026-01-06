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
  TAB: 'TAB',
  TOGGLE_PAUSE: 'p',
  VOLUME_UP: 'right',
  VOLUME_DOWN: 'left',
  QUIT: 'q',
  QUIT_CTRL_C: 'C-c',
  ENTER: 'enter',
  ESCAPE: 'escape',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
} as const;

export const HELP_TEXT = {
  p: 'Play/Pause',
  leftRight: 'Volume',
  tab: 'Switch',
  oneTwo: 'Select',
  q: 'Quit',
};
