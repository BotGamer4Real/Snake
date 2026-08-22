export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
export const SPAWN_X = 3;
export const SPAWN_Y = 1;

export const CELL = 24;
export const PAD = 24;
export const SIDE = 112;
export const GAP = 16;

export const GAME_WIDTH = PAD + COLS * CELL + GAP + SIDE + PAD;
export const GAME_HEIGHT = PAD + VISIBLE_ROWS * CELL + PAD;

export const START_DELAY_MS = 3000;
export const LINE_CLEAR_MS = 240;
export const DAS_DELAY_MS = 267;
export const DAS_REPEAT_MS = 100;
export const SOFT_DROP_MS = 33;

/** NES-style frames-per-cell at 60 Hz, converted to milliseconds. */
const GRAVITY_FRAMES = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 1,
];

export function gravityMs(level: number): number {
  const frames = level >= 29 ? 1 : (GRAVITY_FRAMES[level] ?? 1);
  return (frames / 60) * 1000;
}

export const LINE_POINTS = [0, 40, 100, 300, 1200] as const;
