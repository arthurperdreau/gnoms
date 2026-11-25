/**
 * @file board.js
 * Board model: an 11 x 11 grid of cell types. Pure logic, no DOM.
 *
 * Coordinates: x from 0 to BOARD_SIZE - 1 (left to right),
 *              y from 0 to BOARD_SIZE - 1 (top to bottom).
 * Storage: `cells[y][x]` holds a value of CELL_TYPES.
 */

import { BOARD_SIZE, TREASURE_POSITION, CELL_TYPES } from '../config.js';

/**
 * Cell types that stop the gnome. The board edge is also treated as blocking
 * (see `isBlocking`). Add future blocking obstacles here.
 */
export const BLOCKING_TYPES = Object.freeze(new Set([CELL_TYPES.WALL]));

/** All valid cell type values, for validation. */
const VALID_TYPES = new Set(Object.values(CELL_TYPES));

export class Board {
  /**
   * Create an empty board with the treasure on its fixed cell.
   * @param {number} [size=BOARD_SIZE] Width and height of the grid.
   */
  constructor(size = BOARD_SIZE) {
    /** @type {number} */
    this.size = size;
    /** @type {string[][]} cells[y][x] */
    this.cells = [];
    this.reset();
  }

  /**
   * Fill the whole grid with CELL_TYPES.EMPTY, then put CELL_TYPES.TREASURE
   * at TREASURE_POSITION. Removes every wall.
   * @returns {void}
   */
  reset() {
    this.cells = Array.from({ length: this.size }, () => Array(this.size).fill(CELL_TYPES.EMPTY));
    if (this.isInside(TREASURE_POSITION.x, TREASURE_POSITION.y)) {
      this.cells[TREASURE_POSITION.y][TREASURE_POSITION.x] = CELL_TYPES.TREASURE;
    }
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
   * Read the type of a cell.
   * @param {number} x
   * @param {number} y
   * @returns {string|null} A CELL_TYPES value, or null if outside the board.
   */
  getCell(x, y) {
    return this.isInside(x, y) ? this.cells[y][x] : null;
  }

  /**
   * Low-level setter used by placeWall/removeWall (and later by other obstacles).
   * The treasure cell can never be changed.
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {boolean} true if the cell was changed.
   */
  setCell(x, y, type) {
    if (!this.isInside(x, y) || this.isTreasure(x, y)) return false;
    if (!VALID_TYPES.has(type) || type === CELL_TYPES.TREASURE) return false;
    this.cells[y][x] = type;
    return true;
  }

  /**
   * Check if a cell is the treasure.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isTreasure(x, y) {
    return this.getCell(x, y) === CELL_TYPES.TREASURE;
  }

  /**
   * Check if a wall can be placed on a cell.
   * Forbidden on the treasure, on the gnome's cell and outside the board.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition] Current gnome position, if any.
   * @returns {boolean}
   */
  canPlaceWall(x, y, gnomePosition) {
    if (!this.isInside(x, y) || this.isTreasure(x, y)) return false;
    if (gnomePosition && gnomePosition.x === x && gnomePosition.y === y) return false;
    return true;
  }

  /**
   * Place a wall on a cell if allowed.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the wall was placed.
   */
  placeWall(x, y, gnomePosition) {
    if (!this.canPlaceWall(x, y, gnomePosition)) return false;
    return this.setCell(x, y, CELL_TYPES.WALL);
  }

  /**
   * Remove a wall (the cell becomes empty). Does nothing on other types.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if a wall was removed.
   */
  removeWall(x, y) {
    if (this.getCell(x, y) !== CELL_TYPES.WALL) return false;
    return this.setCell(x, y, CELL_TYPES.EMPTY);
  }

  /**
   * Toggle a wall: remove it if present, otherwise try to place it.
   * Used by the "wall" mode of the toolbar.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the board changed.
   */
  toggleWall(x, y, gnomePosition) {
    if (this.getCell(x, y) === CELL_TYPES.WALL) return this.removeWall(x, y);
    return this.placeWall(x, y, gnomePosition);
  }

  /**
   * Remove every wall but keep the treasure (and other obstacles).
   * @returns {void}
   */
  clearWalls() {
    for (const row of this.cells) {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === CELL_TYPES.WALL) row[x] = CELL_TYPES.EMPTY;
      }
    }
  }

  /**
   * Check if a cell stops the gnome. The board edge counts as a wall.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if outside the board or the type is in BLOCKING_TYPES.
   */
  isBlocking(x, y) {
    if (!this.isInside(x, y)) return true;
    return BLOCKING_TYPES.has(this.getCell(x, y));
  }

  /**
   * Check if the gnome may stand on a cell (used when placing the gnome).
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
