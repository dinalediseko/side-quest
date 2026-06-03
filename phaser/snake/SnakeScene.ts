import Phaser from "phaser";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Point = {
    row: number;
    col: number;
};

const OPPOSITE: Record<Direction, Direction> = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT",
};

const DIRS: Record<Direction, Point> = {
    UP: { row: -1, col: 0 },
    DOWN: { row: 1, col: 0 },
    LEFT: { row: 0, col: -1 },
    RIGHT: { row: 0, col: 1 },
};

export default class SnakeScene extends Phaser.Scene {
    private readonly GAME_WIDTH = 960;
    private readonly GAME_HEIGHT = 1400;

    private readonly ROWS = 20;
    private readonly COLS = 14;

    // Smaller cell size so the board ends before the controls.
    private readonly CELL_SIZE = 46;

    private readonly START_SPEED = 280;
    private readonly MIN_SPEED = 95;
    private readonly SPEED_STEP = 12;
    private readonly FOOD_PER_SPEED_UP = 3;

    private gridX = 0;
    private gridY = 220;

    private snake: Point[] = [];
    private food: Point = { row: 8, col: 8 };

    private direction: Direction = "RIGHT";
    private queuedDirection: Direction = "RIGHT";

    private score = 0;
    private foodEaten = 0;

    private scoreText!: Phaser.GameObjects.Text;
    private lengthText!: Phaser.GameObjects.Text;

    private moveTimer?: Phaser.Time.TimerEvent;
    private gameOver = false;

    private renderObjects: Phaser.GameObjects.GameObject[] = [];

    private pointerStartX = 0;
    private pointerStartY = 0;
    private pointerStartedOnBoard = false;

    constructor() {
        super("SnakeScene");
    }

    create() {
        this.gridX = (this.GAME_WIDTH - this.COLS * this.CELL_SIZE) / 2;

        this.score = 0;
        this.foodEaten = 0;
        this.gameOver = false;

        this.direction = "RIGHT";
        this.queuedDirection = "RIGHT";

        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this.pointerStartedOnBoard = false;

        this.snake = [
            { row: 10, col: 5 },
            { row: 10, col: 4 },
            { row: 10, col: 3 },
        ];

        this.renderObjects = [];

        this.drawBackground();
        this.createHUD();
        this.createBoardFrame();
        this.createControls();
        this.setupKeyboard();
        this.setupTouch();

        this.spawnFood();
        this.render();
        this.startMoveTimer();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopMoveTimer();
            this.clearRenderObjects();
        });
    }

    private drawBackground() {
        this.add.rectangle(
            this.GAME_WIDTH / 2,
            this.GAME_HEIGHT / 2,
            this.GAME_WIDTH,
            this.GAME_HEIGHT,
            0x11100f
        );

        this.add
            .text(this.GAME_WIDTH / 2, 65, "SNAKE", {
                fontSize: "56px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5);

        this.add
            .text(this.GAME_WIDTH / 2, 120, "SWIPE BOARD. EAT. GROW.", {
                fontSize: "22px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5);
    }

    private createHUD() {
        this.scoreText = this.add
            .text(90, 170, "SCORE 0", {
                fontSize: "24px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0, 0.5);

        this.lengthText = this.add
            .text(this.GAME_WIDTH - 90, 170, "LENGTH 3", {
                fontSize: "24px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(1, 0.5);
    }

    private createBoardFrame() {
        this.add
            .rectangle(
                this.GAME_WIDTH / 2,
                this.gridY + (this.ROWS * this.CELL_SIZE) / 2,
                this.COLS * this.CELL_SIZE + 18,
                this.ROWS * this.CELL_SIZE + 18,
                0x2a2926,
                0.85
            )
            .setStrokeStyle(6, 0xefefe9)
            .setDepth(1);
    }

    private setupKeyboard() {
        const keyboard = this.input.keyboard;

        if (!keyboard) return;

        keyboard.on("keydown-UP", () => this.queueDirection("UP"));
        keyboard.on("keydown-DOWN", () => this.queueDirection("DOWN"));
        keyboard.on("keydown-LEFT", () => this.queueDirection("LEFT"));
        keyboard.on("keydown-RIGHT", () => this.queueDirection("RIGHT"));
        keyboard.on("keydown-W", () => this.queueDirection("UP"));
        keyboard.on("keydown-S", () => this.queueDirection("DOWN"));
        keyboard.on("keydown-A", () => this.queueDirection("LEFT"));
        keyboard.on("keydown-D", () => this.queueDirection("RIGHT"));
    }

    private setupTouch() {
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;

            this.pointerStartedOnBoard = this.isPointerOnBoard(pointer.x, pointer.y);

            if (!this.pointerStartedOnBoard) {
                return;
            }

            this.pointerStartX = pointer.x;
            this.pointerStartY = pointer.y;
        });

        this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;
            if (!this.pointerStartedOnBoard) return;

            this.pointerStartedOnBoard = false;

            const dx = pointer.x - this.pointerStartX;
            const dy = pointer.y - this.pointerStartY;

            const absX = Math.abs(dx);
            const absY = Math.abs(dy);

            if (absX < 30 && absY < 30) return;

            if (absX > absY) {
                this.queueDirection(dx > 0 ? "RIGHT" : "LEFT");
                return;
            }

            this.queueDirection(dy > 0 ? "DOWN" : "UP");
        });
    }

    private isPointerOnBoard(x: number, y: number) {
        const boardLeft = this.gridX;
        const boardRight = this.gridX + this.COLS * this.CELL_SIZE;
        const boardTop = this.gridY;
        const boardBottom = this.gridY + this.ROWS * this.CELL_SIZE;

        return (
            x >= boardLeft &&
            x <= boardRight &&
            y >= boardTop &&
            y <= boardBottom
        );
    }

    private createControls() {
        const centerX = this.GAME_WIDTH / 2;
        const centerY = 1280;
        const offset = 68;

        // Center hub
        this.add
            .rectangle(centerX, centerY, 76, 76, 0x11100f)
            .setStrokeStyle(5, 0xb9b9b3)
            .setDepth(39);

        this.createDpadButton(centerX, centerY - offset, "UP", () =>
            this.queueDirection("UP"),
        );

        this.createDpadButton(centerX, centerY + offset, "DOWN", () =>
            this.queueDirection("DOWN"),
        );

        this.createDpadButton(centerX - offset, centerY, "LEFT", () =>
            this.queueDirection("LEFT"),
        );

        this.createDpadButton(centerX + offset, centerY, "RIGHT", () =>
            this.queueDirection("RIGHT"),
        );
    }

    private createDpadButton(
        x: number,
        y: number,
        direction: Direction,
        action: () => void,
    ) {
        const button = this.add
            .rectangle(x, y, 76, 76, 0x2a2926)
            .setStrokeStyle(5, 0xb9b9b3)
            .setInteractive({ useHandCursor: true })
            .setDepth(40);

        const arrow = this.add
            .triangle(
                x,
                y,
                0,
                -18,
                22,
                18,
                -22,
                18,
                0xefefe9,
            )
            .setStrokeStyle(3, 0x11100f)
            .setDepth(41);

        if (direction === "RIGHT") {
            arrow.setRotation(Math.PI / 2);
        }

        if (direction === "DOWN") {
            arrow.setRotation(Math.PI);
        }

        if (direction === "LEFT") {
            arrow.setRotation(-Math.PI / 2);
        }

        button.on("pointerover", () => {
            button.setFillStyle(0x11100f);
        });

        button.on("pointerout", () => {
            button.setFillStyle(0x2a2926);
        });

        button.on(
            "pointerdown",
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                event.stopPropagation();

                if (this.gameOver) return;

                this.pointerStartedOnBoard = false;
                action();
            },
        );
    }

    private queueDirection(direction: Direction) {
        if (OPPOSITE[direction] === this.direction) return;

        this.queuedDirection = direction;
    }

    private startMoveTimer() {
        this.stopMoveTimer();

        this.moveTimer = this.time.addEvent({
            delay: this.getMoveSpeed(),
            loop: true,
            callback: () => this.step(),
        });
    }

    private stopMoveTimer() {
        if (this.moveTimer) {
            this.moveTimer.remove(false);
            this.moveTimer = undefined;
        }
    }

    private getMoveSpeed() {
        const difficultyStep = Math.floor(this.foodEaten / this.FOOD_PER_SPEED_UP);

        return Math.max(
            this.MIN_SPEED,
            this.START_SPEED - difficultyStep * this.SPEED_STEP
        );
    }

    private step() {
        if (this.gameOver) return;

        if (OPPOSITE[this.queuedDirection] !== this.direction) {
            this.direction = this.queuedDirection;
        }

        const head = this.snake[0];
        const dir = DIRS[this.direction];

        const nextHead = {
            row: head.row + dir.row,
            col: head.col + dir.col,
        };

        if (this.isWallCollision(nextHead) || this.isSelfCollision(nextHead)) {
            this.endGame();
            return;
        }

        this.snake.unshift(nextHead);

        const ateFood =
            nextHead.row === this.food.row && nextHead.col === this.food.col;

        if (ateFood) {
            this.foodEaten++;
            this.score += 100 + this.snake.length * 2;

            this.spawnFood();
            this.updateHUD();
            this.showNotice("+100", "#efefe9");

            this.startMoveTimer();
        } else {
            this.snake.pop();
        }

        this.render();
    }

    private isWallCollision(point: Point) {
        return (
            point.row < 0 ||
            point.row >= this.ROWS ||
            point.col < 0 ||
            point.col >= this.COLS
        );
    }

    private isSelfCollision(point: Point) {
        return this.snake.some(
            (segment) => segment.row === point.row && segment.col === point.col
        );
    }

    private spawnFood() {
        const emptyCells: Point[] = [];

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const occupied = this.snake.some(
                    (segment) => segment.row === row && segment.col === col
                );

                if (!occupied) {
                    emptyCells.push({ row, col });
                }
            }
        }

        this.food = Phaser.Utils.Array.GetRandom(emptyCells);
    }

    private updateHUD() {
        this.scoreText.setText(`SCORE ${this.score}`);
        this.lengthText.setText(`LENGTH ${this.snake.length}`);
    }

    private render() {
        this.clearRenderObjects();

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = this.gridX + col * this.CELL_SIZE;
                const y = this.gridY + row * this.CELL_SIZE;

                const cell = this.add
                    .rectangle(
                        x,
                        y,
                        this.CELL_SIZE - 4,
                        this.CELL_SIZE - 4,
                        0x11100f,
                        0.45
                    )
                    .setOrigin(0)
                    .setStrokeStyle(1, 0x2a2926)
                    .setDepth(2);

                this.renderObjects.push(cell);
            }
        }

        const foodX =
            this.gridX + this.food.col * this.CELL_SIZE + this.CELL_SIZE / 2;
        const foodY =
            this.gridY + this.food.row * this.CELL_SIZE + this.CELL_SIZE / 2;

        const foodView = this.add
            .circle(foodX, foodY, 15, 0xbe001c)
            .setStrokeStyle(4, 0xefefe9)
            .setDepth(20);

        this.renderObjects.push(foodView);

        this.snake.forEach((segment, index) => {
            const x =
                this.gridX + segment.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            const y =
                this.gridY + segment.row * this.CELL_SIZE + this.CELL_SIZE / 2;

            const color = index === 0 ? 0xefefe9 : 0x2ea043;

            const snakeBlock = this.createBeveledBlock(
                x,
                y,
                this.CELL_SIZE - 6,
                color,
                index === 0 ? 30 : 25
            );

            this.renderObjects.push(snakeBlock);
        });
    }

    private createBeveledBlock(
        x: number,
        y: number,
        size: number,
        color: number,
        depth: number
    ) {
        const container = this.add.container(x, y).setDepth(depth);

        const base = this.add.rectangle(0, 0, size, size, color);
        base.setStrokeStyle(3, 0x11100f);

        const highlight = this.add.rectangle(
            0,
            -size / 2 + 5,
            size - 10,
            6,
            0xffffff,
            0.3
        );

        const shadow = this.add.rectangle(
            0,
            size / 2 - 5,
            size - 10,
            6,
            0x11100f,
            0.45
        );

        container.add([base, highlight, shadow]);

        return container;
    }

    private clearRenderObjects() {
        this.renderObjects.forEach((item) => item.destroy());
        this.renderObjects = [];
    }

    private showNotice(message: string, color = "#efefe9") {
        const notice = this.add
            .text(this.GAME_WIDTH / 2, 200, message, {
                fontSize: "24px",
                color,
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(90);

        this.tweens.add({
            targets: notice,
            alpha: 1,
            y: 180,
            duration: 120,
            yoyo: true,
            hold: 300,
            onComplete: () => notice.destroy(),
        });
    }

    private endGame() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.stopMoveTimer();

        window.dispatchEvent(
            new CustomEvent("snake-score", {
                detail: {
                    score: this.score,
                    length: this.snake.length,
                    food: this.foodEaten,
                },
            })
        );

        const cx = this.GAME_WIDTH / 2;
        const cy = this.GAME_HEIGHT / 2;

        this.add
            .rectangle(cx, cy, 720, 560, 0x11100f, 0.96)
            .setStrokeStyle(8, 0xefefe9)
            .setDepth(100);

        this.add
            .text(cx, cy - 190, "GAME OVER", {
                fontSize: "52px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(101);

        this.add
            .text(cx, cy - 90, `SCORE ${this.score}`, {
                fontSize: "38px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(101);

        this.add
            .text(cx, cy - 30, `LENGTH ${this.snake.length}`, {
                fontSize: "28px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(101);

        const retryBtn = this.add
            .rectangle(cx, cy + 135, 300, 78, 0xbe001c)
            .setStrokeStyle(6, 0xefefe9)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        this.add
            .text(cx, cy + 135, "RETRY", {
                fontSize: "32px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(103);

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