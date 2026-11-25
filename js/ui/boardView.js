/**
 * @file boardView.js
 * Draws the garden: the printed board picture, with one transparent button
 * per square laid exactly over the grid of the picture. Forwards taps on
 * squares. Reads the Board and gnome state but NEVER modifies them.
 *
 * The printed squares (footprints, treasure, mushrooms, burrows, roots,
 * rakes) are already on the picture: only the rocks added by the player and
 * the gnome are drawn on top.
 */

import { CELL_TYPES, STEP_EVENTS } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Paths of the icons, relative to index.html. */
export const ICONS = Object.freeze({
  gnome: 'assets/icons/gnome.svg',
  obstacle: 'assets/icons/obstacle.svg',
  treasure: 'assets/icons/treasure.svg',
});

/** Every `cell--<type>` class, to remove them before applying the new one. */
const CELL_TYPE_CLASSES = Object.values(CELL_TYPES).map((type) => `cell--${type}`);

/** Temporary effect classes. */
const EFFECT_CLASSES = ['cell--trail', 'cell--blocked', 'cell--victory'];

/** Events that move the gnome to a new square (they leave a trail). */
const MOVE_EVENTS = new Set([
  STEP_EVENTS.MOVED, STEP_EVENTS.TREASURE, STEP_EVENTS.MUSHROOM,
  STEP_EVENTS.SLID, STEP_EVENTS.PUSHED,
]);

export class BoardView {
  /**
   * @param {HTMLElement} rootElement The #board element (the grid).
   * @param {HTMLElement} frameElement The #board-frame element (the picture).
   * @param {{onCellTap: (x: number, y: number) => void}} callbacks
   * @param {{
   *   width: number, height: number,
   *   image: typeof import('../config.js').BOARD_IMAGE,
   *   treasure: {x: number, y: number, width: number, height: number},
   * }} geometry
   */
  constructor(rootElement, frameElement, callbacks, geometry) {
    /** @type {HTMLElement} */
    this.root = rootElement;
    this.frame = frameElement;
    this.callbacks = callbacks;
    this.geometry = geometry;
    /** @type {HTMLButtonElement[][]} cellElements[y][x] */
    this.cellElements = [];
    /** @type {HTMLImageElement[][]} iconElements[y][x] */
    this.iconElements = [];
    /** @type {HTMLElement|null} The gnome element, moved from square to square. */
    this.gnomeElement = null;
    /** @type {boolean} */
    this.locked = false;

    this.placeOnPicture();
    this.buildGrid();
    this.bindEvents();
  }

  /**
   * Put the picture behind the grid and size the grid so its squares match
   * the squares drawn on the picture (percentages, so it scales with the screen).
   * @returns {void}
   */
  placeOnPicture() {
    const { image } = this.geometry;
    const { left, top, right, bottom } = image.grid;
    const percent = (value, total) => `${(value / total) * 100}%`;

    this.frame.style.backgroundImage = `url("${image.src}")`;
    this.frame.style.aspectRatio = `${image.width} / ${image.height}`;
    this.root.style.left = percent(left, image.width);
    this.root.style.top = percent(top, image.height);
    this.root.style.width = percent(right - left, image.width);
    this.root.style.height = percent(bottom - top, image.height);
  }

  /**
   * Create one square button per square, the treasure chest and the gnome element.
   * @returns {void}
   */
  buildGrid() {
    const { width, height, treasure } = this.geometry;
    this.root.replaceChildren();
    this.root.style.setProperty('--board-width', String(width));
    this.root.style.setProperty('--board-height', String(height));
    this.cellElements = [];
    this.iconElements = [];

    for (let y = 0; y < height; y++) {
      const cellRow = [];
      const iconRow = [];
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.style.gridColumn = String(x + 1);
        cell.style.gridRow = String(y + 1);

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

    // Treasure chest drawn over the whole treasure zone
    const chest = document.createElement('img');
    chest.className = 'board__treasure';
    chest.src = ICONS.treasure;
    chest.alt = '';
    chest.style.gridColumn = `${treasure.x + 1} / span ${treasure.width}`;
    chest.style.gridRow = `${treasure.y + 1} / span ${treasure.height}`;
    this.root.append(chest);

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
   * Full render: every square + the gnome.
   * @param {import('../logic/board.js').Board} board
   * @param {import('../logic/gnome.js').GnomeState} gnome Displayed gnome.
   * @param {import('../logic/gnome.js').GnomeState} [startGnome] To mark the start square.
   * @returns {void}
   */
  render(board, gnome, startGnome) {
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        this.updateCell(x, y, board.getCell(x, y));
        const isStart = Boolean(startGnome) && startGnome.x === x && startGnome.y === y
          && !(gnome.x === x && gnome.y === y);
        this.cellElements[y][x].classList.toggle('cell--start-gnome', isStart);
      }
    }
    this.renderGnome(gnome);
  }

  /**
   * Update the classes, icon and label of one square.
   * Only rocks get an icon: the other squares are printed on the picture.
   * @param {number} x
   * @param {number} y
   * @param {string} type A CELL_TYPES value.
   * @returns {void}
   */
  updateCell(x, y, type) {
    const cell = this.cellElements[y][x];
    cell.classList.remove(...CELL_TYPE_CLASSES);
    cell.classList.add(`cell--${type}`);

    const icon = this.iconElements[y][x];
    if (type === CELL_TYPES.OBSTACLE) {
      if (icon.getAttribute('src') !== ICONS.obstacle) icon.src = ICONS.obstacle;
      icon.hidden = false;
    } else {
      icon.hidden = true;
    }

    const typeName = TEXTS.squareTypes[type];
    const label = TEXTS.squareLabel(x, y);
    cell.setAttribute('aria-label', typeName ? `${label}, ${typeName}` : label);
  }

  /**
   * Move the gnome element onto its square, rotate it and play a small effect.
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

    if (MOVE_EVENTS.has(event)) cell.classList.add('cell--trail');
    if (event === STEP_EVENTS.BLOCKED) this.playEffect(cell, 'cell--blocked');
    if (event === STEP_EVENTS.TREASURE) this.playEffect(cell, 'cell--victory');
  }

  /**
   * Restart a CSS animation class on a square, and remove it when it ends.
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
   * Show the active mode on the grid (CSS hints use data-mode).
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
