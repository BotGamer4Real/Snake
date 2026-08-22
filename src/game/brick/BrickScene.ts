import * as Phaser from "phaser";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "@/game/progress";
import {
  BALL_R,
  DEATH_PAUSE_MS,
  PAD,
  PADDLE_H,
  PADDLE_Y,
  SCALE,
  START_DELAY_MS,
  WAVE_PAUSE_MS,
  WORLD_H,
  WORLD_W,
} from "./constants";
import {
  afterDeath,
  createState,
  launch,
  movePaddle,
  nextLevel,
  setPaddleX,
  tick,
  type BrickState,
} from "./engine";
import {
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  LAUNCH_EVENT,
  MOVE_END,
  MOVE_START,
  PADDLE_SET,
  RESTART_EVENT,
  type BrickDir,
} from "./events";
import { BRICK_COLOR, COLOR } from "./theme";

type Burst = { x: number; y: number; color: number; age: number };

export class BrickScene extends Phaser.Scene {
  private state!: BrickState;
  private highScore = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private startDelay = 0;
  private deathDelay = 0;
  private waveDelay = 0;
  private hold: Record<BrickDir, boolean> = { left: false, right: false };
  private scoredDeath = false;
  private bursts: Burst[] = [];
  private lastRemaining = 0;

  constructor() {
    super("BrickScene");
  }

  create(): void {
    this.highScore = loadHighScore("brick");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.graphics = this.add.graphics();

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    this.game.events.on(MOVE_START, this.onMoveStart, this);
    this.game.events.on(MOVE_END, this.onMoveEnd, this);
    this.game.events.on(LAUNCH_EVENT, this.onLaunch, this);
    this.game.events.on(PADDLE_SET, this.onPaddleSet, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.game.events.on(HUD_REQUEST, this.publishHud, this);
    this.game.events.on(HIGH_SCORE_SET, this.onCloudHighScore, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", this.onKeyDown, true);
      window.removeEventListener("keyup", this.onKeyUp, true);
      this.game.events.off(MOVE_START, this.onMoveStart, this);
      this.game.events.off(MOVE_END, this.onMoveEnd, this);
      this.game.events.off(LAUNCH_EVENT, this.onLaunch, this);
      this.game.events.off(PADDLE_SET, this.onPaddleSet, this);
      this.game.events.off(RESTART_EVENT, this.restartRun, this);
      this.game.events.off(HUD_REQUEST, this.publishHud, this);
      this.game.events.off(HIGH_SCORE_SET, this.onCloudHighScore, this);
    });

    this.publishHud();
    this.draw();
  }

  update(_time: number, delta: number): void {
    this.bursts = this.bursts.filter((burst) => {
      burst.age += delta;
      return burst.age < 280;
    });

    if (this.state.status === "dead") {
      this.draw();
      return;
    }
    if (this.startDelay > 0) {
      const before = Math.ceil(this.startDelay / 1000);
      this.startDelay = Math.max(0, this.startDelay - delta);
      if (before !== (this.startDelay > 0 ? Math.ceil(this.startDelay / 1000) : 0)) {
        this.publishHud();
      }
      this.draw();
      return;
    }
    if (this.state.status === "dying") {
      this.deathDelay += delta;
      if (this.deathDelay >= DEATH_PAUSE_MS) {
        afterDeath(this.state);
        this.deathDelay = 0;
        this.publishHud();
      }
      this.draw();
      return;
    }
    if (this.state.status === "wave") {
      this.waveDelay += delta;
      if (this.waveDelay >= WAVE_PAUSE_MS) {
        nextLevel(this.state);
        this.waveDelay = 0;
        this.startDelay = 800;
        this.lastRemaining = this.state.remaining;
        this.publishHud();
      }
      this.draw();
      return;
    }

    const dir = this.hold.left && !this.hold.right ? -1 : this.hold.right && !this.hold.left ? 1 : 0;
    const before = {
      score: this.state.score,
      lives: this.state.lives,
      remaining: this.state.remaining,
      status: this.state.status,
      served: this.state.served,
    };
    movePaddle(this.state, dir, delta);
    tick(this.state, delta);
    if (this.state.remaining < this.lastRemaining) {
      this.spawnBurst();
      this.lastRemaining = this.state.remaining;
    }
    this.onDeathIfNeeded();
    if (
      before.score !== this.state.score
      || before.lives !== this.state.lives
      || before.remaining !== this.state.remaining
      || before.status !== this.state.status
      || before.served !== this.state.served
    ) {
      this.publishHud();
    }
    this.draw();
  }

  private spawnBurst(): void {
    this.bursts.push({
      x: this.state.ballX,
      y: this.state.ballY,
      color: 0xf8fafc,
      age: 0,
    });
  }

  private onDeathIfNeeded(): void {
    if (this.state.status !== "dead") return;
    if (this.scoredDeath) return;
    this.scoredDeath = true;
    this.highScore = saveHighScore("brick", this.state.score);
    void persistHighScore("brick", this.state.score).then((merged) => {
      this.highScore = merged;
      this.publishHud();
    });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingInField(event)) return;
    const key = event.key.toLowerCase();
    if (this.state.status === "dead" && (key === " " || key === "enter" || key === "r")) {
      event.preventDefault();
      this.restartRun();
      return;
    }
    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      this.hold.left = true;
    } else if (key === "arrowright" || key === "d") {
      event.preventDefault();
      this.hold.right = true;
    } else if (key === " " || key === "arrowup" || key === "w") {
      event.preventDefault();
      launch(this.state);
      this.publishHud();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") this.hold.left = false;
    if (key === "arrowright" || key === "d") this.hold.right = false;
  };

  private onMoveStart(dir: BrickDir): void {
    this.hold[dir] = true;
  }

  private onMoveEnd(dir: BrickDir): void {
    this.hold[dir] = false;
  }

  private onLaunch(): void {
    launch(this.state);
    this.publishHud();
  }

  private onPaddleSet(x: number): void {
    if (!Number.isFinite(x)) return;
    setPaddleX(this.state, x - this.state.paddleW / 2);
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
    this.deathDelay = 0;
    this.waveDelay = 0;
    this.hold = { left: false, right: false };
    this.scoredDeath = false;
    this.bursts = [];
    this.lastRemaining = this.state.remaining;
    if (publish) this.publishHud();
  }

  private publishHud(): void {
    this.game.events.emit(HUD_EVENT, {
      score: this.state.score,
      highScore: this.highScore,
      lives: Math.max(0, this.state.lives),
      level: this.state.level + 1,
      bricks: this.state.remaining,
      status: this.state.status === "dead" ? "dead" : "playing",
      countdown:
        this.state.status !== "dead" && this.startDelay > 0
          ? Math.max(1, Math.ceil(this.startDelay / 1000))
          : null,
      newBest:
        this.state.status === "dead" &&
        this.state.score >= this.highScore &&
        this.state.score > 0,
      served: this.state.served,
    });
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();
    const ox = PAD;
    const oy = PAD;
    const w = WORLD_W * SCALE;
    const h = WORLD_H * SCALE;

    g.fillStyle(0x101827, 1);
    g.fillRoundedRect(ox - 8, oy - 8, w + 16, h + 16, 16);
    g.lineStyle(2, 0x38bdf8, 0.3);
    g.strokeRoundedRect(ox - 8, oy - 8, w + 16, h + 16, 16);
    g.fillStyle(COLOR.field, 1);
    g.fillRoundedRect(ox, oy, w, h, 8);

    g.fillStyle(COLOR.wall, 0.85);
    g.fillRect(ox, oy, w, 8 * SCALE);
    g.fillRect(ox, oy, 8 * SCALE, h);
    g.fillRect(ox + w - 8 * SCALE, oy, 8 * SCALE, h);

    for (const brick of this.state.bricks) {
      if (!brick.alive) continue;
      const p = this.world(brick.x, brick.y);
      const color = BRICK_COLOR[brick.row] ?? BRICK_COLOR[0]!;
      g.fillStyle(color, 1);
      g.fillRoundedRect(p.x, p.y, brick.w * SCALE, brick.h * SCALE, 4);
      g.fillStyle(0xffffff, 0.22);
      g.fillRoundedRect(p.x + 2, p.y + 2, brick.w * SCALE * 0.55, 4, 2);
    }

    const paddle = this.world(this.state.paddleX, PADDLE_Y);
    g.fillStyle(COLOR.paddleGlow, 0.28);
    g.fillRoundedRect(paddle.x - 4, paddle.y - 3, this.state.paddleW * SCALE + 8, PADDLE_H * SCALE + 6, 8);
    g.fillStyle(COLOR.paddle, 1);
    g.fillRoundedRect(paddle.x, paddle.y, this.state.paddleW * SCALE, PADDLE_H * SCALE, 6);
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(paddle.x + 4, paddle.y + 2, this.state.paddleW * SCALE * 0.45, 3, 2);

    const ball = this.world(this.state.ballX - BALL_R, this.state.ballY - BALL_R);
    const d = BALL_R * 2 * SCALE;
    g.fillStyle(COLOR.ballGlow, 0.35);
    g.fillCircle(ball.x + d / 2, ball.y + d / 2, d * 0.85);
    g.fillStyle(COLOR.ball, 1);
    g.fillCircle(ball.x + d / 2, ball.y + d / 2, d / 2);
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(ball.x + d / 2 - 1.5, ball.y + d / 2 - 1.8, d * 0.16);

    for (const burst of this.bursts) {
      const p = this.world(burst.x, burst.y);
      const t = burst.age / 280;
      g.fillStyle(burst.color, 0.45 * (1 - t));
      g.fillCircle(p.x, p.y, 6 + t * 16);
    }

  }

  private world(x: number, y: number): { x: number; y: number } {
    return { x: PAD + x * SCALE, y: PAD + y * SCALE };
  }
}

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
