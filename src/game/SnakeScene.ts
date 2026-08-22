import * as Phaser from "phaser";
import { COLS, ROWS, START_DELAY_MS, tickMs } from "./constants";
import {
  createState,
  queueDirection,
  step,
  type Dir,
  type GameState,
  type Point,
} from "./engine";
import { DIR_EVENT, HIGH_SCORE_SET, HUD_EVENT, HUD_REQUEST, RESTART_EVENT } from "./events";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "./progress";
import { CELL, COLOR, PAD } from "./theme";

type Burst = { x: number; y: number; age: number; maxAge: number };

function clonePoints(points: Point[]): Point[] {
  return points.map((point) => ({ x: point.x, y: point.y }));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class SnakeScene extends Phaser.Scene {
  private state!: GameState;
  private highScore = 0;
  private elapsed = 0;
  private fromSnake: Point[] = [];
  private toSnake: Point[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  private bursts: Burst[] = [];
  private deathFlash = 0;
  private startDelay = 0;

  constructor() {
    super("SnakeScene");
  }

  create(): void {
    this.highScore = loadHighScore("snake");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.glow = this.add.graphics();
    this.graphics = this.add.graphics();

    window.addEventListener("keydown", this.onWindowKey, true);
    this.game.events.on(DIR_EVENT, this.onDir, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.game.events.on(HUD_REQUEST, this.publishHud, this);
    this.game.events.on(HIGH_SCORE_SET, this.onCloudHighScore, this);
    this.input.on("pointerdown", this.onPointer, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", this.onWindowKey, true);
      this.game.events.off(DIR_EVENT, this.onDir, this);
      this.game.events.off(RESTART_EVENT, this.restartRun, this);
      this.game.events.off(HUD_REQUEST, this.publishHud, this);
      this.game.events.off(HIGH_SCORE_SET, this.onCloudHighScore, this);
    });

    this.publishHud();
    this.draw(0);
  }

  update(time: number, delta: number): void {
    this.bursts = this.bursts.filter((burst) => {
      burst.age += delta;
      return burst.age < burst.maxAge;
    });
    if (this.deathFlash > 0) {
      this.deathFlash = Math.max(0, this.deathFlash - delta);
    }

    let t = 1;
    if (this.state.status === "playing" && this.startDelay > 0) {
      const before = Math.ceil(this.startDelay / 1000);
      this.startDelay = Math.max(0, this.startDelay - delta);
      const after = this.startDelay > 0 ? Math.ceil(this.startDelay / 1000) : 0;
      if (before !== after) this.publishHud();
      this.draw(1, time);
      return;
    }
    if (this.state.status === "playing") {
      this.elapsed += delta;
      const interval = tickMs(this.state.score);
      while (this.elapsed >= interval && this.state.status === "playing") {
        this.elapsed -= interval;
        this.advance();
      }
      t = Math.min(1, this.elapsed / interval);
    }

    this.draw(this.state.status === "playing" ? t : 1, time);
  }

  private advance(): void {
    const previous = clonePoints(this.state.snake);
    const previousScore = this.state.score;
    this.state = step(this.state);
    this.fromSnake = previous;
    this.toSnake = clonePoints(this.state.snake);
    if (this.toSnake.length > this.fromSnake.length && this.fromSnake[0]) {
      this.fromSnake.unshift({ ...this.fromSnake[0] });
    }

    if (this.state.score > previousScore) {
      const food = this.toSnake[0]!;
      this.bursts.push({
        x: this.cellCenter(food.x),
        y: this.cellCenterY(food.y),
        age: 0,
        maxAge: 420,
      });
    }

    if (this.state.status === "dead") {
      this.highScore = saveHighScore("snake", this.state.score);
      this.deathFlash = 280;
      this.cameras.main.shake(160, 0.006);
      void persistHighScore("snake", this.state.score).then((merged) => {
        this.highScore = merged;
        this.publishHud();
      });
    }
    this.publishHud();
  }

  private onWindowKey = (event: KeyboardEvent): void => {
    this.onKey(event);
  };

  private onKey(event: KeyboardEvent): void {
    if (isTypingInField(event)) return;

    const key = event.key.toLowerCase();
    const dir = keyToDir(key);
    if (dir) {
      event.preventDefault();
      queueDirection(this.state, dir);
      return;
    }
    if (
      this.state.status === "dead" &&
      (key === " " || key === "enter" || key === "r")
    ) {
      event.preventDefault();
      this.restartRun();
    }
  }

  private onCloudHighScore(score: number): void {
    if (!Number.isFinite(score)) return;
    this.highScore = Math.max(this.highScore, score);
    this.publishHud();
  }

  private onDir(dir: Dir): void {
    if (this.state.status === "dead") return;
    queueDirection(this.state, dir);
  }

  private onPointer(): void {
    if (this.state.status === "dead") this.restartRun();
  }

  private restartRun(): void {
    this.resetRun(true);
  }

  private resetRun(publish: boolean): void {
    this.state = createState();
    this.elapsed = 0;
    this.fromSnake = clonePoints(this.state.snake);
    this.toSnake = clonePoints(this.state.snake);
    this.bursts = [];
    this.deathFlash = 0;
    this.startDelay = START_DELAY_MS;
    if (publish) this.publishHud();
  }

  private publishHud(): void {
    this.game.events.emit(HUD_EVENT, {
      score: this.state.score,
      highScore: this.highScore,
      status: this.state.status,
      countdown:
        this.state.status === "playing" && this.startDelay > 0
          ? Math.max(1, Math.ceil(this.startDelay / 1000))
          : null,
      newBest:
        this.state.status === "dead" &&
        this.state.score >= this.highScore &&
        this.state.score > 0,
    });
  }

  private cellCenter(x: number): number {
    return PAD + x * CELL + CELL / 2;
  }

  private cellCenterY(y: number): number {
    return PAD + y * CELL + CELL / 2;
  }

  private visualSnake(t: number): Point[] {
    const from = this.fromSnake;
    const to = this.toSnake;
    const length = to.length;
    const points: Point[] = [];
    for (let i = 0; i < length; i += 1) {
      const a = from[i] ?? from[from.length - 1] ?? to[i]!;
      const b = to[i]!;
      points.push({
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
      });
    }
    return points;
  }

  private draw(t: number, time = 0): void {
    const g = this.graphics;
    const glow = this.glow;
    g.clear();
    glow.clear();

    const boardX = PAD;
    const boardY = PAD;
    const width = COLS * CELL;
    const height = ROWS * CELL;
    const radius = 18;

    glow.fillStyle(COLOR.snakeGlow, 0.08);
    glow.fillRoundedRect(boardX - 10, boardY - 10, width + 20, height + 20, 24);

    g.fillStyle(COLOR.board, 1);
    g.fillRoundedRect(boardX, boardY, width, height, radius);

    g.fillStyle(COLOR.grid, 0.45);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        g.fillCircle(
          boardX + x * CELL + CELL / 2,
          boardY + y * CELL + CELL / 2,
          1.15,
        );
      }
    }

    g.lineStyle(1, COLOR.grid, 0.35);
    g.strokeRoundedRect(boardX + 0.5, boardY + 0.5, width - 1, height - 1, radius);

    this.drawFood(g, glow, time);
    this.drawBursts(glow);
    this.drawSnake(g, glow, this.visualSnake(t));

    if (this.deathFlash > 0) {
      g.fillStyle(0xff3355, (this.deathFlash / 280) * 0.28);
      g.fillRoundedRect(boardX, boardY, width, height, radius);
    }
  }

  private drawFood(
    g: Phaser.GameObjects.Graphics,
    glow: Phaser.GameObjects.Graphics,
    time: number,
  ): void {
    const pulse = 1 + Math.sin(time / 180) * 0.08;
    const cx = this.cellCenter(this.state.food.x);
    const cy = this.cellCenterY(this.state.food.y);
    const r = CELL * 0.34 * pulse;

    glow.fillStyle(COLOR.foodGlow, 0.18);
    glow.fillCircle(cx, cy, r * 2.4);
    glow.fillStyle(COLOR.foodGlow, 0.32);
    glow.fillCircle(cx, cy, r * 1.55);

    g.fillStyle(COLOR.food, 1);
    g.fillCircle(cx, cy + 1, r);
    g.fillStyle(0xff6b81, 1);
    g.fillCircle(cx - r * 0.12, cy - r * 0.08, r * 0.92);
    g.fillStyle(COLOR.foodCore, 0.55);
    g.fillCircle(cx - r * 0.28, cy - r * 0.32, r * 0.28);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - r * 0.22, cy - r * 0.38, r * 0.12);

    g.fillStyle(COLOR.stem, 1);
    g.fillRect(cx - 1.2, cy - r - 5, 2.4, 6);
    g.fillStyle(COLOR.leaf, 1);
    g.fillTriangle(
      cx + 1,
      cy - r - 2,
      cx + 9,
      cy - r - 7,
      cx + 8,
      cy - r + 1,
    );
  }

  private drawBursts(glow: Phaser.GameObjects.Graphics): void {
    for (const burst of this.bursts) {
      const p = burst.age / burst.maxAge;
      glow.lineStyle(3 * (1 - p), COLOR.foodCore, 0.7 * (1 - p));
      glow.strokeCircle(burst.x, burst.y, 10 + p * 28);
      glow.fillStyle(COLOR.foodGlow, 0.2 * (1 - p));
      glow.fillCircle(burst.x, burst.y, 6 + p * 10);
    }
  }

  private drawSnake(
    g: Phaser.GameObjects.Graphics,
    glow: Phaser.GameObjects.Graphics,
    snake: Point[],
  ): void {
    if (snake.length === 0) return;
    const pixels = snake.map((segment) => ({
      x: this.cellCenter(segment.x),
      y: this.cellCenterY(segment.y),
    }));
    const radius = CELL * 0.38;

    glow.lineStyle(radius * 2.8, COLOR.snakeGlow, 0.16);
    glow.beginPath();
    glow.moveTo(pixels[pixels.length - 1]!.x, pixels[pixels.length - 1]!.y);
    for (let i = pixels.length - 2; i >= 0; i -= 1) {
      glow.lineTo(pixels[i]!.x, pixels[i]!.y);
    }
    glow.strokePath();

    for (let i = pixels.length - 1; i >= 1; i -= 1) {
      const mix = i / Math.max(1, pixels.length - 1);
      const color = mixColor(COLOR.snakeBody, COLOR.snakeTail, mix);
      g.lineStyle(radius * 2, color, 1);
      g.beginPath();
      g.moveTo(pixels[i]!.x, pixels[i]!.y);
      g.lineTo(pixels[i - 1]!.x, pixels[i - 1]!.y);
      g.strokePath();
      g.fillStyle(color, 1);
      g.fillCircle(pixels[i]!.x, pixels[i]!.y, radius);
    }

    const head = pixels[0]!;
    glow.fillStyle(COLOR.snakeGlow, 0.35);
    glow.fillCircle(head.x, head.y, radius * 1.55);
    g.fillStyle(COLOR.snakeHead, 1);
    g.fillCircle(head.x, head.y, radius * 1.08);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(head.x - radius * 0.25, head.y - radius * 0.28, radius * 0.32);

    const delta = dirDelta(this.state.dir);
    const eyeForward = 5.5;
    const eyeSide = 5;
    const perp = { x: -delta.y, y: delta.x };
    for (const side of [-1, 1]) {
      const ex = head.x + delta.x * eyeForward + perp.x * eyeSide * side;
      const ey = head.y + delta.y * eyeForward + perp.y * eyeSide * side;
      g.fillStyle(0x06201a, 1);
      g.fillCircle(ex, ey, 2.4);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(ex - 0.7, ey - 0.7, 0.9);
    }
  }
}

function dirDelta(dir: Dir): Point {
  if (dir === "up") return { x: 0, y: -1 };
  if (dir === "down") return { x: 0, y: 1 };
  if (dir === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return (r << 16) | (g << 8) | bl;
}

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function keyToDir(key: string): Dir | null {
  if (key === "arrowup" || key === "w") return "up";
  if (key === "arrowdown" || key === "s") return "down";
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return null;
}
