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

    // TODO: this.buildFilter(); this.bindEvents();
  }

  /**
   * Create the filter buttons: "All" + one per LEVELS value
   * (<button class="btn btn--level" role="radio" data-level="1">Beginner</button>).
   * "All" uses data-level="".
   * @returns {void}
   */
  buildFilter() {
    // TODO: implement with TEXTS.levelAll and TEXTS.levels.
  }

  /**
   * Event delegation:
   *  - click on .btn--level -> callbacks.onLevelChange(level or null)
   *  - click on .card[data-card-id] -> callbacks.onCardTap(cardId)
   * Ignore while locked.
   * @returns {void}
   */
  bindEvents() {
    // TODO: implement.
  }

  /**
   * Render the cards of the current level.
   * @param {number|null} level Current filter.
   * @param {boolean} canAdd false when the card limit is reached (cards are disabled).
   * @returns {void}
   */
  render(level, canAdd) {
    // TODO: update aria-checked on the filter buttons.
    // TODO: list.replaceChildren(...getCardsByLevel(level).map(def => this.createCardElement(def, canAdd))).
  }

  /**
   * Build one palette card.
   * <li><button class="card card--<family>" data-card-id="...">
   *   <span class="card__label">Forward 1</span><span class="card__level">Beginner</span>
   * </button></li>
   * @param {import('../logic/cards.js').CardDefinition} def
   * @param {boolean} enabled
   * @returns {HTMLLIElement}
   */
  createCardElement(def, enabled) {
    // TODO: implement, label from TEXTS.cards[def.id], disabled = !enabled.
  }

  /**
   * Lock / unlock the palette during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    // TODO: this.locked = locked; disable every button of the list.
  }
}
