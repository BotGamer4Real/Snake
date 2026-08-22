import * as Phaser from "phaser";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "@/game/progress";
import {
  CELL,
  COLS,
  DAS_DELAY_MS,
  DAS_REPEAT_MS,
  GAP,
  gravityMs,
  LINE_CLEAR_MS,
  PAD,
  SIDE,
  SOFT_DROP_MS,
  START_DELAY_MS,
  VISIBLE_ROWS,
} from "./constants";
import {
  commitClear,
  createState,
  pieceCells,
  previewCells,
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
  private nextLabel!: Phaser.GameObjects.Text;
  private levelLabel!: Phaser.GameObjects.Text;
  private linesLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("BlocksScene");
  }

  create(): void {
    this.highScore = loadHighScore("blocks");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.graphics = this.add.graphics();
    const sideX = PAD + COLS * CELL + GAP;
    const textStyle = {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "11px",
      color: "#94a3b8",
    };
    this.nextLabel = this.add.text(sideX, PAD, "NEXT", textStyle);
    this.levelLabel = this.add.text(sideX, PAD + 132, "", { ...textStyle, fontSize: "13px", color: "#e2e8f0" });
    this.linesLabel = this.add.text(sideX, PAD + 168, "", { ...textStyle, fontSize: "13px", color: "#e2e8f0" });

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
    });
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();

    const boardX = PAD;
    const boardY = PAD;
    const width = COLS * CELL;
    const height = VISIBLE_ROWS * CELL;
    const sideX = PAD + width + GAP;

    g.fillStyle(COLOR.board, 1);
    g.fillRoundedRect(boardX, boardY, width, height, 10);
    g.fillStyle(COLOR.panel, 1);
    g.fillRoundedRect(sideX, boardY, SIDE, height, 10);

    g.fillStyle(COLOR.grid, 0.35);
    for (let y = 0; y < VISIBLE_ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        g.fillRect(boardX + x * CELL, boardY + y * CELL, CELL - 1, CELL - 1);
      }
    }
    g.lineStyle(2, COLOR.well, 0.9);
    g.strokeRoundedRect(boardX + 1, boardY + 1, width - 2, height - 2, 10);

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

    this.drawPreview(g, sideX, this.state.next);
    this.levelLabel.setText(`LEVEL  ${this.state.level}`);
    this.linesLabel.setText(`LINES  ${this.state.lines}`);
  }

  private drawPreview(g: Phaser.GameObjects.Graphics, sideX: number, id: PieceId): void {
    const originX = sideX + 18;
    const originY = PAD + 28;
    const size = 18;
    for (const cell of previewCells(id)) {
      this.paintCell(
        g,
        originX + cell.x * size,
        originY + cell.y * size,
        size - 2,
        PIECE_COLOR[id],
        false,
      );
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
    this.paintCell(g, px, py, CELL - 2, PIECE_COLOR[id], flash);
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
    g.fillRoundedRect(px, py, size, size, 3);
    g.fillStyle(shade(fill, 46), 0.9);
    g.fillRect(px + 1, py + 1, size - 2, 3);
    g.fillStyle(shade(fill, -48), 0.55);
    g.fillRect(px + 1, py + size - 4, size - 2, 3);
    g.fillStyle(0xffffff, flash ? 0.55 : 0.18);
    g.fillRect(px + 2, py + 2, Math.max(3, size * 0.28), 2);
  }
}

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
