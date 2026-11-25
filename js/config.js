/**
 * @file config.js
 * Global constants of the simulator. No DOM access here: this file is
 * imported both by the logic (testable with Node) and by the UI.
 *
 * Change a value here instead of hard-coding it elsewhere.
 */

/**
 * Width and height of the square board, in squares.
 * Not decided yet by the team: every other file derives the size from here.
 */
export const BOARD_SIZE = 11;

/**
 * Center square of a board of a given size (the treasure).
 * @param {number} size
 * @returns {{x: number, y: number}}
 */
export function getTreasurePosition(size) {
  const center = Math.floor(size / 2);
  return { x: center, y: center };
}

/** Fixed position of the treasure on the default board. */
export const TREASURE_POSITION = Object.freeze(getTreasurePosition(BOARD_SIZE));

/**
 * Directions of the gnome and the vector to move one square forward.
 * y grows downward, so North is dy = -1.
 * @type {Readonly<Record<'N'|'E'|'S'|'W', {dx: number, dy: number}>>}
 */
export const DIRECTIONS = Object.freeze({
  N: Object.freeze({ dx: 0, dy: -1 }),
  E: Object.freeze({ dx: 1, dy: 0 }),
  S: Object.freeze({ dx: 0, dy: 1 }),
  W: Object.freeze({ dx: -1, dy: 0 }),
});

/**
 * Directions in clockwise order. Turning right (the gnome's right) = next index,
 * turning left = previous index, U-turn = index + 2 (modulo 4).
 */
export const DIRECTION_ORDER = Object.freeze(['N', 'E', 'S', 'W']);

/**
 * Square types. Only EMPTY, OBSTACLE and TREASURE are used in this version.
 * BURROW, ROOT and RAKE are reserved for the obstacles of the physical game:
 * their effect will be handled in `applySquareEffect()` in js/logic/interpreter.js.
 */
export const CELL_TYPES = Object.freeze({
  EMPTY: 'empty',
  OBSTACLE: 'obstacle', // shown as a rock; blocks the gnome
  TREASURE: 'treasure',
  // --- Future obstacles (not implemented yet) ---
  BURROW: 'burrow', // the gnome goes back to its start square
  ROOT: 'root',     // the gnome slides straight until it is blocked
  RAKE: 'rake',     // the gnome is pushed 2 squares back, opposite to where it came from
});

/** Maximum number of cards in one algorithm (a hand in the physical game), contained cards included. */
export const MAX_CARDS = 8;

/** Safety limit: the interpreter stops after this many steps (loops that are too long). */
export const MAX_STEPS = 200;

/** Delay between two animation steps, in milliseconds. */
export const ANIMATION_DELAY_MS = 400;

/** Card difficulty levels. */
export const LEVELS = Object.freeze({
  BEGINNER: 1,
  INTERMEDIATE: 2,
  EXPERT: 3,
});

/** Card families (used for colours and for the interpreter dispatch). */
export const CARD_FAMILIES = Object.freeze({
  MOVEMENT: 'movement',
  LOOP: 'loop',
  CONDITION: 'condition',
});

/** Events recorded in each step returned by the interpreter. */
export const STEP_EVENTS = Object.freeze({
  START: 'start',       // initial state, before any card
  MOVED: 'moved',
  BLOCKED: 'blocked',
  TURNED: 'turned',
  CHECKED: 'checked',   // an If card was evaluated (no movement)
  TREASURE: 'treasure',
});

/** Final status of a run, returned by the interpreter. */
export const RUN_STATUS = Object.freeze({
  TREASURE: 'treasure',       // the gnome reached the treasure
  FINISHED: 'finished',       // all cards executed
  MAX_STEPS: 'maxSteps',      // stopped by the MAX_STEPS safety
});

/** Edit modes of the toolbar. */
export const TOOL_MODES = Object.freeze({
  GNOME: 'gnome',
  OBSTACLE: 'obstacle',
  DIRECTION: 'direction',
});

/** Default gnome when the page loads: bottom-left square, looking North. */
export const DEFAULT_GNOME = Object.freeze({ x: 0, y: BOARD_SIZE - 1, direction: 'N' });
