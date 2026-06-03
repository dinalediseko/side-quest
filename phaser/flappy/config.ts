import Phaser from "phaser";

import PreloadScene from "./PreloadScene";
import FlappyScene from "./FlappyScene";

export const flappyConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 960,
    height: 1400,

    parent: "game-container",

    backgroundColor: "#000000",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 1400
    },

    physics: {
        default: "arcade",

        arcade: {
            gravity: {
                y: 0
            },

            debug: false
        }
    },

    scene: [
        PreloadScene,
        FlappyScene
    ]
};