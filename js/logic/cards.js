/**
 * @file cards.js
 * Catalogue of every card of the simulator, and factory to create card
 * instances placed in an algorithm. Pure logic, no DOM.
 *
 * Two different things:
 *  - a CARD DEFINITION (catalogue entry): what a card is (id, name, text,
 *    family, level, params, slot).
 *  - a CARD INSTANCE: one card placed in an algorithm, with a unique id (uid)
 *    and, for containers, the cards placed inside it ("on the right" of it).
 *
 * The bonus/malus cards of the physical game (Wheelbarrow, Freeze, Shield,
 * Bug) do not exist in the simulator.
 *
 * @typedef {Object} SlotDefinition
 * @property {number} max         Maximum number of cards inside (Infinity allowed).
 * @property {string[]} [rejects] Card ids that cannot go inside.
 *
 * @typedef {Object} CardDefinition
 * @property {string} id          Unique id, also the key of TEXTS.cards in i18n.js.
 * @property {string} name        Name printed on the card.
 * @property {string} text        Text printed on the card.
 * @property {string} family      A CARD_FAMILIES value.
 * @property {number} level       A LEVELS value (1, 2 or 3).
 * @property {string} action      Name of the interpreter handler ('forward', 'back', 'turn', 'repeat', 'if', 'else').
 * @property {Object} params      Parameters for the handler (steps, quarterTurns, times, condition).
 * @property {SlotDefinition} [slot] Present only on containers (Repeat, If, Else).
 * @property {boolean} [mustFollowIf] true for Else: only valid right after an If.
 *
 * @typedef {Object} CardInstance
 * @property {string} uid         Unique id of this instance.
 * @property {string} cardId      Id of its CardDefinition.
 * @property {CardInstance[]} [children] Cards inside (containers only).
 */

import { CARD_FAMILIES, LEVELS } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Ids of the cards, to avoid typos in the rest of the code. */
export const CARD_IDS = Object.freeze({
  FORWARD_1: 'forward1',
  FORWARD_2: 'forward2',
  BACK_1: 'back1',
  TURN_LEFT: 'turnLeft',
  TURN_RIGHT: 'turnRight',
  U_TURN: 'uTurn',
  REPEAT_2: 'repeat2',
  REPEAT_3: 'repeat3',
  REPEAT_4: 'repeat4',
  IF_BLOCKED: 'ifBlocked',
  IF_NOT_BLOCKED: 'ifNotBlocked',
  ELSE: 'else',
});

/** Conditions used by If cards (evaluated in interpreter.js on the square in front of the gnome). */
export const CONDITIONS = Object.freeze({
  BLOCKED: 'blocked',
  NOT_BLOCKED: 'notBlocked',
});

/**
 * Build a catalogue entry, taking the name and text from i18n.js.
 * @param {Omit<CardDefinition, 'name'|'text'>} def
 * @returns {CardDefinition}
 */
function card(def) {
  return Object.freeze({ ...def, name: TEXTS.cards[def.id].name, text: TEXTS.cards[def.id].text });
}

/**
 * Full catalogue. The order here is the display order in the palette.
 *
 * Containers:
 *  - Repeat: one or more cards on its right.
 *  - If:     exactly one card on its right.
 *  - Else:   placed right under an If; exactly one card on its right.
 *
 * @type {ReadonlyArray<CardDefinition>}
 */
export const CARD_CATALOGUE = Object.freeze([
  // --- Level 1: movement ---
  card({ id: CARD_IDS.FORWARD_1, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'forward', params: { steps: 1 } }),
  card({ id: CARD_IDS.FORWARD_2, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'forward', params: { steps: 2 } }),
  card({ id: CARD_IDS.BACK_1, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'back', params: { steps: 1 } }),
  card({ id: CARD_IDS.TURN_LEFT, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: -1 } }),
  card({ id: CARD_IDS.TURN_RIGHT, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: 1 } }),
  card({ id: CARD_IDS.U_TURN, family: CARD_FAMILIES.MOVEMENT, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: 2 } }),

  // --- Level 2: loops ---
  card({ id: CARD_IDS.REPEAT_2, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 2 }, slot: { max: Infinity } }),
  card({ id: CARD_IDS.REPEAT_3, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 3 }, slot: { max: Infinity } }),
  card({ id: CARD_IDS.REPEAT_4, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 4 }, slot: { max: Infinity } }),

  // --- Level 3: conditions ---
  card({ id: CARD_IDS.IF_BLOCKED, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'if',
    params: { condition: CONDITIONS.BLOCKED }, slot: { max: 1, rejects: [CARD_IDS.ELSE] } }),
  card({ id: CARD_IDS.IF_NOT_BLOCKED, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'if',
    params: { condition: CONDITIONS.NOT_BLOCKED }, slot: { max: 1, rejects: [CARD_IDS.ELSE] } }),
  card({ id: CARD_IDS.ELSE, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'else',
    params: {}, mustFollowIf: true, slot: { max: 1, rejects: [CARD_IDS.ELSE] } }),
]);

/** Fast lookup: card id -> definition. */
const DEFINITIONS_BY_ID = new Map(CARD_CATALOGUE.map((def) => [def.id, def]));

/** Counter used by generateUid. */
let uidCounter = 0;

/**
 * Get a card definition from its id.
 * @param {string} cardId
 * @returns {CardDefinition|undefined}
 */
export function getCardDefinition(cardId) {
  return DEFINITIONS_BY_ID.get(cardId);
}

/**
 * Cards visible for a level filter.
 * @param {number|null} level A LEVELS value, or null for "all levels".
 * @returns {CardDefinition[]}
 */
export function getCardsByLevel(level) {
  if (level === null || level === undefined) return [...CARD_CATALOGUE];
  return CARD_CATALOGUE.filter((def) => def.level === level);
}

/**
 * Check if a card can contain other cards.
 * @param {string} cardId
 * @returns {boolean} true for Repeat, If and Else.
 */
export function isContainer(cardId) {
  return Boolean(getCardDefinition(cardId)?.slot);
}

/**
 * Check if a card is an If card (If blocked / If not blocked).
 * @param {CardInstance|undefined|null} instance
 * @returns {boolean}
 */
export function isIfCard(instance) {
  return Boolean(instance) && getCardDefinition(instance.cardId)?.action === 'if';
}

/**
 * Generate a unique id for a card instance.
 * @returns {string} e.g. "card-12".
 */
export function generateUid() {
  uidCounter += 1;
  return `card-${uidCounter}`;
}

/**
 * Create a new instance of a card, ready to be added to an algorithm.
 * Containers get an empty `children` array.
 * @param {string} cardId One of CARD_IDS.
 * @returns {CardInstance}
 * @throws {Error} If the card id is unknown.
 */
export function createCardInstance(cardId) {
  const def = getCardDefinition(cardId);
  if (!def) throw new Error(`Unknown card: ${cardId}`);
  /** @type {CardInstance} */
  const instance = { uid: generateUid(), cardId };
  if (def.slot) instance.children = [];
  return instance;
}

/**
 * Check if a container can receive one more card of a given id (rejects list
 * and max size). Does NOT check the global MAX_CARDS limit.
 * @param {CardInstance} container
 * @param {string} cardId
 * @returns {boolean}
 */
export function slotAccepts(container, cardId) {
  const slot = getCardDefinition(container.cardId)?.slot;
  if (!slot || !container.children) return false;
  if (container.children.length >= slot.max) return false;
  if (slot.rejects && slot.rejects.includes(cardId)) return false;
  return true;
}
