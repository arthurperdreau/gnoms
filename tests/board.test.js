/**
 * @file board.test.js
 * Tests of js/logic/board.js and js/logic/gnome.js with node:test.
 * Run: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_LAYOUT, CELL_TYPES, DEFAULT_GNOME } from '../js/config.js';
import { Board } from '../js/logic/board.js';
import { createGnome, turnLeft, turnRight, uTurn, cellAhead, cellBehind } from '../js/logic/gnome.js';
import { plainLayout } from './helpers/layouts.js';

/** Count the squares of each type. */
function countTypes(board) {
  const counts = {};
  for (const row of board.cells) for (const type of row) counts[type] = (counts[type] ?? 0) + 1;
  return counts;
}

describe('Printed board (BOARD_LAYOUT)', () => {
  const board = new Board();

  test('is 14 columns x 13 rows', () => {
    assert.equal(board.width, 14);
    assert.equal(board.height, 13);
    assert.equal(board.cells.length, 13);
    for (const row of board.cells) assert.equal(row.length, 14);
  });

  test('has a 2 x 2 treasure zone in the middle', () => {
    const { x, y } = BOARD_LAYOUT.treasure;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      assert.equal(board.isTreasure(x + dx, y + dy), true);
    }
    assert.equal(countTypes(board)[CELL_TYPES.TREASURE], 4);
  });

  test('has the 4 footprints in the corners, and the default gnome on one of them', () => {
    for (const [x, y] of [[0, 0], [13, 0], [0, 12], [13, 12]]) assert.equal(board.isStart(x, y), true);
    assert.equal(countTypes(board)[CELL_TYPES.START], 4);
    assert.equal(board.isStart(DEFAULT_GNOME.x, DEFAULT_GNOME.y), true);
  });

  test('has the printed special squares', () => {
    const counts = countTypes(board);
    assert.equal(counts[CELL_TYPES.MUSHROOM], 10);
    assert.equal(counts[CELL_TYPES.BURROW], 4);
    assert.equal(counts[CELL_TYPES.ROOT], 8); // 4 roots of 2 squares
    assert.equal(BOARD_LAYOUT.roots.length, 4);
    assert.equal(counts[CELL_TYPES.RAKE], 4);
    assert.equal(counts[CELL_TYPES.OBSTACLE] ?? 0, 0, 'no rock at the start');
  });

  test('every printed position is inside the board and used only once', () => {
    const seen = new Set();
    const all = [
      ...BOARD_LAYOUT.starts,
      ...Object.values(BOARD_LAYOUT.squares).flat(),
      ...BOARD_LAYOUT.roots.flatMap((root) => root.squares),
    ];
    for (const [x, y] of all) {
      assert.equal(board.isInside(x, y), true, `(${x}, ${y})`);
      assert.equal(seen.has(`${x},${y}`), false, `(${x}, ${y}) used twice`);
      seen.add(`${x},${y}`);
    }
  });
});

describe('Board', () => {
  test('each root square knows the direction of the root tip', () => {
    const board = new Board();
    assert.equal(board.getRootTip(2, 1), 'W');
    assert.equal(board.getRootTip(3, 1), 'W');
    assert.equal(board.getRootTip(8, 7), 'S');
    assert.equal(board.getRootTip(1, 9), 'N');
    assert.equal(board.getRootTip(0, 0), null);
    assert.equal(board.clone().getRootTip(12, 2), 'W', 'kept by clone()');
  });

  test('a board of another size works the same way', () => {
    for (const [width, height] of [[5, 5], [7, 9], [11, 11], [16, 12]]) {
      const board = new Board(plainLayout({ width, height }));
      assert.equal(board.cells.length, height);
      assert.equal(board.cells[0].length, width);
      assert.equal(board.isTreasure(Math.floor(width / 2), Math.floor(height / 2)), true);
      assert.equal(board.isInside(width - 1, height - 1), true);
      assert.equal(board.isInside(width, 0), false);
      assert.equal(board.isBlocking(0, height), true, 'the edge blocks');
    }
  });

  test('isInside returns false outside the board on both axes', () => {
    const board = new Board();
    for (const [x, y] of [[-1, 0], [0, -1], [board.width, 0], [0, board.height], [1.5, 2]]) {
      assert.equal(board.isInside(x, y), false, `(${x}, ${y})`);
    }
    assert.equal(board.isInside(board.width - 1, board.height - 1), true);
  });

  test('getCell returns null outside the board', () => {
    const board = new Board();
    assert.equal(board.getCell(-1, 3), null);
    assert.equal(board.getCell(3, board.height), null);
  });

  test('a rock goes on an empty square only', () => {
    const board = new Board();
    assert.equal(board.placeObstacle(2, 2), true);
    assert.equal(board.getCell(2, 2), CELL_TYPES.OBSTACLE);
    for (const [x, y] of [[6, 5], [0, 0], [6, 1], [9, 0], [2, 1], [8, 3]]) {
      assert.equal(board.placeObstacle(x, y), false, `printed square (${x}, ${y})`);
    }
  });

  test('a rock is refused on the gnome square', () => {
    const board = new Board();
    assert.equal(board.placeObstacle(1, 1, { x: 1, y: 1 }), false);
    assert.equal(board.getCell(1, 1), CELL_TYPES.EMPTY);
  });

  test('removeObstacle / toggleObstacle / clearObstacles only touch rocks', () => {
    const board = new Board();
    assert.equal(board.toggleObstacle(4, 4), true);
    assert.equal(board.getCell(4, 4), CELL_TYPES.OBSTACLE);
    assert.equal(board.toggleObstacle(4, 4), true);
    assert.equal(board.getCell(4, 4), CELL_TYPES.EMPTY);
    assert.equal(board.removeObstacle(6, 1), false, 'a mushroom is not a rock');

    board.placeObstacle(2, 2);
    board.placeObstacle(10, 10);
    board.clearObstacles();
    assert.equal(board.getCell(2, 2), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(10, 10), CELL_TYPES.EMPTY);
    assert.equal(board.getCell(6, 1), CELL_TYPES.MUSHROOM);
  });

  test('only rocks and the edge block the gnome', () => {
    const board = new Board();
    board.placeObstacle(3, 3);
    assert.equal(board.isBlocking(3, 3), true);
    assert.equal(board.isBlocking(-1, 0), true);
    for (const [x, y] of [[2, 2], [6, 5], [0, 0], [6, 1], [9, 0], [2, 1], [8, 3]]) {
      assert.equal(board.isBlocking(x, y), false, `(${x}, ${y})`);
    }
  });

  test('the gnome can only start on a footprints square', () => {
    const board = new Board();
    assert.equal(board.canPlaceGnome(0, 0), true);
    assert.equal(board.canPlaceGnome(13, 12), true);
    assert.equal(board.canPlaceGnome(1, 0), false);
    assert.equal(board.canPlaceGnome(6, 5), false);
  });

  test('clone returns an independent copy', () => {
    const board = new Board();
    board.placeObstacle(1, 2);
    const copy = board.clone();
    assert.equal(copy.getCell(1, 2), CELL_TYPES.OBSTACLE);
    copy.placeObstacle(4, 0);
    copy.removeObstacle(1, 2);
    assert.equal(board.getCell(4, 0), CELL_TYPES.EMPTY);
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
