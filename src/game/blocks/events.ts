export const MOVE_START = "blocks-move-start";
export const MOVE_END = "blocks-move-end";
export const ROTATE_EVENT = "blocks-rotate";
export const RESTART_EVENT = "blocks-restart";
export const HUD_EVENT = "blocks-hud";
export const HUD_REQUEST = "blocks-hud-request";
export const HIGH_SCORE_SET = "blocks-high-score-set";

export type BlocksDir = "left" | "right" | "down";

export type BlocksHud = {
  score: number;
  highScore: number;
  status: "playing" | "dead";
  newBest: boolean;
  countdown: number | null;
  lines: number;
  level: number;
};
