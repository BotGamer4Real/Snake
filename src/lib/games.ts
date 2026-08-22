export const GAME_IDS = ["snake", "chase", "stack"] as const;

export type GameId = (typeof GAME_IDS)[number];

export const GAME_META: Record<
  GameId,
  { title: string; blurb: string; playable: boolean }
> = {
  snake: {
    title: "Snake",
    blurb: "Classic 1997-style rules. Eat. Don't hit the walls.",
    playable: true,
  },
  chase: {
    title: "Chase",
    blurb: "Original maze chase. Coming next.",
    playable: false,
  },
  stack: {
    title: "Stack",
    blurb: "Original falling blocks. Coming next.",
    playable: false,
  },
};

export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

export function emptyHighScores(): Record<GameId, number> {
  return { snake: 0, chase: 0, stack: 0 };
}
