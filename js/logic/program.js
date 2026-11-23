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
    // TODO: for each card: 1 + countCards of every slot array (if card.slots).
  }

  /**
   * True if one more card can be added without exceeding maxCards.
   * @returns {boolean}
   */
  canAddCard() {
    // TODO: return this.countCards() < this.maxCards.
  }

  /**
   * Find a card anywhere in the tree.
   * @param {string} uid
   * @returns {CardLocation|null} Where the card is: its parent (null at root),
   *   the slot name, the array that holds it and its index in that array.
   */
  findCard(uid) {
    // TODO: depth-first search starting at this.root (write a recursive helper
    //       that receives (list, parent, slotName)).
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
    // TODO: loop over Object.keys(container.slots) and return the first one
    //       where slotAccepts(container, slotName, cardId) is true.
  }

  /**
   * Add a new card at the end of the main level or inside a container.
   * @param {string} cardId Id from CARD_IDS.
   * @param {string|null} [containerUid=null] null = main level.
   * @returns {ProgramResult} `card` is the created instance when ok.
   */
  addCard(cardId, containerUid = null) {
    // TODO: refuse with UNKNOWN_CARD if getCardDefinition(cardId) is undefined.
    // TODO: refuse with CARD_LIMIT if !this.canAddCard().
    // TODO: if containerUid is null:
    //         - refuse with ELSE_OUTSIDE_IF when cardId === CARD_IDS.ELSE,
    //         - otherwise push createCardInstance(cardId) into this.root.
    // TODO: else: findCard(containerUid) -> NOT_FOUND / NOT_A_CONTAINER checks,
    //       slot = pickSlot(...). If null: ELSE_OUTSIDE_IF for an Else card,
    //       SLOT_FULL otherwise. Push the new instance into that slot.
    // TODO: return { ok: true, card }.
  }

  /**
   * Remove a card (and everything inside it) from the tree.
   * @param {string} uid
   * @returns {ProgramResult}
   */
  removeCard(uid) {
    // TODO: findCard(uid), then location.list.splice(location.index, 1).
  }

  /**
   * Check that the whole tree respects the rules:
   * - at most maxCards cards,
   * - every Else is directly in the "else" slot of an If.
   * @returns {{valid: boolean, errors: string[]}} errors = PROGRAM_ERRORS values.
   */
  validate() {
    // TODO: check countCards() <= maxCards.
    // TODO: walk the tree; for each Else card, check that its parent exists,
    //       that its parent's action is 'if' and that slotName === 'else'.
  }

  /**
   * True if the algorithm has no card.
   * @returns {boolean}
   */
  isEmpty() {
    // TODO: return this.root.length === 0.
  }

  /**
   * Remove every card.
   * @returns {void}
   */
  clear() {
    // TODO: this.root = [].
  }

  /**
   * Walk the tree depth-first and call `visitor` for each card.
   * Handy for the UI (render) and for validate().
   * @param {(card: CardInstance, depth: number, parent: CardInstance|null, slotName: string|null) => void} visitor
   * @returns {void}
   */
  forEachCard(visitor) {
    // TODO: recursive walk from this.root with depth 0.
  }
}
