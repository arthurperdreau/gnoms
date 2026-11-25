/**
 * @file programView.js
 * Displays the algorithm tree with indentation, the selected container,
 * the "used / max" card counter, delete buttons and the highlight of the
 * card being executed.
 */

import { TEXTS } from '../i18n.js';
import { getCardDefinition, isContainer } from '../logic/cards.js';

/** Slots whose name is displayed as a label (If cards). */
const LABELLED_SLOTS = Object.freeze({ then: 'slotThen', else: 'slotElse' });

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

      const card = target.closest('.card[data-uid]');
      if (card && card.dataset.container === 'true') {
        this.callbacks.onSelectContainer(card.dataset.uid);
      }
    });

    this.elements.rootButton.addEventListener('click', () => {
      if (!this.locked) this.callbacks.onBackToRoot();
    });
  }

  /**
   * Full render of the tree.
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
   * Build the <li> of one card, recursively for its children.
   * @param {import('../logic/cards.js').CardInstance} card
   * @param {string|null} targetUid
   * @returns {HTMLLIElement}
   */
  createItem(card, targetUid) {
    const def = getCardDefinition(card.cardId);
    const container = isContainer(card.cardId);

    const item = document.createElement('li');
    item.className = 'program__item';

    // --- Row: card + delete button ---
    const row = document.createElement('div');
    row.className = 'program__row';

    const cardElement = document.createElement('button');
    cardElement.type = 'button';
    cardElement.className = `card card--${def.family}`;
    cardElement.dataset.uid = card.uid;
    cardElement.dataset.container = String(container);
    if (container) {
      const selected = card.uid === targetUid;
      cardElement.classList.toggle('card--selected', selected);
      cardElement.setAttribute('aria-pressed', String(selected));
    } else {
      cardElement.tabIndex = -1; // simple cards are not interactive
      cardElement.style.cursor = 'default';
    }
    const label = document.createElement('span');
    label.className = 'card__label';
    label.textContent = TEXTS.cards[card.cardId];
    cardElement.append(label);
    this.cardElements.set(card.uid, cardElement);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'program__delete';
    deleteButton.dataset.uid = card.uid;
    deleteButton.setAttribute('aria-label', `${TEXTS.deleteCard}: ${TEXTS.cards[card.cardId]}`);
    deleteButton.textContent = '×';

    row.append(cardElement, deleteButton);
    item.append(row);

    // --- Children, one block per slot ---
    if (card.slots) {
      const childrenWrapper = document.createElement('div');
      childrenWrapper.className = `program__children program__children--${def.family}`;

      for (const [slotName, children] of Object.entries(card.slots)) {
        const labelKey = LABELLED_SLOTS[slotName];
        if (labelKey && def.action === 'if') {
          const slotLabel = document.createElement('span');
          slotLabel.className = 'program__slot-label';
          slotLabel.textContent = TEXTS[labelKey];
          childrenWrapper.append(slotLabel);
        }

        if (children.length === 0) {
          const empty = document.createElement('span');
          empty.className = 'program__slot-empty';
          empty.textContent = TEXTS.slotEmpty;
          childrenWrapper.append(empty);
        } else {
          const list = document.createElement('ol');
          list.className = 'program__children-list';
          list.append(...children.map((child) => this.createItem(child, targetUid)));
          childrenWrapper.append(list);
        }
      }
      item.append(childrenWrapper);
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
      ? TEXTS.targetContainer(TEXTS.cards[location.card.cardId])
      : TEXTS.targetMain;
    this.elements.rootButton.hidden = !location;
  }

  /**
   * Highlight the card being executed (remove the previous highlight).
   * @param {string|null} uid null removes any highlight.
   * @returns {void}
   */
  highlightCard(uid) {
    if (this.highlightedUid) {
      this.cardElements.get(this.highlightedUid)?.classList.remove('card--current');
    }
    this.highlightedUid = uid;
    const element = uid ? this.cardElements.get(uid) : null;
    if (!element) return;
    element.classList.remove('card--current');
    void element.offsetWidth; // restart the pulse when the same card runs again
    element.classList.add('card--current');
    element.scrollIntoView({ block: 'nearest' });
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
