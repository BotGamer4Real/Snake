import { COLS, ROWS } from "./maze";

export { COLS, ROWS };

export const CELL = 20;
export const PAD = 16;

export const GAME_WIDTH = PAD + COLS * CELL + PAD;
export const GAME_HEIGHT = PAD + ROWS * CELL + PAD;

export const START_DELAY_MS = 3000;
export const DEATH_PAUSE_MS = 1400;
export const START_LIVES = 3;

export const PLAYER_STEP_MS = 118;
export const HUNTER_STEP_MS = 128;
export const FRIGHT_STEP_MS = 168;
export const EATEN_STEP_MS = 52;
export const FRIGHT_MS = 6200;
export const SCATTER_MS = 6000;
export const CHASE_MS = 18000;

export const PIP_SCORE = 10;
export const BOOST_SCORE = 50;
export const HUNTER_SCORES = [200, 400, 800, 1600] as const;

export function playerStepMs(level: number): number {
  return Math.max(78, PLAYER_STEP_MS - level * 4);
}

export function hunterStepMs(level: number, frightened: boolean, eaten: boolean): number {
  if (eaten) return EATEN_STEP_MS;
  if (frightened) return Math.max(120, FRIGHT_STEP_MS - level * 4);
  return Math.max(84, HUNTER_STEP_MS - level * 5);
}

export function frightMs(level: number): number {
  return Math.max(2200, FRIGHT_MS - level * 400);
}
