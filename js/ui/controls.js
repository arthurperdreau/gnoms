/**
 * @file controls.js
 * Toolbar (edit modes + direction picker) and the Run / Step / Reset gnome /
 * Clear / Clear walls buttons. Only forwards user intentions to main.js.
 */

import { TOOL_MODES } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Ids of the buttons in index.html. */
export const BUTTON_IDS = Object.freeze({
  run: 'btn-run',
  step: 'btn-step',
  reset: 'btn-reset',
  clear: 'btn-clear',
  clearWalls: 'btn-clear-walls',
});

export class Controls {
  /**
   * @param {Document|HTMLElement} root Where to look for the elements.
   * @param {{
   *   onModeChange: (mode: string) => void,
   *   onDirectionChange: (direction: 'N'|'E'|'S'|'W') => void,
   *   onRun: () => void,
   *   onStep: () => void,
   *   onResetGnome: () => void,
   *   onClearProgram: () => void,
   *   onClearWalls: () => void,
   * }} callbacks
   */
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;

    // TODO: store references: this.toolbar (#toolbar), this.directionPicker (#direction-picker),
    //       this.buttons = { run, step, reset, clear, clearWalls } from BUTTON_IDS.
    // TODO: this.bindEvents();
  }

  /**
   * Wire every button:
   *  - .btn--mode[data-mode] -> onModeChange
   *  - .btn--dir[data-direction] -> onDirectionChange
   *  - run / step / reset / clear / clearWalls -> matching callback
   * @returns {void}
   */
  bindEvents() {
    // TODO: implement.
  }

  /**
   * Show the active mode (aria-checked) and the direction picker when
   * mode === TOOL_MODES.DIRECTION, with the current direction pressed.
   * @param {string} mode
   * @param {'N'|'E'|'S'|'W'} direction
   * @returns {void}
   */
  setMode(mode, direction) {
    // TODO: implement.
  }

  /**
   * Update the buttons during the animation:
   * Run label becomes TEXTS.stop, editing buttons (Clear, Clear walls, modes) are disabled.
   * @param {boolean} running
   * @returns {void}
   */
  setRunning(running) {
    // TODO: implement.
  }
}
