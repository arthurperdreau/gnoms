/**
 * @file board.js
 * Board model: a grid of square types built from a BoardLayout
 * (the printed Gnomads board by default). Pure logic, no DOM.
 *
 * Coordinates: x from 0 to width - 1 (left to right),
 *              y from 0 to height - 1 (top to bottom).
 * Storage: `cells[y][x]` holds a value of CELL_TYPES.
 *
 * The squares printed on the board (start, treasure, mushroom, burrow, root,
 * rake) are fixed. The player can only add or remove rocks (OBSTACLE) on
 * empty squares.
 */

import { BOARD_LAYOUT, CELL_TYPES } from '../config.js';

/**
 * Square types that block the gnome. The board edge also blocks it
 * (see `isBlocking`).
 */
export const BLOCKING_TYPES = Object.freeze(new Set([CELL_TYPES.OBSTACLE]));

export class Board {
  /**
   * Create a board from a layout.
   * @param {import('../config.js').BoardLayout} [layout=BOARD_LAYOUT]
   */
  constructor(layout = BOARD_LAYOUT) {
    /** @type {import('../config.js').BoardLayout} */
    this.layout = layout;
    /** @type {number} */
    this.width = layout.width;
    /** @type {number} */
    this.height = layout.height;
    /** @type {string[][]} cells[y][x] */
    this.cells = [];
    /** @type {Map<string, 'N'|'E'|'S'|'W'>} "x,y" of a root square -> direction of the root's tip */
    this.rootTips = new Map();
    this.reset();
  }

  /**
   * Rebuild the grid from the layout: printed squares only, no rock.
   * @returns {void}
   */
  reset() {
    const { width, height, treasure, starts, squares = {}, roots = [] } = this.layout;
    this.cells = Array.from({ length: height }, () => Array(width).fill(CELL_TYPES.EMPTY));

    for (let y = treasure.y; y < treasure.y + treasure.height; y++) {
      for (let x = treasure.x; x < treasure.x + treasure.width; x++) {
        this.cells[y][x] = CELL_TYPES.TREASURE;
      }
    }
    for (const [x, y] of starts) this.cells[y][x] = CELL_TYPES.START;
    for (const [type, positions] of Object.entries(squares)) {
      for (const [x, y] of positions) this.cells[y][x] = type;
    }
    this.rootTips = new Map();
    for (const root of roots) {
      for (const [x, y] of root.squares) {
        this.cells[y][x] = CELL_TYPES.ROOT;
        this.rootTips.set(`${x},${y}`, root.tip);
      }
    }
  }

  /**
   * Direction the tip of a root points to.
   * @param {number} x
   * @param {number} y
   * @returns {'N'|'E'|'S'|'W'|null} null if the square is not a root.
   */
  getRootTip(x, y) {
    return this.rootTips.get(`${x},${y}`) ?? null;
  }

  /**
   * Check if a position is inside the board.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isInside(x, y) {
    return Number.isInteger(x) && Number.isInteger(y)
      && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * Read the type of a square.
   * @param {number} x
   * @param {number} y
   * @returns {string|null} A CELL_TYPES value, or null if outside the board.
   */
  getCell(x, y) {
    return this.isInside(x, y) ? this.cells[y][x] : null;
  }

  /**
   * Check if a square is part of the treasure zone.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isTreasure(x, y) {
    return this.getCell(x, y) === CELL_TYPES.TREASURE;
  }

  /**
   * Check if a square is a start square (footprints).
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isStart(x, y) {
    return this.getCell(x, y) === CELL_TYPES.START;
  }

  /**
   * Check if a rock can be placed on a square: only on an empty square
   * (never on a printed square), and not under the gnome.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean}
   */
  canPlaceObstacle(x, y, gnomePosition) {
    if (this.getCell(x, y) !== CELL_TYPES.EMPTY) return false;
    if (gnomePosition && gnomePosition.x === x && gnomePosition.y === y) return false;
    return true;
  }

  /**
   * Place a rock on a square if allowed.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the rock was placed.
   */
  placeObstacle(x, y, gnomePosition) {
    if (!this.canPlaceObstacle(x, y, gnomePosition)) return false;
    this.cells[y][x] = CELL_TYPES.OBSTACLE;
    return true;
  }

  /**
   * Remove a rock (the square becomes empty). Does nothing on other types.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if a rock was removed.
   */
  removeObstacle(x, y) {
    if (this.getCell(x, y) !== CELL_TYPES.OBSTACLE) return false;
    this.cells[y][x] = CELL_TYPES.EMPTY;
    return true;
  }

  /**
   * Toggle a rock: remove it if present, otherwise try to place it.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the board changed.
   */
  toggleObstacle(x, y, gnomePosition) {
    if (this.getCell(x, y) === CELL_TYPES.OBSTACLE) return this.removeObstacle(x, y);
    return this.placeObstacle(x, y, gnomePosition);
  }

  /**
   * Remove every rock. Printed squares stay.
   * @returns {void}
   */
  clearObstacles() {
    for (const row of this.cells) {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === CELL_TYPES.OBSTACLE) row[x] = CELL_TYPES.EMPTY;
      }
    }
  }

  /**
   * Check if a square blocks the gnome. The board edge blocks it too.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isBlocking(x, y) {
    if (!this.isInside(x, y)) return true;
    return BLOCKING_TYPES.has(this.getCell(x, y));
  }

  /**
   * Check if the gnome may start on a square: only on the footprints.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  canPlaceGnome(x, y) {
    return this.isStart(x, y);
  }

  /**
   * Deep copy of the board (the interpreter must never modify the real board).
   * @returns {Board}
   */
  clone() {
    const copy = new Board(this.layout);
    copy.cells = this.cells.map((row) => row.slice()); // rootTips are rebuilt from the layout
    return copy;
  }
}
