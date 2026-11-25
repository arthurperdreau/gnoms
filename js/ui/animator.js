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
    /** @type {ReturnType<typeof setTimeout>|null} Timer id while playing. */
    this.timerId = null;
  }

  /** @returns {boolean} true while the automatic play is running. */
  get isPlaying() {
    return this.timerId !== null;
  }

  /**
   * Load a run if it is a new one: show its start state immediately and put
   * the cursor on the first real step.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  load(run) {
    if (run === this.run) return;
    this.run = run;
    this.rewind();
  }

  /**
   * Go back to the start state of the loaded run.
   * @returns {void}
   */
  rewind() {
    this.cursor = 0;
    this.showNextStep(); // step 0 = start state, shown without waiting
    this.showMessage('');
  }

  /**
   * Play every remaining step automatically, one every delayMs.
   * If the previous run was finished, restart from the beginning.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  play(run) {
    this.load(run);
    if (this.isFinished()) this.rewind();
    if (this.isFinished()) return; // nothing to play
    this.onPlayingChange(true);
    this.scheduleNext();
  }

  /**
   * Schedule the next tick with setTimeout (easier to stop than setInterval).
   * @returns {void}
   */
  scheduleNext() {
    this.timerId = setTimeout(() => {
      this.showNextStep();
      if (this.isFinished()) this.stop();
      else this.scheduleNext();
    }, this.delayMs);
  }

  /**
   * Show only the next step (Step button). Stops the automatic play if running.
   * After the last step, a new press restarts from the beginning.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  step(run) {
    if (this.isPlaying) this.stop();
    const isNew = run !== this.run;
    this.load(run);
    if (!isNew && this.isFinished()) {
      this.rewind();
      return;
    }
    this.showNextStep();
  }

  /**
   * Display the step at this.cursor, then move the cursor.
   * When the last step is shown, display the final message.
   * @returns {void}
   */
  showNextStep() {
    if (!this.run || this.isFinished()) return;
    this.onStep(this.run.steps[this.cursor]);
    this.cursor += 1;
    if (this.isFinished()) this.showFinalMessage(this.run);
  }

  /** @returns {boolean} true when every step has been displayed. */
  isFinished() {
    return !this.run || this.cursor >= this.run.steps.length;
  }

  /**
   * Stop the automatic play (the current position stays displayed).
   * @returns {void}
   */
  stop() {
    if (this.timerId === null) return;
    clearTimeout(this.timerId);
    this.timerId = null;
    this.onPlayingChange(false);
  }

  /**
   * Stop and forget the current run (used by "Reset gnome").
   * main.js re-renders the board itself after the reset.
   * @returns {void}
   */
  reset() {
    this.stop();
    this.run = null;
    this.cursor = 0;
  }

  /**
   * Build and show the final message of a run: treasure found, or final
 * position and number of times the gnome was blocked.
   * @param {import('../logic/interpreter.js').RunResult} run
   * @returns {void}
   */
  showFinalMessage(run) {
    const moves = run.steps.length - 1; // the start step is not a move

    if (run.status === RUN_STATUS.TREASURE) {
      this.showMessage(TEXTS.msgTreasure(moves), 'success');
      return;
    }
    if (run.status === RUN_STATUS.MAX_STEPS) {
      this.showMessage(TEXTS.msgMaxSteps(MAX_STEPS), 'error');
      return;
    }

    const { x, y, direction } = run.finalGnome;
    const text = `${TEXTS.msgFinished(x, y, TEXTS.directions[direction])} ${TEXTS.msgBlocked(run.blockedCount)}`;
    this.showMessage(text, run.blockedCount > 0 ? 'warning' : 'info');
  }

  /**
   * Write a message in the message area.
   * @param {string} text
   * @param {'info'|'success'|'warning'|'error'} [type='info'] Adds .message--<type>.
   * @returns {void}
   */
  showMessage(text, type = 'info') {
    this.messageElement.textContent = text;
    this.messageElement.className = `message message--${type}`;
  }
}
