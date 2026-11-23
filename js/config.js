/**
 * @file config.js
 * Global constants of the simulator. No DOM access here: this file is
 * imported both by the logic (testable with Node) and by the UI.
 *
 * Change a value here instead of hard-coding it elsewhere.
 */

/** Width and height of the square board (cells). */
export const BOARD_SIZE = 11;

/** Fixed position of the treasure (center of the board). */
export const TREASURE_POSITION = Object.freeze({ x: 5, y: 5 });

/**
 * Directions of the gnome and the vector to move one cell forward.
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
 * Directions in clockwise order. Turning right = next index,
 * turning left = previous index, U-turn = index + 2 (modulo 4).
 */
export const DIRECTION_ORDER = Object.freeze(['N', 'E', 'S', 'W']);

/**
 * Cell types. Only EMPTY, WALL and TREASURE are used in this first version.
 * BURROW, ROOT and RAKE are reserved for the obstacles of the physical game:
 * their effect will be handled in `applyCellEffect()` in js/logic/interpreter.js.
 */
export const CELL_TYPES = Object.freeze({
  EMPTY: 'empty',
  WALL: 'wall',
  TREASURE: 'treasure',
  // --- Future obstacles (not implemented yet) ---
  BURROW: 'burrow', // sends the gnome back to its start cell
  ROOT: 'root',     // the gnome slides straight until the next obstacle
  RAKE: 'rake',     // pushes the gnome 2 cells back, opposite to its arrival
});

/** Maximum number of cards in one algorithm, nested cards included. */
export const MAX_CARDS = 5;

/** Safety limit: the interpreter stops after this many steps (infinite / too long loops). */
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
  MOVE: 'move',
  LOOP: 'loop',
  CONDITION: 'condition',
});

/** Events recorded in each step returned by the interpreter. */
export const STEP_EVENTS = Object.freeze({
  START: 'start',       // initial state, before any card
  MOVED: 'moved',
  BLOCKED: 'blocked',
  TURNED: 'turned',
  CHECKED: 'checked',   // a condition was evaluated (no movement)
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
  WALL: 'wall',
  DIRECTION: 'direction',
});

/** Default gnome when the page loads. */
export const DEFAULT_GNOME = Object.freeze({ x: 0, y: 10, direction: 'N' });
