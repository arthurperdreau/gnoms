/**
 * @file controls.js
 * Toolbar (edit modes + direction picker) and the Run / Step / Reset gnome /
 * Clear / Clear obstacles buttons. Only forwards user intentions to main.js.
 */

import { TOOL_MODES } from '../config.js';
import { TEXTS } from '../i18n.js';

/** Ids of the buttons in index.html. */
export const BUTTON_IDS = Object.freeze({
  run: 'btn-run',
  step: 'btn-step',
  reset: 'btn-reset',
  clear: 'btn-clear',
  clearObstacles: 'btn-clear-obstacles',
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
   *   onClearObstacles: () => void,
   * }} callbacks
   */
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;

    this.toolbar = root.querySelector('#toolbar');
    this.directionPicker = root.querySelector('#direction-picker');
    /** @type {Record<keyof BUTTON_IDS, HTMLButtonElement>} */
    this.buttons = {};
    for (const [key, id] of Object.entries(BUTTON_IDS)) {
      this.buttons[key] = root.querySelector(`#${id}`);
    }

    this.bindEvents();
  }

  /**
   * Wire every button to its callback.
   * @returns {void}
   */
  bindEvents() {
    this.toolbar.addEventListener('click', (event) => {
      const button = /** @type {HTMLButtonElement} */ (event.target).closest('.btn--mode');
      if (button && !button.disabled) this.callbacks.onModeChange(button.dataset.mode);
    });

    this.directionPicker.addEventListener('click', (event) => {
      const button = /** @type {HTMLButtonElement} */ (event.target).closest('.btn--dir');
      if (button && !button.disabled) this.callbacks.onDirectionChange(button.dataset.direction);
    });

    // Direction buttons get translated labels
    for (const button of this.directionPicker.querySelectorAll('.btn--dir')) {
      button.setAttribute('aria-label', TEXTS.directions[button.dataset.direction]);
    }

    this.buttons.run.addEventListener('click', () => this.callbacks.onRun());
    this.buttons.step.addEventListener('click', () => this.callbacks.onStep());
    this.buttons.reset.addEventListener('click', () => this.callbacks.onResetGnome());
    this.buttons.clear.addEventListener('click', () => this.callbacks.onClearProgram());
    this.buttons.clearObstacles.addEventListener('click', () => this.callbacks.onClearObstacles());
  }

  /**
   * Show the active mode and, in direction mode, the direction picker.
   * @param {string} mode
   * @param {'N'|'E'|'S'|'W'} direction
   * @returns {void}
   */
  setMode(mode, direction) {
    for (const button of this.toolbar.querySelectorAll('.btn--mode')) {
      button.setAttribute('aria-checked', String(button.dataset.mode === mode));
    }
    this.directionPicker.hidden = mode !== TOOL_MODES.DIRECTION;
    for (const button of this.directionPicker.querySelectorAll('.btn--dir')) {
      button.setAttribute('aria-pressed', String(button.dataset.direction === direction));
    }
  }

  /**
   * Update the buttons during the animation: Run becomes Stop, editing is disabled.
   * @param {boolean} running
   * @returns {void}
   */
  setRunning(running) {
    this.buttons.run.textContent = running ? TEXTS.stop : TEXTS.run;
    this.buttons.clear.disabled = running;
    this.buttons.clearObstacles.disabled = running;
    for (const button of this.root.querySelectorAll('.btn--mode, .btn--dir')) {
      button.disabled = running;
    }
  }
}
