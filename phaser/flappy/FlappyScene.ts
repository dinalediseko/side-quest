import Phaser from "phaser";

type PipePair = {
    top: Phaser.Physics.Arcade.Image;
    bottom: Phaser.Physics.Arcade.Image;
    scored: boolean;
};

type LeaderboardEntry = {
    uid: string;
    username: string;
    bestScore: number;
    isCurrentUser?: boolean;
};

export default class FlappyScene extends Phaser.Scene {
    private readonly GAME_WIDTH = 960;
    private readonly GAME_HEIGHT = 1400;

    private bird!: Phaser.Physics.Arcade.Sprite;
    private pipeGroup!: Phaser.Physics.Arcade.Group;
    private pipePairs: PipePair[] = [];

    private scoreText!: Phaser.GameObjects.Text;
    private bestText!: Phaser.GameObjects.Text;
    private startText!: Phaser.GameObjects.Text;
    private helperText!: Phaser.GameObjects.Text;

    private score = 0;
    private gameOver = false;
    private started = false;

    private pipeTimer?: Phaser.Time.TimerEvent;

    private readonly birdX = 260;
    private readonly pipeSpeed = -370;
    private readonly gravityY = 1160;
    private readonly flapPower = -485;

    constructor() {
        super("FlappyScene");
    }

    create() {
        this.score = 0;
        this.gameOver = false;
        this.started = false;
        this.pipePairs = [];

        this.physics.resume();

        this.drawBackground();
        this.createPipes();
        this.createBird();
        this.createHUD();
        this.createStartPrompt();
        this.setupCollisions();
        this.setupInput();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.cleanup();
        });
    }

    update() {
        if (this.gameOver) return;

        if (!this.started) {
            this.idleBirdAnimation();
            return;
        }

        this.updateBirdRotation();
        this.checkWorldBounds();
        this.checkScoring();
        this.cleanupPipes();
    }

    private drawBackground() {
        this.add.image(0, 0, "bg").setOrigin(0).setDepth(0);

        this.add
            .rectangle(
                this.GAME_WIDTH / 2,
                0,
                this.GAME_WIDTH,
                180,
                0x11100f,
                0.22,
            )
            .setOrigin(0.5, 0)
            .setDepth(1);
    }

    private createPipes() {
        this.pipeGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false,
        });
    }

    private createBird() {
        this.bird = this.physics.add.sprite(
            this.birdX,
            this.GAME_HEIGHT / 2,
            "bird",
        );

        this.bird.setScale(1);
        this.bird.setDepth(10);
        this.bird.setCollideWorldBounds(false);

        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;

        birdBody.allowGravity = false;
        birdBody.setSize(58, 58);
        birdBody.setOffset(19, 19);
    }

    private createHUD() {
        this.scoreText = this.add
            .text(42, 38, "0", {
                fontSize: "72px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 10,
            })
            .setDepth(30);

        const oldBest =
            typeof window !== "undefined"
                ? Number(localStorage.getItem("flappy_best")) || 0
                : 0;

        this.bestText = this.add
            .text(this.GAME_WIDTH - 42, 58, `BEST ${oldBest}`, {
                fontSize: "24px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 6,
            })
            .setOrigin(1, 0.5)
            .setDepth(30);
    }

    private createStartPrompt() {
        this.startText = this.add
            .text(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2 - 180, "TAP TO START", {
                fontSize: "46px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 9,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(30);

        this.helperText = this.add
            .text(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2 - 118, "KEEP THE BIRD UP", {
                fontSize: "22px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 5,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(30);

        this.tweens.add({
            targets: [this.startText, this.helperText],
            alpha: 0.35,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    private setupCollisions() {
        this.physics.add.overlap(
            this.bird,
            this.pipeGroup,
            () => this.endGame(),
            undefined,
            this,
        );
    }

    private setupInput() {
        this.input.on("pointerdown", () => {
            this.handleInput();
        });

        this.input.keyboard?.on("keydown-SPACE", () => {
            this.handleInput();
        });

        this.input.keyboard?.on("keydown-UP", () => {
            this.handleInput();
        });
    }

    private idleBirdAnimation() {
        this.bird.y = this.GAME_HEIGHT / 2 + Math.sin(this.time.now / 260) * 12;
        this.bird.setRotation(Math.sin(this.time.now / 360) * 0.08);
    }

    private updateBirdRotation() {
        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;

        this.bird.setRotation(
            Phaser.Math.Clamp(birdBody.velocity.y / 700, -0.5, 0.9),
        );
    }

    private checkWorldBounds() {
        if (this.bird.y >= this.GAME_HEIGHT - 35 || this.bird.y <= 0) {
            this.endGame();
        }
    }

    private checkScoring() {
        this.pipePairs.forEach((pair) => {
            if (!pair.scored && pair.bottom.x < this.bird.x) {
                pair.scored = true;
                this.score += 1;
                this.scoreText.setText(String(this.score));

                this.showScorePop();
                this.playScoreEffect();
            }
        });
    }

    private cleanupPipes() {
        this.pipePairs = this.pipePairs.filter((pair) => {
            const offScreen = pair.bottom.x < -170;

            if (offScreen) {
                pair.top.destroy();
                pair.bottom.destroy();
            }

            return !offScreen;
        });
    }

    private handleInput() {
        if (this.gameOver) return;

        if (!this.started) {
            this.startGame();
        }

        this.flap();
    }

    private startGame() {
        this.started = true;

        this.tweens.killTweensOf([this.startText, this.helperText]);

        this.startText.destroy();
        this.helperText.destroy();

        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;

        birdBody.allowGravity = true;
        birdBody.setGravityY(this.gravityY);

        this.spawnPipePair();

        this.pipeTimer = this.time.delayedCall(1450, () => {
            this.scheduleNextPipe();
        });

        this.showNotice("GO", "#efefe9");
    }

    private flap() {
        const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;

        birdBody.setVelocityY(this.flapPower);

        this.tweens.killTweensOf(this.bird);

        this.bird.setScale(0.92, 1.08);

        this.tweens.add({
            targets: this.bird,
            scaleX: 1,
            scaleY: 1,
            duration: 115,
            ease: "Back.easeOut",
        });
    }

    private scheduleNextPipe() {
        if (this.gameOver) return;

        this.spawnPipePair();

        const delay = Phaser.Math.Between(1580, 1820);

        this.pipeTimer = this.time.delayedCall(delay, () => {
            this.scheduleNextPipe();
        });
    }

    private spawnPipePair() {
        if (this.gameOver) return;

        const x = this.GAME_WIDTH + 90;

        const gap = Phaser.Math.Clamp(395 - this.score * 2.5, 275, 395);
        const safeTop = 260;
        const safeBottom = this.GAME_HEIGHT - 310;

        const gapCenter = Phaser.Math.Between(
            safeTop + gap / 2,
            safeBottom - gap / 2,
        );

        const topPipeY = gapCenter - gap / 2 - 300;
        const bottomPipeY = gapCenter + gap / 2 + 300;

        const topPipe = this.pipeGroup.create(
            x,
            topPipeY,
            "pipe",
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
            "pipe",
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

    private showScorePop() {
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.22,
            duration: 80,
            yoyo: true,
            ease: "Back.easeOut",
        });

        const pop = this.add
            .text(this.scoreText.x + 80, this.scoreText.y + 24, "+1", {
                fontSize: "26px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 5,
            })
            .setDepth(31)
            .setAlpha(0);

        this.tweens.add({
            targets: pop,
            alpha: 1,
            y: pop.y - 30,
            duration: 140,
            yoyo: true,
            hold: 120,
            onComplete: () => pop.destroy(),
        });
    }

    private showNotice(message: string, color = "#efefe9") {
        const notice = this.add
            .text(this.GAME_WIDTH / 2, 205, message, {
                fontSize: "28px",
                color,
                fontFamily: "monospace",
                stroke: "#11100f",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(35)
            .setAlpha(0);

        this.tweens.add({
            targets: notice,
            alpha: 1,
            y: 175,
            duration: 120,
            yoyo: true,
            hold: 280,
            onComplete: () => notice.destroy(),
        });
    }

    private playScoreEffect() {
        this.cameras.main.shake(30, 0.0012);
    }

    private getMedal() {
        if (this.score >= 50) return "gold";
        if (this.score >= 25) return "silver";
        if (this.score >= 10) return "bronze";

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

            if (!AudioContextClass) return;

            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "square";
            oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                70,
                audioContext.currentTime + 0.25,
            );

            gain.gain.setValueAtTime(0.08, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + 0.3,
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
        if (this.gameOver) return;

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
            }),
        );

        this.cameras.main.shake(180, 0.006);

        const panelW = 740;
        const panelH = 760;
        const panelX = this.GAME_WIDTH / 2;
        const panelY = this.GAME_HEIGHT / 2;

        const panel = this.add
            .rectangle(panelX, panelY, panelW, panelH, 0x11100f, 0.96)
            .setStrokeStyle(8, 0xefefe9)
            .setDepth(50)
            .setScale(0.92);

        this.tweens.add({
            targets: panel,
            scale: 1,
            duration: 180,
            ease: "Back.easeOut",
        });

        this.add
            .text(panelX, panelY - 320, "GAME OVER", {
                fontSize: "62px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(51);

        this.add
            .text(panelX, panelY - 230, `SCORE ${this.score}`, {
                fontSize: "46px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(51);

        this.renderMedal(panelX, panelY, medal);
        this.renderLocalBest(panelX, panelY);
        this.renderLeaderboard(panelX, panelY);
        this.renderRetryButton(panelX, panelY + 315);
    }

    private renderMedal(panelX: number, panelY: number, medal: string) {
        if (medal !== "none") {
            const medalImage = this.add.image(panelX, panelY - 150, `medal-${medal}`);

            medalImage.setScale(1.15);
            medalImage.setDepth(51);

            this.add
                .text(panelX, panelY - 68, `${medal.toUpperCase()} MEDAL`, {
                    fontSize: "24px",
                    color: "#efefe9",
                    fontFamily: "monospace",
                    stroke: "#000000",
                    strokeThickness: 4,
                })
                .setOrigin(0.5)
                .setDepth(51);

            return;
        }

        this.add
            .text(panelX, panelY - 150, "NO MEDAL", {
                fontSize: "30px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(51);
    }

    private renderLocalBest(panelX: number, panelY: number) {
        const oldBest =
            typeof window !== "undefined"
                ? Number(localStorage.getItem("flappy_best")) || 0
                : 0;

        if (this.score > oldBest && typeof window !== "undefined") {
            localStorage.setItem("flappy_best", String(this.score));

            this.add
                .text(panelX, panelY - 92, "NEW PERSONAL BEST", {
                    fontSize: "24px",
                    color: "#efefe9",
                    fontFamily: "monospace",
                    stroke: "#be001c",
                    strokeThickness: 5,
                })
                .setOrigin(0.5)
                .setDepth(51);

            this.bestText.setText(`BEST ${this.score}`);
        }
    }

    private renderLeaderboard(panelX: number, panelY: number) {
        const rankText = this.add
            .text(panelX, panelY - 25, "SAVING SCORE...", {
                fontSize: "24px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(51);

        this.add
            .text(panelX, panelY + 45, "TOP PLAYERS", {
                fontSize: "24px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(51);

        const rowTexts: Phaser.GameObjects.Text[] = [];

        const rankListener = (event: Event) => {
            const customEvent = event as CustomEvent<{
                saved?: boolean;
                message?: string;
                rank?: number | null;
                bestScore?: number;
                leaderboard?: LeaderboardEntry[];
            }>;

            window.removeEventListener("flappy-rank-data", rankListener);

            const detail = customEvent.detail || {};

            if (detail.rank) {
                rankText.setText(
                    `RANK #${detail.rank}  BEST ${detail.bestScore ?? this.score}`,
                );
            } else {
                rankText.setText(detail.message || "SCORE READY");
            }

            rankText.setColor("#efefe9");

            rowTexts.forEach((row) => row.destroy());
            rowTexts.length = 0;

            const leaderboard = detail.leaderboard || [];

            if (!leaderboard.length) {
                const emptyText = this.add
                    .text(panelX, panelY + 105, "NO SCORES YET", {
                        fontSize: "22px",
                        color: "#b9b9b3",
                        fontFamily: "monospace",
                        stroke: "#000000",
                        strokeThickness: 3,
                    })
                    .setOrigin(0.5)
                    .setDepth(51);

                rowTexts.push(emptyText);
                return;
            }

            leaderboard.slice(0, 5).forEach((entry, index) => {
                const username = String(entry.username || "Player")
                    .toUpperCase()
                    .padEnd(10)
                    .slice(0, 10);

                const row = this.add
                    .text(
                        panelX,
                        panelY + 105 + index * 42,
                        `#${index + 1} ${username} ${entry.bestScore}`,
                        {
                            fontSize: "22px",
                            color: entry.isCurrentUser ? "#be001c" : "#efefe9",
                            fontFamily: "monospace",
                            stroke: "#000000",
                            strokeThickness: 3,
                        },
                    )
                    .setOrigin(0.5)
                    .setDepth(51);

                rowTexts.push(row);
            });
        };

        window.addEventListener("flappy-rank-data", rankListener);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener("flappy-rank-data", rankListener);
        });
    }

    private renderRetryButton(panelX: number, buttonY: number) {
        const button = this.add
            .rectangle(panelX, buttonY, 300, 82, 0xbe001c, 1)
            .setStrokeStyle(6, 0xefefe9)
            .setDepth(52)
            .setInteractive({ useHandCursor: true });

        const buttonLabel = this.add
            .text(panelX, buttonY, "RETRY", {
                fontSize: "34px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(53);

        button.on("pointerover", () => {
            button.setFillStyle(0x11100f);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0xbe001c);
        });

        button.on("pointerdown", () => {
            this.scene.restart();
        });

        button.on("pointerdown", () => {
            this.tweens.add({
                targets: [button, buttonLabel],
                scale: 0.92,
                duration: 60,
                yoyo: true,
                ease: "Quad.easeOut",
            });
        });
    }

    private cleanup() {
        if (this.pipeTimer) {
            this.pipeTimer.remove(false);
            this.pipeTimer = undefined;
        }

        this.pipePairs.forEach((pair) => {
            pair.top.destroy();
            pair.bottom.destroy();
        });

        this.pipePairs = [];
    }
}