/**
 * @file interpreter.test.js
 * Tests of js/logic/interpreter.js and js/logic/program.js with node:test.
 * Run: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_CARDS, MAX_STEPS, STEP_EVENTS, RUN_STATUS, CELL_TYPES } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome } from '../js/logic/gnome.js';
import { CARD_IDS } from '../js/logic/cards.js';
import { Program, PROGRAM_ERRORS } from '../js/logic/program.js';
import { runProgram } from '../js/logic/interpreter.js';

const {
  FORWARD_1, FORWARD_2, BACK_1, TURN_LEFT, TURN_RIGHT, U_TURN,
  REPEAT_2, REPEAT_3, REPEAT_4, IF_WALL, IF_CLEAR, ELSE,
} = CARD_IDS;

/**
 * Build a Program from a compact spec. A string is a card; an array
 * `[containerId, ...children]` is a container with its children.
 * Example: [FORWARD_1, [REPEAT_2, FORWARD_1, TURN_RIGHT]]
 * For an If: [IF_WALL, thenCard, [ELSE, elseCard]].
 * @param {Array} spec
 * @returns {Program}
 */
function buildProgram(spec) {
  const program = new Program();
  const add = (items, parentUid) => {
    for (const item of items) {
      const [cardId, ...children] = Array.isArray(item) ? item : [item];
      const result = program.addCard(cardId, parentUid);
      assert.ok(result.ok, `could not add ${cardId}: ${result.reason}`);
      add(children, result.card.uid);
    }
  };
  add(spec, null);
  return program;
}

/**
 * Run a spec on a board.
 * @param {Array} spec
 * @param {{x: number, y: number, direction: string}} gnome
 * @param {Board} [board]
 * @param {Object} [options]
 */
function run(spec, gnome, board = new Board(), options) {
  return runProgram(board, createGnome(gnome.x, gnome.y, gnome.direction), buildProgram(spec).root, options);
}

/** List of the events of a run, without the start step. */
const events = (result) => result.steps.slice(1).map((step) => step.event);

describe('Interpreter: moves', () => {
  test('Forward 1 on a free cell moves the gnome one cell (event "moved")', () => {
    const result = run([FORWARD_1], { x: 0, y: 10, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 0, y: 9, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED]);
  });

  test('Forward 2 moves cell by cell (2 "moved" steps)', () => {
    const result = run([FORWARD_2], { x: 0, y: 10, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.MOVED]);
    assert.deepEqual(result.steps[1].gnome, { x: 0, y: 9, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 0, y: 8, direction: 'N' });
  });

  test('blocked by a wall: the gnome stays on its cell, event "blocked", execution continues', () => {
    const board = new Board();
    board.placeWall(0, 9);
    const result = run([FORWARD_1, TURN_RIGHT], { x: 0, y: 10, direction: 'N' }, board);
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED, STEP_EVENTS.TURNED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 10, direction: 'E' });
    assert.equal(result.status, RUN_STATUS.FINISHED);
  });

  test('Forward 2 with a wall on the 2nd cell: one "moved" then one "blocked"', () => {
    const board = new Board();
    board.placeWall(0, 8);
    const result = run([FORWARD_2], { x: 0, y: 10, direction: 'N' }, board);
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 9, direction: 'N' });
  });

  test('blocked by the board edge (e.g. at y = 0 facing N)', () => {
    const result = run([FORWARD_1], { x: 3, y: 0, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 3, y: 0, direction: 'N' });
  });

  test('Back 1 moves backward without changing the direction', () => {
    const result = run([BACK_1], { x: 2, y: 2, direction: 'E' });
    assert.deepEqual(result.finalGnome, { x: 1, y: 2, direction: 'E' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED]);
  });

  test('Back 1 toward a wall is blocked', () => {
    const board = new Board();
    board.placeWall(1, 2);
    const result = run([BACK_1], { x: 2, y: 2, direction: 'E' }, board);
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'E' });
  });

  test('Turn left / Turn right / U-turn change only the direction (event "turned")', () => {
    const start = { x: 2, y: 2, direction: 'N' };
    assert.deepEqual(run([TURN_LEFT], start).finalGnome, { x: 2, y: 2, direction: 'W' });
    assert.deepEqual(run([TURN_RIGHT], start).finalGnome, { x: 2, y: 2, direction: 'E' });
    const result = run([U_TURN], start);
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'S' });
    assert.deepEqual(events(result), [STEP_EVENTS.TURNED]);
  });

  test('blockedCount counts every "blocked" event', () => {
    const result = run([FORWARD_2, FORWARD_1], { x: 0, y: 0, direction: 'N' });
    assert.equal(result.blockedCount, 3);
  });
});

describe('Interpreter: loops', () => {
  test('simple Repeat: Repeat 3 [Forward 1] moves 3 cells', () => {
    const result = run([[REPEAT_3, FORWARD_1]], { x: 0, y: 10, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 0, y: 7, direction: 'N' });
    assert.equal(events(result).length, 3);
  });

  test('nested Repeat: Repeat 2 [Repeat 2 [Forward 1]] moves 4 cells', () => {
    const result = run([[REPEAT_2, [REPEAT_2, FORWARD_1]]], { x: 0, y: 10, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 0, y: 6, direction: 'N' });
  });

  test('Repeat with several cards inside keeps their order', () => {
    // Repeat 4 [Forward 1, Turn right] draws a small square back to the start
    const result = run([[REPEAT_4, FORWARD_1, TURN_RIGHT]], { x: 2, y: 2, direction: 'N' });
    assert.deepEqual(events(result), Array(4).fill([STEP_EVENTS.MOVED, STEP_EVENTS.TURNED]).flat());
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'N' });
  });
});

describe('Interpreter: conditions', () => {
  test('If wall ahead (true): the "then" card runs', () => {
    const result = run([[IF_WALL, TURN_RIGHT]], { x: 0, y: 0, direction: 'N' });
    assert.equal(result.steps[1].event, STEP_EVENTS.CHECKED);
    assert.equal(result.steps[1].details.result, true);
    assert.deepEqual(result.finalGnome, { x: 0, y: 0, direction: 'E' });
  });

  test('If wall ahead (false) without Else: nothing happens, execution continues', () => {
    const result = run([[IF_WALL, TURN_RIGHT], FORWARD_1], { x: 0, y: 10, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 9, direction: 'N' });
  });

  test('If path clear (false) with Else: the Else card runs', () => {
    const board = new Board();
    board.placeWall(0, 9);
    const result = run([[IF_CLEAR, FORWARD_1, [ELSE, TURN_RIGHT]]], { x: 0, y: 10, direction: 'N' }, board);
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.TURNED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 10, direction: 'E' });
  });

  test('If inside a Repeat is evaluated again at each iteration', () => {
    // Going N from (0, 2): clear, clear, then wall (edge) -> turn right
    const result = run([[REPEAT_3, [IF_CLEAR, FORWARD_1, [ELSE, TURN_RIGHT]]]], { x: 0, y: 2, direction: 'N' });
    assert.deepEqual(events(result), [
      STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED,
      STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED,
      STEP_EVENTS.CHECKED, STEP_EVENTS.TURNED,
    ]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 0, direction: 'E' });
  });
});

describe('Interpreter: end of run', () => {
  test('reaching the treasure stops the run with status "treasure" and no later steps', () => {
    const result = run([FORWARD_2, FORWARD_2, TURN_RIGHT], { x: 5, y: 8, direction: 'N' });
    assert.equal(result.status, RUN_STATUS.TREASURE);
    assert.equal(result.steps.at(-1).event, STEP_EVENTS.TREASURE);
    assert.deepEqual(result.finalGnome, { x: 5, y: 5, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.MOVED, STEP_EVENTS.TREASURE]);
  });

  test('a run without treasure ends with status "finished"', () => {
    const result = run([FORWARD_1], { x: 0, y: 10, direction: 'N' });
    assert.equal(result.status, RUN_STATUS.FINISHED);
  });

  test('the run stops at MAX_STEPS with status "maxSteps"', () => {
    // 4 * 4 * 4 * 4 = 256 turns > MAX_STEPS, with exactly 5 cards
    const spec = [[REPEAT_4, [REPEAT_4, [REPEAT_4, [REPEAT_4, TURN_RIGHT]]]]];
    const result = run(spec, { x: 0, y: 0, direction: 'N' });
    assert.ok(256 > MAX_STEPS, 'this test needs MAX_STEPS < 256');
    assert.equal(result.status, RUN_STATUS.MAX_STEPS);
    assert.equal(result.steps.length, MAX_STEPS + 1); // + the start step

    const small = run([[REPEAT_4, [REPEAT_4, TURN_RIGHT]]], { x: 0, y: 0, direction: 'N' }, new Board(), { maxSteps: 10 });
    assert.equal(small.status, RUN_STATUS.MAX_STEPS);
    assert.equal(small.steps.length, 11);
  });

  test('the first step is the start state (event "start", cardUid null)', () => {
    const result = run([FORWARD_1], { x: 4, y: 9, direction: 'W' });
    assert.deepEqual(result.steps[0], {
      index: 0, gnome: { x: 4, y: 9, direction: 'W' }, cardUid: null, event: STEP_EVENTS.START,
    });
  });

  test('the real board is never modified by a run', () => {
    const board = new Board();
    board.placeWall(3, 3);
    const before = JSON.stringify(board.cells);
    run([[REPEAT_4, FORWARD_2, TURN_LEFT]], { x: 0, y: 10, direction: 'N' }, board);
    assert.equal(JSON.stringify(board.cells), before);
    assert.equal(board.getCell(3, 3), CELL_TYPES.WALL);
  });
});

describe('Program: 5 cards limit and structure', () => {
  test('counts nested cards: Repeat 2 [Forward 1, Turn left] = 3 cards', () => {
    assert.equal(buildProgram([[REPEAT_2, FORWARD_1, TURN_LEFT]]).countCards(), 3);
  });

  test(`refuses the ${MAX_CARDS + 1}th card with reason CARD_LIMIT`, () => {
    const program = new Program();
    for (let i = 0; i < MAX_CARDS; i++) assert.ok(program.addCard(FORWARD_1).ok);
    assert.equal(program.canAddCard(), false);
    const result = program.addCard(TURN_LEFT);
    assert.equal(result.ok, false);
    assert.equal(result.reason, PROGRAM_ERRORS.CARD_LIMIT);
  });

  test('the limit counts cards inside Repeat and If too', () => {
    const program = buildProgram([[REPEAT_2, FORWARD_1, [IF_WALL, TURN_LEFT]], FORWARD_1]);
    assert.equal(program.countCards(), MAX_CARDS);
    assert.equal(program.addCard(FORWARD_1, program.root[0].uid).reason, PROGRAM_ERRORS.CARD_LIMIT);
  });

  test('Else at the main level is refused with ELSE_OUTSIDE_IF', () => {
    const program = new Program();
    assert.equal(program.addCard(ELSE).reason, PROGRAM_ERRORS.ELSE_OUTSIDE_IF);
    const repeat = program.addCard(REPEAT_2).card;
    assert.equal(program.addCard(ELSE, repeat.uid).reason, PROGRAM_ERRORS.ELSE_OUTSIDE_IF);
  });

  test('Else inside an If goes to the "else" slot; a 2nd card in "then" is refused with SLOT_FULL', () => {
    const program = new Program();
    const ifCard = program.addCard(IF_WALL).card;
    assert.ok(program.addCard(TURN_LEFT, ifCard.uid).ok);
    const elseCard = program.addCard(ELSE, ifCard.uid).card;
    assert.deepEqual(ifCard.slots.else, [elseCard]);
    assert.equal(ifCard.slots.then.length, 1);
    assert.equal(program.addCard(FORWARD_1, ifCard.uid).reason, PROGRAM_ERRORS.SLOT_FULL);
    assert.equal(program.addCard(ELSE, ifCard.uid).reason, PROGRAM_ERRORS.SLOT_FULL);
  });

  test('removeCard removes the card and everything inside it', () => {
    const program = buildProgram([FORWARD_1, [REPEAT_2, FORWARD_1, TURN_LEFT]]);
    const repeatUid = program.root[1].uid;
    const innerUid = program.root[1].slots.body[0].uid;
    assert.ok(program.removeCard(repeatUid).ok);
    assert.equal(program.countCards(), 1);
    assert.equal(program.findCard(innerUid), null);
    assert.equal(program.removeCard('does-not-exist').reason, PROGRAM_ERRORS.NOT_FOUND);
  });

  test('validate() reports an Else that is not in an If', () => {
    const program = buildProgram([[IF_WALL, TURN_LEFT, [ELSE, FORWARD_1]]]);
    assert.deepEqual(program.validate(), { valid: true, errors: [] });
    // Force an invalid tree by moving the Else to the main level by hand
    program.root.push(program.root[0].slots.else.pop());
    const { valid, errors } = program.validate();
    assert.equal(valid, false);
    assert.ok(errors.includes(PROGRAM_ERRORS.ELSE_OUTSIDE_IF));
  });
});
