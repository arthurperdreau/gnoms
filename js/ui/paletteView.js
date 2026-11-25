/**
 * @file paletteView.js
 * Displays the available cards, with a level filter. Tapping a card asks
 * main.js to add it to the algorithm. No drag and drop.
 */

import { LEVELS } from '../config.js';
import { TEXTS } from '../i18n.js';
import { getCardsByLevel } from '../logic/cards.js';

export class PaletteView {
  /**
   * @param {HTMLElement} listElement The #palette <ul>.
   * @param {HTMLElement} filterElement The #level-filter container.
   * @param {{onCardTap: (cardId: string) => void, onLevelChange: (level: number|null) => void}} callbacks
   */
  constructor(listElement, filterElement, callbacks) {
    this.list = listElement;
    this.filter = filterElement;
    this.callbacks = callbacks;
    /** @type {boolean} */
    this.locked = false;
    /** @type {boolean} Last value of canAdd, to restore buttons after unlocking. */
    this.canAdd = true;

    this.buildFilter();
    this.bindEvents();
  }

  /**
   * Create the filter buttons: "All" + one per LEVELS value.
   * @returns {void}
   */
  buildFilter() {
    const makeButton = (label, level) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--level';
      button.setAttribute('role', 'radio');
      button.dataset.level = level === null ? '' : String(level);
      button.textContent = label;
      return button;
    };

    this.filter.replaceChildren(
      makeButton(TEXTS.levelAll, null),
      ...Object.values(LEVELS).map((level) => makeButton(TEXTS.levels[level], level)),
    );
  }

  /**
   * Event delegation for the filter and the cards.
   * @returns {void}
   */
  bindEvents() {
    this.filter.addEventListener('click', (event) => {
      const button = /** @type {HTMLElement} */ (event.target).closest('.btn--level');
      if (!button) return;
      const level = button.dataset.level === '' ? null : Number(button.dataset.level);
      this.callbacks.onLevelChange(level);
    });

    this.list.addEventListener('click', (event) => {
      if (this.locked) return;
      const card = /** @type {HTMLButtonElement} */ (event.target).closest('.card[data-card-id]');
      if (!card || card.disabled) return;
      this.callbacks.onCardTap(card.dataset.cardId);
    });
  }

  /**
   * Render the cards of the current level.
   * @param {number|null} level Current filter.
   * @param {boolean} canAdd false when the card limit is reached (cards are disabled).
   * @returns {void}
   */
  render(level, canAdd) {
    this.canAdd = canAdd;
    for (const button of this.filter.querySelectorAll('.btn--level')) {
      const buttonLevel = button.dataset.level === '' ? null : Number(button.dataset.level);
      button.setAttribute('aria-checked', String(buttonLevel === level));
    }
    const enabled = canAdd && !this.locked;
    this.list.replaceChildren(...getCardsByLevel(level).map((def) => this.createCardElement(def, enabled)));
  }

  /**
   * Build one palette card.
   * @param {import('../logic/cards.js').CardDefinition} def
   * @param {boolean} enabled
   * @returns {HTMLLIElement}
   */
  createCardElement(def, enabled) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card card--${def.family}`;
    button.dataset.cardId = def.id;
    button.disabled = !enabled;

    const label = document.createElement('span');
    label.className = 'card__label';
    label.textContent = TEXTS.cards[def.id];

    const level = document.createElement('span');
    level.className = 'card__level';
    level.textContent = TEXTS.levels[def.level];

    button.append(label, level);
    item.append(button);
    return item;
  }

  /**
   * Lock / unlock the palette during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    this.locked = locked;
    for (const button of this.list.querySelectorAll('.card')) {
      button.disabled = locked || !this.canAdd;
    }
  }
}
