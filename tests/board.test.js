/**
 * @file board.test.js
 * Tests of js/logic/board.js and js/logic/gnome.js with node:test.
 * Run: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_SIZE, TREASURE_POSITION, CELL_TYPES } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome, turnLeft, turnRight, uTurn, cellAhead, cellBehind } from '../js/logic/gnome.js';

const T = TREASURE_POSITION;

describe('Board', () => {
  test('a new board is BOARD_SIZE x BOARD_SIZE and empty except the treasure', () => {
    const board = new Board();
    assert.equal(board.cells.length, BOARD_SIZE);
    let treasures = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
      assert.equal(board.cells[y].length, BOARD_SIZE);
      for (let x = 0; x < BOARD_SIZE; x++) {
        const type = board.getCell(x, y);
        if (type === CELL_TYPES.TREASURE) treasures++;
        else assert.equal(type, CELL_TYPES.EMPTY);
      }
    }
    assert.equal(treasures, 1);
    assert.equal(board.getCell(T.x, T.y), CELL_TYPES.TREASURE);
  });

  test('isInside returns false outside 0..10 on both axes', () => {
    const board = new Board();
    for (const [x, y] of [[-1, 0], [0, -1], [BOARD_SIZE, 0], [0, BOARD_SIZE], [1.5, 2]]) {
      assert.equal(board.isInside(x, y), false, `(${x}, ${y})`);
    }
    assert.equal(board.isInside(0, 0), true);
    assert.equal(board.isInside(BOARD_SIZE - 1, BOARD_SIZE - 1), true);
  });

  test('getCell returns null outside the board', () => {
    const board = new Board();
    assert.equal(board.getCell(-1, 3), null);
    assert.equal(board.getCell(3, BOARD_SIZE), null);
  });

  test('placeWall puts a wall on an empty cell', () => {
    const board = new Board();
    assert.equal(board.placeWall(2, 3), true);
    assert.equal(board.getCell(2, 3), CELL_TYPES.WALL);
  });

  test('placeWall is refused on the treasure', () => {
    const board = new Board();
    assert.equal(board.placeWall(T.x, T.y), false);
    assert.equal(board.getCell(T.x, T.y), CELL_TYPES.TREASURE);
  });

  test('placeWall is refused on the gnome cell', () => {
    const board = new Board();
    assert.equal(board.placeWall(1, 1, { x: 1, y: 1 }), false);
    assert.equal(board.getCell(1, 1), CELL_TYPES.EMPTY);
  });

  test('removeWall makes the cell empty again', () => {
    const board = new Board();
    board.placeWall(4, 4);
    assert.equal(board.removeWall(4, 4), true);
    assert.equal(board.getCell(4, 4), CELL_TYPES.EMPTY);
    assert.equal(board.removeWall(4, 4), false, 'nothing to remove the second time');
    assert.equal(board.removeWall(T.x, T.y), false, 'the treasure is never removed');
  });

  test('toggleWall adds then removes a wall', () => {
    const board = new Board();
    assert.equal(board.toggleWall(7, 2), true);
    assert.equal(board.getCell(7, 2), CELL_TYPES.WALL);
    assert.equal(board.toggleWall(7, 2), true);
    assert.equal(board.getCell(7, 2), CELL_TYPES.EMPTY);
  });

  test('clearWalls removes every wall but keeps the treasure', () => {
    const board = new Board();
    board.placeWall(0, 0);
    board.placeWall(10, 10);
    board.placeWall(5, 4);
    board.clearWalls();
    assert.equal(board.getCell(0, 0), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(10, 10), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(5, 4), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(T.x, T.y), CELL_TYPES.TREASURE);
  });

  test('isBlocking is true for a wall and for any cell outside the board (edge)', () => {
    const board = new Board();
    board.placeWall(3, 3);
    assert.equal(board.isBlocking(3, 3), true);
    assert.equal(board.isBlocking(-1, 0), true);
    assert.equal(board.isBlocking(0, BOARD_SIZE), true);
  });

  test('isBlocking is false for an empty cell and for the treasure', () => {
    const board = new Board();
    assert.equal(board.isBlocking(2, 2), false);
    assert.equal(board.isBlocking(T.x, T.y), false);
  });

  test('canPlaceGnome is false on a wall and on the treasure', () => {
    const board = new Board();
    board.placeWall(6, 6);
    assert.equal(board.canPlaceGnome(6, 6), false);
    assert.equal(board.canPlaceGnome(T.x, T.y), false);
    assert.equal(board.canPlaceGnome(0, 0), true);
  });

  test('clone returns an independent copy (changing the clone does not change the original)', () => {
    const board = new Board();
    board.placeWall(1, 2);
    const copy = board.clone();
    assert.equal(copy.getCell(1, 2), CELL_TYPES.WALL);
    copy.placeWall(8, 8);
    copy.removeWall(1, 2);
    assert.equal(board.getCell(8, 8), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(1, 2), CELL_TYPES.WALL);
  });
});

describe('Gnome', () => {
  test('createGnome refuses an invalid direction', () => {
    assert.throws(() => createGnome(0, 0, 'X'));
    assert.deepEqual(createGnome(1, 2, 'E'), { x: 1, y: 2, direction: 'E' });
  });

  test('turnLeft: N -> W -> S -> E -> N', () => {
    let g = createGnome(3, 3, 'N');
    for (const expected of ['W', 'S', 'E', 'N']) {
      g = turnLeft(g);
      assert.equal(g.direction, expected);
    }
  });

  test('turnRight: N -> E -> S -> W -> N', () => {
    let g = createGnome(3, 3, 'N');
    for (const expected of ['E', 'S', 'W', 'N']) {
      g = turnRight(g);
      assert.equal(g.direction, expected);
    }
  });

  test('uTurn: N <-> S and E <-> W', () => {
    assert.equal(uTurn(createGnome(0, 0, 'N')).direction, 'S');
    assert.equal(uTurn(createGnome(0, 0, 'S')).direction, 'N');
    assert.equal(uTurn(createGnome(0, 0, 'E')).direction, 'W');
    assert.equal(uTurn(createGnome(0, 0, 'W')).direction, 'E');
  });

  test('turning does not change the position and does not mutate the original object', () => {
    const original = createGnome(4, 7, 'N');
    const turned = turnRight(original);
    assert.deepEqual(original, { x: 4, y: 7, direction: 'N' });
    assert.equal(turned.x, 4);
    assert.equal(turned.y, 7);
    assert.notEqual(turned, original);
  });

  test('cellAhead and cellBehind follow the direction (y grows downward)', () => {
    assert.deepEqual(cellAhead(createGnome(3, 3, 'N')), { x: 3, y: 2 });
    assert.deepEqual(cellBehind(createGnome(3, 3, 'N')), { x: 3, y: 4 });
    assert.deepEqual(cellAhead(createGnome(3, 3, 'E')), { x: 4, y: 3 });
    assert.deepEqual(cellBehind(createGnome(3, 3, 'E')), { x: 2, y: 3 });
    assert.deepEqual(cellAhead(createGnome(3, 3, 'S')), { x: 3, y: 4 });
    assert.deepEqual(cellAhead(createGnome(3, 3, 'W')), { x: 2, y: 3 });
  });
});
