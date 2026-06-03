import Phaser from "phaser";

import TetrisScene from "./TetrisScene";

export const tetrisConfig: Phaser.Types.Core.GameConfig = {
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

  scene: [TetrisScene],
};