import Phaser from "phaser";

type Cell = number | null;
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Piece = {
    shape: number[][];
    color: number;
    row: number;
    col: number;
};

type PieceTemplate = {
    shape: number[][];
    color: number;
};

const SHAPES: number[][][] = [
    [[1, 1, 1, 1]],

    [
        [1, 1],
        [1, 1],
    ],

    [
        [0, 1, 0],
        [1, 1, 1],
    ],

    [
        [1, 0, 0],
        [1, 1, 1],
    ],

    [
        [0, 0, 1],
        [1, 1, 1],
    ],

    [
        [1, 1, 0],
        [0, 1, 1],
    ],

    [
        [0, 1, 1],
        [1, 1, 0],
    ],
];

const COLORS = [
    0xbe001c,
    0xefefe9,
    0x1f6feb,
    0x2ea043,
    0xff8c00,
    0x8b5cf6,
    0x00c2ff,
];

export default class TetrisScene extends Phaser.Scene {
    private readonly GAME_WIDTH = 960;
    private readonly GAME_HEIGHT = 1400;

    private readonly ROWS = 20;
    private readonly COLS = 10;
    private readonly CELL_SIZE = 48;

    private readonly FALL_SPEED = 650;

    private readonly NEXT_BOX_X = 835;
    private readonly NEXT_BOX_Y = 330;

    private board: Cell[][] = [];

    private activePiece: Piece | null = null;
    private nextPiece: PieceTemplate | null = null;

    private blockViews: Phaser.GameObjects.GameObject[] = [];
    private nextPreviewViews: Phaser.GameObjects.GameObject[] = [];

    private score = 0;
    private lines = 0;

    private scoreText!: Phaser.GameObjects.Text;
    private linesText!: Phaser.GameObjects.Text;

    private fallTimer?: Phaser.Time.TimerEvent;
    private gameOver = false;
    private isResolvingLines = false;

    private gridX = 0;
    private gridY = 210;

    private pointerStartX = 0;
    private pointerStartY = 0;
    private pointerStartedOnBoard = false;

    constructor() {
        super("TetrisScene");
    }

    create() {
        this.gridX = (this.GAME_WIDTH - this.COLS * this.CELL_SIZE) / 2;

        this.score = 0;
        this.lines = 0;
        this.gameOver = false;
        this.isResolvingLines = false;

        this.activePiece = null;
        this.nextPiece = null;

        this.blockViews = [];
        this.nextPreviewViews = [];

        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this.pointerStartedOnBoard = false;

        this.board = Array.from({ length: this.ROWS }, () =>
            Array.from({ length: this.COLS }, () => null),
        );

        this.drawBackground();
        this.createHUD();
        this.createBoardFrame();
        this.createNextPreviewBox();
        this.createControls();

        this.setupKeyboard();
        this.setupTouchControls();

        this.nextPiece = this.createRandomPieceTemplate();
        this.spawnPiece();

        this.render();
        this.renderNextPreview();
        this.startFallTimer();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopFallTimer();
            this.clearRenderedObjects();
        });
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
            .text(this.GAME_WIDTH / 2, 65, "TETRIS", {
                fontSize: "56px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5);

        this.add
            .text(this.GAME_WIDTH / 2, 120, "SWIPE BOARD OR USE A/B CONTROLS.", {
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
            .text(90, 165, "SCORE 0", {
                fontSize: "24px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0, 0.5);

        this.linesText = this.add
            .text(this.GAME_WIDTH - 90, 165, "LINES 0", {
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
                0.85,
            )
            .setStrokeStyle(6, 0xefefe9)
            .setDepth(1);
    }

    private createNextPreviewBox() {
        this.add
            .rectangle(this.NEXT_BOX_X, this.NEXT_BOX_Y, 170, 170, 0x2a2926, 0.92)
            .setStrokeStyle(5, 0xb9b9b3)
            .setDepth(30);

        this.add
            .text(this.NEXT_BOX_X, this.NEXT_BOX_Y - 105, "NEXT", {
                fontSize: "22px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(31);
    }

    private setupKeyboard() {
        const keyboard = this.input.keyboard;

        if (!keyboard) return;

        keyboard.on("keydown-LEFT", () => this.movePiece(0, -1));
        keyboard.on("keydown-RIGHT", () => this.movePiece(0, 1));
        keyboard.on("keydown-DOWN", () => this.softDrop());
        keyboard.on("keydown-UP", () => this.rotatePiece());
        keyboard.on("keydown-SPACE", () => this.hardDrop());
    }

    private setupTouchControls() {
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver || this.isResolvingLines) return;

            this.pointerStartedOnBoard = this.isPointerOnBoard(pointer.x, pointer.y);

            if (!this.pointerStartedOnBoard) {
                return;
            }

            this.pointerStartX = pointer.x;
            this.pointerStartY = pointer.y;
        });

        this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver || this.isResolvingLines) return;
            if (!this.pointerStartedOnBoard) return;

            this.pointerStartedOnBoard = false;

            const deltaX = pointer.x - this.pointerStartX;
            const deltaY = pointer.y - this.pointerStartY;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            const swipeDistance = 45;
            const tapDistance = 18;

            if (absX < tapDistance && absY < tapDistance) {
                this.rotatePiece();
                return;
            }

            if (absY > absX && deltaY > swipeDistance) {
                this.hardDrop();
                return;
            }

            if (absX > absY && deltaX > swipeDistance) {
                this.movePiece(0, 1);
                return;
            }

            if (absX > absY && deltaX < -swipeDistance) {
                this.movePiece(0, -1);
            }
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
        const dpadX = 270;
        const dpadY = 1245;
        const offset = 68;

        this.add
            .rectangle(dpadX, dpadY, 76, 76, 0x11100f)
            .setStrokeStyle(5, 0xb9b9b3)
            .setDepth(39);

        this.createDpadButton(dpadX - offset, dpadY, "LEFT", () => {
            this.movePiece(0, -1);
        });

        this.createDpadButton(dpadX + offset, dpadY, "RIGHT", () => {
            this.movePiece(0, 1);
        });

        this.createDpadButton(dpadX, dpadY + offset, "DOWN", () => {
            this.softDrop();
        });

        this.createActionButton(650, 1225, "A", "ROTATE", () => {
            this.rotatePiece();
        });

        this.createActionButton(790, 1290, "B", "DROP", () => {
            this.hardDrop();
        });
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
            .triangle(x, y, 0, -18, 22, 18, -22, 18, 0xefefe9)
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

                if (this.gameOver || this.isResolvingLines) return;

                this.pointerStartedOnBoard = false;

                this.tweens.add({
                    targets: [button, arrow],
                    scale: 0.88,
                    duration: 55,
                    yoyo: true,
                    ease: "Quad.easeOut",
                });

                action();
            },
        );
    }

    private createActionButton(
        x: number,
        y: number,
        label: string,
        caption: string,
        action: () => void,
    ) {
        const button = this.add
            .circle(x, y, 42, 0xbe001c)
            .setStrokeStyle(6, 0xefefe9)
            .setInteractive({ useHandCursor: true })
            .setDepth(40);

        const labelText = this.add
            .text(x, y - 2, label, {
                fontSize: "28px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(41);

        this.add
            .text(x, y + 62, caption, {
                fontSize: "16px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(41);

        button.on(
            "pointerdown",
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                event.stopPropagation();

                if (this.gameOver || this.isResolvingLines) return;

                this.pointerStartedOnBoard = false;

                this.tweens.add({
                    targets: [button, labelText],
                    scale: 0.88,
                    duration: 55,
                    yoyo: true,
                    ease: "Quad.easeOut",
                });

                action();
            },
        );
    }

    private startFallTimer() {
        this.stopFallTimer();

        this.fallTimer = this.time.addEvent({
            delay: this.FALL_SPEED,
            loop: true,
            callback: () => {
                this.tickDown();
            },
        });
    }

    private stopFallTimer() {
        if (this.fallTimer) {
            this.fallTimer.remove(false);
            this.fallTimer = undefined;
        }
    }

    private createRandomPieceTemplate(): PieceTemplate {
        const index = Phaser.Math.Between(0, SHAPES.length - 1);

        return {
            shape: SHAPES[index].map((row) => [...row]),
            color: COLORS[index],
        };
    }

    private spawnPiece() {
        const template = this.nextPiece || this.createRandomPieceTemplate();

        this.activePiece = {
            shape: template.shape.map((row) => [...row]),
            color: template.color,
            row: 0,
            col: Math.floor(this.COLS / 2) - 2,
        };

        this.nextPiece = this.createRandomPieceTemplate();
        this.renderNextPreview();

        if (!this.canPlace(this.activePiece)) {
            this.endGame();
        }
    }

    private tickDown() {
        if (this.gameOver || !this.activePiece || this.isResolvingLines) return;

        if (this.canPlace(this.activePiece, 1, 0)) {
            this.activePiece.row++;
            this.render();
            return;
        }

        this.lockPiece();
        this.resolveAfterLock();
    }

    private softDrop() {
        if (this.gameOver || !this.activePiece || this.isResolvingLines) return;

        if (this.canPlace(this.activePiece, 1, 0)) {
            this.activePiece.row++;
            this.score += 1;
            this.updateHUD();
            this.render();
            return;
        }

        this.tickDown();
    }

    private hardDrop() {
        if (this.gameOver || !this.activePiece || this.isResolvingLines) return;

        let dropDistance = 0;

        while (this.canPlace(this.activePiece, 1, 0)) {
            this.activePiece.row++;
            dropDistance++;
        }

        this.score += dropDistance * 2;
        this.updateHUD();

        this.lockPiece();
        this.showNotice("DROP", "#efefe9");
        this.resolveAfterLock();
    }

    private resolveAfterLock() {
        const rowsToClear = this.getRowsToClear();

        if (rowsToClear.length === 0) {
            this.spawnPiece();
            this.render();
            return;
        }

        this.isResolvingLines = true;

        this.animateLineClear(rowsToClear, () => {
            rowsToClear
                .sort((a, b) => b - a)
                .forEach((row) => {
                    this.board.splice(row, 1);
                    this.board.unshift(Array.from({ length: this.COLS }, () => null));
                });

            const linesCleared = rowsToClear.length;

            this.lines += linesCleared;

            const scoreByLines = [0, 100, 300, 500, 800];
            this.score += scoreByLines[linesCleared] || 1000;

            this.updateHUD();
            this.showNotice(`CLEAR x${linesCleared}`, "#efefe9");
            this.cameras.main.shake(140, 0.006);

            this.isResolvingLines = false;

            this.spawnPiece();
            this.render();
        });
    }

    private getRowsToClear() {
        const rowsToClear: number[] = [];

        for (let row = this.ROWS - 1; row >= 0; row--) {
            const isFull = this.board[row].every((cell) => cell !== null);

            if (isFull) {
                rowsToClear.push(row);
            }
        }

        return rowsToClear;
    }

    private movePiece(rowOffset: number, colOffset: number) {
        if (this.gameOver || !this.activePiece || this.isResolvingLines) return;

        if (this.canPlace(this.activePiece, rowOffset, colOffset)) {
            this.activePiece.row += rowOffset;
            this.activePiece.col += colOffset;
            this.render();
            return;
        }

        this.showNotice("BLOCKED", "#be001c");
        this.cameras.main.shake(45, 0.002);
    }

    private rotatePiece() {
        if (this.gameOver || !this.activePiece || this.isResolvingLines) return;

        const rotated = this.rotateMatrix(this.activePiece.shape);

        const rotatedPiece: Piece = {
            ...this.activePiece,
            shape: rotated,
        };

        if (this.canPlace(rotatedPiece)) {
            this.activePiece.shape = rotated;
            this.render();
            return;
        }

        const kickLeft: Piece = {
            ...rotatedPiece,
            col: rotatedPiece.col - 1,
        };

        if (this.canPlace(kickLeft)) {
            this.activePiece.shape = rotated;
            this.activePiece.col -= 1;
            this.render();
            return;
        }

        const kickRight: Piece = {
            ...rotatedPiece,
            col: rotatedPiece.col + 1,
        };

        if (this.canPlace(kickRight)) {
            this.activePiece.shape = rotated;
            this.activePiece.col += 1;
            this.render();
            return;
        }

        this.showNotice("NO ROTATE", "#be001c");
        this.cameras.main.shake(45, 0.002);
    }

    private rotateMatrix(matrix: number[][]) {
        const rows = matrix.length;
        const cols = matrix[0].length;

        const rotated: number[][] = [];

        for (let col = 0; col < cols; col++) {
            const newRow: number[] = [];

            for (let row = rows - 1; row >= 0; row--) {
                newRow.push(matrix[row][col]);
            }

            rotated.push(newRow);
        }

        return rotated;
    }

    private canPlace(piece: Piece, rowOffset = 0, colOffset = 0) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (!piece.shape[row][col]) continue;

                const boardRow = piece.row + row + rowOffset;
                const boardCol = piece.col + col + colOffset;

                if (boardCol < 0 || boardCol >= this.COLS) {
                    return false;
                }

                if (boardRow >= this.ROWS) {
                    return false;
                }

                if (boardRow >= 0 && this.board[boardRow][boardCol] !== null) {
                    return false;
                }
            }
        }

        return true;
    }

    private lockPiece() {
        if (!this.activePiece) return;

        this.activePiece.shape.forEach((shapeRow, row) => {
            shapeRow.forEach((value, col) => {
                if (!value || !this.activePiece) return;

                const boardRow = this.activePiece.row + row;
                const boardCol = this.activePiece.col + col;

                if (
                    boardRow >= 0 &&
                    boardRow < this.ROWS &&
                    boardCol >= 0 &&
                    boardCol < this.COLS
                ) {
                    this.board[boardRow][boardCol] = this.activePiece.color;
                }
            });
        });

        this.activePiece = null;
    }

    private render() {
        this.clearBlockViews();

        this.renderBoardCells();
        this.renderActivePiece();
    }

    private renderBoardCells() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = this.gridX + col * this.CELL_SIZE;
                const y = this.gridY + row * this.CELL_SIZE;

                const backgroundCell = this.add
                    .rectangle(
                        x,
                        y,
                        this.CELL_SIZE - 3,
                        this.CELL_SIZE - 3,
                        0x11100f,
                        0.45,
                    )
                    .setOrigin(0)
                    .setStrokeStyle(1, 0x2a2926)
                    .setDepth(2);

                this.blockViews.push(backgroundCell);

                const cellColor = this.board[row][col];

                if (cellColor !== null) {
                    const block = this.createBeveledBlock(
                        x + this.CELL_SIZE / 2,
                        y + this.CELL_SIZE / 2,
                        this.CELL_SIZE - 4,
                        cellColor,
                        10,
                    );

                    this.blockViews.push(block);
                }
            }
        }
    }

    private renderActivePiece() {
        if (!this.activePiece) return;

        this.renderGhostPiece();

        this.activePiece.shape.forEach((shapeRow, row) => {
            shapeRow.forEach((value, col) => {
                if (!value || !this.activePiece) return;

                const boardRow = this.activePiece.row + row;
                const boardCol = this.activePiece.col + col;

                if (boardRow < 0) return;

                const x = this.gridX + boardCol * this.CELL_SIZE;
                const y = this.gridY + boardRow * this.CELL_SIZE;

                const block = this.createBeveledBlock(
                    x + this.CELL_SIZE / 2,
                    y + this.CELL_SIZE / 2,
                    this.CELL_SIZE - 4,
                    this.activePiece.color,
                    25,
                );

                this.blockViews.push(block);
            });
        });
    }

    private renderGhostPiece() {
        if (!this.activePiece) return;

        const ghostPiece: Piece = {
            ...this.activePiece,
            shape: this.activePiece.shape.map((row) => [...row]),
        };

        while (this.canPlace(ghostPiece, 1, 0)) {
            ghostPiece.row++;
        }

        ghostPiece.shape.forEach((shapeRow, row) => {
            shapeRow.forEach((value, col) => {
                if (!value) return;

                const boardRow = ghostPiece.row + row;
                const boardCol = ghostPiece.col + col;

                if (boardRow < 0) return;

                const x = this.gridX + boardCol * this.CELL_SIZE;
                const y = this.gridY + boardRow * this.CELL_SIZE;

                const ghost = this.add
                    .rectangle(
                        x + this.CELL_SIZE / 2,
                        y + this.CELL_SIZE / 2,
                        this.CELL_SIZE - 8,
                        this.CELL_SIZE - 8,
                        0xefefe9,
                        0.18,
                    )
                    .setStrokeStyle(3, 0xbe001c)
                    .setDepth(12);

                this.blockViews.push(ghost);
            });
        });
    }

    private renderNextPreview() {
        this.clearNextPreviewViews();

        if (!this.nextPiece) return;

        const previewCellSize = 30;

        const shape = this.nextPiece.shape;
        const shapeWidth = shape[0].length * previewCellSize;
        const shapeHeight = shape.length * previewCellSize;

        shape.forEach((shapeRow, row) => {
            shapeRow.forEach((value, col) => {
                if (!value || !this.nextPiece) return;

                const x =
                    this.NEXT_BOX_X -
                    shapeWidth / 2 +
                    col * previewCellSize +
                    previewCellSize / 2;

                const y =
                    this.NEXT_BOX_Y -
                    shapeHeight / 2 +
                    row * previewCellSize +
                    previewCellSize / 2;

                const block = this.createBeveledBlock(
                    x,
                    y,
                    previewCellSize - 4,
                    this.nextPiece.color,
                    35,
                );

                this.nextPreviewViews.push(block);
            });
        });
    }

    private animateLineClear(rowsToClear: number[], onComplete: () => void) {
        const flashes: Phaser.GameObjects.Rectangle[] = [];

        rowsToClear.forEach((row) => {
            for (let col = 0; col < this.COLS; col++) {
                const x = this.gridX + col * this.CELL_SIZE;
                const y = this.gridY + row * this.CELL_SIZE;

                const flash = this.add
                    .rectangle(
                        x + this.CELL_SIZE / 2,
                        y + this.CELL_SIZE / 2,
                        this.CELL_SIZE - 4,
                        this.CELL_SIZE - 4,
                        0xefefe9,
                        0.9,
                    )
                    .setStrokeStyle(3, 0xbe001c)
                    .setScale(0.2)
                    .setDepth(80);

                flashes.push(flash);
            }
        });

        this.tweens.add({
            targets: flashes,
            scale: 1.15,
            alpha: 1,
            duration: 120,
            ease: "Back.easeOut",
            yoyo: true,
            hold: 90,
            onComplete: () => {
                this.tweens.add({
                    targets: flashes,
                    scaleX: 0,
                    alpha: 0,
                    duration: 180,
                    ease: "Cubic.easeIn",
                    onComplete: () => {
                        flashes.forEach((flash) => flash.destroy());
                        onComplete();
                    },
                });
            },
        });
    }

    private updateHUD() {
        this.scoreText.setText(`SCORE ${this.score}`);
        this.linesText.setText(`LINES ${this.lines}`);

        this.tweens.add({
            targets: [this.scoreText, this.linesText],
            scale: 1.08,
            duration: 80,
            yoyo: true,
            ease: "Back.easeOut",
        });
    }

    private createBeveledBlock(
        x: number,
        y: number,
        size: number,
        color: number,
        depth: number,
    ) {
        const container = this.add.container(x, y).setDepth(depth);

        const base = this.add.rectangle(0, 0, size, size, color);
        base.setStrokeStyle(3, 0x11100f);

        const highlightTop = this.add.rectangle(
            0,
            -size / 2 + 5,
            size - 10,
            6,
            0xffffff,
            0.35,
        );

        const highlightLeft = this.add.rectangle(
            -size / 2 + 5,
            0,
            6,
            size - 10,
            0xffffff,
            0.22,
        );

        const shadowBottom = this.add.rectangle(
            0,
            size / 2 - 5,
            size - 10,
            6,
            0x11100f,
            0.45,
        );

        const shadowRight = this.add.rectangle(
            size / 2 - 5,
            0,
            6,
            size - 10,
            0x11100f,
            0.45,
        );

        container.add([
            base,
            highlightTop,
            highlightLeft,
            shadowBottom,
            shadowRight,
        ]);

        return container;
    }

    private showNotice(message: string, color = "#efefe9") {
        const notice = this.add
            .text(this.GAME_WIDTH / 2, 195, message, {
                fontSize: "24px",
                color,
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(90)
            .setAlpha(0);

        this.tweens.add({
            targets: notice,
            alpha: 1,
            y: 178,
            duration: 120,
            yoyo: true,
            hold: 450,
            onComplete: () => {
                notice.destroy();
            },
        });
    }

    private clearBlockViews() {
        this.blockViews.forEach((block) => {
            block.destroy();
        });

        this.blockViews = [];
    }

    private clearNextPreviewViews() {
        this.nextPreviewViews.forEach((item) => {
            item.destroy();
        });

        this.nextPreviewViews = [];
    }

    private clearRenderedObjects() {
        this.clearBlockViews();
        this.clearNextPreviewViews();
    }

    private endGame() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.stopFallTimer();

        window.dispatchEvent(
            new CustomEvent("tetris-score", {
                detail: {
                    score: this.score,
                    lines: this.lines,
                },
            }),
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
            .text(cx, cy - 95, `SCORE ${this.score}`, {
                fontSize: "36px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(101);

        this.add
            .text(cx, cy - 35, `LINES ${this.lines}`, {
                fontSize: "28px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(101);

        const retryBtn = this.add
            .rectangle(cx, cy + 130, 300, 78, 0xbe001c)
            .setStrokeStyle(6, 0xefefe9)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        this.add
            .text(cx, cy + 130, "RETRY", {
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