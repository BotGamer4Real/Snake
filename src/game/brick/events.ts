export const MOVE_START = "brick-move-start";
export const MOVE_END = "brick-move-end";
export const LAUNCH_EVENT = "brick-launch";
export const PADDLE_SET = "brick-paddle-set";
export const RESTART_EVENT = "brick-restart";
export const HUD_EVENT = "brick-hud";
export const HUD_REQUEST = "brick-hud-request";
export const HIGH_SCORE_SET = "brick-high-score-set";

export type BrickDir = "left" | "right";

export type BrickHud = {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  bricks: number;
  status: "playing" | "dead";
  newBest: boolean;
  countdown: number | null;
  served: boolean;
};
