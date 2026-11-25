/**
 * @file i18n.js
 * All user-facing texts, in English. To translate the interface, copy this
 * object into another language and switch the exported `TEXTS`.
 *
 * Vocabulary (same as the physical game): a gnome is "blocked" when it cannot
 * move; an "obstacle" is a square that blocks it; the "treasure" is the goal.
 *
 * Texts with variables are functions, so the UI never concatenates strings.
 */

export const TEXTS = Object.freeze({
  appTitle: 'Gnomads Simulator',
  logoAlt: 'Gnomads',

  // Sections
  boardTitle: 'Garden',
  toolbarTitle: 'Edit the garden',
  paletteTitle: 'Cards',
  programTitle: 'Algorithm',
  controlsTitle: 'Controls',

  // Toolbar modes
  modeGnome: 'Place gnome',
  modeObstacle: 'Obstacles',
  modeDirection: 'Direction',

  // Directions
  directions: Object.freeze({ N: 'North', E: 'East', S: 'South', W: 'West' }),

  // Levels
  levelAll: 'All',
  levels: Object.freeze({ 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' }),

  // Cards: name and text exactly as printed on the physical cards
  // (keys = card ids in js/logic/cards.js)
  cards: Object.freeze({
    forward1: { name: 'Forward 1', text: 'Your gnome moves 1 square forward.' },
    forward2: { name: 'Forward 2', text: 'Your gnome moves 2 squares forward. If it is blocked, it stops.' },
    back1: { name: 'Back 1', text: 'Your gnome moves 1 square back. It keeps looking the same way.' },
    turnLeft: { name: 'Turn left', text: 'Your gnome turns to its left.' },
    turnRight: { name: 'Turn right', text: 'Your gnome turns to its right.' },
    uTurn: { name: 'U-turn', text: 'Your gnome turns around and looks the other way.' },
    repeat2: { name: 'Repeat 2 times', text: 'Do the cards on the right of this card 2 times.' },
    repeat3: { name: 'Repeat 3 times', text: 'Do the cards on the right of this card 3 times.' },
    repeat4: { name: 'Repeat 4 times', text: 'Do the cards on the right of this card 4 times.' },
    ifBlocked: { name: 'If blocked', text: "If your gnome can't move forward, do the card on the right." },
    ifNotBlocked: { name: 'If not blocked', text: 'If your gnome can move forward, do the card on the right.' },
    else: { name: 'Else', text: 'Put it under an If card. If the If is false, do the card on the right.' },
  }),

  // Algorithm area
  programEmpty: 'Tap a card to add it here.',
  slotEmpty: 'Add a card',
  targetMain: 'Adding to: main level',
  targetContainer: (name) => `Adding inside: ${name}`,
  backToMain: 'Back to main level',
  deleteCard: 'Delete card',
  cardCounter: (used, max) => `${used} / ${max}`,

  // Board
  gnomeLabel: (direction) => `Gnome looking ${direction}`,
  squareLabel: (x, y) => `Square ${x}, ${y}`,
  squareTypes: Object.freeze({
    start: 'footprints',
    treasure: 'treasure',
    obstacle: 'rock',
    mushroom: 'mushroom',
    burrow: 'burrow',
    root: 'root',
    rake: 'rake',
  }),

  // Buttons
  run: 'Run',
  step: 'Step',
  stop: 'Stop',
  resetGnome: 'Reset gnome',
  clearProgram: 'Clear',
  clearObstacles: 'Clear obstacles',

  // Messages
  msgReady: 'Put your gnome on a footprints square, build an algorithm, then press Run.',
  msgEmptyProgram: 'Your algorithm is empty.',
  msgCardLimit: (max) => `Your hand is full (${max} cards maximum).`,
  msgElseWithoutIf: 'An Else card goes right under an If card (one Else per If).',
  msgSlotFull: 'This card already holds a card.',
  msgCannotPlaceObstacle: 'Rocks go on empty squares only.',
  msgCannotPlaceGnome: 'The gnome starts on one of the 4 footprints squares.',
  msgTreasure: (steps) => `Treasure found in ${steps} steps!`,
  msgFinished: (x, y, direction) => `Algorithm finished. Gnome on square (${x}, ${y}), looking ${direction}.`,
  msgBlocked: (count) => `It was blocked ${count} time${count === 1 ? '' : 's'}.`,
  msgMaxSteps: (max) => `Stopped after ${max} steps: the algorithm is too long.`,
});
