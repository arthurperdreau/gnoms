/**
 * @file board.test.js
 * Tests of js/logic/board.js and js/logic/gnome.js with node:test.
 * Run: npm test   (or: node --test tests/)
 *
 * Each `test.todo` is a case to implement: replace `test.todo` with `test`
 * and write the assertions described in the comment.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_SIZE, TREASURE_POSITION, CELL_TYPES } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome, turnLeft, turnRight, uTurn, cellAhead, cellBehind } from '../js/logic/gnome.js';

describe('Board', () => {
  test.todo('a new board is BOARD_SIZE x BOARD_SIZE and empty except the treasure', () => {
    // const board = new Board();
    // assert.equal(board.getCell(0, 0), CELL_TYPES.EMPTY);
    // assert.equal(board.getCell(TREASURE_POSITION.x, TREASURE_POSITION.y), CELL_TYPES.TREASURE);
  });

  test.todo('isInside returns false outside 0..10 on both axes', () => {
    // (-1, 0), (0, -1), (11, 0), (0, 11) -> false ; (0, 0), (10, 10) -> true
  });

  test.todo('getCell returns null outside the board');

  test.todo('placeWall puts a wall on an empty cell');

  test.todo('placeWall is refused on the treasure');

  test.todo('placeWall is refused on the gnome cell');

  test.todo('removeWall makes the cell empty again');

  test.todo('toggleWall adds then removes a wall');

  test.todo('clearWalls removes every wall but keeps the treasure');

  test.todo('isBlocking is true for a wall and for any cell outside the board (edge)');

  test.todo('isBlocking is false for an empty cell and for the treasure');

  test.todo('canPlaceGnome is false on a wall and on the treasure');

  test.todo('clone returns an independent copy (changing the clone does not change the original)');
});

describe('Gnome', () => {
  test.todo('createGnome refuses an invalid direction');

  test.todo('turnLeft: N -> W -> S -> E -> N', () => {
    // let g = createGnome(3, 3, 'N'); g = turnLeft(g); assert.equal(g.direction, 'W'); ...
  });

  test.todo('turnRight: N -> E -> S -> W -> N');

  test.todo('uTurn: N <-> S and E <-> W');

  test.todo('turning does not change the position and does not mutate the original object');

  test.todo('cellAhead and cellBehind follow the direction (y grows downward)', () => {
    // createGnome(3, 3, 'N') -> ahead (3, 2), behind (3, 4)
    // createGnome(3, 3, 'E') -> ahead (4, 3), behind (2, 3)
  });
});
