import * as blessed from 'blessed';

/**
 * Extended BlessedProgram interface that includes internal methods
 * used for cursor manipulation that aren't exposed in @types/blessed
 */
export interface ExtendedBlessedProgram extends blessed.BlessedProgram {
  /** Stored reference to original showCursor for restoration */
  _originalShowCursor?: () => boolean;
  /** Internal method to write directly to the terminal */
  _write(data: string): boolean;
}

/**
 * Interface for accessing the internal cursor shape override.
 * Blessed accepts a { ch: string } object to render a custom character
 * as the cursor, but this isn't documented in the official types.
 */
export interface ScreenWithCursorOverride {
  cursor: {
    shape: { ch: string };
  };
}

/**
 * Extended border interface that accepts string colors (which blessed supports)
 * but @types/blessed incorrectly types as numbers only
 */
export interface ExtendedBorder {
  type?: 'line' | 'bg';
  ch?: string;
  bg?: number | string;
  fg?: number | string;
}

/**
 * Extended box interface for internal methods not exposed in @types/blessed.
 * Note: strWidth exists on BoxElement but returns string in types, number in reality.
 * We use Omit to override the incorrect type.
 */
export interface ExtendedBoxElement extends Omit<blessed.Widgets.BoxElement, 'strWidth'> {
  strWidth?(text: string): number;
  _getCoords?(): { xi: number; yi: number; xl: number; yl: number } | null;
}
