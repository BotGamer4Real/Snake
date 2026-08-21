export const DIR_EVENT = "snake-dir";
export const RESTART_EVENT = "snake-restart";
export const HUD_EVENT = "snake-hud";
export const HUD_REQUEST = "snake-hud-request";
export const HIGH_SCORE_SET = "snake-high-score-set";

export type HudPayload = {
  score: number;
  highScore: number;
  status: "playing" | "dead";
  newBest: boolean;
};
