export const COLS = 19;
export const ROWS = 21;

/** Original maze. # wall, . pip, * boost, = tunnel, H house, D door, S start. */
const RAW = [
  "###################",
  "#........#........#",
  "#*##.###.#.###.##*#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###.#.###.####",
  "=.................=",
  "#####.#.##.##.#.###",
  "#####.#.HHH.#.#####",
  "=.......DDD.......=",
  "#####.#.HHH.#.#####",
  "#####.#.#####.#.###",
  "=.................=",
  "####.###.#.###.####",
  "#....#...#...#....#",
  "#.##.#.#####.#.##.#",
  "#........S........#",
  "#*##.###.#.###.##*#",
  "#........#........#",
  "###################",
];

export type Tile = "#" | "." | "*" | "=" | "H" | "D" | "S" | " ";

export type Dir = "up" | "down" | "left" | "right";

export const DELTA: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

if (RAW.length !== ROWS || RAW.some((row) => row.length !== COLS)) {
  throw new Error("Chase maze is the wrong size");
}

export const MAZE: Tile[][] = RAW.map((row) => row.split("") as Tile[]);

export function wrap(x: number, y: number): { x: number; y: number } {
  let nx = x;
  let ny = y;
  if (nx < 0) nx = COLS - 1;
  if (nx >= COLS) nx = 0;
  if (ny < 0) ny = ROWS - 1;
  if (ny >= ROWS) ny = 0;
  return { x: nx, y: ny };
}

function tileAt(x: number, y: number): Tile {
  const p = wrap(x, y);
  return MAZE[p.y]![p.x]!;
}

export function isPlayerWalkable(x: number, y: number): boolean {
  const tile = tileAt(x, y);
  return tile === "." || tile === "*" || tile === "=" || tile === "S" || tile === " ";
}

export function isHunterWalkable(x: number, y: number): boolean {
  const tile = tileAt(x, y);
  return isPlayerWalkable(x, y) || tile === "H" || tile === "D";
}

export function isDoor(x: number, y: number): boolean {
  return tileAt(x, y) === "D";
}

export function isHouse(x: number, y: number): boolean {
  const tile = tileAt(x, y);
  return tile === "H" || tile === "D";
}

export function findTiles(kind: Tile): { x: number; y: number }[] {
  const found: { x: number; y: number }[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (MAZE[y]![x] === kind) found.push({ x, y });
    }
  }
  return found;
}

export function exits(
  x: number,
  y: number,
  walkable: (x: number, y: number) => boolean,
): Dir[] {
  const dirs: Dir[] = ["up", "left", "down", "right"];
  return dirs.filter((dir) => {
    const d = DELTA[dir];
    return walkable(x + d.x, y + d.y);
  });
}
