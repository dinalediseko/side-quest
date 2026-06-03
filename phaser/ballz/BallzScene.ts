import Phaser from "phaser";

type Brick = {
    id: string;
    row: number;
    col: number;
    hp: number;
};

type Ball = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    stuckToPaddle: boolean;
    view?: Phaser.GameObjects.Arc;
};

export default class BallzScene extends Phaser.Scene {
    private readonly GAME_WIDTH = 960;
    private readonly GAME_HEIGHT = 1400;

    private readonly COLS = 8;
    private readonly ROWS = 7;

    private readonly BRICK_WIDTH = 94;
    private readonly BRICK_HEIGHT = 58;
    private readonly BRICK_GAP = 10;

    private readonly BALL_RADIUS = 11;
    private readonly START_BALL_SPEED = 620;
    private readonly MAX_BALL_SPEED = 960;

    private readonly PADDLE_WIDTH = 190;
    private readonly PADDLE_HEIGHT = 34;
    private readonly PADDLE_Y = 1180;

    private gridX = 0;
    private readonly gridY = 260;

    private paddleX = this.GAME_WIDTH / 2;
    private paddle!: Phaser.GameObjects.Rectangle;

    private ball: Ball = {
        x: this.GAME_WIDTH / 2,
        y: this.PADDLE_Y - 42,
        vx: 0,
        vy: 0,
        active: true,
        stuckToPaddle: true,
    };

    private bricks: Brick[] = [];
    private brickViews: Phaser.GameObjects.GameObject[] = [];

    private score = 0;
    private bricksBroken = 0;
    private runPower = 1;

    private scoreText!: Phaser.GameObjects.Text;
    private bricksText!: Phaser.GameObjects.Text;
    private speedText!: Phaser.GameObjects.Text;

    private gameOver = false;

    constructor() {
        super("BallzScene");
    }

    create() {
        this.gridX =
            (this.GAME_WIDTH -
                this.COLS * this.BRICK_WIDTH -
                (this.COLS - 1) * this.BRICK_GAP) /
            2;

        this.score = 0;
        this.bricksBroken = 0;
        this.runPower = 1;
        this.gameOver = false;

        this.paddleX = this.GAME_WIDTH / 2;

        this.ball = {
            x: this.paddleX,
            y: this.PADDLE_Y - 42,
            vx: 0,
            vy: 0,
            active: true,
            stuckToPaddle: true,
        };

        this.bricks = [];
        this.brickViews = [];

        this.drawBackground();
        this.createHUD();
        this.createPaddle();
        this.createBall();
        this.setupInput();

        this.generateBrickWall();
        this.renderBricks();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearBrickViews();
        });
    }

    update(_time: number, delta: number) {
        if (this.gameOver) return;

        const dt = delta / 1000;

        if (this.ball.stuckToPaddle) {
            this.ball.x = this.paddleX;
            this.ball.y = this.PADDLE_Y - 42;
            this.ball.view?.setPosition(this.ball.x, this.ball.y);
            return;
        }

        this.updateBall(dt);
    }

    private drawBackground() {
        this.add.rectangle(
            this.GAME_WIDTH / 2,
            this.GAME_HEIGHT / 2,
            this.GAME_WIDTH,
            this.GAME_HEIGHT,
            0x11100f,
        );

        this.add
            .text(this.GAME_WIDTH / 2, 62, "BALLZ", {
                fontSize: "56px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5);

        this.add
            .text(this.GAME_WIDTH / 2, 118, "MOVE PADDLE. BREAK BRICKS. SURVIVE.", {
                fontSize: "21px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5);

        this.add
            .rectangle(this.GAME_WIDTH / 2, 1238, 760, 6, 0xbe001c, 0.75)
            .setDepth(2);

        this.add
            .text(this.GAME_WIDTH / 2, 1268, "MISS LINE", {
                fontSize: "18px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5);
    }

    private createHUD() {
        this.scoreText = this.add
            .text(70, 175, "SCORE 0", {
                fontSize: "24px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0, 0.5);

        this.bricksText = this.add
            .text(this.GAME_WIDTH / 2, 175, "BRICKS 0", {
                fontSize: "24px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5);

        this.speedText = this.add
            .text(this.GAME_WIDTH - 70, 175, "POWER 1", {
                fontSize: "24px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(1, 0.5);
    }

    private createPaddle() {
        this.paddle = this.add
            .rectangle(
                this.paddleX,
                this.PADDLE_Y,
                this.PADDLE_WIDTH,
                this.PADDLE_HEIGHT,
                0xefefe9,
            )
            .setStrokeStyle(5, 0xbe001c)
            .setDepth(40);

        this.add
            .rectangle(
                this.paddleX,
                this.PADDLE_Y - 8,
                this.PADDLE_WIDTH - 22,
                6,
                0xffffff,
                0.35,
            )
            .setDepth(41);
    }

    private createBall() {
        const view = this.add
            .circle(this.ball.x, this.ball.y, this.BALL_RADIUS, 0xefefe9)
            .setStrokeStyle(3, 0x11100f)
            .setDepth(50);

        this.ball.view = view;
    }

    private setupInput() {
        const keyboard = this.input.keyboard;

        if (keyboard) {
            keyboard.on("keydown-LEFT", () => this.movePaddleBy(-55));
            keyboard.on("keydown-RIGHT", () => this.movePaddleBy(55));
            keyboard.on("keydown-A", () => this.movePaddleBy(-55));
            keyboard.on("keydown-D", () => this.movePaddleBy(55));
            keyboard.on("keydown-SPACE", () => this.launchBall());
            keyboard.on("keydown-UP", () => this.launchBall());
        }

        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;

            this.movePaddleTo(pointer.x);

            if (this.ball.stuckToPaddle) {
                this.launchBall();
            }
        });

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;

            if (pointer.isDown) {
                this.movePaddleTo(pointer.x);
            }
        });
    }

    private movePaddleBy(amount: number) {
        this.movePaddleTo(this.paddleX + amount);
    }

    private movePaddleTo(x: number) {
        const minX = this.gridX + this.PADDLE_WIDTH / 2;
        const maxX =
            this.gridX +
            this.COLS * this.BRICK_WIDTH +
            (this.COLS - 1) * this.BRICK_GAP -
            this.PADDLE_WIDTH / 2;

        this.paddleX = Phaser.Math.Clamp(x, minX, maxX);
        this.paddle.setX(this.paddleX);
    }

    private launchBall() {
        if (!this.ball.stuckToPaddle) return;

        const angle = Phaser.Math.DegToRad(-68);
        const speed = this.getBallSpeed();

        this.ball.vx = Math.cos(angle) * speed;
        this.ball.vy = Math.sin(angle) * speed;
        this.ball.stuckToPaddle = false;

        this.showNotice("GO", "#efefe9");
    }

    private updateBall(dt: number) {
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        const leftWall = this.gridX + this.BALL_RADIUS;
        const rightWall =
            this.gridX +
            this.COLS * this.BRICK_WIDTH +
            (this.COLS - 1) * this.BRICK_GAP -
            this.BALL_RADIUS;

        if (this.ball.x <= leftWall) {
            this.ball.x = leftWall;
            this.ball.vx *= -1;
        }

        if (this.ball.x >= rightWall) {
            this.ball.x = rightWall;
            this.ball.vx *= -1;
        }

        if (this.ball.y <= this.gridY - 20) {
            this.ball.y = this.gridY - 20;
            this.ball.vy *= -1;
        }

        this.checkPaddleCollision();
        this.checkBrickCollisions();

        if (this.ball.y > this.PADDLE_Y + 75) {
            this.endGame();
            return;
        }

        this.ball.view?.setPosition(this.ball.x, this.ball.y);
    }

    private checkPaddleCollision() {
        if (this.ball.vy <= 0) return;

        const paddleLeft = this.paddleX - this.PADDLE_WIDTH / 2;
        const paddleRight = this.paddleX + this.PADDLE_WIDTH / 2;
        const paddleTop = this.PADDLE_Y - this.PADDLE_HEIGHT / 2;

        const hitPaddle =
            this.ball.x >= paddleLeft &&
            this.ball.x <= paddleRight &&
            this.ball.y + this.BALL_RADIUS >= paddleTop &&
            this.ball.y - this.BALL_RADIUS <= this.PADDLE_Y + this.PADDLE_HEIGHT / 2;

        if (!hitPaddle) return;

        const hitPosition = (this.ball.x - this.paddleX) / (this.PADDLE_WIDTH / 2);
        const clampedHit = Phaser.Math.Clamp(hitPosition, -1, 1);

        const maxBounceAngle = Phaser.Math.DegToRad(68);
        const bounceAngle = -Math.PI / 2 + clampedHit * maxBounceAngle;

        const speed = this.getBallSpeed();

        this.ball.vx = Math.cos(bounceAngle) * speed;
        this.ball.vy = Math.sin(bounceAngle) * speed;

        this.ball.y = paddleTop - this.BALL_RADIUS - 2;
        this.cameras.main.shake(35, 0.0015);
    }

    private checkBrickCollisions() {
        for (const brick of [...this.bricks]) {
            const rect = this.getBrickRect(brick);

            const closestX = Phaser.Math.Clamp(this.ball.x, rect.left, rect.right);
            const closestY = Phaser.Math.Clamp(this.ball.y, rect.top, rect.bottom);

            const dx = this.ball.x - closestX;
            const dy = this.ball.y - closestY;

            const hit = dx * dx + dy * dy <= this.BALL_RADIUS * this.BALL_RADIUS;

            if (!hit) continue;

            brick.hp--;

            this.score += 10;
            this.bricksBroken++;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.ball.vx *= -1;
            } else {
                this.ball.vy *= -1;
            }

            if (brick.hp <= 0) {
                this.score += 35;
                this.bricks = this.bricks.filter((item) => item.id !== brick.id);
                this.showPop(rect.centerX, rect.centerY);
            }

            this.updateHUD();
            this.renderBricks();

            if (this.bricks.length === 0) {
                this.refillBricks();
            }

            return;
        }
    }

    private refillBricks() {
        this.runPower++;
        this.score += 250;

        this.resetBallToPaddle();
        this.generateBrickWall();
        this.renderBricks();
        this.updateHUD();

        this.showNotice("WALL RESET +250", "#be001c");
    }

    private resetBallToPaddle() {
        this.ball.x = this.paddleX;
        this.ball.y = this.PADDLE_Y - 42;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.stuckToPaddle = true;
        this.ball.view?.setPosition(this.ball.x, this.ball.y);
    }

    private generateBrickWall() {
        this.bricks = [];

        const brickChance = Phaser.Math.Clamp(58 + this.runPower * 3, 58, 86);

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const shouldPlace =
                    row < 2 || Phaser.Math.Between(0, 100) < brickChance;

                if (!shouldPlace) continue;

                const hp =
                    1 +
                    Math.floor(this.runPower / 2) +
                    Phaser.Math.Between(0, Math.min(3, this.runPower));

                this.bricks.push({
                    id: `${Date.now()}-${row}-${col}-${Math.random()}`,
                    row,
                    col,
                    hp,
                });
            }
        }
    }

    private getBallSpeed() {
        return Math.min(
            this.MAX_BALL_SPEED,
            this.START_BALL_SPEED + this.runPower * 28 + this.bricksBroken * 0.75,
        );
    }

    private getBrickRect(brick: Brick) {
        const x = this.gridX + brick.col * (this.BRICK_WIDTH + this.BRICK_GAP);

        const y = this.gridY + brick.row * (this.BRICK_HEIGHT + this.BRICK_GAP);

        return new Phaser.Geom.Rectangle(
            x,
            y,
            this.BRICK_WIDTH,
            this.BRICK_HEIGHT,
        );
    }

    private renderBricks() {
        this.clearBrickViews();

        this.bricks.forEach((brick) => {
            const rect = this.getBrickRect(brick);

            const color =
                brick.hp >= 6
                    ? 0x8b0000
                    : brick.hp >= 4
                        ? 0xbe001c
                        : brick.hp >= 2
                            ? 0x2a2926
                            : 0xefefe9;

            const textColor = brick.hp === 1 ? "#11100f" : "#efefe9";

            const block = this.add
                .rectangle(
                    rect.centerX,
                    rect.centerY,
                    this.BRICK_WIDTH,
                    this.BRICK_HEIGHT,
                    color,
                )
                .setStrokeStyle(4, 0x11100f)
                .setDepth(10);

            const shine = this.add
                .rectangle(
                    rect.centerX,
                    rect.centerY - this.BRICK_HEIGHT / 2 + 8,
                    this.BRICK_WIDTH - 16,
                    6,
                    0xffffff,
                    0.28,
                )
                .setDepth(11);

            const text = this.add
                .text(rect.centerX, rect.centerY, String(brick.hp), {
                    fontSize: "26px",
                    color: textColor,
                    fontFamily: "monospace",
                    stroke: "#000000",
                    strokeThickness: brick.hp === 1 ? 0 : 4,
                })
                .setOrigin(0.5)
                .setDepth(12);

            this.brickViews.push(block, shine, text);
        });
    }

    private updateHUD() {
        this.scoreText.setText(`SCORE ${this.score}`);
        this.bricksText.setText(`BRICKS ${this.bricksBroken}`);
        this.speedText.setText(`POWER ${this.runPower}`);
    }

    private showPop(x: number, y: number) {
        const pop = this.add.circle(x, y, 10, 0xefefe9, 0.9).setDepth(80);

        this.tweens.add({
            targets: pop,
            scale: 3.2,
            alpha: 0,
            duration: 220,
            ease: "Cubic.easeOut",
            onComplete: () => pop.destroy(),
        });
    }

    private showNotice(message: string, color = "#efefe9") {
        const notice = this.add
            .text(this.GAME_WIDTH / 2, 215, message, {
                fontSize: "24px",
                color,
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(120);

        this.tweens.add({
            targets: notice,
            alpha: 1,
            y: 190,
            duration: 120,
            yoyo: true,
            hold: 420,
            onComplete: () => notice.destroy(),
        });
    }

    private clearBrickViews() {
        this.brickViews.forEach((view) => view.destroy());
        this.brickViews = [];
    }

    private endGame() {
        if (this.gameOver) return;

        this.gameOver = true;

        window.dispatchEvent(
            new CustomEvent("ballz-score", {
                detail: {
                    score: this.score,
                    bricks: this.bricksBroken,
                    power: this.runPower,
                },
            }),
        );

        const cx = this.GAME_WIDTH / 2;
        const cy = this.GAME_HEIGHT / 2;

        this.add
            .rectangle(cx, cy, 720, 560, 0x11100f, 0.96)
            .setStrokeStyle(8, 0xefefe9)
            .setDepth(200);

        this.add
            .text(cx, cy - 190, "GAME OVER", {
                fontSize: "52px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(201);

        this.add
            .text(cx, cy - 90, `SCORE ${this.score}`, {
                fontSize: "38px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(201);

        this.add
            .text(cx, cy - 30, `BRICKS ${this.bricksBroken}`, {
                fontSize: "28px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(201);

        const retryBtn = this.add
            .rectangle(cx, cy + 135, 300, 78, 0xbe001c)
            .setStrokeStyle(6, 0xefefe9)
            .setInteractive({ useHandCursor: true })
            .setDepth(202);

        this.add
            .text(cx, cy + 135, "RETRY", {
                fontSize: "32px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(203);

        retryBtn.on("pointerover", () => {
            retryBtn.setFillStyle(0x11100f);
        });

        retryBtn.on("pointerout", () => {
            retryBtn.setFillStyle(0xbe001c);
        });

        retryBtn.on("pointerdown", () => {
            this.scene.restart();
        });
    }
}