/**
 * @file interpreter.test.js
 * Tests of js/logic/interpreter.js and js/logic/program.js with node:test.
 * Run: npm test   (or: node --test tests/)
 *
 * Tip: write a small helper that builds a Program from a list of card ids,
 * e.g. buildProgram([['repeat2', ['forward1', 'turnRight']]]).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_CARDS, MAX_STEPS, STEP_EVENTS, RUN_STATUS } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome } from '../js/logic/gnome.js';
import { CARD_IDS } from '../js/logic/cards.js';
import { Program, PROGRAM_ERRORS } from '../js/logic/program.js';
import { runProgram } from '../js/logic/interpreter.js';

describe('Interpreter: moves', () => {
  test.todo('Forward 1 on a free cell moves the gnome one cell (event "moved")', () => {
    // board = new Board(); gnome = createGnome(0, 10, 'N');
    // program.addCard(CARD_IDS.FORWARD_1);
    // result = runProgram(board, gnome, program.root);
    // assert.deepEqual(result.finalGnome, { x: 0, y: 9, direction: 'N' });
    // assert.equal(result.steps.at(-1).event, STEP_EVENTS.MOVED);
  });

  test.todo('Forward 2 moves cell by cell (2 "moved" steps)');

  test.todo('blocked by a wall: the gnome stays on its cell, event "blocked", execution continues');

  test.todo('Forward 2 with a wall on the 2nd cell: one "moved" then one "blocked"');

  test.todo('blocked by the board edge (e.g. at y = 0 facing N)');

  test.todo('Back 1 moves backward without changing the direction');

  test.todo('Back 1 toward a wall is blocked');

  test.todo('Turn left / Turn right / U-turn change only the direction (event "turned")');

  test.todo('blockedCount counts every "blocked" event');
});

describe('Interpreter: loops', () => {
  test.todo('simple Repeat: Repeat 3 [Forward 1] moves 3 cells');

  test.todo('nested Repeat: Repeat 2 [Repeat 2 [Forward 1]] moves 4 cells');

  test.todo('Repeat with several cards inside keeps their order');
});

describe('Interpreter: conditions', () => {
  test.todo('If wall ahead (true): the "then" card runs');

  test.todo('If wall ahead (false) without Else: nothing happens, execution continues');

  test.todo('If path clear (false) with Else: the Else card runs');

  test.todo('If inside a Repeat is evaluated again at each iteration');
});

describe('Interpreter: end of run', () => {
  test.todo('reaching the treasure stops the run with status "treasure" and no later steps');

  test.todo('a run without treasure ends with status "finished"');

  test.todo('the run stops at MAX_STEPS with status "maxSteps"', () => {
    // use runProgram(board, gnome, cards, { maxSteps: 10 }) with Repeat 4 [Repeat 4 [Turn right]] ...
  });

  test.todo('the first step is the start state (event "start", cardUid null)');

  test.todo('the real board is never modified by a run');
});

describe('Program: 5 cards limit and structure', () => {
  test.todo(`counts nested cards: Repeat 2 [Forward 1, Turn left] = 3 cards`);

  test.todo(`refuses the ${MAX_CARDS + 1}th card with reason CARD_LIMIT`, () => {
    // add MAX_CARDS cards, then assert.equal(program.addCard(...).reason, PROGRAM_ERRORS.CARD_LIMIT)
  });

  test.todo('the limit counts cards inside Repeat and If too');

  test.todo('Else at the main level is refused with ELSE_OUTSIDE_IF');

  test.todo('Else inside an If goes to the "else" slot; a 2nd card in "then" is refused with SLOT_FULL');

  test.todo('removeCard removes the card and everything inside it');

  test.todo('validate() reports an Else that is not in an If');
});
