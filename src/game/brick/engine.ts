import {
  BALL_R,
  BALL_SPEED_MAX,
  BALL_SPEED_STEP,
  BRICK_GAP,
  BRICK_H,
  BRICK_TOP,
  COLS,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_Y,
  ROWS,
  SCORES,
  START_LIVES,
  WALL,
  WORLD_H,
  WORLD_W,
  paddleWidth,
  startSpeed,
} from "./constants";

export type BrickCell = {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  alive: boolean;
};

export type BrickStatus = "playing" | "dying" | "dead" | "wave";

export interface BrickState {
  bricks: BrickCell[];
  paddleX: number;
  paddleW: number;
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  speed: number;
  served: boolean;
  score: number;
  lives: number;
  level: number;
  remaining: number;
  status: BrickStatus;
}

function brickWidth(): number {
  return (WORLD_W - WALL * 2 - BRICK_GAP * (COLS + 1)) / COLS;
}

function makeBricks(): BrickCell[] {
  const w = brickWidth();
  const bricks: BrickCell[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      bricks.push({
        x: WALL + BRICK_GAP + col * (w + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
        w,
        h: BRICK_H,
        row,
        alive: true,
      });
    }
  }
  return bricks;
}

function resetBall(state: BrickState): void {
  state.ballX = state.paddleX + state.paddleW / 2;
  state.ballY = PADDLE_Y - BALL_R - 1;
  state.vx = 0;
  state.vy = 0;
  state.served = false;
}

export function createState(): BrickState {
  const paddleW = paddleWidth(0);
  const state: BrickState = {
    bricks: makeBricks(),
    paddleX: WORLD_W / 2 - paddleW / 2,
    paddleW,
    ballX: 0,
    ballY: 0,
    vx: 0,
    vy: 0,
    speed: startSpeed(0),
    served: false,
    score: 0,
    lives: START_LIVES,
    level: 0,
    remaining: COLS * ROWS,
    status: "playing",
  };
  resetBall(state);
  return state;
}

export function movePaddle(state: BrickState, dir: -1 | 0 | 1, dt: number): void {
  if (state.status !== "playing" || dir === 0) return;
  setPaddleX(state, state.paddleX + dir * PADDLE_SPEED * (dt / 1000));
}

export function setPaddleX(state: BrickState, x: number): void {
  if (state.status !== "playing") return;
  state.paddleX = Math.max(WALL, Math.min(WORLD_W - WALL - state.paddleW, x));
  if (!state.served) {
    state.ballX = state.paddleX + state.paddleW / 2;
    state.ballY = PADDLE_Y - BALL_R - 1;
  }
}

export function launch(state: BrickState): void {
  if (state.status !== "playing" || state.served) return;
  const offset = (Math.random() * 2 - 1) * 0.35;
  const speed = state.speed;
  state.vx = speed * offset;
  state.vy = -Math.sqrt(Math.max(64, speed * speed - state.vx * state.vx));
  state.served = true;
}

function clampBallSpeed(state: BrickState): void {
  const mag = Math.hypot(state.vx, state.vy);
  if (mag < 1) return;
  const target = Math.min(BALL_SPEED_MAX, Math.max(state.speed, mag));
  state.vx = (state.vx / mag) * target;
  state.vy = (state.vy / mag) * target;
  if (Math.abs(state.vy) < target * 0.28) {
    state.vy = (state.vy < 0 ? -1 : 1) * target * 0.28;
    const nx = Math.sqrt(Math.max(16, target * target - state.vy * state.vy));
    state.vx = state.vx < 0 ? -nx : nx;
  }
}

function bouncePaddle(state: BrickState): void {
  const cx = state.paddleX + state.paddleW / 2;
  const hit = Math.max(-1, Math.min(1, (state.ballX - cx) / (state.paddleW / 2)));
  const speed = Math.min(BALL_SPEED_MAX, state.speed + BALL_SPEED_STEP * 0.35);
  state.speed = speed;
  const angle = hit * 1.05;
  state.vx = speed * Math.sin(angle);
  state.vy = -Math.abs(speed * Math.cos(angle));
  state.ballY = PADDLE_Y - BALL_R - 0.5;
  clampBallSpeed(state);
}

function bounceBrick(state: BrickState, brick: BrickCell): void {
  const nearestX = Math.max(brick.x, Math.min(state.ballX, brick.x + brick.w));
  const nearestY = Math.max(brick.y, Math.min(state.ballY, brick.y + brick.h));
  const dx = state.ballX - nearestX;
  const dy = state.ballY - nearestY;
  if (Math.abs(dx) > Math.abs(dy)) state.vx *= -1;
  else state.vy *= -1;
  brick.alive = false;
  state.remaining -= 1;
  state.score += SCORES[brick.row] ?? 1;
  if (brick.row <= 1) state.speed = Math.min(BALL_SPEED_MAX, state.speed + BALL_SPEED_STEP);
  clampBallSpeed(state);
}

function hitsBrick(state: BrickState, brick: BrickCell): boolean {
  const nx = Math.max(brick.x, Math.min(state.ballX, brick.x + brick.w));
  const ny = Math.max(brick.y, Math.min(state.ballY, brick.y + brick.h));
  const dx = state.ballX - nx;
  const dy = state.ballY - ny;
  return dx * dx + dy * dy <= BALL_R * BALL_R;
}

export function tick(state: BrickState, dt: number): void {
  if (state.status !== "playing" || !state.served) return;
  const steps = 3;
  const slice = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    if (state.status !== "playing" || !state.served) return;
    state.ballX += state.vx * (slice / 1000);
    state.ballY += state.vy * (slice / 1000);

    if (state.ballX - BALL_R <= WALL) {
      state.ballX = WALL + BALL_R;
      state.vx = Math.abs(state.vx);
    } else if (state.ballX + BALL_R >= WORLD_W - WALL) {
      state.ballX = WORLD_W - WALL - BALL_R;
      state.vx = -Math.abs(state.vx);
    }
    if (state.ballY - BALL_R <= WALL) {
      state.ballY = WALL + BALL_R;
      state.vy = Math.abs(state.vy);
    }

    if (
      state.vy > 0
      && state.ballY + BALL_R >= PADDLE_Y
      && state.ballY + BALL_R <= PADDLE_Y + PADDLE_H + 6
      && state.ballX >= state.paddleX - BALL_R
      && state.ballX <= state.paddleX + state.paddleW + BALL_R
    ) {
      bouncePaddle(state);
    }

    for (const brick of state.bricks) {
      if (!brick.alive || !hitsBrick(state, brick)) continue;
      bounceBrick(state, brick);
      break;
    }

    if (state.remaining <= 0) {
      state.status = "wave";
      return;
    }
    if (state.ballY - BALL_R > WORLD_H) {
      state.lives -= 1;
      state.status = state.lives <= 0 ? "dead" : "dying";
      return;
    }
  }
}

export function afterDeath(state: BrickState): void {
  if (state.status !== "dying") return;
  resetBall(state);
  state.status = "playing";
}

export function nextLevel(state: BrickState): void {
  state.level += 1;
  state.bricks = makeBricks();
  state.remaining = COLS * ROWS;
  state.paddleW = paddleWidth(state.level);
  state.speed = startSpeed(state.level);
  state.paddleX = Math.max(WALL, Math.min(WORLD_W - WALL - state.paddleW, state.paddleX));
  resetBall(state);
  state.status = "playing";
}
