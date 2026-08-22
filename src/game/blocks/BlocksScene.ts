import * as Phaser from "phaser";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "@/game/progress";
import {
  CELL,
  COLS,
  DAS_DELAY_MS,
  DAS_REPEAT_MS,
  gravityMs,
  LINE_CLEAR_MS,
  PAD,
  SOFT_DROP_MS,
  START_DELAY_MS,
  VISIBLE_ROWS,
} from "./constants";
import {
  commitClear,
  createState,
  pieceCells,
  softDrop,
  tickGravity,
  tryMove,
  tryRotate,
  visibleY,
  type BlocksState,
  type PieceId,
} from "./engine";
import {
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  MOVE_END,
  MOVE_START,
  RESTART_EVENT,
  ROTATE_EVENT,
  type BlocksDir,
} from "./events";
import { COLOR, PIECE_COLOR, shade } from "./theme";

export class BlocksScene extends Phaser.Scene {
  private state!: BlocksState;
  private highScore = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private startDelay = 0;
  private gravityElapsed = 0;
  private softElapsed = 0;
  private clearElapsed = 0;
  private held: Record<BlocksDir, boolean> = { left: false, right: false, down: false };
  private dasElapsed = 0;
  private dasReady = false;
  private dasDir: "left" | "right" | null = null;
  private scoredDeath = false;

  constructor() {
    super("BlocksScene");
  }

  create(): void {
    this.highScore = loadHighScore("blocks");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.graphics = this.add.graphics();

    window.addEventListener("keydown", this.onWindowKeyDown, true);
    window.addEventListener("keyup", this.onWindowKeyUp, true);
    this.game.events.on(MOVE_START, this.onMoveStart, this);
    this.game.events.on(MOVE_END, this.onMoveEnd, this);
    this.game.events.on(ROTATE_EVENT, this.onRotate, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.game.events.on(HUD_REQUEST, this.publishHud, this);
    this.game.events.on(HIGH_SCORE_SET, this.onCloudHighScore, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", this.onWindowKeyDown, true);
      window.removeEventListener("keyup", this.onWindowKeyUp, true);
      this.game.events.off(MOVE_START, this.onMoveStart, this);
      this.game.events.off(MOVE_END, this.onMoveEnd, this);
      this.game.events.off(ROTATE_EVENT, this.onRotate, this);
      this.game.events.off(RESTART_EVENT, this.restartRun, this);
      this.game.events.off(HUD_REQUEST, this.publishHud, this);
      this.game.events.off(HIGH_SCORE_SET, this.onCloudHighScore, this);
    });

    this.publishHud();
    this.draw();
  }

  update(_time: number, delta: number): void {
    if (this.state.status === "dead") {
      this.draw();
      return;
    }

    if (this.startDelay > 0) {
      const before = Math.ceil(this.startDelay / 1000);
      this.startDelay = Math.max(0, this.startDelay - delta);
      const after = this.startDelay > 0 ? Math.ceil(this.startDelay / 1000) : 0;
      if (before !== after) this.publishHud();
      this.draw();
      return;
    }

    if (this.state.status === "clearing") {
      this.clearElapsed += delta;
      if (this.clearElapsed >= LINE_CLEAR_MS) {
        commitClear(this.state);
        this.clearElapsed = 0;
        this.gravityElapsed = 0;
        this.onDeathIfNeeded();
        this.publishHud();
      }
      this.draw();
      return;
    }

    this.stepDas(delta);

    if (this.held.down) {
      this.softElapsed += delta;
      while (this.softElapsed >= SOFT_DROP_MS && this.state.status === "playing") {
        this.softElapsed -= SOFT_DROP_MS;
        const result = softDrop(this.state);
        if (result !== "noop") this.publishHud();
        if (result === "locked") {
          this.gravityElapsed = 0;
          this.softElapsed = 0;
          break;
        }
      }
    } else {
      this.softElapsed = 0;
      this.gravityElapsed += delta;
      const interval = gravityMs(this.state.level);
      while (this.gravityElapsed >= interval && this.state.status === "playing") {
        this.gravityElapsed -= interval;
        tickGravity(this.state);
        this.publishHud();
      }
    }

    this.onDeathIfNeeded();
    this.draw();
  }

  private stepDas(delta: number): void {
    const dir: "left" | "right" | null = this.held.left && !this.held.right
      ? "left"
      : this.held.right && !this.held.left
        ? "right"
        : this.held.left && this.held.right
          ? this.dasDir
          : null;
    if (!dir) {
      this.dasDir = null;
      this.dasReady = false;
      this.dasElapsed = 0;
      return;
    }
    if (this.dasDir !== dir) {
      this.dasDir = dir;
      this.dasReady = false;
      this.dasElapsed = 0;
      tryMove(this.state, dir === "left" ? -1 : 1, 0);
      this.publishHud();
      return;
    }
    this.dasElapsed += delta;
    const threshold = this.dasReady ? DAS_REPEAT_MS : DAS_DELAY_MS;
    if (this.dasElapsed >= threshold) {
      this.dasElapsed -= threshold;
      this.dasReady = true;
      tryMove(this.state, dir === "left" ? -1 : 1, 0);
      this.publishHud();
    }
  }

  private onDeathIfNeeded(): void {
    if (this.state.status !== "dead") return;
    this.onDeath();
  }

  private onDeath(): void {
    if (this.scoredDeath) return;
    this.scoredDeath = true;
    this.highScore = saveHighScore("blocks", this.state.score);
    void persistHighScore("blocks", this.state.score).then((merged) => {
      this.highScore = merged;
      this.publishHud();
    });
    this.publishHud();
  }

  private onWindowKeyDown = (event: KeyboardEvent): void => {
    if (isTypingInField(event) || event.repeat) return;
    const key = event.key.toLowerCase();
    if (this.state.status === "dead" && (key === " " || key === "enter" || key === "r")) {
      event.preventDefault();
      this.restartRun();
      return;
    }
    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      this.onMoveStart("left");
    } else if (key === "arrowright" || key === "d") {
      event.preventDefault();
      this.onMoveStart("right");
    } else if (key === "arrowdown" || key === "s") {
      event.preventDefault();
      this.onMoveStart("down");
    } else if (key === "arrowup" || key === "w" || key === "x") {
      event.preventDefault();
      if (this.startDelay > 0) return;
      tryRotate(this.state, 1);
      this.publishHud();
    } else if (key === "z") {
      event.preventDefault();
      if (this.startDelay > 0) return;
      tryRotate(this.state, -1);
      this.publishHud();
    }
  };

  private onWindowKeyUp = (event: KeyboardEvent): void => {
    if (isTypingInField(event)) return;
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") this.onMoveEnd("left");
    if (key === "arrowright" || key === "d") this.onMoveEnd("right");
    if (key === "arrowdown" || key === "s") this.onMoveEnd("down");
  };

  private onMoveStart(dir: BlocksDir): void {
    if (this.state.status === "dead") return;
    this.held[dir] = true;
  }

  private onMoveEnd(dir: BlocksDir): void {
    this.held[dir] = false;
  }

  private onRotate(): void {
    if (this.state.status === "dead" || this.startDelay > 0) return;
    tryRotate(this.state, 1);
    this.publishHud();
  }

  private onCloudHighScore(score: number): void {
    if (!Number.isFinite(score)) return;
    this.highScore = Math.max(this.highScore, score);
    this.publishHud();
  }

  private restartRun(): void {
    this.resetRun(true);
  }

  private resetRun(publish: boolean): void {
    this.state = createState();
    this.startDelay = START_DELAY_MS;
    this.gravityElapsed = 0;
    this.softElapsed = 0;
    this.clearElapsed = 0;
    this.held = { left: false, right: false, down: false };
    this.dasDir = null;
    this.dasReady = false;
    this.dasElapsed = 0;
    this.scoredDeath = false;
    if (publish) this.publishHud();
  }

  private publishHud(): void {
    this.game.events.emit(HUD_EVENT, {
      score: this.state.score,
      highScore: this.highScore,
      status: this.state.status === "dead" ? "dead" : "playing",
      countdown:
        this.state.status !== "dead" && this.startDelay > 0
          ? Math.max(1, Math.ceil(this.startDelay / 1000))
          : null,
      newBest:
        this.state.status === "dead" &&
        this.state.score >= this.highScore &&
        this.state.score > 0,
      lines: this.state.lines,
      level: this.state.level,
      next: this.state.next,
    });
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();

    const boardX = PAD;
    const boardY = PAD;
    const width = COLS * CELL;
    const height = VISIBLE_ROWS * CELL;

    g.fillStyle(0x101827, 1);
    g.fillRoundedRect(boardX - 8, boardY - 8, width + 16, height + 16, 16);
    g.lineStyle(2, 0x67e8f9, 0.28);
    g.strokeRoundedRect(boardX - 8, boardY - 8, width + 16, height + 16, 16);

    g.fillStyle(COLOR.board, 1);
    g.fillRoundedRect(boardX, boardY, width, height, 8);
    g.fillStyle(0x050814, 0.35);
    g.fillRoundedRect(boardX + 2, boardY + 2, width - 4, 18, 6);

    g.fillStyle(COLOR.grid, 0.42);
    for (let y = 0; y < VISIBLE_ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        g.fillRoundedRect(boardX + x * CELL + 1, boardY + y * CELL + 1, CELL - 2, CELL - 2, 3);
      }
    }
    g.lineStyle(2, COLOR.well, 0.95);
    g.strokeRoundedRect(boardX + 0.5, boardY + 0.5, width - 1, height - 1, 8);

    for (let y = 0; y < this.state.board.length; y += 1) {
      const row = this.state.board[y]!;
      for (let x = 0; x < row.length; x += 1) {
        const id = row[x];
        if (!id) continue;
        const flashing = this.state.clearing.includes(y);
        this.drawBlock(g, x, visibleY(y), id, flashing);
      }
    }

    if (this.state.status === "playing") {
      for (const cell of pieceCells(this.state.current)) {
        this.drawBlock(g, cell.x, visibleY(cell.y), this.state.current.id, false);
      }
    }
  }

  private drawBlock(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    id: PieceId,
    flash: boolean,
  ): void {
    if (y < 0 || y >= VISIBLE_ROWS || x < 0 || x >= COLS) return;
    const px = PAD + x * CELL + 1;
    const py = PAD + y * CELL + 1;
    this.paintCell(g, px, py, CELL - 3, PIECE_COLOR[id], flash);
  }

  private paintCell(
    g: Phaser.GameObjects.Graphics,
    px: number,
    py: number,
    size: number,
    color: number,
    flash: boolean,
  ): void {
    const fill = flash ? COLOR.flash : color;
    g.fillStyle(fill, 1);
    g.fillRoundedRect(px, py, size, size, 4);
    g.fillStyle(shade(fill, 52), 0.95);
    g.fillRect(px + 2, py + 2, size - 4, 4);
    g.fillStyle(shade(fill, -56), 0.55);
    g.fillRect(px + 2, py + size - 6, size - 4, 4);
    g.fillStyle(0xffffff, flash ? 0.6 : 0.22);
    g.fillRect(px + 3, py + 3, Math.max(4, size * 0.3), 3);
  }
}

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
