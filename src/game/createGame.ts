import * as Phaser from "phaser";
import { COLS, ROWS } from "./constants";
import { CELL, COLOR, PAD } from "./theme";
import { SnakeScene } from "./SnakeScene";

export const GAME_WIDTH = COLS * CELL + PAD * 2;
export const GAME_HEIGHT = ROWS * CELL + PAD * 2;

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: `#${COLOR.void.toString(16).padStart(6, "0")}`,
    scene: [SnakeScene],
    audio: { noAudio: true },
    render: {
      antialias: true,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
    },
  });
}
