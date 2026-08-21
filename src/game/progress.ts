import { HIGH_SCORE_KEY } from "./constants";

export function loadHighScore(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
  const value = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function saveHighScore(score: number): number {
  const next = Math.max(loadHighScore(), score);
  window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
  return next;
}
