export const GAME_IDS = ["snake", "chase", "blocks", "swarm"] as const;

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
    blurb: "Eat the pips. Dodge the hunters. Boosts turn the chase.",
    playable: true,
  },
  blocks: {
    title: "Blocks",
    blurb: "Classic falling pieces. Clear lines. Don't top out.",
    playable: true,
  },
  swarm: {
    title: "Swarm",
    blurb: "Classic gallery shooter. Waves from above. Don't let them land.",
    playable: true,
  },
};

export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

export function emptyHighScores(): Record<GameId, number> {
  return { snake: 0, chase: 0, blocks: 0, swarm: 0 };
}
