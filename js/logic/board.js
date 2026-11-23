/**
 * @file board.js
 * Board model: an 11 x 11 grid of cell types. Pure logic, no DOM.
 *
 * Coordinates: x from 0 to BOARD_SIZE - 1 (left to right),
 *              y from 0 to BOARD_SIZE - 1 (top to bottom).
 * Storage suggestion: `cells[y][x]` holds a value of CELL_TYPES.
 */

import { BOARD_SIZE, TREASURE_POSITION, CELL_TYPES } from '../config.js';

/**
 * Cell types that stop the gnome. The board edge is also treated as blocking
 * (see `isBlocking`). Add future blocking obstacles here.
 */
export const BLOCKING_TYPES = Object.freeze(new Set([CELL_TYPES.WALL]));

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
    // TODO: call this.reset() to fill the grid.
  }

  /**
   * Fill the whole grid with CELL_TYPES.EMPTY, then put CELL_TYPES.TREASURE
   * at TREASURE_POSITION. Removes every wall.
   * @returns {void}
   */
  reset() {
    // TODO: build a new 2D array of size x size filled with CELL_TYPES.EMPTY
    //       (use Array.from so each row is a different array).
    // TODO: set the treasure cell.
  }

  /**
   * Check if a position is inside the board.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if 0 <= x < size and 0 <= y < size.
   */
  isInside(x, y) {
    // TODO: return the bounds check. Also reject non-integer values.
  }

  /**
   * Read the type of a cell.
   * @param {number} x
   * @param {number} y
   * @returns {string|null} A CELL_TYPES value, or null if outside the board.
   */
  getCell(x, y) {
    // TODO: return null when !this.isInside(x, y), otherwise this.cells[y][x].
  }

  /**
   * Low-level setter used by placeWall/removeWall (and later by other obstacles).
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {boolean} true if the cell was changed.
   */
  setCell(x, y, type) {
    // TODO: refuse if outside the board, or if the cell is the treasure.
    // TODO: refuse unknown types (check Object.values(CELL_TYPES)).
    // TODO: write the value and return true.
  }

  /**
   * Check if a cell is the treasure.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isTreasure(x, y) {
    // TODO: compare getCell(x, y) with CELL_TYPES.TREASURE.
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
    // TODO: return false if outside, if treasure, or if (x, y) equals gnomePosition.
  }

  /**
   * Place a wall on a cell if allowed.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} [gnomePosition]
   * @returns {boolean} true if the wall was placed.
   */
  placeWall(x, y, gnomePosition) {
    // TODO: use canPlaceWall, then setCell(x, y, CELL_TYPES.WALL).
  }

  /**
   * Remove a wall (the cell becomes empty). Does nothing on other types.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if a wall was removed.
   */
  removeWall(x, y) {
    // TODO: only act if getCell(x, y) === CELL_TYPES.WALL.
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
    // TODO: call removeWall or placeWall.
  }

  /**
   * Remove every wall but keep the treasure (and future obstacles if wanted).
   * @returns {void}
   */
  clearWalls() {
    // TODO: loop over all cells and replace CELL_TYPES.WALL with CELL_TYPES.EMPTY.
  }

  /**
   * Check if a cell stops the gnome. The board edge counts as a wall.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if outside the board or the type is in BLOCKING_TYPES.
   */
  isBlocking(x, y) {
    // TODO: return true when !isInside(x, y).
    // TODO: return BLOCKING_TYPES.has(getCell(x, y)).
  }

  /**
   * Check if the gnome may stand on a cell (used when placing the gnome).
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if inside, not blocking and not the treasure.
   */
  canPlaceGnome(x, y) {
    // TODO: implement.
  }

  /**
   * Deep copy of the board (the interpreter must never modify the real board).
   * @returns {Board}
   */
  clone() {
    // TODO: create a new Board(this.size) and copy each row (row.slice()).
  }
}
