/**
 * @file cards.js
 * Catalogue of every card of the game, and factory to create card instances
 * placed in an algorithm. Pure logic, no DOM.
 *
 * Two different things:
 *  - a CARD DEFINITION (catalogue entry): what a card is (id, family, level, params, slots).
 *  - a CARD INSTANCE: one card placed in an algorithm, with a unique id (uid)
 *    and, for containers, the cards placed inside it.
 *
 * @typedef {Object} SlotDefinition
 * @property {number} max        Maximum number of cards in this slot (Infinity allowed).
 * @property {string[]} [accepts] If set, only these card ids are accepted.
 * @property {string[]} [rejects] If set, these card ids are refused.
 *
 * @typedef {Object} CardDefinition
 * @property {string} id         Unique id, also the key of TEXTS.cards in i18n.js.
 * @property {string} family     A CARD_FAMILIES value.
 * @property {number} level      A LEVELS value (1, 2 or 3).
 * @property {string} action     Name of the interpreter handler ('forward', 'back', 'turn', 'repeat', 'if', 'else').
 * @property {Object} params     Parameters for the handler (steps, quarterTurns, times, condition).
 * @property {Record<string, SlotDefinition>} [slots] Present only on containers.
 * @property {boolean} [onlyInsideIf] true for the Else card.
 *
 * @typedef {Object} CardInstance
 * @property {string} uid        Unique id of this instance (used by the UI and by program.js).
 * @property {string} cardId     Id of its CardDefinition.
 * @property {Record<string, CardInstance[]>} [slots] Cards inside, per slot name (containers only).
 */

import { CARD_FAMILIES, LEVELS } from '../config.js';

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
  IF_WALL: 'ifWall',
  IF_CLEAR: 'ifClear',
  ELSE: 'else',
});

/** Condition names used by If cards (evaluated in interpreter.js). */
export const CONDITIONS = Object.freeze({
  WALL_AHEAD: 'wallAhead',
  PATH_CLEAR: 'pathClear',
});

/**
 * Full catalogue. The order here is the display order in the palette.
 *
 * Slots:
 *  - Repeat: one "body" slot with one or more cards (no Else directly inside).
 *  - If:     a "then" slot (1 card, no Else) and an optional "else" slot (1 Else card only).
 *  - Else:   a "body" slot with the card to run when the condition is false.
 *
 * @type {ReadonlyArray<CardDefinition>}
 */
export const CARD_CATALOGUE = Object.freeze([
  // --- Level 1: moves ---
  { id: CARD_IDS.FORWARD_1, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'forward', params: { steps: 1 } },
  { id: CARD_IDS.FORWARD_2, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'forward', params: { steps: 2 } },
  { id: CARD_IDS.BACK_1, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'back', params: { steps: 1 } },
  { id: CARD_IDS.TURN_LEFT, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: -1 } },
  { id: CARD_IDS.TURN_RIGHT, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: 1 } },
  { id: CARD_IDS.U_TURN, family: CARD_FAMILIES.MOVE, level: LEVELS.BEGINNER, action: 'turn', params: { quarterTurns: 2 } },

  // --- Level 2: loops ---
  { id: CARD_IDS.REPEAT_2, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 2 },
    slots: { body: { max: Infinity, rejects: [CARD_IDS.ELSE] } } },
  { id: CARD_IDS.REPEAT_3, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 3 },
    slots: { body: { max: Infinity, rejects: [CARD_IDS.ELSE] } } },
  { id: CARD_IDS.REPEAT_4, family: CARD_FAMILIES.LOOP, level: LEVELS.INTERMEDIATE, action: 'repeat', params: { times: 4 },
    slots: { body: { max: Infinity, rejects: [CARD_IDS.ELSE] } } },

  // --- Level 3: conditions ---
  { id: CARD_IDS.IF_WALL, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'if', params: { condition: CONDITIONS.WALL_AHEAD },
    slots: { then: { max: 1, rejects: [CARD_IDS.ELSE] }, else: { max: 1, accepts: [CARD_IDS.ELSE] } } },
  { id: CARD_IDS.IF_CLEAR, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'if', params: { condition: CONDITIONS.PATH_CLEAR },
    slots: { then: { max: 1, rejects: [CARD_IDS.ELSE] }, else: { max: 1, accepts: [CARD_IDS.ELSE] } } },
  { id: CARD_IDS.ELSE, family: CARD_FAMILIES.CONDITION, level: LEVELS.EXPERT, action: 'else', params: {}, onlyInsideIf: true,
    slots: { body: { max: 1, rejects: [CARD_IDS.ELSE] } } },
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
  return Boolean(getCardDefinition(cardId)?.slots);
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
 * Containers get one empty array per slot of their definition.
 * @param {string} cardId One of CARD_IDS.
 * @returns {CardInstance}
 * @throws {Error} If the card id is unknown.
 */
export function createCardInstance(cardId) {
  const def = getCardDefinition(cardId);
  if (!def) throw new Error(`Unknown card: ${cardId}`);

  /** @type {CardInstance} */
  const instance = { uid: generateUid(), cardId };
  if (def.slots) {
    instance.slots = {};
    for (const slotName of Object.keys(def.slots)) {
      instance.slots[slotName] = [];
    }
  }
  return instance;
}

/**
 * Check if a slot of a container accepts a given card id (accepts / rejects
 * lists and max size). Does NOT check the global MAX_CARDS limit.
 * @param {CardInstance} container
 * @param {string} slotName
 * @param {string} cardId
 * @returns {boolean}
 */
export function slotAccepts(container, slotName, cardId) {
  const slot = getCardDefinition(container.cardId)?.slots?.[slotName];
  if (!slot || !container.slots?.[slotName]) return false;
  if (container.slots[slotName].length >= slot.max) return false;
  if (slot.accepts && !slot.accepts.includes(cardId)) return false;
  if (slot.rejects && slot.rejects.includes(cardId)) return false;
  return true;
}
