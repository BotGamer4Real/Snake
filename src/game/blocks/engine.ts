import {
  COLS,
  HIDDEN_ROWS,
  LINE_POINTS,
  ROWS,
  SPAWN_X,
  SPAWN_Y,
} from "./constants";

export type PieceId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Point = { x: number; y: number };
export type Cell = PieceId | null;
export type Board = Cell[][];
export type GameStatus = "playing" | "clearing" | "dead";

export type ActivePiece = {
  id: PieceId;
  x: number;
  y: number;
  rot: number;
};

export interface BlocksState {
  board: Board;
  current: ActivePiece;
  next: PieceId;
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
  clearing: number[];
}

const PIECE_IDS: PieceId[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Four cells per rotation. I/O/S/Z repeat orientations; no wall kicks. */
const SHAPES: Record<PieceId, Point[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
  ],
  O: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
};

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
}

export function pieceCells(piece: ActivePiece): Point[] {
  const offsets = SHAPES[piece.id][piece.rot]!;
  return offsets.map((offset) => ({ x: piece.x + offset.x, y: piece.y + offset.y }));
}

export function previewCells(id: PieceId): Point[] {
  return SHAPES[id][0]!;
}

function collides(board: Board, cells: Point[]): boolean {
  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= COLS || cell.y >= ROWS) return true;
    if (cell.y < 0) continue;
    if (board[cell.y]![cell.x]) return true;
  }
  return false;
}

function pickPiece(random: () => number, previous?: PieceId): PieceId {
  const first = PIECE_IDS[Math.floor(random() * PIECE_IDS.length)]!;
  if (first === previous) {
    return PIECE_IDS[Math.floor(random() * PIECE_IDS.length)]!;
  }
  return first;
}

function spawnPiece(id: PieceId): ActivePiece {
  return { id, x: SPAWN_X, y: SPAWN_Y, rot: 0 };
}

function fullRows(board: Board): number[] {
  const rows: number[] = [];
  for (let y = HIDDEN_ROWS; y < ROWS; y += 1) {
    if (board[y]!.every((cell) => cell != null)) rows.push(y);
  }
  return rows;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function placePiece(board: Board, piece: ActivePiece): Board {
  const next = cloneBoard(board);
  for (const cell of pieceCells(piece)) {
    if (cell.y < 0 || cell.y >= ROWS || cell.x < 0 || cell.x >= COLS) continue;
    next[cell.y]![cell.x] = piece.id;
  }
  return next;
}

export function createState(random: () => number = Math.random): BlocksState {
  const currentId = pickPiece(random);
  const next = pickPiece(random, currentId);
  const current = spawnPiece(currentId);
  const board = emptyBoard();
  const status: GameStatus = collides(board, pieceCells(current)) ? "dead" : "playing";
  return {
    board,
    current,
    next,
    score: 0,
    lines: 0,
    level: 0,
    status,
    clearing: [],
  };
}

export function tryMove(state: BlocksState, dx: number, dy: number): boolean {
  if (state.status !== "playing") return false;
  const moved: ActivePiece = {
    ...state.current,
    x: state.current.x + dx,
    y: state.current.y + dy,
  };
  if (collides(state.board, pieceCells(moved))) return false;
  state.current = moved;
  return true;
}

export function tryRotate(state: BlocksState, dir: 1 | -1): boolean {
  if (state.status !== "playing") return false;
  const rotated: ActivePiece = {
    ...state.current,
    rot: (state.current.rot + dir + 4) % 4,
  };
  if (collides(state.board, pieceCells(rotated))) return false;
  state.current = rotated;
  return true;
}

export function softDrop(state: BlocksState): "moved" | "locked" | "noop" {
  if (state.status !== "playing") return "noop";
  if (tryMove(state, 0, 1)) {
    state.score += 1;
    return "moved";
  }
  lockPiece(state);
  return "locked";
}

export function tickGravity(state: BlocksState): void {
  if (state.status !== "playing") return;
  if (!tryMove(state, 0, 1)) lockPiece(state);
}

export function lockPiece(state: BlocksState): void {
  if (state.status !== "playing") return;
  state.board = placePiece(state.board, state.current);
  const rows = fullRows(state.board);
  if (rows.length > 0) {
    state.status = "clearing";
    state.clearing = rows;
    return;
  }
  spawnNext(state);
}

export function commitClear(state: BlocksState): void {
  if (state.status !== "clearing") return;
  const count = state.clearing.length;
  const keep = state.board.filter((_, y) => !state.clearing.includes(y));
  const added = Array.from({ length: count }, () => Array.from({ length: COLS }, () => null));
  state.board = [...added, ...keep];
  state.score += (LINE_POINTS[count] ?? 0) * (state.level + 1);
  state.lines += count;
  state.level = Math.floor(state.lines / 10);
  state.clearing = [];
  state.status = "playing";
  spawnNext(state);
}

function spawnNext(state: BlocksState): void {
  const current = spawnPiece(state.next);
  state.next = pickPiece(Math.random, current.id);
  state.current = current;
  if (collides(state.board, pieceCells(current))) {
    state.status = "dead";
  }
}

export function visibleY(y: number): number {
  return y - HIDDEN_ROWS;
}
