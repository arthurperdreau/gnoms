/**
 * @file programView.js
 * Displays the algorithm like on the table in the physical game: cards are
 * read from top to bottom, and the cards contained in a Repeat, an If or an
 * Else are on the same line, on the right of that card.
 * Also shows the selected container, the "used / max" counter, delete
 * buttons and the highlight of the card being executed.
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

    this.elements.list.dataset.emptyText = TEXTS.programEmpty;
    this.bindEvents();
  }

  /**
   * Event delegation on the list and the "Back to main level" button.
   * @returns {void}
   */
  bindEvents() {
    this.elements.list.addEventListener('click', (event) => {
      if (this.locked) return;
      const target = /** @type {HTMLElement} */ (event.target);

      const deleteButton = target.closest('.program__delete');
      if (deleteButton) {
        this.callbacks.onDeleteCard(deleteButton.dataset.uid);
        return;
      }

      const select = target.closest('.program__select');
      if (select && select.dataset.container === 'true') {
        this.callbacks.onSelectContainer(select.dataset.uid);
      }
    });

    this.elements.rootButton.addEventListener('click', () => {
      if (!this.locked) this.callbacks.onBackToRoot();
    });
  }

  /**
   * Full render of the algorithm.
   * @param {import('../logic/program.js').Program} program
   * @param {string|null} targetUid Selected container (null = main level).
   * @returns {void}
   */
  render(program, targetUid) {
    this.cardElements.clear();
    this.highlightedUid = null;
    this.elements.list.replaceChildren(...program.root.map((card) => this.createItem(card, targetUid)));
    this.renderCounter(program.countCards(), program.maxCards);
    this.renderTarget(program, targetUid);
    this.setLocked(this.locked);
  }

  /**
   * Build the line of one card, with the cards it contains on its right.
   * <li class="program__item">
   *   <div class="card card--<family> program__card [card--selected]">
   *     <button class="program__select">name</button>
   *     <button class="program__delete">×</button>
   *   </div>
   *   <ol class="program__children">...</ol>   (containers only)
   * </li>
   * @param {import('../logic/cards.js').CardInstance} card
   * @param {string|null} targetUid
   * @returns {HTMLLIElement}
   */
  createItem(card, targetUid) {
    const def = getCardDefinition(card.cardId);
    const container = isContainer(card.cardId);
    const selected = container && card.uid === targetUid;

    const item = document.createElement('li');
    item.className = `program__item${container ? '' : ' program__item--simple'}`;

    const cardElement = document.createElement('div');
    cardElement.className = `card card--${def.family} program__card`;
    cardElement.classList.toggle('card--selected', selected);
    this.cardElements.set(card.uid, cardElement);

    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'program__select';
    select.dataset.uid = card.uid;
    select.dataset.container = String(container);
    select.textContent = def.name;
    select.title = def.text;
    if (container) {
      select.setAttribute('aria-pressed', String(selected));
    } else {
      select.tabIndex = -1; // simple cards cannot be selected
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'program__delete';
    deleteButton.dataset.uid = card.uid;
    deleteButton.setAttribute('aria-label', `${TEXTS.deleteCard}: ${def.name}`);
    deleteButton.textContent = '×';

    cardElement.append(select, deleteButton);
    item.append(cardElement);

    if (container) {
      const children = document.createElement('ol');
      children.className = 'program__children';
      if (card.children.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'program__slot-empty';
        empty.textContent = TEXTS.slotEmpty;
        children.append(empty);
      } else {
        children.append(...card.children.map((child) => this.createItem(child, targetUid)));
      }
      item.append(children);
    }

    return item;
  }

  /**
   * Update the "used / max" counter.
   * @param {number} used
   * @param {number} max
   * @returns {void}
   */
  renderCounter(used, max) {
    this.elements.counter.textContent = TEXTS.cardCounter(used, max);
    this.elements.counter.classList.toggle('card-counter--full', used >= max);
  }

  /**
   * Show where new cards go, and show/hide the "Back to main level" button.
   * @param {import('../logic/program.js').Program} program
   * @param {string|null} targetUid
   * @returns {void}
   */
  renderTarget(program, targetUid) {
    const location = targetUid ? program.findCard(targetUid) : null;
    this.elements.targetLabel.textContent = location
      ? TEXTS.targetContainer(getCardDefinition(location.card.cardId).name)
      : TEXTS.targetMain;
    this.elements.rootButton.hidden = !location;
  }

  /**
   * Highlight the card being executed (remove the previous highlight).
   * @param {string|null} uid null removes any highlight.
   * @param {{pulse?: boolean}} [options] pulse=false: if this card is already
   *   highlighted, keep it as it is (used for the steps of a special square,
   *   so the card does not look like it runs again).
   * @returns {void}
   */
  highlightCard(uid, { pulse = true } = {}) {
    if (!pulse && uid && uid === this.highlightedUid) return;
    if (this.highlightedUid) {
      this.cardElements.get(this.highlightedUid)?.classList.remove('card--current');
    }
    this.highlightedUid = uid;
    const element = uid ? this.cardElements.get(uid) : null;
    if (!element) return;
    element.classList.remove('card--current');
    void element.offsetWidth; // restart the pulse when the same card runs again
    element.classList.add('card--current');
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /**
   * Lock / unlock editing during the animation.
   * @param {boolean} locked
   * @returns {void}
   */
  setLocked(locked) {
    this.locked = locked;
    for (const button of this.elements.list.querySelectorAll('.program__delete')) {
      button.disabled = locked;
    }
    this.elements.rootButton.disabled = locked;
  }
}
