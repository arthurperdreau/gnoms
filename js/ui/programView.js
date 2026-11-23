/**
 * @file programView.js
 * Displays the algorithm tree with indentation, the selected container,
 * the "used / max" card counter, delete buttons and the highlight of the
 * card being executed.
 */

import { TEXTS } from '../i18n.js';
import { getCardDefinition, isContainer } from '../logic/cards.js';

export class ProgramView {
  /**
   * @param {{list: HTMLElement, counter: HTMLElement, targetLabel: HTMLElement, rootButton: HTMLButtonElement}} elements
   * @param {{onSelectContainer: (uid: string) => void, onDeleteCard: (uid: string) => void, onBackToRoot: () => void}} callbacks
   */
  constructor(elements, callbacks) {
    this.elements = elements;
    this.callbacks = callbacks;
    /** @type {Map<string, HTMLElement>} uid -> .card element, for fast highlight. */
    this.cardElements = new Map();
    /** @type {string|null} */
    this.highlightedUid = null;
    /** @type {boolean} */
    this.locked = false;

    // TODO: this.elements.list.dataset.emptyText = TEXTS.programEmpty (used by CSS :empty).
    // TODO: this.bindEvents();
  }

  /**
   * Event delegation on the list:
   *  - click on .program__delete -> callbacks.onDeleteCard(uid)
   *  - click on a container .card -> callbacks.onSelectContainer(uid)
   *  - click on rootButton -> callbacks.onBackToRoot()
   * Ignore while locked.
   * @returns {void}
   */
  bindEvents() {
    // TODO: implement (use data-uid on the elements).
  }

  /**
   * Full render of the tree.
   * @param {import('../logic/program.js').Program} program
   * @param {string|null} targetUid Selected container (null = main level).
   * @returns {void}
   */
  render(program, targetUid) {
    // TODO: this.cardElements.clear().
    // TODO: list.replaceChildren(...program.root.map(card => this.createItem(card, targetUid))).
    // TODO: this.renderCounter(program.countCards(), program.maxCards).
    // TODO: this.renderTarget(program, targetUid).
  }

  /**
   * Build the <li> of one card, recursively for its children.
   * Structure:
   * <li class="program__item">
   *   <div class="program__row">
   *     <button class="card card--<family> [card--selected]" data-uid>label</button>
   *     <button class="program__delete" data-uid aria-label="Delete card">×</button>
   *   </div>
   *   <!-- containers only, one block per slot: -->
   *   <span class="program__slot-label">then</span>   (only for If slots)
   *   <ol class="program__children program__children--<family>">...</ol>
   *   or <span class="program__slot-empty">empty</span> when the slot is empty
   * </li>
   * @param {import('../logic/cards.js').CardInstance} card
   * @param {string|null} targetUid
   * @returns {HTMLLIElement}
   */
  createItem(card, targetUid) {
    // TODO: implement; register the .card element in this.cardElements.
  }

  /**
   * Update the "used / max" counter (add .card-counter--full at the limit).
   * @param {number} used
   * @param {number} max
   * @returns {void}
   */
  renderCounter(used, max) {
    // TODO: textContent = TEXTS.cardCounter(used, max).
  }

  /**
   * Show where new cards go, and show/hide the "Back to main level" button.
   * @param {import('../logic/program.js').Program} program
   * @param {string|null} targetUid
   * @returns {void}
   */
  renderTarget(program, targetUid) {
    // TODO: TEXTS.targetMain or TEXTS.targetContainer(label of the target card).
    // TODO: rootButton.hidden = targetUid === null.
  }

  /**
   * Highlight the card being executed (remove the previous highlight).
   * @param {string|null} uid null removes any highlight.
   * @returns {void}
   */
  highlightCard(uid) {
    // TODO: remove .card--current from this.highlightedUid's element.
    // TODO: add it to the new one and scrollIntoView({ block: 'nearest' }).
  }

  /**
   * Lock / unlock editing during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    // TODO: this.locked = locked; disable delete buttons; when unlocking, highlightCard(null)?
  }
}
