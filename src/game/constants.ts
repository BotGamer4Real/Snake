export const COLS = 20;
export const ROWS = 15;
export const START_LENGTH = 3;
export { CELL as CELL_SIZE, PAD as BOARD_PAD } from "./theme";

export const START_DELAY_MS = 3000;
const START_TICK_MS = 200;
const END_TICK_MS = 140;
const TICK_STEP_MS = 3;

/** Start 200ms; every 5 food, 3ms faster; floor 140ms (half the old top speed). */
export function tickMs(score: number): number {
  const step = Math.floor(score / 5);
  return Math.max(END_TICK_MS, START_TICK_MS - step * TICK_STEP_MS);
}

