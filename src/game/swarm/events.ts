export const MOVE_START = "swarm-move-start";
export const MOVE_END = "swarm-move-end";
export const FIRE_EVENT = "swarm-fire";
export const FIRE_END = "swarm-fire-end";
export const RESTART_EVENT = "swarm-restart";
export const HUD_EVENT = "swarm-hud";
export const HUD_REQUEST = "swarm-hud-request";
export const HIGH_SCORE_SET = "swarm-high-score-set";

export type SwarmDir = "left" | "right";

export type SwarmHud = {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  status: "playing" | "dead";
  newBest: boolean;
  countdown: number | null;
};
