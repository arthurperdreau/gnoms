/**
 * @file layouts.js
 * Small board layouts for the tests: a plain board (no printed square except
 * the footprints in the corners and a 1 x 1 treasure in the center), to which
 * a test can add special squares.
 */

/**
 * @param {{width?: number, height?: number, squares?: Object, roots?: Array}} [options]
 * @returns {import('../../js/config.js').BoardLayout}
 */
export function plainLayout({ width = 11, height = 11, squares = {}, roots = [] } = {}) {
  return {
    width,
    height,
    treasure: { x: Math.floor(width / 2), y: Math.floor(height / 2), width: 1, height: 1 },
    starts: [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]],
    squares,
    roots,
  };
}
