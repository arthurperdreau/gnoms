/**
 * @file main.js
 * Entry point. Creates the application state (board, gnome, algorithm),
 * creates the views and wires the events between logic and UI.
 *
 * Data flow: user action -> view callback -> main.js updates the logic
 * objects -> main.js asks the views to re-render. Views never modify the
 * logic objects themselves.
 */

import { TOOL_MODES, DEFAULT_GNOME, ANIMATION_DELAY_MS, STEP_EVENTS } from './config.js';
import { TEXTS } from './i18n.js';
import { Board } from './logic/board.js';
import { createGnome, cloneGnome, rotateDirection, samePosition } from './logic/gnome.js';
import { Program, PROGRAM_ERRORS } from './logic/program.js';
import { isContainer } from './logic/cards.js';
import { runProgram } from './logic/interpreter.js';
import { BoardView } from './ui/boardView.js';
import { PaletteView } from './ui/paletteView.js';
import { ProgramView } from './ui/programView.js';
import { Controls } from './ui/controls.js';
import { Animator } from './ui/animator.js';

/**
 * Whole application state. Kept in one object to make debugging easy
 * (type `gnomads.state` in the console).
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
  /** @type {import('./logic/interpreter.js').RunResult|null} Reused by "Step" until something changes. */
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
  switch (reason) {
    case PROGRAM_ERRORS.CARD_LIMIT: return TEXTS.msgCardLimit(state.program.maxCards);
    case PROGRAM_ERRORS.ELSE_OUTSIDE_IF: return TEXTS.msgElseOutsideIf;
    case PROGRAM_ERRORS.SLOT_FULL:
    case PROGRAM_ERRORS.NOT_A_CONTAINER: return TEXTS.msgSlotFull;
    default: return reason;
  }
}

/**
 * Fill every element with a data-i18n attribute with the matching text.
 * @returns {void}
 */
function applyStaticTexts() {
  for (const element of document.querySelectorAll('[data-i18n]')) {
    const text = TEXTS[element.dataset.i18n];
    if (typeof text === 'string') element.textContent = text;
  }
  document.title = TEXTS.appTitle;
}

/**
 * Re-render everything from the state.
 * @returns {void}
 */
function renderAll() {
  views.board.setMode(state.mode);
  views.board.render(state.board, state.gnome, state.startGnome);
  views.program.render(state.program, state.targetUid);
  views.palette.render(state.levelFilter, state.program.canAddCard());
  views.controls.setMode(state.mode, state.startGnome.direction);
}

/**
 * Something changed the board, the start gnome or the program: the previous
 * run is no longer valid. Stop it and show the gnome on its start cell.
 * @returns {void}
 */
function invalidateRun() {
  views.animator.reset();
  state.lastRun = null;
  state.gnome = cloneGnome(state.startGnome);
  views.board.clearEffects();
}

// ---------------------------------------------------------------------------
// Handlers called by the views
// ---------------------------------------------------------------------------

/**
 * A board cell was tapped. Behaviour depends on state.mode.
 * @param {number} x
 * @param {number} y
 */
function onCellTap(x, y) {
  switch (state.mode) {
    case TOOL_MODES.GNOME:
      if (samePosition(state.startGnome, { x, y })) return;
      if (!state.board.canPlaceGnome(x, y)) {
        views.animator.showMessage(TEXTS.msgCannotPlaceGnome, 'warning');
        return;
      }
      state.startGnome = createGnome(x, y, state.startGnome.direction);
      break;

    case TOOL_MODES.WALL:
      if (!state.board.toggleWall(x, y, state.startGnome)) {
        views.animator.showMessage(TEXTS.msgCannotPlaceWall, 'warning');
        return;
      }
      break;

    case TOOL_MODES.DIRECTION:
      // Tapping the gnome turns it clockwise; tapping elsewhere does nothing.
      if (!samePosition(state.startGnome, { x, y })) return;
      state.startGnome = createGnome(x, y, rotateDirection(state.startGnome.direction, 1));
      break;

    default:
      return;
  }
  views.animator.showMessage('');
  invalidateRun();
  renderAll();
}

/**
 * A toolbar mode was chosen.
 * @param {string} mode A TOOL_MODES value.
 */
function onModeChange(mode) {
  state.mode = mode;
  renderAll();
}

/**
 * A direction was chosen in the direction picker.
 * @param {'N'|'E'|'S'|'W'} direction
 */
function onDirectionChange(direction) {
  state.startGnome = createGnome(state.startGnome.x, state.startGnome.y, direction);
  invalidateRun();
  renderAll();
}

/**
 * A palette card was tapped: add it to the algorithm at the current target.
 * A newly added container becomes the target, so the next cards go inside it.
 * @param {string} cardId
 */
function onPaletteCardTap(cardId) {
  const result = state.program.addCard(cardId, state.targetUid);
  if (!result.ok) {
    views.animator.showMessage(programErrorMessage(result.reason), 'warning');
    return;
  }
  if (isContainer(cardId)) state.targetUid = result.card.uid;
  views.animator.showMessage('');
  invalidateRun();
  renderAll();
}

/**
 * A level filter button was tapped.
 * @param {number|null} level
 */
function onLevelFilterChange(level) {
  state.levelFilter = level;
  renderAll();
}

/**
 * A container card in the algorithm was tapped: it becomes the target.
 * Tapping it again goes back to the main level.
 * @param {string} uid
 */
function onSelectContainer(uid) {
  state.targetUid = state.targetUid === uid ? null : uid;
  renderAll();
}

/** "Back to main level" button. */
function onBackToRoot() {
  state.targetUid = null;
  renderAll();
}

/**
 * Delete button of a card in the algorithm.
 * @param {string} uid
 */
function onDeleteCard(uid) {
  state.program.removeCard(uid);
  // The target may have been the deleted card or a card inside it.
  if (state.targetUid && !state.program.findCard(state.targetUid)) state.targetUid = null;
  invalidateRun();
  renderAll();
}

/**
 * Compute the run if needed (cached in state.lastRun).
 * @returns {import('./logic/interpreter.js').RunResult|null} null if the program is empty.
 */
function ensureRun() {
  if (state.program.isEmpty()) {
    views.animator.showMessage(TEXTS.msgEmptyProgram, 'warning');
    return null;
  }
  if (!state.lastRun) {
    state.lastRun = runProgram(state.board, state.startGnome, state.program.root);
  }
  return state.lastRun;
}

/** "Run" button: play the whole run automatically, or stop it if running. */
function onRun() {
  if (views.animator.isPlaying) {
    views.animator.stop();
    return;
  }
  const run = ensureRun();
  if (run) views.animator.play(run);
}

/** "Step" button: show the next step only. */
function onStep() {
  const run = ensureRun();
  if (run) views.animator.step(run);
}

/** "Reset gnome" button: back to the start position, animation stopped. */
function onResetGnome() {
  views.animator.reset();
  state.gnome = cloneGnome(state.startGnome);
  views.board.clearEffects();
  views.program.highlightCard(null);
  renderAll();
  views.animator.showMessage(TEXTS.msgReady);
}

/** "Clear" button: empty the algorithm. */
function onClearProgram() {
  state.program.clear();
  state.targetUid = null;
  invalidateRun();
  onResetGnome();
}

/** "Clear walls" button. */
function onClearWalls() {
  state.board.clearWalls();
  invalidateRun();
  renderAll();
}

/**
 * Called by the animator for each displayed step.
 * @param {import('./logic/interpreter.js').Step} step
 */
function onAnimationStep(step) {
  if (step.event === STEP_EVENTS.START) views.board.clearEffects();
  state.gnome = step.gnome;
  views.board.renderGnome(step.gnome, step.event);
  views.program.highlightCard(step.cardUid);
}

/**
 * Called by the animator when playing starts / stops, to lock the editing UI.
 * @param {boolean} isPlaying
 */
function onPlayingChange(isPlaying) {
  views.controls.setRunning(isPlaying);
  views.board.setLocked(isPlaying);
  views.palette.setLocked(isPlaying);
  views.program.setLocked(isPlaying);
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

  views.board = new BoardView(document.getElementById('board'), { onCellTap });
  views.palette = new PaletteView(
    document.getElementById('palette'),
    document.getElementById('level-filter'),
    { onCardTap: onPaletteCardTap, onLevelChange: onLevelFilterChange },
  );
  views.program = new ProgramView(
    {
      list: document.getElementById('program'),
      counter: document.getElementById('card-counter'),
      targetLabel: document.getElementById('program-target-label'),
      rootButton: /** @type {HTMLButtonElement} */ (document.getElementById('btn-root')),
    },
    { onSelectContainer, onDeleteCard, onBackToRoot },
  );
  views.controls = new Controls(document, {
    onModeChange,
    onDirectionChange,
    onRun,
    onStep,
    onResetGnome,
    onClearProgram,
    onClearWalls,
  });
  views.animator = new Animator({
    messageElement: document.getElementById('message'),
    delayMs: ANIMATION_DELAY_MS,
    onStep: onAnimationStep,
    onPlayingChange,
  });

  renderAll();
  views.animator.showMessage(TEXTS.msgReady);

  // Debug helper: inspect the state from the browser console.
  window.gnomads = { state, views };
}

init();
