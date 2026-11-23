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
 */
export function createGnome(x = DEFAULT_GNOME.x, y = DEFAULT_GNOME.y, direction = DEFAULT_GNOME.direction) {
  // TODO: validate the direction with isValidDirection (throw an Error if invalid).
  // TODO: return { x, y, direction }.
}

/**
 * Check if a value is one of 'N', 'E', 'S', 'W'.
 * @param {unknown} direction
 * @returns {boolean}
 */
export function isValidDirection(direction) {
  // TODO: return DIRECTION_ORDER.includes(direction).
}

/**
 * Rotate a direction by a number of quarter turns (positive = clockwise).
 * @param {Direction} direction
 * @param {number} quarterTurns e.g. 1 = right, -1 = left, 2 = U-turn.
 * @returns {Direction}
 */
export function rotateDirection(direction, quarterTurns) {
  // TODO: index = DIRECTION_ORDER.indexOf(direction)
  // TODO: new index = ((index + quarterTurns) % 4 + 4) % 4   (handles negatives)
}

/**
 * Turn a quarter turn to the left.
 * @param {GnomeState} gnome
 * @returns {GnomeState} New state, same position.
 */
export function turnLeft(gnome) {
  // TODO: return { ...gnome, direction: rotateDirection(gnome.direction, -1) }.
}

/**
 * Turn a quarter turn to the right.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function turnRight(gnome) {
  // TODO: same as turnLeft with +1.
}

/**
 * Half turn.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function uTurn(gnome) {
  // TODO: same as turnLeft with +2.
}

/**
 * Coordinates of the cell in front of the gnome (may be outside the board).
 * @param {GnomeState} gnome
 * @returns {{x: number, y: number}}
 */
export function cellAhead(gnome) {
  // TODO: use DIRECTIONS[gnome.direction] -> { x: x + dx, y: y + dy }.
}

/**
 * Coordinates of the cell behind the gnome (may be outside the board).
 * @param {GnomeState} gnome
 * @returns {{x: number, y: number}}
 */
export function cellBehind(gnome) {
  // TODO: { x: x - dx, y: y - dy }.
}

/**
 * Return a copy of the gnome at a new position, same direction.
 * @param {GnomeState} gnome
 * @param {{x: number, y: number}} position
 * @returns {GnomeState}
 */
export function moveTo(gnome, position) {
  // TODO: return { ...gnome, x: position.x, y: position.y }.
}

/**
 * Copy of the gnome state.
 * @param {GnomeState} gnome
 * @returns {GnomeState}
 */
export function cloneGnome(gnome) {
  // TODO: return { ...gnome }.
}

/**
 * Check if two gnome states are on the same cell.
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {boolean}
 */
export function samePosition(a, b) {
  // TODO: compare x and y.
}
