import Phaser from "phaser";

type PipePair = {
    top: Phaser.Physics.Arcade.Image;
    bottom: Phaser.Physics.Arcade.Image;
    scored: boolean;
};

export default class FlappyScene extends Phaser.Scene {
    private GAME_WIDTH = 960;
    private GAME_HEIGHT = 1400;

    private bird!: Phaser.Physics.Arcade.Sprite;
    private pipeGroup!: Phaser.Physics.Arcade.Group;
    private pipePairs: PipePair[] = [];

    private scoreText!: Phaser.GameObjects.Text;
    private startText!: Phaser.GameObjects.Text;

    private score = 0;
    private gameOver = false;
    private started = false;

    private pipeTimer?: Phaser.Time.TimerEvent;

    private readonly birdX = 260;
    private readonly pipeSpeed = -360;

    constructor() {
        super("FlappyScene");
    }

    create() {
        this.score = 0;
        this.gameOver = false;
        this.started = false;
        this.pipePairs = [];

        this.add.image(0, 0, "bg").setOrigin(0);

        this.pipeGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false,
        });

        this.bird = this.physics.add.sprite(this.birdX, this.GAME_HEIGHT / 2, "bird");
        this.bird.setScale(1);
        this.bird.setDepth(10);
        this.bird.setCollideWorldBounds(true);

        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;
        birdBody.allowGravity = false;
        birdBody.setSize(58, 58);
        birdBody.setOffset(19, 19);

        this.scoreText = this.add.text(40, 40, "0", {
            fontSize: "64px",
            color: "#efefe9",
            fontFamily: "monospace",
            stroke: "#11100f",
            strokeThickness: 8,
        });

        this.scoreText.setDepth(20);

        this.startText = this.add.text(
            this.GAME_WIDTH / 2,
            this.GAME_HEIGHT / 2 - 170,
            "TAP TO START",
            {
                fontSize: "42px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 8,
                align: "center",
            }
        );

        this.startText.setOrigin(0.5);
        this.startText.setDepth(20);

        this.physics.add.overlap(
            this.bird,
            this.pipeGroup,
            () => this.endGame(),
            undefined,
            this
        );

        this.input.on("pointerdown", () => {
            this.handleInput();
        });

        this.input.keyboard?.on("keydown-SPACE", () => {
            this.handleInput();
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.pipeTimer) {
                this.pipeTimer.remove(false);
                this.pipeTimer = undefined;
            }
        });
    }

    update() {
        if (this.gameOver || !this.started) {
            return;
        }

        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;

        this.bird.setRotation(
            Phaser.Math.Clamp(birdBody.velocity.y / 700, -0.5, 0.9)
        );

        if (this.bird.y >= this.GAME_HEIGHT - 20 || this.bird.y <= 0) {
            this.endGame();
            return;
        }

        this.pipePairs.forEach((pair) => {
            if (!pair.scored && pair.bottom.x < this.bird.x) {
                pair.scored = true;
                this.score += 1;
                this.scoreText.setText(String(this.score));
            }
        });

        this.pipePairs = this.pipePairs.filter((pair) => {
            const offScreen = pair.bottom.x < -160;

            if (offScreen) {
                pair.top.destroy();
                pair.bottom.destroy();
            }

            return !offScreen;
        });
    }

    private handleInput() {
        if (this.gameOver) {
            return;
        }

        if (!this.started) {
            this.startGame();
        }

        this.flap();
    }

    private startGame() {
        this.started = true;

        if (this.startText) {
            this.startText.destroy();
        }

        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;
        birdBody.allowGravity = true;
        birdBody.setGravityY(1150);

        this.spawnPipePair();
        this.scheduleNextPipe();
    }

    private flap() {
        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;
        birdBody.setVelocityY(-470);
    }

    private scheduleNextPipe() {
        if (this.gameOver) {
            return;
        }

        this.pipeTimer = this.time.delayedCall(1850, () => {
            this.spawnPipePair();
            this.scheduleNextPipe();
        });
    }

    private spawnPipePair() {
        if (this.gameOver) {
            return;
        }

        const x = this.GAME_WIDTH + 80;

        const minGap = 200;
        const maxGap = 800;
        const gap = Phaser.Math.Between(minGap, maxGap);

        const visiblePipeMinimum = 260;

        const gapCenter = Phaser.Math.Between(
            visiblePipeMinimum + gap / 2,
            this.GAME_HEIGHT - visiblePipeMinimum - gap / 2
        );

        const topPipeY = gapCenter - gap / 2 - 300;
        const bottomPipeY = gapCenter + gap / 2 + 300;

        const topPipe = this.pipeGroup.create(
            x,
            topPipeY,
            "pipe"
        ) as Phaser.Physics.Arcade.Image;

        topPipe.setFlipY(true);
        topPipe.setDepth(5);
        topPipe.setVelocityX(this.pipeSpeed);
        topPipe.setImmovable(true);

        const topBody = topPipe.body as Phaser.Physics.Arcade.Body;
        topBody.allowGravity = false;
        topBody.setSize(92, 560);
        topBody.setOffset(14, 20);

        const bottomPipe = this.pipeGroup.create(
            x,
            bottomPipeY,
            "pipe"
        ) as Phaser.Physics.Arcade.Image;

        bottomPipe.setDepth(5);
        bottomPipe.setVelocityX(this.pipeSpeed);
        bottomPipe.setImmovable(true);

        const bottomBody = bottomPipe.body as Phaser.Physics.Arcade.Body;
        bottomBody.allowGravity = false;
        bottomBody.setSize(92, 560);
        bottomBody.setOffset(14, 20);

        this.pipePairs.push({
            top: topPipe,
            bottom: bottomPipe,
            scored: false,
        });
    }

    private getMedal() {
        if (this.score >= 5000) {
            return "gold";
        }

        if (this.score >= 500) {
            return "silver";
        }

        if (this.score >= 100) {
            return "bronze";
        }

        return "none";
    }

    private vibrate(pattern: number | number[]) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(pattern);
        }
    }

    private playGameOverSound() {
        try {
            const AudioContextClass =
                window.AudioContext ||
                (window as typeof window & {
                    webkitAudioContext?: typeof AudioContext;
                }).webkitAudioContext;

            if (!AudioContextClass) {
                return;
            }

            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "square";
            oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                70,
                audioContext.currentTime + 0.25
            );

            gain.gain.setValueAtTime(0.08, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + 0.3
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch {
            // Sound is optional.
        }
    }

    private endGame() {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;

        if (this.pipeTimer) {
            this.pipeTimer.remove(false);
            this.pipeTimer = undefined;
        }

        this.physics.pause();

        this.playGameOverSound();
        this.vibrate([60, 40, 90]);

        const medal = this.getMedal();

        window.dispatchEvent(
            new CustomEvent("flappy-score", {
                detail: {
                    score: this.score,
                    medal,
                },
            })
        );

        const panelW = 740;
        const panelH = 760;
        const panelX = this.GAME_WIDTH / 2;
        const panelY = this.GAME_HEIGHT / 2;

        const panel = this.add.rectangle(
            panelX,
            panelY,
            panelW,
            panelH,
            0x11100f,
            0.96
        );

        panel.setStrokeStyle(8, 0xefefe9);
        panel.setDepth(50);

        const title = this.add.text(panelX, panelY - 320, "GAME OVER", {
            fontSize: "62px",
            color: "#be001c",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 8,
        });

        title.setOrigin(0.5);
        title.setDepth(51);

        const scoreText = this.add.text(panelX, panelY - 225, `SCORE: ${this.score}`, {
            fontSize: "46px",
            color: "#efefe9",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 6,
        });

        scoreText.setOrigin(0.5);
        scoreText.setDepth(51);

        if (medal !== "none") {
            const medalImage = this.add.image(
                panelX,
                panelY - 150,
                `medal-${medal}`
            );

            medalImage.setScale(1.2);
            medalImage.setDepth(51);

            const medalLabel = this.add.text(
                panelX,
                panelY - 60,
                `${medal.toUpperCase()} MEDAL`,
                {
                    fontSize: "24px",
                    color: "#efefe9",
                    fontFamily: "monospace",
                    stroke: "#000000",
                    strokeThickness: 4,
                }
            );

            medalLabel.setOrigin(0.5);
            medalLabel.setDepth(51);
        } else {
            const medalText = this.add.text(panelX, panelY - 150, "NO MEDAL", {
                fontSize: "30px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            });

            medalText.setOrigin(0.5);
            medalText.setDepth(51);
        }

        const oldBest =
            typeof window !== "undefined"
                ? Number(localStorage.getItem("flappy_best")) || 0
                : 0;

        if (this.score > oldBest && typeof window !== "undefined") {
            localStorage.setItem("flappy_best", String(this.score));

            const bestText = this.add.text(panelX, panelY - 85, "NEW PERSONAL BEST", {
                fontSize: "26px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#be001c",
                strokeThickness: 5,
            });

            bestText.setOrigin(0.5);
            bestText.setDepth(51);
        }

        const rankText = this.add.text(panelX, panelY - 25, "SAVING SCORE...", {
            fontSize: "24px",
            color: "#b9b9b3",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 3,
        });

        rankText.setOrigin(0.5);
        rankText.setDepth(51);

        const leaderboardTitle = this.add.text(panelX, panelY + 45, "TOP PLAYERS", {
            fontSize: "24px",
            color: "#be001c",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 4,
        });

        leaderboardTitle.setOrigin(0.5);
        leaderboardTitle.setDepth(51);

        const rowTexts: Phaser.GameObjects.Text[] = [];

        const rankListener = (event: Event) => {
            const customEvent = event as CustomEvent<{
                saved?: boolean;
                message?: string;
                rank?: number | null;
                bestScore?: number;
                leaderboard?: Array<{
                    uid: string;
                    username: string;
                    bestScore: number;
                    isCurrentUser?: boolean;
                }>;
            }>;

            window.removeEventListener("flappy-rank-data", rankListener);

            const detail = customEvent.detail || {};

            if (detail.rank) {
                rankText.setText(
                    `RANK #${detail.rank}  BEST ${detail.bestScore ?? this.score}`
                );
            } else {
                rankText.setText(detail.message || "SCORE READY");
            }

            rankText.setColor("#efefe9");

            rowTexts.forEach((row) => row.destroy());
            rowTexts.length = 0;

            const leaderboard = detail.leaderboard || [];

            if (!leaderboard.length) {
                const emptyText = this.add.text(panelX, panelY + 105, "NO SCORES YET", {
                    fontSize: "22px",
                    color: "#b9b9b3",
                    fontFamily: "monospace",
                    stroke: "#000000",
                    strokeThickness: 3,
                });

                emptyText.setOrigin(0.5);
                emptyText.setDepth(51);
                rowTexts.push(emptyText);

                return;
            }

            leaderboard.slice(0, 5).forEach((entry, index) => {
                const username = String(entry.username || "Player")
                    .toUpperCase()
                    .padEnd(10)
                    .slice(0, 10);

                const row = this.add.text(
                    panelX,
                    panelY + 105 + index * 42,
                    `#${index + 1} ${username} ${entry.bestScore}`,
                    {
                        fontSize: "22px",
                        color: entry.isCurrentUser ? "#be001c" : "#efefe9",
                        fontFamily: "monospace",
                        stroke: "#000000",
                        strokeThickness: 3,
                    }
                );

                row.setOrigin(0.5);
                row.setDepth(51);
                rowTexts.push(row);
            });
        };

        window.addEventListener("flappy-rank-data", rankListener);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener("flappy-rank-data", rankListener);
        });

        const buttonY = panelY + 315;

        const button = this.add.rectangle(
            panelX,
            buttonY,
            300,
            82,
            0xbe001c,
            1
        );

        button.setStrokeStyle(6, 0xefefe9);
        button.setDepth(52);
        button.setInteractive({ useHandCursor: true });

        const buttonLabel = this.add.text(panelX, buttonY, "RETRY", {
            fontSize: "34px",
            color: "#efefe9",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 5,
        });

        buttonLabel.setOrigin(0.5);
        buttonLabel.setDepth(53);

        button.on("pointerover", () => {
            button.setFillStyle(0x11100f);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0xbe001c);
        });

        button.on("pointerdown", () => {
            window.dispatchEvent(new CustomEvent("flappy-restart"));
        });
    }
}