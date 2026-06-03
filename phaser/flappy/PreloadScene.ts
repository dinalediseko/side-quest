import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        const loadingText = this.add.text(
            480,
            700,
            "LOADING CITY...",
            {
                fontSize: "42px",
                color: "#ffffff",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        loadingText.setOrigin(0.5);

        this.load.image("bg", "/assets/flappy/bg.png");
        this.load.image("bird", "/assets/flappy/bird.png");
        this.load.image("pipe", "/assets/flappy/pipe.png");

        this.load.image("medal-bronze", "/assets/flappy/medals/bronze.png");
        this.load.image("medal-silver", "/assets/flappy/medals/silver.png");
        this.load.image("medal-gold", "/assets/flappy/medals/gold.png");

        this.load.once(
            "complete",
            () => {
                loadingText.destroy();
            }
        );
    }

    create() {
        this.scene.start("FlappyScene");
    }
}