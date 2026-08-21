import { COLS, ROWS, START_LENGTH } from "./constants";

export type Dir = "up" | "down" | "left" | "right";
export type Point = { x: number; y: number };

export type GameStatus = "playing" | "dead";

export interface GameState {
  snake: Point[];
  dir: Dir;
  queue: Dir[];
  food: Point;
  score: number;
  status: GameStatus;
}

const DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function occupies(cells: Point[], point: Point): boolean {
  return cells.some((cell) => samePoint(cell, point));
}

export function spawnFood(
  snake: Point[],
  random: () => number = Math.random,
): Point | null {
  const empty: Point[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = { x, y };
      if (!occupies(snake, cell)) empty.push(cell);
    }
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(random() * empty.length)]!;
}

export function createState(random: () => number = Math.random): GameState {
  const startY = Math.floor(ROWS / 2);
  const snake: Point[] = [];
  for (let i = START_LENGTH - 1; i >= 0; i -= 1) {
    snake.push({ x: i, y: startY });
  }
  const food = spawnFood(snake, random) ?? { x: COLS - 1, y: startY };
  return {
    snake,
    dir: "right",
    queue: [],
    food,
    score: 0,
    status: "playing",
  };
}

const MAX_QUEUE = 2;

export function queueDirection(state: GameState, dir: Dir): void {
  if (state.status !== "playing") return;
  const facing = state.queue[state.queue.length - 1] ?? state.dir;
  if (dir === facing || dir === OPPOSITE[facing]) return;
  if (state.queue.length >= MAX_QUEUE) return;
  state.queue.push(dir);
}

export function step(
  state: GameState,
  random: () => number = Math.random,
): GameState {
  if (state.status !== "playing") return state as GameState;

  const dir = state.queue.shift() ?? state.dir;
  state.dir = dir;

  const head = state.snake[0]!;
  const delta = DELTA[dir];
  const next: Point = { x: head.x + delta.x, y: head.y + delta.y };

  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    state.status = "dead";
    return state;
  }

  const growing = samePoint(next, state.food);
  const bodyToCheck = growing ? state.snake : state.snake.slice(0, -1);
  if (occupies(bodyToCheck, next)) {
    state.status = "dead";
    return state;
  }

  state.snake.unshift(next);
  if (growing) {
    state.score += 1;
    const food = spawnFood(state.snake, random);
    if (!food) {
      state.status = "dead";
      return state;
    }
    state.food = food;
  } else {
    state.snake.pop();
  }

  return state;
}
