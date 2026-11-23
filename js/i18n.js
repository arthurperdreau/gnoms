/**
 * @file i18n.js
 * All user-facing texts, in English. To translate the interface, copy this
 * object into another language and switch the exported `TEXTS`.
 *
 * Texts with variables are functions, so the UI never concatenates strings.
 */

export const TEXTS = Object.freeze({
  appTitle: 'Gnomads Simulator',

  // Sections
  boardTitle: 'Board',
  toolbarTitle: 'Edit board',
  paletteTitle: 'Cards',
  programTitle: 'Algorithm',
  controlsTitle: 'Controls',

  // Toolbar modes
  modeGnome: 'Place gnome',
  modeWall: 'Walls',
  modeDirection: 'Direction',

  // Directions
  directions: Object.freeze({ N: 'North', E: 'East', S: 'South', W: 'West' }),

  // Levels
  levelAll: 'All',
  levels: Object.freeze({ 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' }),

  // Card labels (keys = card ids in js/logic/cards.js)
  cards: Object.freeze({
    forward1: 'Forward 1',
    forward2: 'Forward 2',
    back1: 'Back 1',
    turnLeft: 'Turn left',
    turnRight: 'Turn right',
    uTurn: 'U-turn',
    repeat2: 'Repeat 2',
    repeat3: 'Repeat 3',
    repeat4: 'Repeat 4',
    ifWall: 'If wall ahead',
    ifClear: 'If path clear',
    else: 'Else',
  }),

  // Algorithm area
  programEmpty: 'Tap a card to add it here.',
  slotThen: 'then',
  slotElse: 'else',
  slotEmpty: 'empty',
  targetMain: 'Adding to: main level',
  targetContainer: (label) => `Adding inside: ${label}`,
  backToMain: 'Back to main level',
  deleteCard: 'Delete card',
  cardCounter: (used, max) => `${used} / ${max}`,

  // Buttons
  run: 'Run',
  step: 'Step',
  stop: 'Stop',
  resetGnome: 'Reset gnome',
  clearProgram: 'Clear',
  clearWalls: 'Clear walls',

  // Messages
  msgReady: 'Place your gnome, build an algorithm, then press Run.',
  msgEmptyProgram: 'Your algorithm is empty.',
  msgCardLimit: (max) => `Card limit reached (${max} cards maximum).`,
  msgElseOutsideIf: 'An Else card can only go inside an If card.',
  msgSlotFull: 'This card cannot hold more cards.',
  msgCannotPlaceWall: 'You cannot place a wall here.',
  msgCannotPlaceGnome: 'The gnome cannot go on a wall or on the treasure.',
  msgTreasure: (steps) => `Treasure found in ${steps} steps!`,
  msgFinished: (x, y, direction) => `Algorithm finished. Gnome at (${x}, ${y}) facing ${direction}.`,
  msgBlocked: (count) => `The gnome was blocked ${count} time${count > 1 ? 's' : ''}.`,
  msgMaxSteps: (max) => `Stopped after ${max} steps: the algorithm is too long.`,
});
