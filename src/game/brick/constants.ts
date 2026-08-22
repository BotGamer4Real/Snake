export const WORLD_W = 360;
export const WORLD_H = 420;
export const SCALE = 1.2;
export const PAD = 16;

export const GAME_WIDTH = PAD + WORLD_W * SCALE + PAD;
export const GAME_HEIGHT = PAD + WORLD_H * SCALE + PAD;

export const START_DELAY_MS = 3000;
export const DEATH_PAUSE_MS = 1100;
export const WAVE_PAUSE_MS = 1200;
export const START_LIVES = 3;

export const COLS = 11;
export const ROWS = 8;
export const BRICK_GAP = 3;
export const BRICK_TOP = 46;
export const BRICK_H = 14;
export const WALL = 8;

export const PADDLE_W = 58;
export const PADDLE_H = 10;
export const PADDLE_Y = 392;
export const PADDLE_SPEED = 280;
export const PADDLE_MIN_W = 40;

export const BALL_R = 5;
export const BALL_SPEED = 210;
export const BALL_SPEED_MAX = 340;
export const BALL_SPEED_STEP = 8;

export const SCORES = [7, 7, 5, 5, 3, 3, 1, 1] as const;

export function paddleWidth(level: number): number {
  return Math.max(PADDLE_MIN_W, PADDLE_W - level * 3);
}

export function startSpeed(level: number): number {
  return Math.min(BALL_SPEED_MAX, BALL_SPEED + level * 12);
}
