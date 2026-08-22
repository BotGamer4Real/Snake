import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import { SwarmScene } from "./SwarmScene";
import { COLOR } from "./theme";

export function createSwarmGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: `#${COLOR.void.toString(16).padStart(6, "0")}`,
    scene: [SwarmScene],
    audio: { noAudio: true },
    render: { antialias: true, roundPixels: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: false,
    },
    input: { keyboard: true },
  });
}
