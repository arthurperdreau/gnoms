/**
 * @file animator.js
 * Plays the list of steps computed by the interpreter, with a pause between
 * each step, automatically (Run) or one by one (Step). Can be stopped.
 * Displays the final message.
 *
 * The animator does not know about the board DOM: it calls `onStep(step)`
 * and main.js updates the views.
 */

import { ANIMATION_DELAY_MS, RUN_STATUS, MAX_STEPS } from '../config.js';
import { TEXTS } from '../i18n.js';

export class Animator {
  /**
   * @param {{
   *   messageElement: HTMLElement,
   *   delayMs?: number,
   *   onStep: (step: import('../logic/interpreter.js').Step) => void,
   *   onPlayingChange?: (isPlaying: boolean) => void,
   * }} options
   */
  constructor(options) {
    this.messageElement = options.messageElement;
    this.delayMs = options.delayMs ?? ANIMATION_DELAY_MS;
    this.onStep = options.onStep;
    this.onPlayingChange = options.onPlayingChange ?? (() => {});

    /** @type {import('../logic/interpreter.js').RunResult|null} Run being displayed. */
    this.run = null;
    /** Index of the next step to display. */
    this.cursor = 0;
    /** @type {number|null} setTimeout id while playing. */
    this.timerId = null;
  }

  /** @returns {boolean} true while the automatic play is running. */
  get isPlaying() {
    // TODO: return this.timerId !== null.
  }

  /**
   * Load a run if it is a new one (reset the cursor to 0).
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  load(run) {
    // TODO: if run !== this.run -> this.run = run; this.cursor = 0.
  }

  /**
   * Play every remaining step automatically, one every delayMs.
   * If the previous run was finished, restart from the beginning.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  play(run) {
    // TODO: this.load(run); if this.isFinished() -> this.cursor = 0.
    // TODO: this.onPlayingChange(true); this.scheduleNext().
  }

  /**
   * Schedule the next tick with setTimeout (easier to stop than setInterval).
   * @returns {void}
   */
  scheduleNext() {
    // TODO: this.timerId = setTimeout(() => { this.showNextStep(); if finished -> this.stop() else scheduleNext(); }, this.delayMs).
  }

  /**
   * Show only the next step (Step button). Stops the automatic play if running.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  step(run) {
    // TODO: if playing -> this.stop(). this.load(run). this.showNextStep().
  }

  /**
   * Display the step at this.cursor, then move the cursor.
   * When the last step is shown, display the final message.
   * @returns {void}
   */
  showNextStep() {
    // TODO: if !this.run or finished -> return.
    // TODO: this.onStep(this.run.steps[this.cursor]); this.cursor++.
    // TODO: if this.isFinished() -> this.showFinalMessage(this.run).
  }

  /** @returns {boolean} true when every step has been displayed. */
  isFinished() {
    // TODO: return !this.run || this.cursor >= this.run.steps.length.
  }

  /**
   * Stop the automatic play (the current position stays displayed).
   * @returns {void}
   */
  stop() {
    // TODO: clearTimeout(this.timerId); this.timerId = null; this.onPlayingChange(false).
    //       (only call onPlayingChange if it was playing)
  }

  /**
   * Stop and forget the current run (used by "Reset gnome").
   * @returns {void}
   */
  reset() {
    // TODO: this.stop(); this.run = null; this.cursor = 0.
    //       (main.js re-renders the board itself after the reset.)
  }

  /**
   * Build and show the final message of a run:
   *  - TREASURE  -> TEXTS.msgTreasure(steps), 'success'
   *  - MAX_STEPS -> TEXTS.msgMaxSteps(MAX_STEPS), 'error'
   *  - FINISHED  -> TEXTS.msgFinished(x, y, direction name) + TEXTS.msgBlocked(n) if n > 0
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  showFinalMessage(run) {
    // TODO: implement with this.showMessage(text, type).
  }

  /**
   * Write a message in the message area.
   * @param {string} text
   * @param {'info'|'success'|'warning'|'error'} [type='info'] Adds .message--<type>.
   * @returns {void}
   */
  showMessage(text, type = 'info') {
    // TODO: set textContent and className = `message message--${type}`.
  }
}
