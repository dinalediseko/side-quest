import Phaser from "phaser";

type Shape = number[][];

type Piece = {
    id: string;
    shape: Shape;
};

type RenderedPiece = {
    piece: Piece;
    container: Phaser.GameObjects.Container;
    frame: Phaser.GameObjects.Rectangle;
    blockRects: Phaser.GameObjects.Container[];
    previewX: number;
    previewY: number;
};

const ALL_PIECES: Piece[] = [
    { id: "single", shape: [[1]] },
    { id: "two-line", shape: [[1, 1]] },
    { id: "three-line", shape: [[1, 1, 1]] },
    { id: "four-line", shape: [[1, 1, 1, 1]] },
    { id: "vertical-two", shape: [[1], [1]] },
    { id: "vertical-three", shape: [[1], [1], [1]] },
    { id: "vertical-four", shape: [[1], [1], [1], [1]] },
    {
        id: "square",
        shape: [
            [1, 1],
            [1, 1],
        ],
    },
    {
        id: "l-shape",
        shape: [
            [1, 0],
            [1, 0],
            [1, 1],
        ],
    },
    {
        id: "corner",
        shape: [
            [1, 1],
            [1, 0],
        ],
    },
    {
        id: "plus",
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0],
        ],
    },
];

export default class BlockBlastScene extends Phaser.Scene {
    private readonly GAME_WIDTH = 960;
    private readonly GAME_HEIGHT = 1400;

    private readonly GRID_SIZE = 8;
    private readonly CELL_SIZE = 76;
    private readonly CELL_GAP = 6;
    private readonly PREVIEW_CELL_SIZE = 46;

    private readonly PREVIEW_START_X = 190;
    private readonly PREVIEW_SLOT_WIDTH = 290;
    private readonly PREVIEW_Y = 995;

    private readonly PIECE_HIT_HALF = 170;
    private readonly PIECE_FRAME_SIZE = 210;

    // Keeps the dragged shape above the finger on touchscreen.
    private readonly DRAG_Y_OFFSET = -175;

    private grid: number[][] = [];
    private cells: Phaser.GameObjects.Rectangle[][] = [];
    private boardBlocks: (Phaser.GameObjects.Container | null)[][] = [];

    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;

    private pieces: Piece[] = [];
    private renderedPieces: RenderedPiece[] = [];
    private placementGhosts: Phaser.GameObjects.Rectangle[] = [];

    private selectedPieceIndex: number | null = null;
    private gameOver = false;

    private gridX = 0;
    private readonly gridY = 210;

    constructor() {
        super("BlockBlastScene");
    }

    create() {
        this.score = 0;
        this.gameOver = false;
        this.selectedPieceIndex = null;
        this.pieces = [];
        this.renderedPieces = [];
        this.placementGhosts = [];

        this.gridX =
            (this.GAME_WIDTH -
                this.GRID_SIZE * this.CELL_SIZE -
                (this.GRID_SIZE - 1) * this.CELL_GAP) /
            2;

        this.drawBackground();
        this.createGrid();
        this.createScoreText();
        this.generatePieces();
        this.setupDragEvents();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearPlacementPreview();
            this.clearRenderedPieces();
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
            .text(this.GAME_WIDTH / 2, 80, "BLOCK BLAST", {
                fontSize: "48px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5);

        this.add
            .text(this.GAME_WIDTH / 2, 132, "DRAG ABOVE YOUR FINGER. MATCH THE GHOST.", {
                fontSize: "20px",
                color: "#b9b9b3",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5);
    }

    private createScoreText() {
        this.scoreText = this.add
            .text(this.GAME_WIDTH / 2, 170, "SCORE 0", {
                fontSize: "30px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5);
    }

    private createGrid() {
        this.grid = [];
        this.cells = [];
        this.boardBlocks = [];

        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            this.cells[row] = [];
            this.boardBlocks[row] = [];

            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = 0;
                this.boardBlocks[row][col] = null;

                const x = this.gridX + col * (this.CELL_SIZE + this.CELL_GAP);
                const y = this.gridY + row * (this.CELL_SIZE + this.CELL_GAP);

                const cell = this.add
                    .rectangle(x, y, this.CELL_SIZE, this.CELL_SIZE, 0x2a2926)
                    .setOrigin(0)
                    .setStrokeStyle(3, 0x11100f);

                this.cells[row][col] = cell;
            }
        }
    }

    private setupDragEvents() {
        this.input.dragDistanceThreshold = 0;
        this.input.dragTimeThreshold = 0;
        this.input.topOnly = false;

        this.input.on(
            "dragstart",
            (
                pointer: Phaser.Input.Pointer,
                gameObject: Phaser.GameObjects.GameObject,
            ) => {
                if (this.gameOver) return;

                const index = this.findRenderedPieceIndex(gameObject);

                if (index === -1) return;

                this.selectPiece(index);
                this.startDraggingPiece(index);

                const rendered = this.renderedPieces[index];

                if (!rendered) return;

                rendered.container.setPosition(
                    pointer.x,
                    pointer.y + this.DRAG_Y_OFFSET,
                );

                this.updatePlacementPreview(rendered);
            },
        );

        this.input.on(
            "drag",
            (
                pointer: Phaser.Input.Pointer,
                gameObject: Phaser.GameObjects.GameObject,
            ) => {
                if (this.gameOver) return;

                const index = this.findRenderedPieceIndex(gameObject);

                if (index === -1) return;

                const container = gameObject as Phaser.GameObjects.Container;

                container.setPosition(pointer.x, pointer.y + this.DRAG_Y_OFFSET);

                const rendered = this.renderedPieces[index];

                if (!rendered) return;

                this.updatePlacementPreview(rendered);
            },
        );

        this.input.on(
            "dragend",
            (
                _pointer: Phaser.Input.Pointer,
                gameObject: Phaser.GameObjects.GameObject,
            ) => {
                if (this.gameOver) return;

                const index = this.findRenderedPieceIndex(gameObject);

                if (index === -1) return;

                this.clearPlacementPreview();
                this.dropPiece(index);
            },
        );
    }

    private randomPiece(): Piece {
        return Phaser.Utils.Array.GetRandom(ALL_PIECES);
    }

    private generatePieces() {
        this.clearRenderedPieces();

        this.pieces = [this.randomPiece(), this.randomPiece(), this.randomPiece()];

        this.pieces.forEach((piece, index) => {
            this.renderPiece(piece, index);
        });
    }

    private renderPiece(piece: Piece, index: number) {
        const startX = this.PREVIEW_START_X + index * this.PREVIEW_SLOT_WIDTH;
        const startY = this.PREVIEW_Y;

        const container = this.add.container(startX, startY);
        container.setSize(this.PIECE_FRAME_SIZE, this.PIECE_FRAME_SIZE);
        container.setDepth(10);

        const hitSize = this.PIECE_HIT_HALF * 2;

        container.setInteractive(
            new Phaser.Geom.Rectangle(
                -this.PIECE_HIT_HALF,
                -this.PIECE_HIT_HALF,
                hitSize,
                hitSize,
            ),
            Phaser.Geom.Rectangle.Contains,
        );

        this.input.setDraggable(container);

        const frame = this.add.rectangle(
            0,
            0,
            this.PIECE_FRAME_SIZE,
            this.PIECE_FRAME_SIZE,
            0xefefe9,
        );

        frame.setStrokeStyle(5, 0x11100f);
        container.add(frame);

        const blockRects: Phaser.GameObjects.Container[] = [];
        const shapeWidth = piece.shape[0].length * this.PREVIEW_CELL_SIZE;
        const shapeHeight = piece.shape.length * this.PREVIEW_CELL_SIZE;

        piece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (!value) return;

                const block = this.createBeveledBlock(
                    -shapeWidth / 2 +
                    c * this.PREVIEW_CELL_SIZE +
                    this.PREVIEW_CELL_SIZE / 2,
                    -shapeHeight / 2 +
                    r * this.PREVIEW_CELL_SIZE +
                    this.PREVIEW_CELL_SIZE / 2,
                    this.PREVIEW_CELL_SIZE - 4,
                    0xbe001c,
                    11,
                );

                container.add(block);
                blockRects.push(block);
            });
        });

        this.renderedPieces[index] = {
            piece,
            container,
            frame,
            blockRects,
            previewX: startX,
            previewY: startY,
        };
    }

    private clearRenderedPieces() {
        this.renderedPieces.forEach((rendered) => {
            rendered.container.destroy(true);
        });

        this.renderedPieces = [];
    }

    private findRenderedPieceIndex(gameObject: Phaser.GameObjects.GameObject) {
        return this.renderedPieces.findIndex(
            (rendered) => rendered.container === gameObject,
        );
    }

    private selectPiece(index: number) {
        this.selectedPieceIndex = index;

        this.renderedPieces.forEach((rendered, i) => {
            rendered.frame.setFillStyle(i === index ? 0xbe001c : 0xefefe9);
        });
    }

    private startDraggingPiece(index: number) {
        const rendered = this.renderedPieces[index];

        if (!rendered) return;

        rendered.container.setDepth(100);
        rendered.frame.setAlpha(0);

        this.tweens.killTweensOf(rendered.container);

        this.tweens.add({
            targets: rendered.container,
            scale: this.CELL_SIZE / this.PREVIEW_CELL_SIZE,
            duration: 120,
            ease: "Back.easeOut",
            onComplete: () => {
                const currentRendered = this.renderedPieces[index];

                if (!currentRendered?.container.input) return;

                const scaledHalf =
                    this.PIECE_HIT_HALF * (this.CELL_SIZE / this.PREVIEW_CELL_SIZE);

                const scaledSize = scaledHalf * 2;

                currentRendered.container.input.hitArea = new Phaser.Geom.Rectangle(
                    -scaledHalf,
                    -scaledHalf,
                    scaledSize,
                    scaledSize,
                );
            },
        });
    }

    private dropPiece(index: number) {
        const rendered = this.renderedPieces[index];

        if (!rendered) return;

        if (rendered.container.input) {
            const hitSize = this.PIECE_HIT_HALF * 2;

            rendered.container.input.hitArea = new Phaser.Geom.Rectangle(
                -this.PIECE_HIT_HALF,
                -this.PIECE_HIT_HALF,
                hitSize,
                hitSize,
            );
        }

        const placement = this.getPlacementFromRenderedPiece(rendered);
        const { row, col } = placement;
        const shape = rendered.piece.shape;

        if (!this.canPlace(shape, row, col)) {
            this.shakeCamera();
            this.resetPiecePosition(rendered);
            return;
        }

        this.placePiece(shape, row, col);
        this.removePiece(index);

        this.selectedPieceIndex = null;

        const cleared = this.clearLinesAnimated();
        const blockCount = this.countBlocks(shape);

        let bonus = 0;

        if (cleared > 0 && this.isBoardEmpty()) {
            bonus = 500;
            this.showBoardClearBonus();
        }

        this.score += blockCount * 10 + cleared * 120 + bonus;
        this.scoreText.setText(`SCORE ${this.score}`);

        if (this.pieces.length === 0) {
            this.generatePieces();
        }

        if (!this.hasAnyMove()) {
            this.time.delayedCall(450, () => {
                this.endGame();
            });
        }
    }

    private resetPiecePosition(rendered: RenderedPiece) {
        this.clearPlacementPreview();

        rendered.container.setDepth(10);

        this.tweens.killTweensOf(rendered.container);

        this.tweens.add({
            targets: rendered.container,
            x: rendered.previewX,
            y: rendered.previewY,
            scale: 1,
            duration: 180,
            ease: "Back.easeOut",
            onComplete: () => {
                rendered.frame.setAlpha(1);
            },
        });
    }

    private removePiece(index: number) {
        const rendered = this.renderedPieces[index];

        if (rendered) {
            rendered.container.destroy(true);
        }

        this.pieces.splice(index, 1);
        this.renderedPieces.splice(index, 1);

        const remainingPieces = [...this.pieces];

        this.clearRenderedPieces();

        this.pieces = remainingPieces;

        this.pieces.forEach((piece, newIndex) => {
            this.renderPiece(piece, newIndex);
        });
    }

    private getPlacementFromRenderedPiece(rendered: RenderedPiece) {
        const shape = rendered.piece.shape;
        const step = this.CELL_SIZE + this.CELL_GAP;

        const shapePixelWidth = shape[0].length * step - this.CELL_GAP;
        const shapePixelHeight = shape.length * step - this.CELL_GAP;

        const col = Math.round(
            (rendered.container.x - shapePixelWidth / 2 - this.gridX) / step,
        );

        const row = Math.round(
            (rendered.container.y - shapePixelHeight / 2 - this.gridY) / step,
        );

        return {
            row,
            col,
        };
    }

    private updatePlacementPreview(rendered: RenderedPiece) {
        this.clearPlacementPreview();

        const placement = this.getPlacementFromRenderedPiece(rendered);
        const { row, col } = placement;
        const shape = rendered.piece.shape;

        const canDrop = this.canPlace(shape, row, col);
        const ghostColor = canDrop ? 0xefefe9 : 0xbe001c;
        const ghostAlpha = canDrop ? 0.35 : 0.55;

        shape.forEach((shapeRow, shapeRowIndex) => {
            shapeRow.forEach((value, shapeColIndex) => {
                if (!value) return;

                const gridRow = row + shapeRowIndex;
                const gridCol = col + shapeColIndex;

                if (
                    gridRow < 0 ||
                    gridRow >= this.GRID_SIZE ||
                    gridCol < 0 ||
                    gridCol >= this.GRID_SIZE
                ) {
                    return;
                }

                const cell = this.cells[gridRow][gridCol];

                const ghost = this.add
                    .rectangle(
                        cell.x + this.CELL_SIZE / 2,
                        cell.y + this.CELL_SIZE / 2,
                        this.CELL_SIZE - 8,
                        this.CELL_SIZE - 8,
                        ghostColor,
                        ghostAlpha,
                    )
                    .setStrokeStyle(4, canDrop ? 0xbe001c : 0xefefe9)
                    .setDepth(35);

                this.placementGhosts.push(ghost);
            });
        });
    }

    private clearPlacementPreview() {
        this.placementGhosts.forEach((ghost) => {
            ghost.destroy();
        });

        this.placementGhosts = [];
    }

    private canPlace(shape: Shape, startRow: number, startCol: number): boolean {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (!shape[row][col]) continue;

                const gridRow = startRow + row;
                const gridCol = startCol + col;

                if (
                    gridRow < 0 ||
                    gridRow >= this.GRID_SIZE ||
                    gridCol < 0 ||
                    gridCol >= this.GRID_SIZE ||
                    this.grid[gridRow][gridCol] === 1
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private placePiece(shape: Shape, startRow: number, startCol: number) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (!shape[row][col]) continue;

                const gridRow = startRow + row;
                const gridCol = startCol + col;

                this.grid[gridRow][gridCol] = 1;

                this.boardBlocks[gridRow][gridCol]?.destroy(true);

                const cell = this.cells[gridRow][gridCol];

                this.boardBlocks[gridRow][gridCol] = this.createBeveledBlock(
                    cell.x + this.CELL_SIZE / 2,
                    cell.y + this.CELL_SIZE / 2,
                    this.CELL_SIZE - 6,
                    0xbe001c,
                    8,
                );
            }
        }
    }

    private hasAnyMove(): boolean {
        return this.pieces.some((piece) => {
            for (let row = 0; row < this.GRID_SIZE; row++) {
                for (let col = 0; col < this.GRID_SIZE; col++) {
                    if (this.canPlace(piece.shape, row, col)) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    private countBlocks(shape: Shape): number {
        return shape.flat().filter(Boolean).length;
    }

    private isBoardEmpty(): boolean {
        return this.grid.every((row) => row.every((cell) => cell === 0));
    }

    private clearLinesAnimated(): number {
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        for (let row = 0; row < this.GRID_SIZE; row++) {
            if (this.grid[row].every((cell) => cell === 1)) {
                rowsToClear.push(row);
            }
        }

        for (let col = 0; col < this.GRID_SIZE; col++) {
            let full = true;

            for (let row = 0; row < this.GRID_SIZE; row++) {
                if (this.grid[row][col] === 0) {
                    full = false;
                    break;
                }
            }

            if (full) {
                colsToClear.push(col);
            }
        }

        if (!rowsToClear.length && !colsToClear.length) {
            return 0;
        }

        const affectedCells = new Set<string>();

        rowsToClear.forEach((row) => {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                affectedCells.add(`${row}-${col}`);
            }
        });

        colsToClear.forEach((col) => {
            for (let row = 0; row < this.GRID_SIZE; row++) {
                affectedCells.add(`${row}-${col}`);
            }
        });

        affectedCells.forEach((key) => {
            const [row, col] = key.split("-").map(Number);

            this.grid[row][col] = 0;

            this.boardBlocks[row][col]?.destroy(true);
            this.boardBlocks[row][col] = null;

            this.cells[row][col].setFillStyle(0x2a2926);

            const cell = this.cells[row][col];

            const flash = this.add
                .rectangle(
                    cell.x + this.CELL_SIZE / 2,
                    cell.y + this.CELL_SIZE / 2,
                    this.CELL_SIZE,
                    this.CELL_SIZE,
                    0xefefe9,
                )
                .setStrokeStyle(4, 0xbe001c)
                .setDepth(40);

            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 1.25,
                duration: 320,
                ease: "Cubic.easeOut",
                onComplete: () => {
                    flash.destroy();
                },
            });
        });

        const clearText = this.add
            .text(this.GAME_WIDTH / 2, this.gridY - 45, "LINE CLEAR", {
                fontSize: "28px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#be001c",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(50)
            .setAlpha(0);

        this.tweens.add({
            targets: clearText,
            alpha: 1,
            y: this.gridY - 70,
            duration: 140,
            yoyo: true,
            hold: 250,
            onComplete: () => {
                clearText.destroy();
            },
        });

        this.cameras.main.shake(90, 0.003);

        return rowsToClear.length + colsToClear.length;
    }

    private createBeveledBlock(
        x: number,
        y: number,
        size: number,
        color = 0xbe001c,
        depth = 10,
    ): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        container.setDepth(depth);

        const base = this.add.rectangle(0, 0, size, size, color);
        base.setStrokeStyle(3, 0x11100f);

        const highlightTop = this.add.rectangle(
            0,
            -size / 2 + 5,
            size - 10,
            6,
            0xefefe9,
            0.35,
        );

        const highlightLeft = this.add.rectangle(
            -size / 2 + 5,
            0,
            6,
            size - 10,
            0xefefe9,
            0.25,
        );

        const shadowBottom = this.add.rectangle(
            0,
            size / 2 - 5,
            size - 10,
            6,
            0x740011,
            0.85,
        );

        const shadowRight = this.add.rectangle(
            size / 2 - 5,
            0,
            6,
            size - 10,
            0x740011,
            0.85,
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

    private showBoardClearBonus() {
        const bonusText = this.add
            .text(this.GAME_WIDTH / 2, this.gridY + 300, "BOARD CLEAR +500", {
                fontSize: "34px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#be001c",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(60)
            .setAlpha(0)
            .setScale(0.85);

        this.tweens.add({
            targets: bonusText,
            alpha: 1,
            scale: 1.15,
            y: this.gridY + 250,
            duration: 180,
            ease: "Back.easeOut",
            yoyo: true,
            hold: 450,
            onComplete: () => {
                bonusText.destroy();
            },
        });

        this.cameras.main.shake(180, 0.006);
    }

    private shakeCamera() {
        this.cameras.main.shake(120, 0.006);
    }

    private endGame() {
        if (this.gameOver) return;

        this.gameOver = true;

        window.dispatchEvent(
            new CustomEvent("blockblast-score", {
                detail: {
                    score: this.score,
                },
            }),
        );

        const cx = this.GAME_WIDTH / 2;
        const cy = this.GAME_HEIGHT / 2;

        this.add
            .rectangle(cx, cy, 700, 520, 0x11100f, 0.96)
            .setStrokeStyle(8, 0xefefe9)
            .setDepth(50);

        this.add
            .text(cx, cy - 170, "GAME OVER", {
                fontSize: "54px",
                color: "#be001c",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(51);

        this.add
            .text(cx, cy - 80, "NO MORE MOVES", {
                fontSize: "28px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5)
            .setDepth(51);

        this.add
            .text(cx, cy - 25, `SCORE ${this.score}`, {
                fontSize: "38px",
                color: "#efefe9",
                fontFamily: "monospace",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(51);

        const button = this.add
            .rectangle(cx, cy + 135, 280, 80, 0xbe001c)
            .setStrokeStyle(6, 0xefefe9)
            .setInteractive({ useHandCursor: true })
            .setDepth(52);

        this.add
            .text(cx, cy + 135, "RETRY", {
                fontSize: "32px",
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
    }
}