import Phaser from "phaser";

import Twenty48Scene from "./Twenty48Scene";

export const twenty48Config: Phaser.Types.Core.GameConfig = {
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

  scene: [Twenty48Scene],
};