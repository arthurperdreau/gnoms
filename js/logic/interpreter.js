/**
 * @file interpreter.js
 * Runs an algorithm on a board WITHOUT any animation and returns the full list
 * of steps. Pure logic, no DOM: the animation is done by js/ui/animator.js.
 *
 * Rules:
 *  - Moves of several squares are done one square at a time.
 *  - A move toward an obstacle or the edge: the gnome is blocked and stays on
 *    its square (event "blocked"). This is not an error: execution goes on.
 *  - If blocked / If not blocked test the square in front of the gnome.
 *  - An Else card runs its card only when the If right above it was false.
 *  - Special squares act when the gnome arrives on them (see applySquareEffect):
 *    mushroom, burrow, root, rake. Their moves are recorded as steps too.
 *    The effect ends the card: a Forward 2 whose first square is special does
 *    not do its second square.
 *  - Reaching the treasure stops everything, even in the middle of the algorithm.
 *  - After MAX_STEPS steps the run stops (status "maxSteps").
 *
 * @typedef {import('./gnome.js').GnomeState} GnomeState
 * @typedef {import('./cards.js').CardInstance} CardInstance
 * @typedef {import('./cards.js').CardDefinition} CardDefinition
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

import { MAX_STEPS, STEP_EVENTS, RUN_STATUS, CELL_TYPES, DIRECTIONS } from '../config.js';
import { getCardDefinition, CONDITIONS } from './cards.js';
import { rotateDirection, cellAhead, moveTo, cloneGnome } from './gnome.js';

/**
 * Main entry point: run an algorithm.
 * @param {Board} board Real board (it is cloned, never modified).
 * @param {GnomeState} startGnome Start position and direction.
 * @param {CardInstance[]} cards The main level of the program (program.root).
 * @param {{maxSteps?: number}} [options]
 * @returns {RunResult}
 */
export function runProgram(board, startGnome, cards, options = {}) {
  /** @type {RunContext} */
  const ctx = {
    board: board.clone(),
    gnome: cloneGnome(startGnome),
    startGnome: cloneGnome(startGnome),
    steps: [],
    blockedCount: 0,
    status: null,
    maxSteps: options.maxSteps ?? MAX_STEPS,
  };

  recordStep(ctx, null, STEP_EVENTS.START);
  executeCards(cards, ctx);
  if (ctx.status === null) ctx.status = RUN_STATUS.FINISHED;

  return {
    steps: ctx.steps,
    status: ctx.status,
    finalGnome: cloneGnome(ctx.gnome),
    blockedCount: ctx.blockedCount,
  };
}

/**
 * Execute a list of cards in order, from top to bottom. Stops early when
 * ctx.status is set.
 *
 * Else cards: an Else runs only if the card right above it is an If whose
 * condition was false. `lastIfResult` remembers the result of that If.
 * @param {CardInstance[]} cards
 * @param {RunContext} ctx
 * @returns {void}
 */
export function executeCards(cards, ctx) {
  /** @type {boolean|null} Result of the If right above, null if the previous card was not an If. */
  let lastIfResult = null;

  for (const card of cards) {
    if (shouldStop(ctx)) return;
    const def = getCardDefinition(card.cardId);

    if (def?.action === 'else') {
      if (lastIfResult === false) executeCard(card, ctx);
      lastIfResult = null;
      continue;
    }

    const result = executeCard(card, ctx);
    lastIfResult = def?.action === 'if' ? result : null;
  }
}

/**
 * Execute one card by dispatching to the handler matching its definition's action.
 * @param {CardInstance} card
 * @param {RunContext} ctx
 * @returns {boolean|void} The condition result for an If card.
 */
export function executeCard(card, ctx) {
  const def = getCardDefinition(card.cardId);
  const handler = def && CARD_HANDLERS[def.action];
  if (!handler) throw new Error(`No handler for card: ${card.cardId}`);
  return handler(card, def, ctx);
}

/**
 * True when the run must stop (treasure reached or step limit hit).
 * @param {RunContext} ctx
 * @returns {boolean}
 */
export function shouldStop(ctx) {
  return ctx.status !== null;
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
  /** @type {Step} */
  const step = { index: ctx.steps.length, gnome: cloneGnome(ctx.gnome), cardUid, event };
  if (details) step.details = details;
  ctx.steps.push(step);

  if (event === STEP_EVENTS.BLOCKED) ctx.blockedCount += 1;

  // The start step does not count toward the limit.
  if (ctx.status === null && ctx.steps.length - 1 >= ctx.maxSteps) {
    ctx.status = RUN_STATUS.MAX_STEPS;
  }
}

/**
 * Square next to a position, in a direction.
 * @param {{x: number, y: number}} position
 * @param {'N'|'E'|'S'|'W'} direction
 * @returns {{x: number, y: number}}
 */
export function nextSquare(position, direction) {
  const { dx, dy } = DIRECTIONS[direction];
  return { x: position.x + dx, y: position.y + dy };
}

/**
 * Move the gnome one square in a direction of travel, keeping the way it looks.
 * Records `event` (or "blocked" / "treasure").
 * @param {RunContext} ctx
 * @param {CardInstance} card
 * @param {'N'|'E'|'S'|'W'} travel Direction of the move (not always the way the gnome looks).
 * @param {string} event STEP_EVENTS value recorded when the gnome moves.
 * @param {{recordBlocked?: boolean}} [options] recordBlocked=false: a blocked move records nothing.
 * @returns {boolean} true if the gnome moved.
 */
export function stepGnome(ctx, card, travel, event, options = {}) {
  const target = nextSquare(ctx.gnome, travel);

  if (ctx.board.isBlocking(target.x, target.y)) {
    if (options.recordBlocked !== false) recordStep(ctx, card.uid, STEP_EVENTS.BLOCKED);
    return false;
  }

  ctx.gnome = moveTo(ctx.gnome, target);

  if (ctx.board.isTreasure(target.x, target.y)) {
    recordStep(ctx, card.uid, STEP_EVENTS.TREASURE);
    ctx.status = RUN_STATUS.TREASURE; // the treasure wins over the step limit
    return true;
  }

  recordStep(ctx, card.uid, event);
  return true;
}

/**
 * Move the gnome by exactly one square, forward or backward (it keeps looking
 * the same way), then apply the effect of the square it arrives on.
 * @param {RunContext} ctx
 * @param {CardInstance} card
 * @param {'forward'|'back'} way
 * @returns {boolean} true if the card can go on with its next square:
 *   false when the gnome was blocked, or when it landed on a special square
 *   (the effect of a special square ends the card).
 */
export function moveOneSquare(ctx, card, way) {
  const travel = way === 'forward' ? ctx.gnome.direction : rotateDirection(ctx.gnome.direction, 2);
  if (!stepGnome(ctx, card, travel, STEP_EVENTS.MOVED)) return false;
  const hadEffect = applySquareEffect(ctx, card, travel);
  return !hadEffect;
}

/**
 * Effect of the square the gnome just arrived on. Effects can chain (a rake
 * can push the gnome onto a mushroom...): the loop goes on as long as the
 * gnome lands on a special square AND actually moved, and MAX_STEPS stops
 * any endless chain.
 *
 *  - MUSHROOM: one more square in the direction of travel.
 *  - BURROW:   back to the start square (keeps looking the same way).
 *  - ROOT:     slides toward the tip of the root until blocked. Passing over
 *              another root square (during a slide or a push) starts a new
 *              slide toward that root's tip.
 *  - RAKE:     pushed back 2 squares, opposite to the direction of travel.
 *
 * @param {RunContext} ctx
 * @param {CardInstance} card
 * @param {'N'|'E'|'S'|'W'} travel Direction the gnome was moving when it arrived.
 * @returns {boolean} true if the square had an effect (used to end the card).
 */
export function applySquareEffect(ctx, card, travel) {
  let direction = travel;
  let hadEffect = false;

  while (!shouldStop(ctx)) {
    const type = ctx.board.getCell(ctx.gnome.x, ctx.gnome.y);
    let moved = false;

    switch (type) {
      case CELL_TYPES.MUSHROOM:
        moved = stepGnome(ctx, card, direction, STEP_EVENTS.MUSHROOM);
        break;

      case CELL_TYPES.BURROW:
        ctx.gnome = moveTo(ctx.gnome, ctx.startGnome);
        recordStep(ctx, card.uid, STEP_EVENTS.BURROW);
        return true; // the start square has no effect

      case CELL_TYPES.ROOT:
        // Slide toward the tip until the next square blocks; the end of a
        // slide is not a "blocked". A root crossed on the way redirects it.
        direction = ctx.board.getRootTip(ctx.gnome.x, ctx.gnome.y);
        while (!shouldStop(ctx) && stepGnome(ctx, card, direction, STEP_EVENTS.SLID, { recordBlocked: false })) {
          moved = true;
          direction = ctx.board.getRootTip(ctx.gnome.x, ctx.gnome.y) ?? direction;
        }
        break;

      case CELL_TYPES.RAKE: {
        const back = rotateDirection(direction, 2);
        for (let i = 0; i < 2 && !shouldStop(ctx); i++) {
          if (!stepGnome(ctx, card, back, STEP_EVENTS.PUSHED, { recordBlocked: false })) break;
          moved = true;
          // Pushed over a root: the push stops and the gnome slides
          if (ctx.board.getCell(ctx.gnome.x, ctx.gnome.y) === CELL_TYPES.ROOT) break;
        }
        direction = back; // the gnome now travels the other way
        break;
      }

      default:
        return hadEffect; // empty, start, treasure: no effect
    }

    hadEffect = true;
    if (!moved) return hadEffect;
  }
  return hadEffect;
}

/**
 * Evaluate the condition of an If card on the square in front of the gnome,
 * in its current direction.
 * @param {string} condition A CONDITIONS value.
 * @param {RunContext} ctx
 * @returns {boolean}
 * @throws {Error} On an unknown condition.
 */
export function evaluateCondition(condition, ctx) {
  const ahead = cellAhead(ctx.gnome);
  const blocked = ctx.board.isBlocking(ahead.x, ahead.y);
  switch (condition) {
    case CONDITIONS.BLOCKED: return blocked;
    case CONDITIONS.NOT_BLOCKED: return !blocked;
    default: throw new Error(`Unknown condition: ${condition}`);
  }
}

// ---------------------------------------------------------------------------
// Card handlers: one function per action. Signature: (card, def, ctx) => void
// ---------------------------------------------------------------------------

/**
 * Forward N: move one square at a time, N times. The card ends early when the
 * gnome is blocked, or when it lands on a special square (after its effect).
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleForward(card, def, ctx) {
  for (let i = 0; i < def.params.steps && !shouldStop(ctx); i++) {
    if (!moveOneSquare(ctx, card, 'forward')) return;
  }
}

/**
 * Back N: same as handleForward backward. The direction does not change.
 * Ends early on a blocked move or a special square, like Forward.
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleBack(card, def, ctx) {
  for (let i = 0; i < def.params.steps && !shouldStop(ctx); i++) {
    if (!moveOneSquare(ctx, card, 'back')) return;
  }
}

/**
 * Turn: rotate by def.params.quarterTurns (-1 left, 1 right, 2 U-turn).
 * Left and right are the gnome's own left and right, not the screen's.
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleTurn(card, def, ctx) {
  ctx.gnome = { ...ctx.gnome, direction: rotateDirection(ctx.gnome.direction, def.params.quarterTurns) };
  recordStep(ctx, card.uid, STEP_EVENTS.TURNED);
}

/**
 * Repeat N: run the body N times (nested repeats work through recursion).
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleRepeat(card, def, ctx) {
  for (let i = 0; i < def.params.times && !shouldStop(ctx); i++) {
    executeCards(card.children, ctx);
  }
}

/**
 * If: evaluate the condition, record a "checked" step (so the animation
 * highlights the If card), then run the card on its right when true.
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 * @returns {boolean} The condition result (used by an Else right under it).
 */
export function handleIf(card, def, ctx) {
  const result = evaluateCondition(def.params.condition, ctx);
  recordStep(ctx, card.uid, STEP_EVENTS.CHECKED, { condition: def.params.condition, result });
  if (result && !shouldStop(ctx)) executeCards(card.children, ctx);
  return result;
}

/**
 * Else: called by executeCards only when the If right above was false.
 * Runs the card on its right.
 * @param {CardInstance} card
 * @param {CardDefinition} def
 * @param {RunContext} ctx
 */
export function handleElse(card, def, ctx) {
  executeCards(card.children, ctx);
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
