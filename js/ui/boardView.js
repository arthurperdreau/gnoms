/**
 * @file boardView.js
 * Draws the 11 x 11 grid in the DOM and forwards taps on cells.
 * Reads the Board and gnome state but NEVER modifies them.
 */

import { BOARD_SIZE, CELL_TYPES, STEP_EVENTS } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Paths of the icons, relative to index.html. */
export const ICONS = Object.freeze({
  gnome: 'assets/icons/gnome.svg',
  wall: 'assets/icons/wall.svg',
  treasure: 'assets/icons/treasure.svg',
});

export class BoardView {
  /**
   * @param {HTMLElement} rootElement The #board element.
   * @param {{onCellTap: (x: number, y: number) => void}} callbacks
   */
  constructor(rootElement, callbacks) {
    /** @type {HTMLElement} */
    this.root = rootElement;
    this.callbacks = callbacks;
    /** @type {HTMLButtonElement[][]} cellElements[y][x] */
    this.cellElements = [];
    /** @type {HTMLElement|null} The gnome element, moved from cell to cell. */
    this.gnomeElement = null;
    /** @type {boolean} */
    this.locked = false;

    // TODO: this.buildGrid(); this.bindEvents();
  }

  /**
   * Create the BOARD_SIZE x BOARD_SIZE cell buttons once.
   * Each cell is a <button class="cell" data-x data-y role="gridcell"> with an
   * aria-label like "x 3, y 7". Also create the gnome element
   * (<div class="gnome"><img src=ICONS.gnome alt=""></div>).
   * @returns {void}
   */
  buildGrid() {
    // TODO: clear this.root, set style --board-size to BOARD_SIZE.
    // TODO: double loop y then x (row order = DOM order for CSS Grid).
    // TODO: store each button in this.cellElements[y][x].
  }

  /**
   * One click listener on the grid (event delegation), works with touch.
   * Reads data-x / data-y from the closest .cell and calls callbacks.onCellTap.
   * Ignores taps while this.locked.
   * @returns {void}
   */
  bindEvents() {
    // TODO: this.root.addEventListener('click', ...).
  }

  /**
   * Full render: every cell + the gnome.
   * @param {import('../logic/board.js').Board} board
   * @param {import('../logic/gnome.js').GnomeState} gnome Displayed gnome.
   * @param {import('../logic/gnome.js').GnomeState} [startGnome] To mark the start cell.
   * @returns {void}
   */
  render(board, gnome, startGnome) {
    // TODO: for each cell -> this.updateCell(x, y, board.getCell(x, y)).
    // TODO: mark the start cell with .cell--start (when gnome is not on it).
    // TODO: this.renderGnome(gnome).
  }

  /**
   * Update the classes and icon of one cell.
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {void}
   */
  updateCell(x, y, type) {
    // TODO: remove previous .cell--<type> classes, add `cell--${type}` unless EMPTY.
    // TODO: show the wall / treasure icon (img) for WALL and TREASURE.
    // TODO: update aria-label with the type for screen readers.
  }

  /**
   * Move the gnome element into its cell and rotate it.
   * @param {import('../logic/gnome.js').GnomeState} gnome
   * @param {string} [event] STEP_EVENTS value, to play a small effect
   *   (BLOCKED -> .cell--blocked shake, TREASURE -> .cell--victory).
   * @returns {void}
   */
  renderGnome(gnome, event) {
    // TODO: append this.gnomeElement to cellElements[gnome.y][gnome.x].
    // TODO: set className to `gnome gnome--${gnome.direction}`.
    // TODO: set aria-label "Gnome facing <TEXTS.directions[dir]>".
    // TODO: add the effect class, remove it on 'animationend'.
    // TODO: optional: add .cell--trail to the cells already visited during the run.
  }

  /**
   * Remove the run trail and effect classes (used by "Reset gnome").
   * @returns {void}
   */
  clearEffects() {
    // TODO: remove .cell--trail, .cell--blocked, .cell--victory from all cells.
  }

  /**
   * Show the active mode on the grid (CSS hover hints use data-mode).
   * @param {string} mode A TOOL_MODES value.
   * @returns {void}
   */
  setMode(mode) {
    // TODO: this.root.dataset.mode = mode.
  }

  /**
   * Lock / unlock taps during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    // TODO: this.locked = locked; toggle .is-running on this.root.
  }
}
