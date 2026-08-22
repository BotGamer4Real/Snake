import {
  CHASE_MS,
  frightMs,
  HUNTER_SCORES,
  PIP_SCORE,
  BOOST_SCORE,
  SCATTER_MS,
  START_LIVES,
} from "./constants";
import {
  COLS,
  DELTA,
  exits,
  findTiles,
  isHouse,
  isHunterWalkable,
  isPlayerWalkable,
  MAZE,
  OPPOSITE,
  ROWS,
  wrap,
  type Dir,
} from "./maze";

export type HunterId = "ember" | "drift" | "coil" | "dusk";

export type Actor = { x: number; y: number; dir: Dir };

export type Hunter = Actor & {
  id: HunterId;
  mode: "scatter" | "chase" | "fright" | "eaten";
  frightMs: number;
  released: boolean;
};

export type ChaseStatus = "playing" | "dying" | "dead";

export interface ChaseState {
  pips: boolean[][];
  boosts: boolean[][];
  player: Actor;
  hunters: Hunter[];
  score: number;
  lives: number;
  level: number;
  pipsLeft: number;
  combo: number;
  status: ChaseStatus;
  wave: "scatter" | "chase";
  waveMs: number;
  desired: Dir;
}

const HUNTER_IDS: HunterId[] = ["ember", "drift", "coil", "dusk"];

const SCATTER: Record<HunterId, { x: number; y: number }> = {
  ember: { x: COLS - 2, y: 1 },
  drift: { x: 1, y: 1 },
  coil: { x: COLS - 2, y: ROWS - 2 },
  dusk: { x: 1, y: ROWS - 2 },
};

const startTile = findTiles("S")[0] ?? { x: 9, y: 17 };
const houseTiles = findTiles("H");
const doorTiles = findTiles("D");
const houseHome = houseTiles[1] ?? houseTiles[0] ?? { x: 9, y: 10 };
const doorTile = doorTiles[1] ?? doorTiles[0] ?? { x: 9, y: 9 };
const outsideDoor = { x: doorTile.x, y: doorTile.y - 1 };

function cloneGrid(kind: "." | "*"): boolean[][] {
  return MAZE.map((row) => row.map((tile) => tile === kind));
}

function countPips(pips: boolean[][], boosts: boolean[][]): number {
  let n = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (pips[y]![x] || boosts[y]![x]) n += 1;
    }
  }
  return n;
}

function makeHunters(): Hunter[] {
  return HUNTER_IDS.map((id, index) => {
    const seat = houseTiles[index] ?? houseHome;
    return {
      id,
      x: seat.x,
      y: seat.y,
      dir: "up" as Dir,
      mode: "scatter" as const,
      frightMs: 0,
      released: index === 0,
    };
  });
}

export function createState(): ChaseState {
  const pips = cloneGrid(".");
  const boosts = cloneGrid("*");
  return {
    pips,
    boosts,
    player: { x: startTile.x, y: startTile.y, dir: "left" },
    hunters: makeHunters(),
    score: 0,
    lives: START_LIVES,
    level: 0,
    pipsLeft: countPips(pips, boosts),
    combo: 0,
    status: "playing",
    wave: "scatter",
    waveMs: SCATTER_MS,
    desired: "left",
  };
}

export function setDesired(state: ChaseState, dir: Dir): void {
  if (state.status !== "playing") return;
  state.desired = dir;
}

function canGo(
  x: number, y: number, dir: Dir,
  walkable: (x: number, y: number) => boolean,
): boolean {
  const d = DELTA[dir];
  const n = wrap(x + d.x, y + d.y);
  return walkable(n.x, n.y);
}

function stepActor(
  actor: Actor,
  walkable: (x: number, y: number) => boolean,
  desired?: Dir,
): void {
  if (desired && canGo(actor.x, actor.y, desired, walkable)) {
    actor.dir = desired;
  } else if (!canGo(actor.x, actor.y, actor.dir, walkable)) {
    const options = exits(actor.x, actor.y, walkable);
    if (options[0]) actor.dir = options[0];
    else return;
  }
  const d = DELTA[actor.dir];
  const n = wrap(actor.x + d.x, actor.y + d.y);
  actor.x = n.x;
  actor.y = n.y;
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function ahead(player: Actor, tiles: number): { x: number; y: number } {
  const d = DELTA[player.dir];
  return wrap(player.x + d.x * tiles, player.y + d.y * tiles);
}

function inPen(x: number, y: number): boolean {
  return isHouse(x, y);
}

function hunterCanEnter(hunter: Hunter, x: number, y: number): boolean {
  if (!isHunterWalkable(x, y)) return false;
  if (hunter.mode === "eaten") return true;
  if (!hunter.released) return inPen(x, y);
  if (!inPen(hunter.x, hunter.y) && inPen(x, y)) return false;
  return true;
}

function occupiedByOther(state: ChaseState, hunter: Hunter, x: number, y: number): boolean {
  return state.hunters.some(
    (other) =>
      other.id !== hunter.id &&
      other.mode !== "eaten" &&
      other.x === x &&
      other.y === y,
  );
}

function targetFor(state: ChaseState, hunter: Hunter): { x: number; y: number } {
  if (hunter.mode === "eaten") return houseHome;
  if (!hunter.released) {
    const seat = houseTiles[HUNTER_IDS.indexOf(hunter.id)] ?? houseHome;
    return seat;
  }
  if (inPen(hunter.x, hunter.y)) return outsideDoor;
  if (hunter.mode === "fright") {
    return SCATTER[hunter.id];
  }
  if (hunter.mode === "scatter") return SCATTER[hunter.id];
  const ember = state.hunters[0]!;
  if (hunter.id === "ember") return { x: state.player.x, y: state.player.y };
  if (hunter.id === "drift") return ahead(state.player, 4);
  if (hunter.id === "coil") {
    const pivot = ahead(state.player, 2);
    return {
      x: Math.max(1, Math.min(COLS - 2, pivot.x * 2 - ember.x)),
      y: Math.max(1, Math.min(ROWS - 2, pivot.y * 2 - ember.y)),
    };
  }
  const shy = dist2(hunter, state.player) < 64;
  return shy ? SCATTER.dusk : { x: state.player.x, y: state.player.y };
}

function pickHunterDir(state: ChaseState, hunter: Hunter): Dir {
  const walkable = (x: number, y: number) => hunterCanEnter(hunter, x, y);
  let options = exits(hunter.x, hunter.y, walkable);
  if (options.length === 0) return hunter.dir;
  const outside = hunter.released && !inPen(hunter.x, hunter.y);
  if (hunter.mode !== "eaten" && outside) {
    const reverse = OPPOSITE[hunter.dir];
    const filtered = options.filter((dir) => dir !== reverse);
    if (filtered.length) options = filtered;
  }
  const goal = targetFor(state, hunter);
  if (hunter.mode === "fright" && outside) {
    const open = options.filter((dir) => {
      const d = DELTA[dir];
      const n = wrap(hunter.x + d.x, hunter.y + d.y);
      return !occupiedByOther(state, hunter, n.x, n.y);
    });
    const pool = open.length ? open : options;
    return pool[Math.floor(Math.random() * pool.length)]!;
  }
  let best = options[0]!;
  let bestScore = Infinity;
  for (const dir of options) {
    const d = DELTA[dir];
    const n = wrap(hunter.x + d.x, hunter.y + d.y);
    let score = dist2(n, goal);
    if (occupiedByOther(state, hunter, n.x, n.y)) score += 800;
    if (score < bestScore) {
      bestScore = score;
      best = dir;
    }
  }
  return best;
}

function releaseHunters(state: ChaseState): void {
  const eatenPips = countPips(cloneGrid("."), cloneGrid("*")) - state.pipsLeft;
  const thresholds = [0, 12, 28, 48];
  state.hunters.forEach((hunter, index) => {
    if (!hunter.released && eatenPips >= (thresholds[index] ?? 80)) {
      hunter.released = true;
    }
  });
}

export function stepPlayer(state: ChaseState): void {
  if (state.status !== "playing") return;
  stepActor(state.player, isPlayerWalkable, state.desired);
  const { x, y } = state.player;
  if (state.pips[y]![x]) {
    state.pips[y]![x] = false;
    state.score += PIP_SCORE;
    state.pipsLeft -= 1;
  }
  if (state.boosts[y]![x]) {
    state.boosts[y]![x] = false;
    state.score += BOOST_SCORE;
    state.pipsLeft -= 1;
    state.combo = 0;
    const ms = frightMs(state.level);
    for (const hunter of state.hunters) {
      if (hunter.mode === "eaten") continue;
      hunter.mode = "fright";
      hunter.frightMs = ms;
      hunter.dir = OPPOSITE[hunter.dir];
    }
  }
  releaseHunters(state);
  resolveHits(state);
  if (state.pipsLeft <= 0 && state.status === "playing") {
    nextLevel(state);
  }
}

export function advanceWave(state: ChaseState, dt: number): void {
  if (state.status !== "playing") return;
  state.waveMs -= dt;
  if (state.waveMs <= 0) {
    state.wave = state.wave === "scatter" ? "chase" : "scatter";
    state.waveMs = state.wave === "scatter" ? SCATTER_MS : CHASE_MS;
  }
  for (const hunter of state.hunters) {
    if (hunter.mode === "fright") {
      hunter.frightMs -= dt;
      if (hunter.frightMs <= 0) {
        hunter.mode = state.wave;
        state.combo = 0;
      }
    } else if (hunter.mode !== "eaten") {
      hunter.mode = hunter.released ? state.wave : "scatter";
    }
    if (hunter.mode === "eaten" && hunter.x === houseHome.x && hunter.y === houseHome.y) {
      hunter.mode = state.wave;
      hunter.released = true;
    }
  }
}

export function moveHunter(state: ChaseState, hunter: Hunter): void {
  if (state.status !== "playing") return;
  hunter.dir = pickHunterDir(state, hunter);
  const d = DELTA[hunter.dir];
  const n = wrap(hunter.x + d.x, hunter.y + d.y);
  if (hunterCanEnter(hunter, n.x, n.y)) {
    hunter.x = n.x;
    hunter.y = n.y;
  }
  if (hunter.released && !inPen(hunter.x, hunter.y)) {
    hunter.released = true;
  }
  resolveHits(state);
}

function resolveHits(state: ChaseState): void {
  if (state.status !== "playing") return;
  for (const hunter of state.hunters) {
    if (hunter.x !== state.player.x || hunter.y !== state.player.y) continue;
    if (hunter.mode === "eaten") continue;
    if (hunter.mode === "fright") {
      hunter.mode = "eaten";
      hunter.frightMs = 0;
      const prize = HUNTER_SCORES[Math.min(state.combo, HUNTER_SCORES.length - 1)]!;
      state.score += prize;
      state.combo += 1;
      continue;
    }
    state.lives -= 1;
    state.status = state.lives <= 0 ? "dead" : "dying";
    return;
  }
}

export function afterDeath(state: ChaseState): void {
  if (state.status !== "dying") return;
  resetActors(state);
  state.status = "playing";
  state.wave = "scatter";
  state.waveMs = SCATTER_MS;
  state.combo = 0;
}

function resetActors(state: ChaseState): void {
  state.player = { x: startTile.x, y: startTile.y, dir: "left" };
  state.desired = "left";
  state.hunters = makeHunters();
}

function nextLevel(state: ChaseState): void {
  state.level += 1;
  const pips = cloneGrid(".");
  const boosts = cloneGrid("*");
  state.pips = pips;
  state.boosts = boosts;
  state.pipsLeft = countPips(pips, boosts);
  resetActors(state);
  state.wave = "scatter";
  state.waveMs = SCATTER_MS;
  state.combo = 0;
}
