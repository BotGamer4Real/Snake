import type { Dir } from "./maze";

export const DIR_EVENT = "chase-dir";
export const RESTART_EVENT = "chase-restart";
export const HUD_EVENT = "chase-hud";
export const HUD_REQUEST = "chase-hud-request";
export const HIGH_SCORE_SET = "chase-high-score-set";

export type ChaseDir = Dir;

export type ChaseHud = {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  pips: number;
  status: "playing" | "dead";
  newBest: boolean;
  countdown: number | null;
};
