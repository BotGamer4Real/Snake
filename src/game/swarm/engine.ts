import {
  ALIEN_GAP_X,
  ALIEN_GAP_Y,
  ALIEN_H,
  ALIEN_W,
  alienFireMs,
  BUNKER_CELL,
  BUNKER_COLS,
  BUNKER_COUNT,
  BUNKER_ROWS,
  BUNKER_Y,
  COLS,
  MYSTERY_H,
  MYSTERY_SCORES,
  MYSTERY_SPEED,
  MYSTERY_W,
  MYSTERY_Y,
  PLAYER_H,
  PLAYER_MARGIN,
  PLAYER_SHOT_SPEED,
  PLAYER_SPEED,
  PLAYER_W,
  PLAYER_Y,
  ROWS,
  SCORES,
  SHOT_H,
  SHOT_W,
  START_LIVES,
  STEP_X,
  STEP_Y,
  ALIEN_SHOT_SPEED,
  stepMs,
  WORLD_H,
  WORLD_W,
} from "./constants";

export type Rect = { x: number; y: number; w: number; h: number };
export type Shot = Rect;
export type Alien = Rect & { col: number; row: number; kind: 0 | 1 | 2; alive: boolean };
export type Bunker = { x: number; y: number; cells: boolean[][] };
export type Mystery = Rect & { dir: 1 | -1; live: boolean };

export type SwarmStatus = "playing" | "dying" | "dead" | "wave";

export interface SwarmState {
  aliens: Alien[];
  player: Rect;
  playerShot: Shot | null;
  alienShots: Shot[];
  bunkers: Bunker[];
  mystery: Mystery | null;
  dir: 1 | -1;
  score: number;
  lives: number;
  wave: number;
  status: SwarmStatus;
  stepElapsed: number;
  fireElapsed: number;
  mysteryElapsed: number;
  mysteryNext: number;
}

function kindForRow(row: number): 0 | 1 | 2 {
  if (row === 0) return 2;
  if (row <= 2) return 1;
  return 0;
}

function formationOrigin(wave: number): { x: number; y: number } {
  const gridW = COLS * (ALIEN_W + ALIEN_GAP_X) - ALIEN_GAP_X;
  return {
    x: (WORLD_W - gridW) / 2,
    y: 36 + Math.min(wave, 5) * 10,
  };
}

function makeAliens(wave: number): Alien[] {
  const origin = formationOrigin(wave);
  const aliens: Alien[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      aliens.push({
        col,
        row,
        kind: kindForRow(row),
        alive: true,
        x: origin.x + col * (ALIEN_W + ALIEN_GAP_X),
        y: origin.y + row * (ALIEN_H + ALIEN_GAP_Y),
        w: ALIEN_W,
        h: ALIEN_H,
      });
    }
  }
  return aliens;
}

function makeBunkers(): Bunker[] {
  const width = BUNKER_COLS * BUNKER_CELL;
  const gap = (WORLD_W - BUNKER_COUNT * width) / (BUNKER_COUNT + 1);
  return Array.from({ length: BUNKER_COUNT }, (_, i) => ({
    x: gap + i * (width + gap),
    y: BUNKER_Y,
    cells: Array.from({ length: BUNKER_ROWS }, (__, row) =>
      Array.from({ length: BUNKER_COLS }, (___, col) => {
        const edge = (row === 0 && (col === 0 || col === BUNKER_COLS - 1))
          || (row >= BUNKER_ROWS - 2 && col >= 2 && col <= BUNKER_COLS - 3);
        return !edge;
      }),
    ),
  }));
}

export function createState(): SwarmState {
  return {
    aliens: makeAliens(0),
    player: {
      x: WORLD_W / 2 - PLAYER_W / 2,
      y: PLAYER_Y,
      w: PLAYER_W,
      h: PLAYER_H,
    },
    playerShot: null,
    alienShots: [],
    bunkers: makeBunkers(),
    mystery: null,
    dir: 1,
    score: 0,
    lives: START_LIVES,
    wave: 0,
    status: "playing",
    stepElapsed: 0,
    fireElapsed: 400,
    mysteryElapsed: 0,
    mysteryNext: 12000 + Math.random() * 8000,
  };
}

function hits(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function living(state: SwarmState): Alien[] {
  return state.aliens.filter((alien) => alien.alive);
}

function bounds(aliens: Alien[]): { minX: number; maxX: number; maxY: number } {
  let minX = WORLD_W;
  let maxX = 0;
  let maxY = 0;
  for (const alien of aliens) {
    minX = Math.min(minX, alien.x);
    maxX = Math.max(maxX, alien.x + alien.w);
    maxY = Math.max(maxY, alien.y + alien.h);
  }
  return { minX, maxX, maxY };
}

function damageBunker(bunker: Bunker, shot: Rect): boolean {
  const localX = shot.x + shot.w / 2 - bunker.x;
  const localY = shot.y + shot.h / 2 - bunker.y;
  const col = Math.floor(localX / BUNKER_CELL);
  const row = Math.floor(localY / BUNKER_CELL);
  if (row < 0 || col < 0 || row >= BUNKER_ROWS || col >= BUNKER_COLS) return false;
  if (!bunker.cells[row]![col]) return false;
  for (let r = row - 1; r <= row + 1; r += 1) {
    for (let c = col - 1; c <= col + 1; c += 1) {
      if (r < 0 || c < 0 || r >= BUNKER_ROWS || c >= BUNKER_COLS) continue;
      bunker.cells[r]![c] = false;
    }
  }
  return true;
}

function shotHitsBunker(state: SwarmState, shot: Rect): boolean {
  return state.bunkers.some((bunker) => damageBunker(bunker, shot));
}

function stompBunkers(state: SwarmState): void {
  for (const alien of living(state)) {
    for (const bunker of state.bunkers) {
      const bw = BUNKER_COLS * BUNKER_CELL;
      const bh = BUNKER_ROWS * BUNKER_CELL;
      if (!hits(alien, { x: bunker.x, y: bunker.y, w: bw, h: bh })) continue;
      for (let r = 0; r < BUNKER_ROWS; r += 1) {
        for (let c = 0; c < BUNKER_COLS; c += 1) {
          const cell = {
            x: bunker.x + c * BUNKER_CELL,
            y: bunker.y + r * BUNKER_CELL,
            w: BUNKER_CELL,
            h: BUNKER_CELL,
          };
          if (hits(alien, cell)) bunker.cells[r]![c] = false;
        }
      }
    }
  }
}

function fireAlien(state: SwarmState): void {
  const columns = new Map<number, Alien>();
  for (const alien of living(state)) {
    const current = columns.get(alien.col);
    if (!current || alien.row > current.row) columns.set(alien.col, alien);
  }
  const shooters = [...columns.values()];
  if (shooters.length === 0) return;
  const shooter = shooters[Math.floor(Math.random() * shooters.length)]!;
  state.alienShots.push({
    x: shooter.x + shooter.w / 2 - SHOT_W / 2,
    y: shooter.y + shooter.h,
    w: SHOT_W,
    h: SHOT_H,
  });
}

function spawnMystery(): Mystery {
  const left = Math.random() < 0.5;
  return {
    x: left ? -MYSTERY_W : WORLD_W,
    y: MYSTERY_Y,
    w: MYSTERY_W,
    h: MYSTERY_H,
    dir: left ? 1 : -1,
    live: true,
  };
}

export function movePlayer(state: SwarmState, dir: -1 | 0 | 1, dt: number): void {
  if (state.status !== "playing" || dir === 0) return;
  state.player.x = Math.max(
    PLAYER_MARGIN,
    Math.min(WORLD_W - PLAYER_W - PLAYER_MARGIN, state.player.x + dir * PLAYER_SPEED * (dt / 1000)),
  );
}

export function firePlayer(state: SwarmState): void {
  if (state.status !== "playing" || state.playerShot) return;
  state.playerShot = {
    x: state.player.x + state.player.w / 2 - SHOT_W / 2,
    y: state.player.y - SHOT_H,
    w: SHOT_W,
    h: SHOT_H,
  };
}

export function tick(state: SwarmState, dt: number): void {
  if (state.status !== "playing") return;
  const alive = living(state);

  if (state.playerShot) {
    state.playerShot.y -= PLAYER_SHOT_SPEED * (dt / 1000);
    if (state.playerShot.y + state.playerShot.h < 0) state.playerShot = null;
  }
  if (state.playerShot && shotHitsBunker(state, state.playerShot)) state.playerShot = null;
  if (state.playerShot) {
    for (const alien of alive) {
      if (!hits(state.playerShot, alien)) continue;
      alien.alive = false;
      state.score += SCORES[alien.kind]!;
      state.playerShot = null;
      break;
    }
  }
  if (state.playerShot && state.mystery?.live && hits(state.playerShot, state.mystery)) {
    state.score += MYSTERY_SCORES[Math.floor(Math.random() * MYSTERY_SCORES.length)]!;
    state.mystery.live = false;
    state.playerShot = null;
  }

  state.stepElapsed += dt;
  const beat = stepMs(alive.length, state.wave);
  if (alive.length > 0 && state.stepElapsed >= beat) {
    state.stepElapsed -= beat;
    const box = bounds(alive);
    const drop = (state.dir === 1 && box.maxX + STEP_X > WORLD_W - 8)
      || (state.dir === -1 && box.minX - STEP_X < 8);
    if (drop) {
      state.dir = (state.dir === 1 ? -1 : 1);
      for (const alien of alive) alien.y += STEP_Y;
    } else {
      for (const alien of alive) alien.x += state.dir * STEP_X;
    }
    stompBunkers(state);
  }

  state.fireElapsed += dt;
  if (state.fireElapsed >= alienFireMs(state.wave) && alive.length > 0) {
    state.fireElapsed = 0;
    if (state.alienShots.length < 3) fireAlien(state);
  }
  state.alienShots = state.alienShots.filter((shot) => {
    shot.y += ALIEN_SHOT_SPEED * (dt / 1000);
    if (shot.y > WORLD_H) return false;
    if (shotHitsBunker(state, shot)) return false;
    if (hits(shot, state.player)) {
      state.lives -= 1;
      state.status = state.lives <= 0 ? "dead" : "dying";
      state.alienShots = [];
      state.playerShot = null;
      return false;
    }
    return true;
  });

  state.mysteryElapsed += dt;
  if (!state.mystery?.live && state.mysteryElapsed >= state.mysteryNext) {
    state.mystery = spawnMystery();
    state.mysteryElapsed = 0;
    state.mysteryNext = 14000 + Math.random() * 10000;
  }
  if (state.mystery?.live) {
    state.mystery.x += state.mystery.dir * MYSTERY_SPEED * (dt / 1000);
    if (state.mystery.x > WORLD_W + 4 || state.mystery.x + state.mystery.w < -4) {
      state.mystery.live = false;
    }
  }

  const remaining = living(state);
  if (remaining.length === 0) {
    state.status = "wave";
    return;
  }
  if (bounds(remaining).maxY >= PLAYER_Y - 2) {
    state.lives = 0;
    state.status = "dead";
  }
}

export function afterDeath(state: SwarmState): void {
  if (state.status !== "dying") return;
  state.player.x = WORLD_W / 2 - PLAYER_W / 2;
  state.playerShot = null;
  state.alienShots = [];
  state.status = "playing";
}

export function nextWave(state: SwarmState): void {
  state.wave += 1;
  state.aliens = makeAliens(state.wave);
  state.dir = 1;
  state.stepElapsed = 0;
  state.fireElapsed = 200;
  state.playerShot = null;
  state.alienShots = [];
  state.bunkers = makeBunkers();
  state.mystery = null;
  state.status = "playing";
}

export { WORLD_W, WORLD_H };
