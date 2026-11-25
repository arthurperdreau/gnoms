/**
 * @file board.js
 * Board model: a square grid of square types. Pure logic, no DOM.
 *
 * Coordinates: x from 0 to size - 1 (left to right),
 *              y from 0 to size - 1 (top to bottom).
 * Storage: `cells[y][x]` holds a value of CELL_TYPES.
 */

import { BOARD_SIZE, CELL_TYPES, getTreasurePosition } from '../config.js';

/**
 * Square types that block the gnome. The board edge also blocks it
 * (see `isBlocking`). Add future blocking obstacles here.
 */
export const BLOCKING_TYPES = Object.freeze(new Set([CELL_TYPES.OBSTACLE]));

/** All valid square type values, for validation. */
const VALID_TYPES = new Set(Object.values(CELL_TYPES));

export class Board {
  /**
   * Create an empty board with the treasure on its center square.
   * @param {number} [size=BOARD_SIZE] Width and height of the grid.
   */
  constructor(size = BOARD_SIZE) {
    /** @type {number} */
    this.size = size;
    /** @type {{x: number, y: number}} Center square, computed from the size. */
    this.treasure = getTreasurePosition(size);
    /** @type {string[][]} cells[y][x] */
    this.cells = [];
    this.reset();
  }

  /**
   * Fill the whole grid with CELL_TYPES.EMPTY, then put the treasure on the
   * center square. Removes every obstacle.
   * @returns {void}
   */
  reset() {
    this.cells = Array.from({ length: this.size }, () => Array(this.size).fill(CELL_TYPES.EMPTY));
    this.cells[this.treasure.y][this.treasure.x] = CELL_TYPES.TREASURE;
  }

  /**
   * Check if a position is inside the board.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if 0 <= x < size and 0 <= y < size.
   */
  isInside(x, y) {
    return Number.isInteger(x) && Number.isInteger(y)
      && x >= 0 && y >= 0 && x < this.size && y < this.size;
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
   * Low-level setter used by placeObstacle/removeObstacle (and later by other
   * obstacles). The treasure square can never be changed.
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {boolean} true if the square was changed.
   */
  setCell(x, y, type) {
    if (!this.isInside(x, y) || this.isTreasure(x, y)) return false;
    if (!VALID_TYPES.has(type) || type === CELL_TYPES.TREASURE) return false;
    this.cells[y][x] = type;
    return true;
  }

  /**
   * Check if a square is the treasure.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isTreasure(x, y) {
    return this.getCell(x, y) === CELL_TYPES.TREASURE;
  }

  /**
   * Check if an obstacle can be placed on a square.
   * Forbidden on the treasure, on the gnome's square and outside the board.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition] Current gnome position, if any.
   * @returns {boolean}
   */
  canPlaceObstacle(x, y, gnomePosition) {
    if (!this.isInside(x, y) || this.isTreasure(x, y)) return false;
    if (gnomePosition && gnomePosition.x === x && gnomePosition.y === y) return false;
    return true;
  }

  /**
   * Place an obstacle on a square if allowed.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the obstacle was placed.
   */
  placeObstacle(x, y, gnomePosition) {
    if (!this.canPlaceObstacle(x, y, gnomePosition)) return false;
    return this.setCell(x, y, CELL_TYPES.OBSTACLE);
  }

  /**
   * Remove an obstacle (the square becomes empty). Does nothing on other types.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if an obstacle was removed.
   */
  removeObstacle(x, y) {
    if (this.getCell(x, y) !== CELL_TYPES.OBSTACLE) return false;
    return this.setCell(x, y, CELL_TYPES.EMPTY);
  }

  /**
   * Toggle an obstacle: remove it if present, otherwise try to place it.
   * Used by the "obstacle" mode of the toolbar.
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
   * Remove every obstacle but keep the treasure.
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
   * @returns {boolean} true if outside the board or the type is in BLOCKING_TYPES.
   */
  isBlocking(x, y) {
    if (!this.isInside(x, y)) return true;
    return BLOCKING_TYPES.has(this.getCell(x, y));
  }

  /**
   * Check if the gnome may stand on a square (used when placing the gnome).
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if inside, not blocking and not the treasure.
   */
  canPlaceGnome(x, y) {
    return this.isInside(x, y) && !this.isBlocking(x, y) && !this.isTreasure(x, y);
  }

  /**
   * Deep copy of the board (the interpreter must never modify the real board).
   * @returns {Board}
   */
  clone() {
    const copy = new Board(this.size);
    copy.cells = this.cells.map((row) => row.slice());
    return copy;
  }
}
