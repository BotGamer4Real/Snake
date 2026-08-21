import * as Phaser from "phaser";
import {
  BEZEL,
  CELL_SIZE,
  COLS,
  HUD_HEIGHT,
  LCD_BG,
  LCD_FG,
  LCD_MID,
  LCD_SHADOW,
  ROWS,
  tickMs,
} from "./constants";
import {
  createState,
  queueDirection,
  step,
  type Dir,
  type GameState,
} from "./engine";
import { DIR_EVENT, RESTART_EVENT } from "./events";
import { loadHighScore, saveHighScore } from "./progress";

export class SnakeScene extends Phaser.Scene {
  private state!: GameState;
  private highScore = 0;
  private elapsed = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;

  constructor() {
    super("SnakeScene");
  }

  create(): void {
    this.highScore = loadHighScore();
    this.state = createState();
    this.elapsed = 0;

    this.cameras.main.setBackgroundColor(BEZEL);
    this.graphics = this.add.graphics();
    this.scoreText = this.add.text(8, 8, "", {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "16px",
      color: "#c7f0d8",
    });
    this.overlayText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "18px",
        color: "#0f380f",
        align: "center",
        backgroundColor: "#9bbc0fcc",
        padding: { x: 12, y: 10 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.input.keyboard?.on("keydown", this.onKey, this);
    this.game.events.on(DIR_EVENT, this.onDir, this);
    this.game.events.on(RESTART_EVENT, this.restartRun, this);
    this.input.on("pointerdown", this.onPointer, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(DIR_EVENT, this.onDir, this);
      this.game.events.off(RESTART_EVENT, this.restartRun, this);
    });

    this.draw();
  }

  update(_time: number, delta: number): void {
    if (this.state.status !== "playing") return;
    this.elapsed += delta;
    const interval = tickMs(this.state.score);
    while (this.elapsed >= interval) {
      this.elapsed -= interval;
      this.state = step(this.state);
      if (this.state.status === "dead") {
        this.highScore = saveHighScore(this.state.score);
      }
    }
    this.draw();
  }

  private onKey(event: KeyboardEvent): void {
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

  private onDir(dir: Dir): void {
    if (this.state.status === "dead") return;
    queueDirection(this.state, dir);
  }

  private onPointer(): void {
    if (this.state.status === "dead") this.restartRun();
  }

  private restartRun(): void {
    this.state = createState();
    this.elapsed = 0;
    this.overlayText.setVisible(false);
    this.draw();
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();

    const boardX = 0;
    const boardY = HUD_HEIGHT;
    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;

    g.fillStyle(LCD_BG, 1);
    g.fillRect(boardX, boardY, width, height);

    g.fillStyle(LCD_SHADOW, 1);
    g.fillRect(
      boardX + this.state.food.x * CELL_SIZE + 4,
      boardY + this.state.food.y * CELL_SIZE + 4,
      CELL_SIZE - 8,
      CELL_SIZE - 8,
    );
    g.fillStyle(LCD_MID, 1);
    g.fillRect(
      boardX + this.state.food.x * CELL_SIZE + 5,
      boardY + this.state.food.y * CELL_SIZE + 5,
      CELL_SIZE - 10,
      CELL_SIZE - 10,
    );

    this.state.snake.forEach((segment, index) => {
      g.fillStyle(index === 0 ? LCD_FG : LCD_MID, 1);
      g.fillRect(
        boardX + segment.x * CELL_SIZE + 1,
        boardY + segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
      );
    });

    const best = Math.max(this.highScore, this.state.score);
    this.scoreText.setText(`SCORE ${this.state.score}   BEST ${best}`);

    if (this.state.status === "dead") {
      const beat = this.state.score >= this.highScore && this.state.score > 0;
      this.overlayText.setText(
        beat
          ? `GAME OVER\n${this.state.score}  NEW BEST\nTAP / SPACE TO RESTART`
          : `GAME OVER\n${this.state.score}  BEST ${this.highScore}\nTAP / SPACE TO RESTART`,
      );
      this.overlayText.setVisible(true);
    }
  }
}

function keyToDir(key: string): Dir | null {
  if (key === "arrowup" || key === "w") return "up";
  if (key === "arrowdown" || key === "s") return "down";
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return null;
}
