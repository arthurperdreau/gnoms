/**
 * @file board.test.js
 * Tests of js/logic/board.js and js/logic/gnome.js with node:test.
 * Run: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_SIZE, TREASURE_POSITION, CELL_TYPES, getTreasurePosition } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome, turnLeft, turnRight, uTurn, cellAhead, cellBehind } from '../js/logic/gnome.js';

const T = TREASURE_POSITION;
const LAST = BOARD_SIZE - 1;

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

  test('the treasure is on the center square, computed from the size', () => {
    assert.deepEqual(getTreasurePosition(11), { x: 5, y: 5 });
    assert.deepEqual(getTreasurePosition(7), { x: 3, y: 3 });
    assert.deepEqual(new Board().treasure, TREASURE_POSITION);
  });

  test('a board of another size than 11 works the same way', () => {
    for (const size of [5, 7, 9, 13]) {
      const board = new Board(size);
      const center = Math.floor(size / 2);
      assert.equal(board.cells.length, size);
      assert.equal(board.getCell(center, center), CELL_TYPES.TREASURE);
      assert.equal(board.isInside(size - 1, size - 1), true);
      assert.equal(board.isInside(size, 0), false);
      assert.equal(board.isBlocking(size, 0), true, 'the edge blocks');
    }
  });

  test('isInside returns false outside the board on both axes', () => {
    const board = new Board();
    for (const [x, y] of [[-1, 0], [0, -1], [BOARD_SIZE, 0], [0, BOARD_SIZE], [1.5, 2]]) {
      assert.equal(board.isInside(x, y), false, `(${x}, ${y})`);
    }
    assert.equal(board.isInside(0, 0), true);
    assert.equal(board.isInside(LAST, LAST), true);
  });

  test('getCell returns null outside the board', () => {
    const board = new Board();
    assert.equal(board.getCell(-1, 3), null);
    assert.equal(board.getCell(3, BOARD_SIZE), null);
  });

  test('placeObstacle puts an obstacle on an empty square', () => {
    const board = new Board();
    assert.equal(board.placeObstacle(2, 3), true);
    assert.equal(board.getCell(2, 3), CELL_TYPES.OBSTACLE);
  });

  test('placeObstacle is refused on the treasure', () => {
    const board = new Board();
    assert.equal(board.placeObstacle(T.x, T.y), false);
    assert.equal(board.getCell(T.x, T.y), CELL_TYPES.TREASURE);
  });

  test('placeObstacle is refused on the gnome square', () => {
    const board = new Board();
    assert.equal(board.placeObstacle(1, 1, { x: 1, y: 1 }), false);
    assert.equal(board.getCell(1, 1), CELL_TYPES.EMPTY);
  });

  test('removeObstacle makes the square empty again', () => {
    const board = new Board();
    board.placeObstacle(4, 4);
    assert.equal(board.removeObstacle(4, 4), true);
    assert.equal(board.getCell(4, 4), CELL_TYPES.EMPTY);
    assert.equal(board.removeObstacle(4, 4), false, 'nothing to remove the second time');
    assert.equal(board.removeObstacle(T.x, T.y), false, 'the treasure is never removed');
  });

  test('toggleObstacle adds then removes an obstacle', () => {
    const board = new Board();
    assert.equal(board.toggleObstacle(7, 2), true);
    assert.equal(board.getCell(7, 2), CELL_TYPES.OBSTACLE);
    assert.equal(board.toggleObstacle(7, 2), true);
    assert.equal(board.getCell(7, 2), CELL_TYPES.EMPTY);
  });

  test('clearObstacles removes every obstacle but keeps the treasure', () => {
    const board = new Board();
    board.placeObstacle(0, 0);
    board.placeObstacle(LAST, LAST);
    board.placeObstacle(T.x, T.y - 1);
    board.clearObstacles();
    assert.equal(board.getCell(0, 0), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(LAST, LAST), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(T.x, T.y - 1), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(T.x, T.y), CELL_TYPES.TREASURE);
  });

  test('isBlocking is true for an obstacle and for any square outside the board (edge)', () => {
    const board = new Board();
    board.placeObstacle(3, 3);
    assert.equal(board.isBlocking(3, 3), true);
    assert.equal(board.isBlocking(-1, 0), true);
    assert.equal(board.isBlocking(0, BOARD_SIZE), true);
  });

  test('isBlocking is false for an empty square and for the treasure', () => {
    const board = new Board();
    assert.equal(board.isBlocking(2, 2), false);
    assert.equal(board.isBlocking(T.x, T.y), false);
  });

  test('canPlaceGnome is false on an obstacle and on the treasure', () => {
    const board = new Board();
    board.placeObstacle(1, 6);
    assert.equal(board.canPlaceGnome(1, 6), false);
    assert.equal(board.canPlaceGnome(T.x, T.y), false);
    assert.equal(board.canPlaceGnome(0, 0), true);
  });

  test('clone returns an independent copy (changing the clone does not change the original)', () => {
    const board = new Board();
    board.placeObstacle(1, 2);
    const copy = board.clone();
    assert.equal(copy.getCell(1, 2), CELL_TYPES.OBSTACLE);
    copy.placeObstacle(LAST, 0);
    copy.removeObstacle(1, 2);
    assert.equal(board.getCell(LAST, 0), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(1, 2), CELL_TYPES.OBSTACLE);
  });
});

describe('Gnome', () => {
  test('createGnome refuses an invalid direction', () => {
    assert.throws(() => createGnome(0, 0, 'X'));
    assert.deepEqual(createGnome(1, 2, 'E'), { x: 1, y: 2, direction: 'E' });
  });

  test('turnLeft is the gnome\'s left: N -> W -> S -> E -> N', () => {
    let g = createGnome(3, 3, 'N');
    for (const expected of ['W', 'S', 'E', 'N']) {
      g = turnLeft(g);
      assert.equal(g.direction, expected);
    }
  });

  test('turnRight is the gnome\'s right: N -> E -> S -> W -> N', () => {
    let g = createGnome(3, 3, 'N');
    for (const expected of ['E', 'S', 'W', 'N']) {
      g = turnRight(g);
      assert.equal(g.direction, expected);
    }
  });

  test('a gnome looking South turns right toward West (not the screen\'s right)', () => {
    assert.equal(turnRight(createGnome(3, 3, 'S')).direction, 'W');
    assert.equal(turnLeft(createGnome(3, 3, 'S')).direction, 'E');
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
