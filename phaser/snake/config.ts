import Phaser from "phaser";

import SnakeScene from "./SnakeScene";

export const snakeConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 960,
  height: 1400,

  parent: "game-container",

  backgroundColor: "#11100f",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 1400,
  },

  scene: [SnakeScene],
};