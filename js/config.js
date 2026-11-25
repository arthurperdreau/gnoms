/**
 * @file config.js
 * Global constants of the simulator. No DOM access here: this file is
 * imported both by the logic (testable with Node) and by the UI.
 *
 * Change a value here instead of hard-coding it elsewhere.
 */

/**
 * Square types. A board is a grid of these values.
 * Effects of the special squares are handled in `applySquareEffect()`
 * (js/logic/interpreter.js).
 */
export const CELL_TYPES = Object.freeze({
  EMPTY: 'empty',
  START: 'start',       // footprints: the gnome starts on one of them
  TREASURE: 'treasure', // the goal (a 2 x 2 zone on the board)
  OBSTACLE: 'obstacle', // rock added by the player; blocks the gnome
  MUSHROOM: 'mushroom', // the gnome moves 1 more square the way it was going
  BURROW: 'burrow',     // the gnome goes back to its start square
  ROOT: 'root',         // the gnome slides toward the tip of the root until it is blocked
  RAKE: 'rake',         // the gnome is pushed 2 squares back, opposite to where it came from
});

/**
 * @typedef {Object} BoardLayout
 * @property {number} width   Number of columns.
 * @property {number} height  Number of rows.
 * @property {{x: number, y: number, width: number, height: number}} treasure Treasure zone.
 * @property {Array<[number, number]>} starts Start squares (footprints), as [x, y].
 * @property {Partial<Record<string, Array<[number, number]>>>} squares Special squares per CELL_TYPES value (roots excepted).
 * @property {Array<{squares: Array<[number, number]>, tip: 'N'|'E'|'S'|'W'}>} [roots]
 *   Roots: the squares they cover and the direction their tip points to.
 */

/**
 * The printed Gnomads board (assets/img/board.png): 14 columns x 13 rows.
 * Coordinates: x from 0 (left) to width - 1, y from 0 (top) to height - 1.
 * Everything else (grid, CSS columns, treasure, tests) derives from this object.
 * @type {Readonly<BoardLayout>}
 */
export const BOARD_LAYOUT = Object.freeze({
  width: 14,
  height: 13,
  treasure: { x: 6, y: 5, width: 2, height: 2 },
  starts: [[0, 0], [13, 0], [0, 12], [13, 12]],
  squares: {
    [CELL_TYPES.MUSHROOM]: [[6, 1], [9, 2], [0, 3], [5, 4], [12, 5], [1, 6], [5, 8], [11, 9], [1, 11], [7, 11]],
    [CELL_TYPES.BURROW]: [[9, 0], [2, 3], [10, 6], [3, 10]],
    [CELL_TYPES.RAKE]: [[8, 3], [4, 6], [11, 11], [4, 12]],
  },
  // Each root covers 2 squares. The tip is the thin end, opposite to the rock
  // at the base of the root on the picture.
  roots: [
    { squares: [[2, 1], [3, 1]], tip: 'W' },
    { squares: [[11, 2], [12, 2]], tip: 'W' },
    { squares: [[8, 7], [8, 8]], tip: 'S' },
    { squares: [[1, 8], [1, 9]], tip: 'N' },
  ],
});

/**
 * Where the grid is drawn in the board picture, in pixels of the picture.
 * Used by the UI only, to place the clickable squares exactly on the drawing.
 */
export const BOARD_IMAGE = Object.freeze({
  src: 'assets/img/board.png',
  width: 1798,
  height: 1699,
  grid: Object.freeze({ left: 101, top: 114, right: 1688, bottom: 1587 }),
});

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
  // Moves caused by a special square
  MUSHROOM: 'mushroom', // one more square
  BURROW: 'burrow',     // back to the start square
  SLID: 'slid',         // one square of a root slide
  PUSHED: 'pushed',     // one square pushed back by a rake
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

/** Default gnome when the page loads: bottom-left footprints, looking North. */
export const DEFAULT_GNOME = Object.freeze({
  x: BOARD_LAYOUT.starts[2][0],
  y: BOARD_LAYOUT.starts[2][1],
  direction: 'N',
});
