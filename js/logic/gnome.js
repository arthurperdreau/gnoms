/**
 * @file gnome.js
 * Gnome state and pure movement helpers. No DOM.
 *
 * All helpers return NEW objects (immutable style). This makes the step list
 * of the interpreter safe: each step keeps its own snapshot.
 *
 * @typedef {'N'|'E'|'S'|'W'} Direction
 * @typedef {{x: number, y: number, direction: Direction}} GnomeState
 */

import { DIRECTIONS, DIRECTION_ORDER, DEFAULT_GNOME } from '../config.js';

/**
 * Create a gnome state.
 * @param {number} [x=DEFAULT_GNOME.x]
 * @param {number} [y=DEFAULT_GNOME.y]
 * @param {Direction} [direction=DEFAULT_GNOME.direction]
 * @returns {GnomeState}
 * @throws {Error} If the direction is not N, E, S or W.
 */
export function createGnome(x = DEFAULT_GNOME.x, y = DEFAULT_GNOME.y, direction = DEFAULT_GNOME.direction) {
  if (!isValidDirection(direction)) {
    throw new Error(`Invalid direction: ${direction}`);
  }
  return { x, y, direction };
}

/**
 * Check if a value is one of 'N', 'E', 'S', 'W'.
 * @param {unknown} direction
 * @returns {boolean}
 */
export function isValidDirection(direction) {
  return DIRECTION_ORDER.includes(direction);
}

/**
 * Rotate a direction by a number of quarter turns (positive = clockwise).
 * @param {Direction} direction
 * @param {number} quarterTurns e.g. 1 = right, -1 = left, 2 = U-turn.
 * @returns {Direction}
 */
export function rotateDirection(direction, quarterTurns) {
  const index = DIRECTION_ORDER.indexOf(direction);
  const count = DIRECTION_ORDER.length;
  return DIRECTION_ORDER[(((index + quarterTurns) % count) + count) % count];
}

/**
 * Turn a quarter turn to the left.
 * @param {GnomeState} gnome
 * @returns {GnomeState} New state, same position.
 */
export function turnLeft(gnome) {
  return { ...gnome, direction: rotateDirection(gnome.direction, -1) };
}

/**
 * Turn a quarter turn to the right.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function turnRight(gnome) {
  return { ...gnome, direction: rotateDirection(gnome.direction, 1) };
}

/**
 * Half turn.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function uTurn(gnome) {
  return { ...gnome, direction: rotateDirection(gnome.direction, 2) };
}

/**
 * Coordinates of the cell in front of the gnome (may be outside the board).
 * @param {GnomeState} gnome
 * @returns {{x: number, y: number}}
 */
export function cellAhead(gnome) {
  const { dx, dy } = DIRECTIONS[gnome.direction];
  return { x: gnome.x + dx, y: gnome.y + dy };
}

/**
 * Coordinates of the cell behind the gnome (may be outside the board).
 * @param {GnomeState} gnome
 * @returns {{x: number, y: number}}
 */
export function cellBehind(gnome) {
  const { dx, dy } = DIRECTIONS[gnome.direction];
  return { x: gnome.x - dx, y: gnome.y - dy };
}

/**
 * Return a copy of the gnome at a new position, same direction.
 * @param {GnomeState} gnome
 * @param {{x: number, y: number}} position
 * @returns {GnomeState}
 */
export function moveTo(gnome, position) {
  return { ...gnome, x: position.x, y: position.y };
}

/**
 * Copy of the gnome state.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function cloneGnome(gnome) {
  return { x: gnome.x, y: gnome.y, direction: gnome.direction };
}

/**
 * Check if two positions are the same cell.
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {boolean}
 */
export function samePosition(a, b) {
  return a.x === b.x && a.y === b.y;
}
