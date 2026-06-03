import Phaser from "phaser";

import BallzScene from "./BallzScene";

export const ballzConfig: Phaser.Types.Core.GameConfig = {
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

  scene: [BallzScene],
};