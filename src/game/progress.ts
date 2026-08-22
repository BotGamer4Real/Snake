import { emptyHighScores, type GameId } from "@/lib/games";

const SCORE_KEY_PREFIX = "arcade.highScore.";
const LEGACY_SNAKE_KEY = "snake.highScore";
const LEGACY_STACK_KEY = `${SCORE_KEY_PREFIX}stack`;

function scoreKey(gameId: GameId): string {
  return `${SCORE_KEY_PREFIX}${gameId}`;
}

export function loadHighScore(gameId: GameId): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(scoreKey(gameId));
  if (raw == null && gameId === "snake") {
    const legacy = window.localStorage.getItem(LEGACY_SNAKE_KEY);
    const migrated = parseScore(legacy);
    if (migrated > 0) {
      window.localStorage.setItem(scoreKey("snake"), String(migrated));
    }
    return migrated;
  }
  if (raw == null && gameId === "blocks") {
    const legacy = window.localStorage.getItem(LEGACY_STACK_KEY);
    const migrated = parseScore(legacy);
    if (migrated > 0) {
      window.localStorage.setItem(scoreKey("blocks"), String(migrated));
    }
    return migrated;
  }
  return parseScore(raw);
}

export function saveHighScore(gameId: GameId, score: number): number {
  const next = Math.max(loadHighScore(gameId), score);
  window.localStorage.setItem(scoreKey(gameId), String(next));
  return next;
}

export function loadAllHighScores(): Record<GameId, number> {
  const scores = emptyHighScores();
  for (const gameId of Object.keys(scores) as GameId[]) {
    scores[gameId] = loadHighScore(gameId);
  }
  return scores;
}

function parseScore(raw: string | null): number {
  const value = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}
