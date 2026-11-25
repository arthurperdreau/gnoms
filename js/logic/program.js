/**
 * @file program.js
 * The algorithm, stored as a tree of card instances. Pure logic, no DOM.
 *
 * - `root` is the main level: an ordered list of CardInstance.
 * - Containers (Repeat, If, Else) hold children in `instance.slots[slotName]`.
 * - Every card counts toward MAX_CARDS, nested ones included.
 *
 * Methods return a result object instead of throwing, so the UI can show a
 * translated message: `{ ok: true, card }` or `{ ok: false, reason }`.
 *
 * @typedef {import('./cards.js').CardInstance} CardInstance
 * @typedef {{ok: boolean, reason?: string, card?: CardInstance}} ProgramResult
 * @typedef {{card: CardInstance, parent: CardInstance|null, slotName: string|null, list: CardInstance[], index: number}} CardLocation
 */

import { MAX_CARDS } from '../config.js';
import { createCardInstance, getCardDefinition, isContainer, slotAccepts, CARD_IDS } from './cards.js';

/** Reasons returned when an operation is refused (mapped to texts in the UI). */
export const PROGRAM_ERRORS = Object.freeze({
  CARD_LIMIT: 'cardLimit',
  ELSE_OUTSIDE_IF: 'elseOutsideIf',
  SLOT_FULL: 'slotFull',
  NOT_A_CONTAINER: 'notAContainer',
  NOT_FOUND: 'notFound',
  UNKNOWN_CARD: 'unknownCard',
});

export class Program {
  /**
   * @param {number} [maxCards=MAX_CARDS]
   */
  constructor(maxCards = MAX_CARDS) {
    /** @type {CardInstance[]} Main level. */
    this.root = [];
    /** @type {number} */
    this.maxCards = maxCards;
  }

  /**
   * Count every card of the tree, nested ones included.
   * @param {CardInstance[]} [list=this.root] Used for the recursion.
   * @returns {number}
   */
  countCards(list = this.root) {
    let total = 0;
    for (const card of list) {
      total += 1;
      if (card.slots) {
        for (const children of Object.values(card.slots)) {
          total += this.countCards(children);
        }
      }
    }
    return total;
  }

  /**
   * True if one more card can be added without exceeding maxCards.
   * @returns {boolean}
   */
  canAddCard() {
    return this.countCards() < this.maxCards;
  }

  /**
   * Find a card anywhere in the tree.
   * @param {string} uid
   * @returns {CardLocation|null} Where the card is: its parent (null at root),
   *   the slot name, the array that holds it and its index in that array.
   */
  findCard(uid) {
    if (!uid) return null;
    /**
     * @param {CardInstance[]} list
     * @param {CardInstance|null} parent
     * @param {string|null} slotName
     * @returns {CardLocation|null}
     */
    const search = (list, parent, slotName) => {
      for (let index = 0; index < list.length; index++) {
        const card = list[index];
        if (card.uid === uid) return { card, parent, slotName, list, index };
        if (card.slots) {
          for (const [name, children] of Object.entries(card.slots)) {
            const found = search(children, card, name);
            if (found) return found;
          }
        }
      }
      return null;
    };
    return search(this.root, null, null);
  }

  /**
   * Choose in which slot of a container a new card goes.
   * - Repeat: "body".
   * - If: "else" for an Else card, "then" otherwise.
   * - Else: "body".
   * @param {CardInstance} container
   * @param {string} cardId Card about to be added.
   * @returns {string|null} The slot name, or null if no slot accepts it.
   */
  pickSlot(container, cardId) {
    if (!container.slots) return null;
    for (const slotName of Object.keys(container.slots)) {
      if (slotAccepts(container, slotName, cardId)) return slotName;
    }
    return null;
  }

  /**
   * Add a new card at the end of the main level or inside a container.
   * @param {string} cardId Id from CARD_IDS.
   * @param {string|null} [containerUid=null] null = main level.
   * @returns {ProgramResult} `card` is the created instance when ok.
   */
  addCard(cardId, containerUid = null) {
    const def = getCardDefinition(cardId);
    if (!def) return { ok: false, reason: PROGRAM_ERRORS.UNKNOWN_CARD };
    if (!this.canAddCard()) return { ok: false, reason: PROGRAM_ERRORS.CARD_LIMIT };

    if (containerUid === null || containerUid === undefined) {
      if (def.onlyInsideIf) return { ok: false, reason: PROGRAM_ERRORS.ELSE_OUTSIDE_IF };
      const card = createCardInstance(cardId);
      this.root.push(card);
      return { ok: true, card };
    }

    const location = this.findCard(containerUid);
    if (!location) return { ok: false, reason: PROGRAM_ERRORS.NOT_FOUND };
    const container = location.card;
    if (!isContainer(container.cardId)) return { ok: false, reason: PROGRAM_ERRORS.NOT_A_CONTAINER };

    const slotName = this.pickSlot(container, cardId);
    if (!slotName) {
      const elseMisplaced = def.onlyInsideIf && getCardDefinition(container.cardId).action !== 'if';
      return { ok: false, reason: elseMisplaced ? PROGRAM_ERRORS.ELSE_OUTSIDE_IF : PROGRAM_ERRORS.SLOT_FULL };
    }

    const card = createCardInstance(cardId);
    container.slots[slotName].push(card);
    return { ok: true, card };
  }

  /**
   * Remove a card (and everything inside it) from the tree.
   * @param {string} uid
   * @returns {ProgramResult}
   */
  removeCard(uid) {
    const location = this.findCard(uid);
    if (!location) return { ok: false, reason: PROGRAM_ERRORS.NOT_FOUND };
    location.list.splice(location.index, 1);
    return { ok: true, card: location.card };
  }

  /**
   * Check that the whole tree respects the rules:
   * - at most maxCards cards,
   * - every Else is directly in the "else" slot of an If.
   * @returns {{valid: boolean, errors: string[]}} errors = PROGRAM_ERRORS values.
   */
  validate() {
    const errors = [];
    if (this.countCards() > this.maxCards) errors.push(PROGRAM_ERRORS.CARD_LIMIT);

    this.forEachCard((card, depth, parent, slotName) => {
      if (card.cardId !== CARD_IDS.ELSE) return;
      const parentIsIf = parent && getCardDefinition(parent.cardId).action === 'if';
      if (!parentIsIf || slotName !== 'else') {
        if (!errors.includes(PROGRAM_ERRORS.ELSE_OUTSIDE_IF)) errors.push(PROGRAM_ERRORS.ELSE_OUTSIDE_IF);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * True if the algorithm has no card.
   * @returns {boolean}
   */
  isEmpty() {
    return this.root.length === 0;
  }

  /**
   * Remove every card.
   * @returns {void}
   */
  clear() {
    this.root = [];
  }

  /**
   * Walk the tree depth-first and call `visitor` for each card.
   * @param {(card: CardInstance, depth: number, parent: CardInstance|null, slotName: string|null) => void} visitor
   * @returns {void}
   */
  forEachCard(visitor) {
    const walk = (list, depth, parent, slotName) => {
      for (const card of list) {
        visitor(card, depth, parent, slotName);
        if (card.slots) {
          for (const [name, children] of Object.entries(card.slots)) {
            walk(children, depth + 1, card, name);
          }
        }
      }
    };
    walk(this.root, 0, null, null);
  }
}
