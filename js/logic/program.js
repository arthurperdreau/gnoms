/**
 * @file program.js
 * The algorithm, stored as a tree of card instances. Pure logic, no DOM.
 *
 * - `root` is the main level: cards read from top to bottom.
 * - Containers (Repeat, If, Else) hold the cards "on their right" in `children`.
 * - An Else card is a sibling placed right under an If card (same list).
 * - Every card counts toward MAX_CARDS, contained ones included.
 *
 * Methods return a result object instead of throwing, so the UI can show a
 * translated message: `{ ok: true, card }` or `{ ok: false, reason }`.
 *
 * @typedef {import('./cards.js').CardInstance} CardInstance
 * @typedef {{ok: boolean, reason?: string, card?: CardInstance}} ProgramResult
 * @typedef {{card: CardInstance, parent: CardInstance|null, list: CardInstance[], index: number}} CardLocation
 */

import { MAX_CARDS } from '../config.js';
import { createCardInstance, getCardDefinition, isContainer, isIfCard, slotAccepts, CARD_IDS } from './cards.js';

/** Reasons returned when an operation is refused (mapped to texts in the UI). */
export const PROGRAM_ERRORS = Object.freeze({
  CARD_LIMIT: 'cardLimit',
  ELSE_WITHOUT_IF: 'elseWithoutIf',
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
   * Count every card of the tree, contained ones included.
   * @param {CardInstance[]} [list=this.root] Used for the recursion.
   * @returns {number}
   */
  countCards(list = this.root) {
    let total = 0;
    for (const card of list) {
      total += 1;
      if (card.children) total += this.countCards(card.children);
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
   * @param {string|null} uid
   * @returns {CardLocation|null} The card, its parent (null at root), the list
   *   that holds it and its index in that list.
   */
  findCard(uid) {
    if (!uid) return null;
    const search = (list, parent) => {
      for (let index = 0; index < list.length; index++) {
        const card = list[index];
        if (card.uid === uid) return { card, parent, list, index };
        if (card.children) {
          const found = search(card.children, card);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.root, null);
  }

  /**
   * Add a new card at the end of the main level or inside a container.
   *
   * Else cards follow special rules: they go right under an If card that has
   * no Else yet.
   *  - target = an If card: the Else is inserted right under that If.
   *  - target = main level or a Repeat: the Else goes at the end of that list,
   *    only if the last card of the list is an If.
   *
   * @param {string} cardId Id from CARD_IDS.
   * @param {string|null} [targetUid=null] Selected container, null = main level.
   * @returns {ProgramResult} `card` is the created instance when ok.
   */
  addCard(cardId, targetUid = null) {
    const def = getCardDefinition(cardId);
    if (!def) return { ok: false, reason: PROGRAM_ERRORS.UNKNOWN_CARD };
    if (!this.canAddCard()) return { ok: false, reason: PROGRAM_ERRORS.CARD_LIMIT };

    const target = targetUid ? this.findCard(targetUid) : null;
    if (targetUid && !target) return { ok: false, reason: PROGRAM_ERRORS.NOT_FOUND };
    if (target && !isContainer(target.card.cardId)) return { ok: false, reason: PROGRAM_ERRORS.NOT_A_CONTAINER };

    if (def.mustFollowIf) return this.addElse(target);

    if (!target) {
      const card = createCardInstance(cardId);
      this.root.push(card);
      return { ok: true, card };
    }

    if (!slotAccepts(target.card, cardId)) return { ok: false, reason: PROGRAM_ERRORS.SLOT_FULL };
    const card = createCardInstance(cardId);
    target.card.children.push(card);
    return { ok: true, card };
  }

  /**
   * Insert an Else card right under an If card (see addCard).
   * @param {CardLocation|null} target Selected container, null = main level.
   * @returns {ProgramResult}
   */
  addElse(target) {
    /** @type {CardInstance[]} */
    let list;
    /** @type {number} index of the If card in `list` */
    let ifIndex;

    if (target && isIfCard(target.card)) {
      list = target.list;
      ifIndex = target.index;
    } else if (!target || getCardDefinition(target.card.cardId).action === 'repeat') {
      list = target ? target.card.children : this.root;
      ifIndex = list.length - 1;
    } else {
      return { ok: false, reason: PROGRAM_ERRORS.ELSE_WITHOUT_IF };
    }

    const ifCard = list[ifIndex];
    const next = list[ifIndex + 1];
    if (!isIfCard(ifCard) || (next && next.cardId === CARD_IDS.ELSE)) {
      return { ok: false, reason: PROGRAM_ERRORS.ELSE_WITHOUT_IF };
    }

    const card = createCardInstance(CARD_IDS.ELSE);
    list.splice(ifIndex + 1, 0, card);
    return { ok: true, card };
  }

  /**
   * Remove a card (and everything inside it) from the tree.
   * Removing an If also removes the Else right under it (it would be invalid).
   * @param {string} uid
   * @returns {ProgramResult}
   */
  removeCard(uid) {
    const location = this.findCard(uid);
    if (!location) return { ok: false, reason: PROGRAM_ERRORS.NOT_FOUND };
    const { list, index, card } = location;
    const removeCount = isIfCard(card) && list[index + 1]?.cardId === CARD_IDS.ELSE ? 2 : 1;
    list.splice(index, removeCount);
    return { ok: true, card };
  }

  /**
   * Check that the whole tree respects the rules:
   * - at most maxCards cards,
   * - every Else is right under an If.
   * @returns {{valid: boolean, errors: string[]}} errors = PROGRAM_ERRORS values.
   */
  validate() {
    const errors = new Set();
    if (this.countCards() > this.maxCards) errors.add(PROGRAM_ERRORS.CARD_LIMIT);

    const check = (list) => {
      list.forEach((card, index) => {
        if (getCardDefinition(card.cardId)?.mustFollowIf && !isIfCard(list[index - 1])) {
          errors.add(PROGRAM_ERRORS.ELSE_WITHOUT_IF);
        }
        if (card.children) check(card.children);
      });
    };
    check(this.root);

    return { valid: errors.size === 0, errors: [...errors] };
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
   * @param {(card: CardInstance, depth: number, parent: CardInstance|null) => void} visitor
   * @returns {void}
   */
  forEachCard(visitor) {
    const walk = (list, depth, parent) => {
      for (const card of list) {
        visitor(card, depth, parent);
        if (card.children) walk(card.children, depth + 1, card);
      }
    };
    walk(this.root, 0, null);
  }
}
