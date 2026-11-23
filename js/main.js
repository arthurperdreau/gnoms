/**
 * @file main.js
 * Entry point. Creates the application state (board, gnome, algorithm),
 * creates the views and wires the events between logic and UI.
 *
 * Data flow: user action -> view callback -> main.js updates the logic
 * objects -> main.js asks the views to re-render. Views never modify the
 * logic objects themselves.
 */

import { TOOL_MODES, DEFAULT_GNOME, ANIMATION_DELAY_MS } from './config.js';
import { TEXTS } from './i18n.js';
import { Board } from './logic/board.js';
import { createGnome, cloneGnome } from './logic/gnome.js';
import { Program, PROGRAM_ERRORS } from './logic/program.js';
import { runProgram } from './logic/interpreter.js';
import { BoardView } from './ui/boardView.js';
import { PaletteView } from './ui/paletteView.js';
import { ProgramView } from './ui/programView.js';
import { Controls } from './ui/controls.js';
import { Animator } from './ui/animator.js';

/**
 * Whole application state. Kept in one object to make debugging easy
 * (type `window.gnomads` in the console, see init()).
 */
const state = {
  /** @type {Board} */
  board: new Board(),
  /** Start position chosen by the player (used by "Reset gnome"). */
  startGnome: createGnome(DEFAULT_GNOME.x, DEFAULT_GNOME.y, DEFAULT_GNOME.direction),
  /** Position currently displayed (changes during the animation). */
  gnome: createGnome(DEFAULT_GNOME.x, DEFAULT_GNOME.y, DEFAULT_GNOME.direction),
  /** @type {Program} */
  program: new Program(),
  /** Active toolbar mode, a TOOL_MODES value. */
  mode: TOOL_MODES.GNOME,
  /** Uid of the selected Repeat / If / Else, or null for the main level. */
  targetUid: null,
  /** Level filter of the palette (null = all). */
  levelFilter: null,
  /** Last RunResult, reused by "Step" until the board or the program changes. */
  lastRun: null,
};

/** Views, created in init(). */
const views = {};

/**
 * Map a PROGRAM_ERRORS reason to a user message.
 * @param {string} reason
 * @returns {string}
 */
function programErrorMessage(reason) {
  // TODO: switch on reason: CARD_LIMIT -> TEXTS.msgCardLimit(state.program.maxCards),
  //       ELSE_OUTSIDE_IF -> TEXTS.msgElseOutsideIf, SLOT_FULL -> TEXTS.msgSlotFull, ...
}

/**
 * Fill every element with a data-i18n attribute with the matching text.
 * @returns {void}
 */
function applyStaticTexts() {
  // TODO: document.querySelectorAll('[data-i18n]') and set textContent from TEXTS[key]
  //       (skip keys whose value is not a string).
  // TODO: set document.title = TEXTS.appTitle.
}

/**
 * Re-render everything from the state.
 * @returns {void}
 */
function renderAll() {
  // TODO: views.board.render(state.board, state.gnome, state.startGnome)
  // TODO: views.program.render(state.program, state.targetUid)
  // TODO: views.palette.render(state.levelFilter, state.program.canAddCard())
  // TODO: views.controls.setMode(state.mode, state.gnome.direction)
}

/**
 * Called when something changes the board or the program: the previous run
 * is no longer valid, so stop any animation and forget it.
 * @returns {void}
 */
function invalidateRun() {
  // TODO: views.animator.stop(); state.lastRun = null.
}

// ---------------------------------------------------------------------------
// Handlers called by the views
// ---------------------------------------------------------------------------

/**
 * A board cell was tapped. Behaviour depends on state.mode:
 *  - GNOME: move the start gnome there if board.canPlaceGnome (keep its direction).
 *  - WALL: board.toggleWall(x, y, state.startGnome).
 *  - DIRECTION: if the tapped cell is the gnome, rotate it clockwise.
 * @param {number} x
 * @param {number} y
 */
function onCellTap(x, y) {
  // TODO: implement, show TEXTS.msgCannotPlaceGnome / msgCannotPlaceWall on refusal,
  //       then set state.gnome = cloneGnome(state.startGnome), invalidateRun(), renderAll().
}

/**
 * A toolbar mode was chosen.
 * @param {string} mode A TOOL_MODES value.
 */
function onModeChange(mode) {
  // TODO: state.mode = mode; renderAll().
}

/**
 * A direction was chosen in the direction picker.
 * @param {'N'|'E'|'S'|'W'} direction
 */
function onDirectionChange(direction) {
  // TODO: update state.startGnome.direction (createGnome), copy to state.gnome,
  //       invalidateRun(), renderAll().
}

/**
 * A palette card was tapped: add it to the algorithm at the current target.
 * @param {string} cardId
 */
function onPaletteCardTap(cardId) {
  // TODO: result = state.program.addCard(cardId, state.targetUid).
  // TODO: if !result.ok -> views.animator.showMessage(programErrorMessage(result.reason), 'warning').
  // TODO: optional: if the new card is a container, select it as target automatically.
  // TODO: invalidateRun(); renderAll().
}

/**
 * A level filter button was tapped.
 * @param {number|null} level
 */
function onLevelFilterChange(level) {
  // TODO: state.levelFilter = level; renderAll().
}

/**
 * A container card in the algorithm was tapped: it becomes the target.
 * Tapping it again goes back to the main level.
 * @param {string} uid
 */
function onSelectContainer(uid) {
  // TODO: toggle state.targetUid; renderAll().
}

/** "Back to main level" button. */
function onBackToRoot() {
  // TODO: state.targetUid = null; renderAll().
}

/**
 * Delete button of a card in the algorithm.
 * @param {string} uid
 */
function onDeleteCard(uid) {
  // TODO: state.program.removeCard(uid).
  // TODO: if the target was this card or inside it (findCard(state.targetUid) is null), reset target.
  // TODO: invalidateRun(); renderAll().
}

/**
 * Compute the run if needed (cached in state.lastRun).
 * @returns {import('./logic/interpreter.js').RunResult|null} null if the program is empty.
 */
function ensureRun() {
  // TODO: if program is empty -> show TEXTS.msgEmptyProgram and return null.
  // TODO: if !state.lastRun -> state.lastRun = runProgram(state.board, state.startGnome, state.program.root).
  // TODO: return state.lastRun.
}

/** "Run" button: play the whole run automatically (or stop it if running). */
function onRun() {
  // TODO: if views.animator.isPlaying -> views.animator.stop() and return.
  // TODO: run = ensureRun(); if run -> views.animator.play(run).
}

/** "Step" button: show the next step only. */
function onStep() {
  // TODO: run = ensureRun(); if run -> views.animator.step(run).
}

/** "Reset gnome" button: back to the start position, animation stopped. */
function onResetGnome() {
  // TODO: views.animator.reset(); state.gnome = cloneGnome(state.startGnome); renderAll().
  // TODO: show TEXTS.msgReady.
}

/** "Clear" button: empty the algorithm. */
function onClearProgram() {
  // TODO: state.program.clear(); state.targetUid = null; invalidateRun(); onResetGnome().
}

/** "Clear walls" button. */
function onClearWalls() {
  // TODO: state.board.clearWalls(); invalidateRun(); renderAll().
}

/**
 * Called by the animator for each displayed step.
 * @param {import('./logic/interpreter.js').Step} step
 */
function onAnimationStep(step) {
  // TODO: state.gnome = step.gnome.
  // TODO: views.board.renderGnome(step.gnome, step.event) (lighter than renderAll).
  // TODO: views.program.highlightCard(step.cardUid).
}

/**
 * Called by the animator when playing starts / stops, to lock the editing UI.
 * @param {boolean} isPlaying
 */
function onPlayingChange(isPlaying) {
  // TODO: views.controls.setRunning(isPlaying); views.board.setLocked(isPlaying);
  //       views.palette.setLocked(isPlaying); views.program.setLocked(isPlaying).
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/**
 * Create the views, wire the callbacks, render once.
 * @returns {void}
 */
function init() {
  applyStaticTexts();

  // TODO: views.board = new BoardView(document.getElementById('board'), { onCellTap });
  // TODO: views.palette = new PaletteView(
  //         document.getElementById('palette'), document.getElementById('level-filter'),
  //         { onCardTap: onPaletteCardTap, onLevelChange: onLevelFilterChange });
  // TODO: views.program = new ProgramView({
  //         list: #program, counter: #card-counter, targetLabel: #program-target-label, rootButton: #btn-root },
  //         { onSelectContainer, onDeleteCard, onBackToRoot });
  // TODO: views.controls = new Controls(document, { onModeChange, onDirectionChange, onRun, onStep,
  //         onResetGnome, onClearProgram, onClearWalls });
  // TODO: views.animator = new Animator({ messageElement: #message, delayMs: ANIMATION_DELAY_MS,
  //         onStep: onAnimationStep, onPlayingChange });

  // TODO: renderAll(); views.animator.showMessage(TEXTS.msgReady).

  // Debug helper (remove for production if wanted)
  window.gnomads = { state, views };
}

init();
