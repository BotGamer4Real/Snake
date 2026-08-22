import * as Phaser from "phaser";
import { persistHighScore } from "@/lib/profile";
import { loadHighScore, saveHighScore } from "@/game/progress";
import {
  BUNKER_CELL,
  BUNKER_COLS,
  BUNKER_ROWS,
  DEATH_PAUSE_MS,
  MYSTERY_W,
  PAD,
  SCALE,
  START_DELAY_MS,
  WAVE_PAUSE_MS,
  WORLD_H,
  WORLD_W,
} from "./constants";
import {
  afterDeath,
  createState,
  firePlayer,
  movePlayer,
  nextWave,
  tick,
  type Alien,
  type SwarmState,
} from "./engine";
import {
  FIRE_END,
  FIRE_EVENT,
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  MOVE_END,
  MOVE_START,
  RESTART_EVENT,
  type SwarmDir,
} from "./events";
import { ALIEN_COLOR, COLOR } from "./theme";

export class SwarmScene extends Phaser.Scene {
  private state!: SwarmState;
  private highScore = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private startDelay = 0;
  private deathDelay = 0;
  private waveDelay = 0;
  private hold: Record<SwarmDir, boolean> = { left: false, right: false };
  private fireHeld = false;
  private scoredDeath = false;

  constructor() {
    super("SwarmScene");
  }

  create(): void {
    this.highScore = loadHighScore("swarm");
    this.resetRun(false);
    this.cameras.main.setBackgroundColor(COLOR.void);
    this.graphics = this.add.graphics();

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    this.game.events.on(MOVE_START, this.onMoveStart, this);
    this.game.events.on(MOVE_END, this.onMoveEnd, this);
    this.game.events.on(FIRE_EVENT, this.onFireStart, this);
    this.game.events.on(FIRE_END, this.onFireEnd, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.game.events.on(HUD_REQUEST, this.publishHud, this);
    this.game.events.on(HIGH_SCORE_SET, this.onCloudHighScore, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", this.onKeyDown, true);
      window.removeEventListener("keyup", this.onKeyUp, true);
      this.game.events.off(MOVE_START, this.onMoveStart, this);
      this.game.events.off(MOVE_END, this.onMoveEnd, this);
      this.game.events.off(FIRE_EVENT, this.onFireStart, this);
      this.game.events.off(FIRE_END, this.onFireEnd, this);
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
        this.publishHud();
      }
      this.draw(time);
      return;
    }
    if (this.state.status === "wave") {
      this.waveDelay += delta;
      if (this.waveDelay >= WAVE_PAUSE_MS) {
        nextWave(this.state);
        this.waveDelay = 0;
        this.startDelay = 900;
        this.publishHud();
      }
      this.draw(time);
      return;
    }

    const dir = this.hold.left && !this.hold.right ? -1 : this.hold.right && !this.hold.left ? 1 : 0;
    const before = {
      score: this.state.score,
      lives: this.state.lives,
      status: this.state.status,
      wave: this.state.wave,
    };
    movePlayer(this.state, dir, delta);
    if (this.fireHeld) firePlayer(this.state);
    tick(this.state, delta);
    this.onDeathIfNeeded();
    if (
      before.score !== this.state.score
      || before.lives !== this.state.lives
      || before.status !== this.state.status
      || before.wave !== this.state.wave
    ) {
      this.publishHud();
    }
    this.draw(time);
  }

  private onDeathIfNeeded(): void {
    if (this.state.status !== "dead") return;
    this.onDeath();
  }

  private onDeath(): void {
    if (this.scoredDeath) return;
    this.scoredDeath = true;
    this.highScore = saveHighScore("swarm", this.state.score);
    void persistHighScore("swarm", this.state.score).then((merged) => {
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
    } else if (key === " " || key === "arrowup" || key === "w" || key === "x") {
      event.preventDefault();
      this.fireHeld = true;
      firePlayer(this.state);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") this.hold.left = false;
    if (key === "arrowright" || key === "d") this.hold.right = false;
    if (key === " " || key === "arrowup" || key === "w" || key === "x") this.fireHeld = false;
  };

  private onMoveStart(dir: SwarmDir): void {
    this.hold[dir] = true;
  }

  private onMoveEnd(dir: SwarmDir): void {
    this.hold[dir] = false;
  }

  private onFireStart(): void {
    this.fireHeld = true;
    firePlayer(this.state);
  }

  private onFireEnd(): void {
    this.fireHeld = false;
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
    this.fireHeld = false;
    this.scoredDeath = false;
    if (publish) this.publishHud();
  }

  private publishHud(): void {
    this.game.events.emit(HUD_EVENT, {
      score: this.state.score,
      highScore: this.highScore,
      lives: Math.max(0, this.state.lives),
      wave: this.state.wave + 1,
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

  private draw(time: number): void {
    const g = this.graphics;
    g.clear();
    const ox = PAD;
    const oy = PAD;
    const w = WORLD_W * SCALE;
    const h = WORLD_H * SCALE;

    g.fillStyle(0x101827, 1);
    g.fillRoundedRect(ox - 8, oy - 8, w + 16, h + 16, 16);
    g.lineStyle(2, COLOR.rim, 0.32);
    g.strokeRoundedRect(ox - 8, oy - 8, w + 16, h + 16, 16);
    g.fillStyle(COLOR.field, 1);
    g.fillRoundedRect(ox, oy, w, h, 8);

    g.lineStyle(1, 0xfbbf24, 0.18);
    g.lineBetween(ox + 8, oy + h - 18, ox + w - 8, oy + h - 18);

    for (const bunker of this.state.bunkers) {
      for (let r = 0; r < BUNKER_ROWS; r += 1) {
        for (let c = 0; c < BUNKER_COLS; c += 1) {
          if (!bunker.cells[r]![c]) continue;
          const p = this.world(bunker.x + c * BUNKER_CELL, bunker.y + r * BUNKER_CELL);
          g.fillStyle(COLOR.bunker, 1);
          g.fillRect(p.x, p.y, BUNKER_CELL * SCALE, BUNKER_CELL * SCALE);
        }
      }
    }

    for (const alien of this.state.aliens) {
      if (alien.alive) this.drawAlien(g, alien, time);
    }

    if (this.state.mystery?.live) {
      const p = this.world(this.state.mystery.x, this.state.mystery.y);
      g.fillStyle(COLOR.mystery, 1);
      g.fillRoundedRect(p.x, p.y, MYSTERY_W * SCALE, 10 * SCALE, 6);
    }

    const player = this.world(this.state.player.x, this.state.player.y);
    g.fillStyle(COLOR.playerGlow, 0.3);
    g.fillCircle(player.x + (this.state.player.w * SCALE) / 2, player.y + 4, 16);
    g.fillStyle(COLOR.player, 1);
    g.fillTriangle(
      player.x + (this.state.player.w * SCALE) / 2,
      player.y,
      player.x,
      player.y + this.state.player.h * SCALE,
      player.x + this.state.player.w * SCALE,
      player.y + this.state.player.h * SCALE,
    );

    if (this.state.playerShot) {
      const p = this.world(this.state.playerShot.x, this.state.playerShot.y);
      g.fillStyle(COLOR.shot, 1);
      g.fillRect(p.x, p.y, this.state.playerShot.w * SCALE, this.state.playerShot.h * SCALE);
    }
    for (const shot of this.state.alienShots) {
      const p = this.world(shot.x, shot.y);
      g.fillStyle(COLOR.alienShot, 1);
      g.fillRect(p.x, p.y, shot.w * SCALE, shot.h * SCALE);
    }

  }

  private drawAlien(g: Phaser.GameObjects.Graphics, alien: Alien, time: number): void {
    const p = this.world(alien.x, alien.y);
    const w = alien.w * SCALE;
    const h = alien.h * SCALE;
    const cx = p.x + w / 2;
    const cy = p.y + h / 2;
    const color = ALIEN_COLOR[alien.kind]!;
    const phase = Math.floor(time / 280) % 2;
    g.fillStyle(color, 1);
    if (alien.kind === 2) {
      g.fillTriangle(cx, p.y, p.x + 3, p.y + h, p.x + w - 3, p.y + h);
      g.fillRect(cx - 2, cy - 1, 4, h * 0.4);
    } else if (alien.kind === 1) {
      g.fillTriangle(cx, p.y + 1, p.x + w - 1, cy, cx, p.y + h - 1);
      g.fillTriangle(cx, p.y + 1, p.x + 1, cy, cx, p.y + h - 1);
    } else {
      g.fillRoundedRect(p.x + 2, p.y + 3, w - 4, h - 6, 3);
      g.fillRect(p.x + (phase ? 4 : w - 8), p.y + h - 4, 4, 4);
      g.fillRect(p.x + (phase ? w - 8 : 4), p.y + h - 4, 4, 4);
    }
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(cx - 4, cy - 1, 1.4);
    g.fillCircle(cx + 4, cy - 1, 1.4);
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
