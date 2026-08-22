import * as Phaser from "phaser";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "@/game/progress";
import {
  CELL,
  COLS,
  DEATH_PAUSE_MS,
  HIT_RADIUS,
  hunterStepMs,
  PAD,
  playerStepMs,
  ROWS,
  START_DELAY_MS,
} from "./constants";
import {
  advanceWave,
  afterDeath,
  contactHunter,
  createState,
  moveHunter,
  queueDirection,
  stepPlayer,
  tickLevelTime,
  type ChaseState,
  type Hunter,
} from "./engine";
import {
  DIR_EVENT,
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  RESTART_EVENT,
  type ChaseDir,
} from "./events";
import { COLS as MAZE_COLS, MAZE, ROWS as MAZE_ROWS, type Dir } from "./maze";
import { COLOR, HUNTER_COLOR } from "./theme";

type Point = { x: number; y: number };

type Motion = {
  from: Point;
  to: Point;
  elapsed: number;
  duration: number;
};

export class ChaseScene extends Phaser.Scene {
  private state!: ChaseState;
  private highScore = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private startDelay = 0;
  private deathDelay = 0;
  private playerMove: Motion = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, elapsed: 0, duration: 260 };
  private hunterMoves: Motion[] = [];
  private scoredDeath = false;

  constructor() {
    super("ChaseScene");
  }

  create(): void {
    this.highScore = loadHighScore("chase");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.graphics = this.add.graphics();

    window.addEventListener("keydown", this.onWindowKey, true);
    this.game.events.on(DIR_EVENT, this.onDir, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.game.events.on(HUD_REQUEST, this.publishHud, this);
    this.game.events.on(HIGH_SCORE_SET, this.onCloudHighScore, this);

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
    if (this.state.status === "dead") {
      this.draw(time);
      return;
    }

    if (this.startDelay > 0) {
      const before = Math.ceil(this.startDelay / 1000);
      this.startDelay = Math.max(0, this.startDelay - delta);
      if (before !== (this.startDelay > 0 ? Math.ceil(this.startDelay / 1000) : 0)) {
        this.publishHud();
      }
      this.draw(time);
      return;
    }

    if (this.state.status === "dying") {
      this.deathDelay += delta;
      if (this.deathDelay >= DEATH_PAUSE_MS) {
        afterDeath(this.state);
        this.deathDelay = 0;
        this.snapActors();
        this.publishHud();
      }
      this.draw(time);
      return;
    }

    advanceWave(this.state, delta);
    tickLevelTime(this.state, delta);

    this.advanceMotion(this.playerMove, delta, playerStepMs(this.state.level), () => {
      stepPlayer(this.state);
      return { x: this.state.player.x, y: this.state.player.y };
    });

    for (let i = 0; i < this.state.hunters.length; i += 1) {
      const hunter = this.state.hunters[i]!;
      const move = this.hunterMoves[i];
      if (!move) continue;
      const interval = hunterStepMs(
        this.state.level,
        hunter.mode === "fright",
        hunter.mode === "eaten",
      );
      this.advanceMotion(move, delta, interval, () => {
        moveHunter(this.state, hunter);
        return { x: hunter.x, y: hunter.y };
      });
    }

    this.checkVisualHits();
    this.onDeathIfNeeded();
    this.draw(time);
  }

  private checkVisualHits(): void {
    if (this.state.status !== "playing") return;
    const player = lerpPoint(
      this.playerMove.from,
      this.playerMove.to,
      this.motionT(this.playerMove),
    );
    for (let i = 0; i < this.state.hunters.length; i += 1) {
      const hunter = this.state.hunters[i]!;
      const move = this.hunterMoves[i];
      const pos = move
        ? lerpPoint(move.from, move.to, this.motionT(move))
        : { x: hunter.x, y: hunter.y };
      if (tileDistance(player, pos) > HIT_RADIUS) continue;
      contactHunter(this.state, hunter);
      this.publishHud();
      if (this.state.status !== "playing") return;
    }
  }

  private advanceMotion(
    move: Motion,
    delta: number,
    nextDuration: number,
    step: () => Point,
  ): void {
    if (this.state.status !== "playing") return;
    move.elapsed += delta;
    if (move.elapsed < move.duration) return;
    move.elapsed -= move.duration;
    if (move.elapsed >= move.duration) move.elapsed = 0;
    move.from = { ...move.to };
    move.to = step();
    move.duration = Math.max(1, nextDuration);
    this.publishHud();
  }

  private snapActors(): void {
    const player = { x: this.state.player.x, y: this.state.player.y };
    const playerDuration = playerStepMs(this.state.level);
    this.playerMove = {
      from: player,
      to: { ...player },
      elapsed: playerDuration,
      duration: playerDuration,
    };
    this.hunterMoves = this.state.hunters.map((hunter) => {
      const pos = { x: hunter.x, y: hunter.y };
      const duration = hunterStepMs(this.state.level, false, false);
      return {
        from: pos,
        to: { ...pos },
        elapsed: duration,
        duration,
      };
    });
  }

  private onDeathIfNeeded(): void {
    if (this.state.status !== "dead") return;
    this.onDeath();
  }

  private onDeath(): void {
    if (this.scoredDeath) return;
    this.scoredDeath = true;
    this.highScore = saveHighScore("chase", this.state.score);
    void persistHighScore("chase", this.state.score).then((merged) => {
      this.highScore = merged;
      this.publishHud();
    });
    this.publishHud();
  }

  private onWindowKey = (event: KeyboardEvent): void => {
    if (isTypingInField(event) || event.repeat) return;
    const key = event.key.toLowerCase();
    if (this.state.status === "dead" && (key === " " || key === "enter" || key === "r")) {
      event.preventDefault();
      this.restartRun();
      return;
    }
    const dir = keyToDir(key);
    if (dir) {
      event.preventDefault();
      queueDirection(this.state, dir);
    }
  };

  private onDir(dir: ChaseDir): void {
    queueDirection(this.state, dir);
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
    this.scoredDeath = false;
    this.snapActors();
    if (publish) this.publishHud();
  }

  private publishHud(): void {
    this.game.events.emit(HUD_EVENT, {
      score: this.state.score,
      highScore: this.highScore,
      lives: Math.max(0, this.state.lives),
      level: this.state.level,
      pips: this.state.pipsLeft,
      status: this.state.status === "dead" ? "dead" : "playing",
      countdown:
        this.state.status !== "dead" && this.startDelay > 0
          ? Math.max(1, Math.ceil(this.startDelay / 1000))
          : null,
      newBest:
        this.state.status === "dead" &&
        this.state.score >= this.highScore &&
        this.state.score > 0,
    });
  }

  private motionT(move: Motion | undefined): number {
    if (!move || this.state.status !== "playing" || this.startDelay > 0) return 1;
    return Math.min(1, move.elapsed / Math.max(1, move.duration));
  }

  private draw(time = 0): void {
    const g = this.graphics;
    g.clear();
    const ox = PAD;
    const oy = PAD;
    const width = COLS * CELL;
    const height = ROWS * CELL;

    g.fillStyle(0x101827, 1);
    g.fillRoundedRect(ox - 8, oy - 8, width + 16, height + 16, 16);
    g.lineStyle(2, 0x93c5fd, 0.35);
    g.strokeRoundedRect(ox - 8, oy - 8, width + 16, height + 16, 16);
    g.fillStyle(COLOR.floor, 1);
    g.fillRoundedRect(ox, oy, width, height, 8);

    for (let y = 0; y < MAZE_ROWS; y += 1) {
      for (let x = 0; x < MAZE_COLS; x += 1) {
        const tile = MAZE[y]![x]!;
        const px = ox + x * CELL;
        const py = oy + y * CELL;
        if (tile === "#") {
          g.fillStyle(COLOR.wall, 1);
          g.fillRoundedRect(px + 1, py + 1, CELL - 2, CELL - 2, 5);
          g.fillStyle(COLOR.wallHi, 0.35);
          g.fillRect(px + 3, py + 3, CELL - 6, 3);
        } else if (tile === "D") {
          g.fillStyle(COLOR.door, 0.9);
          g.fillRect(px + 2, py + CELL / 2 - 2, CELL - 4, 4);
        }
        if (this.state.pips[y]![x]) {
          g.fillStyle(COLOR.pip, 1);
          g.fillCircle(px + CELL / 2, py + CELL / 2, 2.2);
        }
        if (this.state.boosts[y]![x]) {
          const pulse = 1 + Math.sin(time / 140) * 0.18;
          g.fillStyle(COLOR.boost, 0.35);
          g.fillCircle(px + CELL / 2, py + CELL / 2, 7 * pulse);
          g.fillStyle(COLOR.boost, 1);
          g.fillCircle(px + CELL / 2, py + CELL / 2, 4.2 * pulse);
        }
      }
    }

    if (this.state.lifeToken) {
      const pulse = 1 + Math.sin(time / 160) * 0.12;
      const cx = PAD + this.state.lifeToken.x * CELL + CELL / 2;
      const cy = PAD + this.state.lifeToken.y * CELL + CELL / 2;
      g.fillStyle(COLOR.lifeGlow, 0.35);
      g.fillCircle(cx, cy, 9 * pulse);
      g.fillStyle(COLOR.life, 1);
      g.fillCircle(cx, cy, 5.5 * pulse);
      g.fillStyle(0x052e16, 1);
      g.fillRect(cx - 1.2, cy - 4.2, 2.4, 8.4);
      g.fillRect(cx - 4.2, cy - 1.2, 8.4, 2.4);
    }

    const player = lerpPoint(this.playerMove.from, this.playerMove.to, this.motionT(this.playerMove));
    this.drawPlayer(g, player, this.state.player.dir);
    for (let i = 0; i < this.state.hunters.length; i += 1) {
      const hunter = this.state.hunters[i]!;
      const move = this.hunterMoves[i];
      const pos = move
        ? lerpPoint(move.from, move.to, this.motionT(move))
        : { x: hunter.x, y: hunter.y };
      this.drawHunter(g, hunter, pos, time);
    }
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics, pos: Point, dir: Dir): void {
    const { x, y } = this.cellCenter(pos);
    const r = CELL * 0.38;
    g.fillStyle(COLOR.playerGlow, 0.28);
    g.fillCircle(x, y, r * 1.45);
    g.fillStyle(COLOR.player, 1);
    g.fillCircle(x, y, r);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(x - r * 0.25, y - r * 0.28, r * 0.28);
    const d = dirDelta(dir);
    g.fillStyle(0x0f172a, 1);
    g.fillTriangle(
      x + d.x * r * 0.95,
      y + d.y * r * 0.95,
      x + d.x * r * 0.15 + d.y * r * 0.42,
      y + d.y * r * 0.15 - d.x * r * 0.42,
      x + d.x * r * 0.15 - d.y * r * 0.42,
      y + d.y * r * 0.15 + d.x * r * 0.42,
    );
  }

  private drawHunter(
    g: Phaser.GameObjects.Graphics,
    hunter: Hunter,
    pos: Point,
    time: number,
  ): void {
    const { x, y } = this.cellCenter(pos);
    const frightEnd = hunter.mode === "fright" && hunter.frightMs < 1600;
    const flash = frightEnd && Math.floor(time / 120) % 2 === 0;
    const color =
      hunter.mode === "eaten"
        ? HUNTER_COLOR.eaten
        : hunter.mode === "fright"
          ? flash
            ? 0xf8fafc
            : HUNTER_COLOR.fright
          : HUNTER_COLOR[hunter.id];
    const s = CELL * 0.42;
    g.fillStyle(color, hunter.mode === "eaten" ? 0.45 : 1);
    g.fillTriangle(x, y - s, x + s, y, x, y + s);
    g.fillTriangle(x, y - s, x - s, y, x, y + s);
    g.fillStyle(0xffffff, hunter.mode === "eaten" ? 0.9 : 1);
    g.fillCircle(x - 3.2, y - 1.5, 2.4);
    g.fillCircle(x + 3.2, y - 1.5, 2.4);
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(x - 3.2, y - 1.5, 1.1);
    g.fillCircle(x + 3.2, y - 1.5, 1.1);
  }

  private cellCenter(pos: Point): Point {
    return {
      x: PAD + pos.x * CELL + CELL / 2,
      y: PAD + pos.y * CELL + CELL / 2,
    };
  }
}

function shortestDelta(from: number, to: number, size: number): number {
  let delta = to - from;
  if (delta > size / 2) delta -= size;
  if (delta < -size / 2) delta += size;
  return delta;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + shortestDelta(a.x, b.x, COLS) * t,
    y: a.y + shortestDelta(a.y, b.y, ROWS) * t,
  };
}

function tileDistance(a: Point, b: Point): number {
  const dx = shortestDelta(a.x, b.x, COLS);
  const dy = shortestDelta(a.y, b.y, ROWS);
  return Math.hypot(dx, dy);
}

function dirDelta(dir: Dir): Point {
  if (dir === "up") return { x: 0, y: -1 };
  if (dir === "down") return { x: 0, y: 1 };
  if (dir === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function keyToDir(key: string): Dir | null {
  if (key === "arrowup" || key === "w") return "up";
  if (key === "arrowdown" || key === "s") return "down";
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return null;
}

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
