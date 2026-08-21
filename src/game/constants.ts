export const COLS = 20;
export const ROWS = 15;
export const START_LENGTH = 3;
export const CELL_SIZE = 24;
export const HUD_HEIGHT = 36;

export const LCD_BG = 0x9bbc0f;
export const LCD_SHADOW = 0x8bac0f;
export const LCD_FG = 0x0f380f;
export const LCD_MID = 0x306230;
export const BEZEL = 0x2b2b2b;

/** Starting tick 200ms; every 5 food, 12ms faster; floor 70ms. */
export function tickMs(score: number): number {
  const step = Math.floor(score / 5);
  return Math.max(70, 200 - step * 12);
}

export const HIGH_SCORE_KEY = "snake.highScore";
