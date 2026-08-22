export const WORLD_W = 360;
export const WORLD_H = 420;
export const SCALE = 1.2;
export const PAD = 16;

export const GAME_WIDTH = PAD + WORLD_W * SCALE + PAD;
export const GAME_HEIGHT = PAD + WORLD_H * SCALE + PAD;

export const START_DELAY_MS = 3000;
export const DEATH_PAUSE_MS = 1200;
export const WAVE_PAUSE_MS = 1400;
export const START_LIVES = 3;

export const COLS = 9;
export const ROWS = 5;
export const ALIEN_W = 22;
export const ALIEN_H = 14;
export const ALIEN_GAP_X = 10;
export const ALIEN_GAP_Y = 10;
export const STEP_X = 8;
export const STEP_Y = 14;

export const PLAYER_W = 26;
export const PLAYER_H = 12;
export const PLAYER_Y = 392;
export const PLAYER_SPEED = 128;
export const PLAYER_MARGIN = 10;

export const SHOT_W = 3;
export const SHOT_H = 10;
export const PLAYER_SHOT_SPEED = 520;
export const ALIEN_SHOT_SPEED = 96;

export const MYSTERY_W = 28;
export const MYSTERY_H = 10;
export const MYSTERY_Y = 22;
export const MYSTERY_SPEED = 46;

export const BUNKER_COUNT = 3;
export const BUNKER_COLS = 8;
export const BUNKER_ROWS = 6;
export const BUNKER_CELL = 4;
export const BUNKER_Y = 338;

export const SCORES = [10, 20, 30] as const;
export const MYSTERY_SCORES = [50, 100, 150, 300] as const;

export function stepMs(alive: number, level: number): number {
  const slow = 720 - Math.min(level, 6) * 36;
  const fast = 90;
  const t = (Math.max(1, alive) - 1) / (COLS * ROWS - 1);
  return fast + (slow - fast) * t;
}

export function alienFireMs(level: number): number {
  return Math.max(520, 1100 - level * 50);
}
