import * as Phaser from "phaser";
import { CELL_SIZE, COLS, HUD_HEIGHT, ROWS } from "./constants";
import { SnakeScene } from "./SnakeScene";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: COLS * CELL_SIZE,
    height: ROWS * CELL_SIZE + HUD_HEIGHT,
    backgroundColor: "#2b2b2b",
    scene: [SnakeScene],
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
    },
  });
}
