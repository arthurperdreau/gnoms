/**
 * @file boardView.js
 * Draws the garden grid in the DOM and forwards taps on squares.
 * The grid size comes from the Board (BOARD_SIZE by default).
 * Reads the Board and gnome state but NEVER modifies them.
 */

import { BOARD_SIZE, CELL_TYPES, STEP_EVENTS } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Paths of the icons, relative to index.html. */
export const ICONS = Object.freeze({
  gnome: 'assets/icons/gnome.svg',
  obstacle: 'assets/icons/obstacle.svg',
  treasure: 'assets/icons/treasure.svg',
});

/** Icon shown for each cell type (types without an icon only get a colour). */
const CELL_ICONS = Object.freeze({
  [CELL_TYPES.OBSTACLE]: ICONS.obstacle,
  [CELL_TYPES.TREASURE]: ICONS.treasure,
});

/** Every `cell--<type>` class, to remove them before applying the new one. */
const CELL_TYPE_CLASSES = Object.values(CELL_TYPES).map((type) => `cell--${type}`);

/** Temporary effect classes. */
const EFFECT_CLASSES = ['cell--trail', 'cell--blocked', 'cell--victory'];

export class BoardView {
  /**
   * @param {HTMLElement} rootElement The #board element.
   * @param {{onCellTap: (x: number, y: number) => void}} callbacks
   * @param {number} [size=BOARD_SIZE] Number of squares per side.
   */
  constructor(rootElement, callbacks, size = BOARD_SIZE) {
    /** @type {number} */
    this.size = size;
    /** @type {HTMLElement} */
    this.root = rootElement;
    this.callbacks = callbacks;
    /** @type {HTMLButtonElement[][]} cellElements[y][x] */
    this.cellElements = [];
    /** @type {HTMLImageElement[][]} iconElements[y][x] */
    this.iconElements = [];
    /** @type {HTMLElement|null} The gnome element, moved from cell to cell. */
    this.gnomeElement = null;
    /** @type {boolean} */
    this.locked = false;

    this.buildGrid();
    this.bindEvents();
  }

  /**
   * Create the size x size square buttons once, and the gnome element.
   * @returns {void}
   */
  buildGrid() {
    this.root.replaceChildren();
    this.root.style.setProperty('--board-size', String(this.size));
    this.cellElements = [];
    this.iconElements = [];

    for (let y = 0; y < this.size; y++) {
      const cellRow = [];
      const iconRow = [];
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);

        const icon = document.createElement('img');
        icon.className = 'cell__icon';
        icon.alt = '';
        icon.hidden = true;
        cell.append(icon);

        this.root.append(cell);
        cellRow.push(cell);
        iconRow.push(icon);
      }
      this.cellElements.push(cellRow);
      this.iconElements.push(iconRow);
    }

    this.gnomeElement = document.createElement('div');
    this.gnomeElement.className = 'gnome';
    const gnomeImg = document.createElement('img');
    gnomeImg.src = ICONS.gnome;
    gnomeImg.alt = '';
    this.gnomeElement.append(gnomeImg);
  }

  /**
   * One click listener on the grid (event delegation), works with touch.
   * @returns {void}
   */
  bindEvents() {
    this.root.addEventListener('click', (event) => {
      if (this.locked) return;
      const cell = /** @type {HTMLElement} */ (event.target).closest('.cell');
      if (!cell || !this.root.contains(cell)) return;
      this.callbacks.onCellTap(Number(cell.dataset.x), Number(cell.dataset.y));
    });
  }

  /**
   * Full render: every cell + the gnome.
   * @param {import('../logic/board.js').Board} board
   * @param {import('../logic/gnome.js').GnomeState} gnome Displayed gnome.
   * @param {import('../logic/gnome.js').GnomeState} [startGnome] To mark the start cell.
   * @returns {void}
   */
  render(board, gnome, startGnome) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.updateCell(x, y, board.getCell(x, y));
        const isStart = Boolean(startGnome) && startGnome.x === x && startGnome.y === y
          && !(gnome.x === x && gnome.y === y);
        this.cellElements[y][x].classList.toggle('cell--start', isStart);
      }
    }
    this.renderGnome(gnome);
  }

  /**
   * Update the classes and icon of one cell.
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {void}
   */
  updateCell(x, y, type) {
    const cell = this.cellElements[y][x];
    cell.classList.remove(...CELL_TYPE_CLASSES);
    if (type !== CELL_TYPES.EMPTY) cell.classList.add(`cell--${type}`);

    const icon = this.iconElements[y][x];
    const src = CELL_ICONS[type];
    if (src) {
      if (icon.getAttribute('src') !== src) icon.src = src;
      icon.hidden = false;
    } else {
      icon.hidden = true;
    }

    const typeName = TEXTS.squareTypes[type];
    const label = TEXTS.squareLabel(x, y);
    cell.setAttribute('aria-label', typeName ? `${label}, ${typeName}` : label);
  }

  /**
   * Move the gnome element into its cell, rotate it and play a small effect.
   * @param {import('../logic/gnome.js').GnomeState} gnome
   * @param {string} [event] STEP_EVENTS value.
   * @returns {void}
   */
  renderGnome(gnome, event) {
    const cell = this.cellElements[gnome.y]?.[gnome.x];
    if (!cell) return;
    if (this.gnomeElement.parentElement !== cell) cell.append(this.gnomeElement);

    this.gnomeElement.className = `gnome gnome--${gnome.direction}`;
    this.gnomeElement.setAttribute('aria-label', TEXTS.gnomeLabel(TEXTS.directions[gnome.direction]));
    this.gnomeElement.setAttribute('role', 'img');

    if (event === STEP_EVENTS.MOVED || event === STEP_EVENTS.TREASURE) {
      cell.classList.add('cell--trail');
    }
    if (event === STEP_EVENTS.BLOCKED) this.playEffect(cell, 'cell--blocked');
    if (event === STEP_EVENTS.TREASURE) this.playEffect(cell, 'cell--victory');
  }

  /**
   * Restart a CSS animation class on a cell, and remove it when it ends.
   * @param {HTMLElement} cell
   * @param {string} className
   * @returns {void}
   */
  playEffect(cell, className) {
    cell.classList.remove(className);
    void cell.offsetWidth; // force a reflow so the animation restarts
    cell.classList.add(className);
    cell.addEventListener('animationend', () => cell.classList.remove(className), { once: true });
  }

  /**
   * Remove the run trail and effect classes (used by "Reset gnome").
   * @returns {void}
   */
  clearEffects() {
    for (const row of this.cellElements) {
      for (const cell of row) cell.classList.remove(...EFFECT_CLASSES);
    }
  }

  /**
   * Show the active mode on the grid (CSS hover hints use data-mode).
   * @param {string} mode A TOOL_MODES value.
   * @returns {void}
   */
  setMode(mode) {
    this.root.dataset.mode = mode;
  }

  /**
   * Lock / unlock taps during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    this.locked = locked;
    this.root.classList.toggle('is-running', locked);
  }
}
