/**
 * @file interpreter.test.js
 * Tests of js/logic/interpreter.js and js/logic/program.js with node:test.
 * Run: npm test
 *
 * Positions are computed from BOARD_SIZE and the treasure position, so the
 * tests keep working if the team changes the board size.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_SIZE, TREASURE_POSITION, MAX_CARDS, MAX_STEPS, STEP_EVENTS, RUN_STATUS, CELL_TYPES } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome } from '../js/logic/gnome.js';
import { CARD_IDS } from '../js/logic/cards.js';
import { Program, PROGRAM_ERRORS } from '../js/logic/program.js';
import { runProgram } from '../js/logic/interpreter.js';

const {
  FORWARD_1, FORWARD_2, BACK_1, TURN_LEFT, TURN_RIGHT, U_TURN,
  REPEAT_2, REPEAT_3, REPEAT_4, IF_BLOCKED, IF_NOT_BLOCKED, ELSE,
} = CARD_IDS;

const LAST = BOARD_SIZE - 1;
const T = TREASURE_POSITION;
/** Bottom-left square, looking North: far from the treasure. */
const BOTTOM_LEFT_N = { x: 0, y: LAST, direction: 'N' };

/**
 * Build a Program from a compact spec, read from top to bottom.
 * A string is a card; an array `[containerId, ...cardsOnItsRight]` is a container.
 * An Else is written right under its If, in the same list:
 *   [[IF_BLOCKED, TURN_RIGHT], [ELSE, FORWARD_1]]
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

describe('Interpreter: movement', () => {
  test('Forward 1 on a free square moves the gnome one square (event "moved")', () => {
    const result = run([FORWARD_1], BOTTOM_LEFT_N);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 1, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED]);
  });

  test('Forward 2 moves square by square (2 "moved" steps)', () => {
    const result = run([FORWARD_2], BOTTOM_LEFT_N);
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.MOVED]);
    assert.deepEqual(result.steps[1].gnome, { x: 0, y: LAST - 1, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 2, direction: 'N' });
  });

  test('blocked by an obstacle: the gnome stays on its square, event "blocked", the algorithm goes on', () => {
    const board = new Board();
    board.placeObstacle(0, LAST - 1);
    const result = run([FORWARD_1, TURN_RIGHT], BOTTOM_LEFT_N, board);
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED, STEP_EVENTS.TURNED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST, direction: 'E' });
    assert.equal(result.status, RUN_STATUS.FINISHED);
  });

  test('Forward 2 blocked after one square: one "moved", one "blocked", then it stops', () => {
    const board = new Board();
    board.placeObstacle(0, LAST - 2);
    const result = run([FORWARD_2], BOTTOM_LEFT_N, board);
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 1, direction: 'N' });
  });

  test('Forward 2 blocked on the first square counts only one "blocked"', () => {
    const result = run([FORWARD_2], { x: 3, y: 0, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED]);
    assert.equal(result.blockedCount, 1);
  });

  test('blocked by the board edge (at y = 0 looking N)', () => {
    const result = run([FORWARD_1], { x: 3, y: 0, direction: 'N' });
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 3, y: 0, direction: 'N' });
  });

  test('Back 1 moves backward and keeps looking the same way', () => {
    const result = run([BACK_1], { x: 2, y: 2, direction: 'E' });
    assert.deepEqual(result.finalGnome, { x: 1, y: 2, direction: 'E' });
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED]);
  });

  test('Back 1 toward an obstacle is blocked', () => {
    const board = new Board();
    board.placeObstacle(1, 2);
    const result = run([BACK_1], { x: 2, y: 2, direction: 'E' }, board);
    assert.deepEqual(events(result), [STEP_EVENTS.BLOCKED]);
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'E' });
  });

  test('Turn left / Turn right are the gnome\'s left and right (event "turned")', () => {
    const lookingSouth = { x: 2, y: 2, direction: 'S' };
    assert.deepEqual(run([TURN_LEFT], lookingSouth).finalGnome, { x: 2, y: 2, direction: 'E' });
    assert.deepEqual(run([TURN_RIGHT], lookingSouth).finalGnome, { x: 2, y: 2, direction: 'W' });
    assert.deepEqual(events(run([TURN_RIGHT], lookingSouth)), [STEP_EVENTS.TURNED]);
  });

  test('U-turn: the gnome looks the other way', () => {
    const result = run([U_TURN], { x: 2, y: 2, direction: 'N' });
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'S' });
    assert.deepEqual(events(result), [STEP_EVENTS.TURNED]);
  });

  test('blockedCount counts every "blocked" event', () => {
    const result = run([FORWARD_2, FORWARD_1, BACK_1], { x: 0, y: 0, direction: 'N' });
    assert.equal(result.blockedCount, 2);
  });
});

describe('Interpreter: loops', () => {
  test('simple Repeat: Repeat 3 times [Forward 1] moves 3 squares', () => {
    const result = run([[REPEAT_3, FORWARD_1]], BOTTOM_LEFT_N);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 3, direction: 'N' });
    assert.equal(events(result).length, 3);
  });

  test('nested Repeat: Repeat 2 times [Repeat 2 times [Forward 1]] moves 4 squares', () => {
    const result = run([[REPEAT_2, [REPEAT_2, FORWARD_1]]], BOTTOM_LEFT_N);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 4, direction: 'N' });
  });

  test('Repeat with several cards on its right keeps their order', () => {
    // Repeat 4 times [Forward 1, Turn right] draws a small square back to the start
    const result = run([[REPEAT_4, FORWARD_1, TURN_RIGHT]], { x: 2, y: 2, direction: 'N' });
    assert.deepEqual(events(result), Array(4).fill([STEP_EVENTS.MOVED, STEP_EVENTS.TURNED]).flat());
    assert.deepEqual(result.finalGnome, { x: 2, y: 2, direction: 'N' });
  });
});

describe('Interpreter: conditions', () => {
  test('If blocked (true): the card on its right runs', () => {
    const result = run([[IF_BLOCKED, TURN_RIGHT]], { x: 0, y: 0, direction: 'N' });
    assert.equal(result.steps[1].event, STEP_EVENTS.CHECKED);
    assert.equal(result.steps[1].details.result, true);
    assert.deepEqual(result.finalGnome, { x: 0, y: 0, direction: 'E' });
  });

  test('If not blocked (true): the card on its right runs', () => {
    const result = run([[IF_NOT_BLOCKED, FORWARD_1]], BOTTOM_LEFT_N);
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 1, direction: 'N' });
  });

  test('If blocked tests the square in front of the gnome, in its current direction', () => {
    const board = new Board();
    board.placeObstacle(3, 2); // East of the gnome
    const lookingNorth = run([[IF_BLOCKED, U_TURN]], { x: 2, y: 2, direction: 'N' }, board);
    const lookingEast = run([[IF_BLOCKED, U_TURN]], { x: 2, y: 2, direction: 'E' }, board);
    assert.equal(lookingNorth.steps[1].details.result, false);
    assert.equal(lookingEast.steps[1].details.result, true);
  });

  test('If false without Else: nothing happens, the algorithm goes on', () => {
    const result = run([[IF_BLOCKED, TURN_RIGHT], FORWARD_1], BOTTOM_LEFT_N);
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST - 1, direction: 'N' });
  });

  test('If false with Else: the card on the right of the Else runs', () => {
    const board = new Board();
    board.placeObstacle(0, LAST - 1);
    const result = run([[IF_NOT_BLOCKED, FORWARD_1], [ELSE, TURN_RIGHT]], BOTTOM_LEFT_N, board);
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.TURNED]);
    assert.deepEqual(result.finalGnome, { x: 0, y: LAST, direction: 'E' });
  });

  test('If true with Else: the Else is skipped', () => {
    const result = run([[IF_NOT_BLOCKED, FORWARD_1], [ELSE, TURN_RIGHT]], BOTTOM_LEFT_N);
    assert.deepEqual(events(result), [STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED]);
  });

  test('If / Else inside a Repeat are evaluated again at each turn', () => {
    // Going N from (0, 2): free, free, then the edge -> turn right
    const result = run([[REPEAT_3, [IF_NOT_BLOCKED, FORWARD_1], [ELSE, TURN_RIGHT]]], { x: 0, y: 2, direction: 'N' });
    assert.deepEqual(events(result), [
      STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED,
      STEP_EVENTS.CHECKED, STEP_EVENTS.MOVED,
      STEP_EVENTS.CHECKED, STEP_EVENTS.TURNED,
    ]);
    assert.deepEqual(result.finalGnome, { x: 0, y: 0, direction: 'E' });
  });
});

describe('Interpreter: end of run', () => {
  test('reaching the treasure in the middle of the algorithm stops the run', () => {
    const start = { x: T.x, y: T.y + 3, direction: 'N' };
    const result = run([FORWARD_2, FORWARD_2, TURN_RIGHT, FORWARD_1], start);
    assert.equal(result.status, RUN_STATUS.TREASURE);
    assert.deepEqual(events(result), [STEP_EVENTS.MOVED, STEP_EVENTS.MOVED, STEP_EVENTS.TREASURE]);
    assert.deepEqual(result.finalGnome, { x: T.x, y: T.y, direction: 'N' });
  });

  test('a run without treasure ends with status "finished"', () => {
    const result = run([FORWARD_1], BOTTOM_LEFT_N);
    assert.equal(result.status, RUN_STATUS.FINISHED);
  });

  test('the run stops at MAX_STEPS with status "maxSteps"', () => {
    // 4 * 4 * 4 * 4 = 256 turns > MAX_STEPS, with 5 cards
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
    const result = run([FORWARD_1], { x: 4, y: 1, direction: 'W' });
    assert.deepEqual(result.steps[0], {
      index: 0, gnome: { x: 4, y: 1, direction: 'W' }, cardUid: null, event: STEP_EVENTS.START,
    });
  });

  test('the real board is never modified by a run', () => {
    const board = new Board();
    board.placeObstacle(3, 3);
    const before = JSON.stringify(board.cells);
    run([[REPEAT_4, FORWARD_2, TURN_LEFT]], BOTTOM_LEFT_N, board);
    assert.equal(JSON.stringify(board.cells), before);
    assert.equal(board.getCell(3, 3), CELL_TYPES.OBSTACLE);
  });

  test('works on a board of another size than 11', () => {
    const board = new Board(7); // treasure on (3, 3)
    const result = runProgram(board, createGnome(3, 6, 'N'), buildProgram([FORWARD_2, FORWARD_1]).root);
    assert.equal(result.status, RUN_STATUS.TREASURE);
    assert.deepEqual(result.finalGnome, { x: 3, y: 3, direction: 'N' });

    const edge = runProgram(board, createGnome(6, 6, 'E'), buildProgram([FORWARD_1]).root);
    assert.deepEqual(events(edge), [STEP_EVENTS.BLOCKED]);
  });
});

describe('Program: 8 cards limit and structure', () => {
  test('MAX_CARDS is 8, the size of a hand', () => {
    assert.equal(MAX_CARDS, 8);
  });

  test('counts contained cards: Repeat 2 times [Forward 1, Turn left] = 3 cards', () => {
    assert.equal(buildProgram([[REPEAT_2, FORWARD_1, TURN_LEFT]]).countCards(), 3);
  });

  test(`refuses card number ${MAX_CARDS + 1} with reason CARD_LIMIT`, () => {
    const program = new Program();
    for (let i = 0; i < MAX_CARDS; i++) assert.ok(program.addCard(FORWARD_1).ok);
    assert.equal(program.canAddCard(), false);
    const result = program.addCard(TURN_LEFT);
    assert.equal(result.ok, false);
    assert.equal(result.reason, PROGRAM_ERRORS.CARD_LIMIT);
  });

  test('the limit counts cards contained in Repeat, If and Else too', () => {
    // 1 Repeat + 1 Forward + If + Turn + Else + Forward + Back + U-turn = 8
    const program = buildProgram([
      [REPEAT_2, FORWARD_1, [IF_BLOCKED, TURN_LEFT], [ELSE, FORWARD_1]],
      BACK_1,
      U_TURN,
    ]);
    assert.equal(program.countCards(), MAX_CARDS);
    assert.equal(program.addCard(FORWARD_1, program.root[0].uid).reason, PROGRAM_ERRORS.CARD_LIMIT);
  });

  test('an If holds only one card', () => {
    const program = new Program();
    const ifCard = program.addCard(IF_BLOCKED).card;
    assert.ok(program.addCard(TURN_LEFT, ifCard.uid).ok);
    assert.equal(program.addCard(FORWARD_1, ifCard.uid).reason, PROGRAM_ERRORS.SLOT_FULL);
  });

  test('Else goes right under an If, as a card of the same list', () => {
    const program = new Program();
    const ifCard = program.addCard(IF_BLOCKED).card;
    program.addCard(TURN_LEFT, ifCard.uid);
    const elseCard = program.addCard(ELSE).card;
    assert.deepEqual(program.root.map((c) => c.cardId), [IF_BLOCKED, ELSE]);
    assert.ok(program.addCard(FORWARD_1, elseCard.uid).ok);
    assert.equal(program.addCard(TURN_RIGHT, elseCard.uid).reason, PROGRAM_ERRORS.SLOT_FULL);
  });

  test('with an If selected, Else is inserted right under that If', () => {
    const program = buildProgram([[IF_BLOCKED, TURN_LEFT], FORWARD_1]);
    const result = program.addCard(ELSE, program.root[0].uid);
    assert.ok(result.ok);
    assert.deepEqual(program.root.map((c) => c.cardId), [IF_BLOCKED, ELSE, FORWARD_1]);
  });

  test('Else is refused when there is no If right above it', () => {
    const program = new Program();
    assert.equal(program.addCard(ELSE).reason, PROGRAM_ERRORS.ELSE_WITHOUT_IF);
    program.addCard(FORWARD_1);
    assert.equal(program.addCard(ELSE).reason, PROGRAM_ERRORS.ELSE_WITHOUT_IF);
    const repeat = program.addCard(REPEAT_2).card;
    assert.equal(program.addCard(ELSE, repeat.uid).reason, PROGRAM_ERRORS.ELSE_WITHOUT_IF);
  });

  test('only one Else per If', () => {
    const program = buildProgram([[IF_BLOCKED, TURN_LEFT], ELSE]);
    assert.equal(program.addCard(ELSE, program.root[0].uid).reason, PROGRAM_ERRORS.ELSE_WITHOUT_IF);
  });

  test('removeCard removes the card and everything on its right', () => {
    const program = buildProgram([FORWARD_1, [REPEAT_2, FORWARD_1, TURN_LEFT]]);
    const repeatUid = program.root[1].uid;
    const innerUid = program.root[1].children[0].uid;
    assert.ok(program.removeCard(repeatUid).ok);
    assert.equal(program.countCards(), 1);
    assert.equal(program.findCard(innerUid), null);
    assert.equal(program.removeCard('does-not-exist').reason, PROGRAM_ERRORS.NOT_FOUND);
  });

  test('removing an If also removes the Else under it', () => {
    const program = buildProgram([[IF_BLOCKED, TURN_LEFT], [ELSE, FORWARD_1], BACK_1]);
    program.removeCard(program.root[0].uid);
    assert.deepEqual(program.root.map((c) => c.cardId), [BACK_1]);
    assert.deepEqual(program.validate(), { valid: true, errors: [] });
  });

  test('validate() reports an Else that is not right under an If', () => {
    const program = buildProgram([[IF_BLOCKED, TURN_LEFT], [ELSE, FORWARD_1]]);
    assert.deepEqual(program.validate(), { valid: true, errors: [] });
    program.root.reverse(); // force the Else above the If
    const { valid, errors } = program.validate();
    assert.equal(valid, false);
    assert.ok(errors.includes(PROGRAM_ERRORS.ELSE_WITHOUT_IF));
  });
});
