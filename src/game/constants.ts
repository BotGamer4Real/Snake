export const COLS = 20;
export const ROWS = 15;
export const START_LENGTH = 3;
export { CELL as CELL_SIZE, PAD as BOARD_PAD } from "./theme";

/** Starting tick 200ms; every 5 food, 12ms faster; floor 70ms. */
export function tickMs(score: number): number {
  const step = Math.floor(score / 5);
  return Math.max(70, 200 - step * 12);
}

export const HIGH_SCORE_KEY = "snake.highScore";
