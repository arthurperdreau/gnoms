/**
 * @file interpreter.js
 * Runs an algorithm on a board WITHOUT any animation and returns the full list
 * of steps. Pure logic, no DOM: the animation is done by js/ui/animator.js.
 *
 * Rules:
 *  - Moves of several cells are done one cell at a time.
 *  - A move toward a wall or the edge leaves the gnome on its cell (event
 *    "blocked"). This is not an error: execution goes on with the next card.
 *  - Reaching the treasure stops everything (status "treasure").
 *  - After MAX_STEPS steps the run stops (status "maxSteps").
 *
 * @typedef {import('./gnome.js').GnomeState} GnomeState
 * @typedef {import('./cards.js').CardInstance} CardInstance
 * @typedef {import('./board.js').Board} Board
 *
 * @typedef {Object} Step
 * @property {number} index        Step number (0 = initial state).
 * @property {GnomeState} gnome    Snapshot of the gnome AFTER this step.
 * @property {string|null} cardUid Uid of the card being executed (null for the start step).
 * @property {string} event        A STEP_EVENTS value.
 * @property {Object} [details]    Optional data (e.g. { condition, result } for "checked").
 *
 * @typedef {Object} RunResult
 * @property {Step[]} steps
 * @property {string} status       A RUN_STATUS value.
 * @property {GnomeState} finalGnome
 * @property {number} blockedCount Number of "blocked" events.
 *
 * @typedef {Object} RunContext    Mutable state shared by all handlers during one run.
 * @property {Board} board         A CLONE of the board.
 * @property {GnomeState} gnome    Current gnome state.
 * @property {GnomeState} startGnome Start state (needed later for the burrow).
 * @property {Step[]} steps
 * @property {number} blockedCount
 * @property {string|null} status  Set when the run must stop (treasure / maxSteps).
 * @property {number} maxSteps
 */

import { MAX_STEPS, STEP_EVENTS, RUN_STATUS, CELL_TYPES } from '../config.js';
import { getCardDefinition, CONDITIONS } from './cards.js';
import { turnLeft, turnRight, uTurn, rotateDirection, cellAhead, cellBehind, moveTo, cloneGnome } from './gnome.js';

/**
 * Main entry point: run an algorithm.
 * @param {Board} board Real board (it is cloned, never modified).
 * @param {GnomeState} startGnome Start position and direction.
 * @param {CardInstance[]} cards The main level of the program (program.root).
 * @param {{maxSteps?: number}} [options]
 * @returns {RunResult}
 */
export function runProgram(board, startGnome, cards, options = {}) {
  // TODO: build the RunContext (board.clone(), cloneGnome(startGnome), steps: [],
  //       blockedCount: 0, status: null, maxSteps: options.maxSteps ?? MAX_STEPS).
  // TODO: record the initial step with event STEP_EVENTS.START and cardUid null.
  // TODO: executeCards(cards, ctx).
  // TODO: if ctx.status is still null, set it to RUN_STATUS.FINISHED.
  // TODO: return { steps, status, finalGnome: ctx.gnome, blockedCount }.
}

/**
 * Execute a list of cards in order. Stops early when ctx.status is set.
 * @param {CardInstance[]} cards
 * @param {RunContext} ctx
 * @returns {void}
 */
export function executeCards(cards, ctx) {
  // TODO: for...of loop; break as soon as shouldStop(ctx).
}

/**
 * Execute one card by dispatching to the handler matching its definition's action.
 * @param {CardInstance} card
 * @param {RunContext} ctx
 * @returns {void}
 */
export function executeCard(card, ctx) {
  // TODO: def = getCardDefinition(card.cardId); handler = CARD_HANDLERS[def.action].
  // TODO: throw an Error if no handler exists (programming error).
  // TODO: handler(card, def, ctx).
}

/**
 * True when the run must stop (treasure reached or step limit hit).
 * @param {RunContext} ctx
 * @returns {boolean}
 */
export function shouldStop(ctx) {
  // TODO: return ctx.status !== null.
}

/**
 * Add a step to the list, with a snapshot of the gnome. Sets
 * ctx.status = RUN_STATUS.MAX_STEPS when the limit is reached.
 * @param {RunContext} ctx
 * @param {string|null} cardUid
 * @param {string} event A STEP_EVENTS value.
 * @param {Object} [details]
 * @returns {void}
 */
export function recordStep(ctx, cardUid, event, details) {
  // TODO: push { index: ctx.steps.length, gnome: cloneGnome(ctx.gnome), cardUid, event, details }.
  // TODO: if event === BLOCKED, ctx.blockedCount++.
  // TODO: if the number of steps (excluding the start step) >= ctx.maxSteps
  //       and status is still null, set status to RUN_STATUS.MAX_STEPS.
}

/**
 * Try to move the gnome by exactly one cell, forward or backward, keeping its direction.
 * Records "moved", "blocked" or "treasure".
 * @param {RunContext} ctx
 * @param {CardInstance} card
 * @param {'forward'|'back'} way
 * @returns {boolean} true if the gnome moved.
 */
export function moveOneCell(ctx, card, way) {
  // TODO: target = way === 'forward' ? cellAhead(ctx.gnome) : cellBehind(ctx.gnome).
  // TODO: if ctx.board.isBlocking(target.x, target.y): recordStep BLOCKED, return false.
  // TODO: ctx.gnome = moveTo(ctx.gnome, target).
  // TODO: if ctx.board.isTreasure(...): recordStep TREASURE, ctx.status = RUN_STATUS.TREASURE, return true.
  // TODO: recordStep MOVED, then applyCellEffect(ctx, card, way). Return true.
}

/**
 * Effect of the cell the gnome just arrived on. Nothing happens for EMPTY
 * in this version. THIS IS THE PLACE to add the future obstacles:
 *  - CELL_TYPES.BURROW: ctx.gnome = moveTo(ctx.gnome, ctx.startGnome), record a step.
 *  - CELL_TYPES.ROOT:   keep moving the same way, one cell at a time, until blocked.
 *  - CELL_TYPES.RAKE:   push the gnome 2 cells opposite to its arrival (one at a time).
 * @param {RunContext} ctx
 * @param {CardInstance} card
 * @param {'forward'|'back'} way How the gnome arrived (needed for ROOT and RAKE).
 * @returns {void}
 */
export function applyCellEffect(ctx, card, way) {
  // TODO: const type = ctx.board.getCell(ctx.gnome.x, ctx.gnome.y);
  // TODO: switch (type) { case CELL_TYPES.EMPTY: default: return; }
  //       Add the cases above when the obstacles are implemented
  //       (and add new STEP_EVENTS values if needed).
}

/**
 * Evaluate the condition of an If card on the current state.
 * @param {string} condition A CONDITIONS value.
 * @param {RunContext} ctx
 * @returns {boolean}
 */
export function evaluateCondition(condition, ctx) {
  // TODO: ahead = cellAhead(ctx.gnome); blocked = ctx.board.isBlocking(ahead.x, ahead.y).
  // TODO: WALL_AHEAD -> blocked ; PATH_CLEAR -> !blocked.
  // TODO: throw on unknown condition.
}

// ---------------------------------------------------------------------------
// Card handlers: one function per action. Signature: (card, def, ctx) => void
// ---------------------------------------------------------------------------

/**
 * Forward N: call moveOneCell(ctx, card, 'forward') def.params.steps times.
 * Keep going after a "blocked" (it just records another blocked step), but stop
 * if shouldStop(ctx).
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleForward(card, def, ctx) {
  // TODO: implement.
}

/**
 * Back N: same as handleForward with 'back'. The direction does not change.
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleBack(card, def, ctx) {
  // TODO: implement.
}

/**
 * Turn: rotate by def.params.quarterTurns (-1 left, 1 right, 2 U-turn),
 * then record a TURNED step. (turnLeft / turnRight / uTurn from gnome.js
 * can be used, or rotateDirection directly.)
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleTurn(card, def, ctx) {
  // TODO: implement.
}

/**
 * Repeat N: executeCards(card.slots.body, ctx) def.params.times times.
 * Nested repeats work naturally through recursion. Stop when shouldStop(ctx).
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleRepeat(card, def, ctx) {
  // TODO: implement.
}

/**
 * If: evaluate def.params.condition, record a CHECKED step with
 * details { condition, result } (so the animation highlights the If card).
 * - true  -> executeCards(card.slots.then, ctx)
 * - false -> executeCards(card.slots.else, ctx)   (runs the Else card, if any)
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleIf(card, def, ctx) {
  // TODO: implement.
}

/**
 * Else: only reached through handleIf when the condition is false.
 * Executes its body: executeCards(card.slots.body, ctx).
 * @param {CardInstance} card
 * @param {import('./cards.js').CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleElse(card, def, ctx) {
  // TODO: implement.
}

/** Dispatch table: action name (from cards.js) -> handler. */
export const CARD_HANDLERS = Object.freeze({
  forward: handleForward,
  back: handleBack,
  turn: handleTurn,
  repeat: handleRepeat,
  if: handleIf,
  else: handleElse,
});
