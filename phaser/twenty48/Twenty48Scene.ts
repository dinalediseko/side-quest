import Phaser from "phaser";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export default class Twenty48Scene extends Phaser.Scene {
  private readonly GAME_WIDTH = 960;
  private readonly GAME_HEIGHT = 1400;

  private readonly SIZE = 4;
  private readonly TILE_SIZE = 150;
  private readonly TILE_GAP = 18;

  private grid: number[][] = [];

  private gridX = 0;
  private gridY = 340;

  private score = 0;
  private bestTile = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;

  private renderObjects: Phaser.GameObjects.GameObject[] = [];

  private pointerStartX = 0;
  private pointerStartY = 0;

  private isAnimating = false;
  private gameOver = false;

  constructor() {
    super("Twenty48Scene");
  }

  create() {
    const boardSize =
      this.SIZE * this.TILE_SIZE + (this.SIZE - 1) * this.TILE_GAP;

    this.gridX = (this.GAME_WIDTH - boardSize) / 2;
    this.gridY = 340;

    this.score = 0;
    this.bestTile = 0;
    this.gameOver = false;
    this.isAnimating = false;

    this.grid = Array.from({ length: this.SIZE }, () =>
      Array.from({ length: this.SIZE }, () => 0)
    );

    this.drawBackground();
    this.createHUD();
    this.createControls();
    this.setupKeyboard();
    this.setupTouch();

    this.addRandomTile();
    this.addRandomTile();
    this.render();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
      .text(this.GAME_WIDTH / 2, 70, "2048", {
        fontSize: "64px",
        color: "#efefe9",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(this.GAME_WIDTH / 2, 130, "SWIPE. MERGE. SCORE.", {
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
      .text(90, 190, "SCORE 0", {
        fontSize: "26px",
        color: "#be001c",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    this.bestText = this.add
      .text(this.GAME_WIDTH - 90, 190, "BEST 0", {
        fontSize: "26px",
        color: "#efefe9",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5);
  }

  private setupKeyboard() {
    const keyboard = this.input.keyboard;

    if (!keyboard) return;

    keyboard.on("keydown-UP", () => this.move("UP"));
    keyboard.on("keydown-DOWN", () => this.move("DOWN"));
    keyboard.on("keydown-LEFT", () => this.move("LEFT"));
    keyboard.on("keydown-RIGHT", () => this.move("RIGHT"));
    keyboard.on("keydown-W", () => this.move("UP"));
    keyboard.on("keydown-S", () => this.move("DOWN"));
    keyboard.on("keydown-A", () => this.move("LEFT"));
    keyboard.on("keydown-D", () => this.move("RIGHT"));
  }

  private setupTouch() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isAnimating) return;

      const dx = pointer.x - this.pointerStartX;
      const dy = pointer.y - this.pointerStartY;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < 35 && absY < 35) return;

      if (absX > absY) {
        this.move(dx > 0 ? "RIGHT" : "LEFT");
        return;
      }

      this.move(dy > 0 ? "DOWN" : "UP");
    });
  }

  private createControls() {
    const y = 1125;

    this.createControlButton(220, y, "LEFT", () => this.move("LEFT"));
    this.createControlButton(400, y, "UP", () => this.move("UP"));
    this.createControlButton(580, y, "DOWN", () => this.move("DOWN"));
    this.createControlButton(760, y, "RIGHT", () => this.move("RIGHT"));
  }

  private createControlButton(
    x: number,
    y: number,
    label: string,
    action: () => void
  ) {
    const button = this.add
      .rectangle(x, y, 155, 70, 0x2a2926)
      .setStrokeStyle(5, 0xb9b9b3)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.add
      .text(x, y, label, {
        fontSize: "18px",
        color: "#efefe9",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(41);

    button.on("pointerover", () => button.setFillStyle(0x11100f));
    button.on("pointerout", () => button.setFillStyle(0x2a2926));
    button.on("pointerdown", () => {
      if (this.gameOver || this.isAnimating) return;
      action();
    });
  }

  private addRandomTile() {
    const emptyCells: { row: number; col: number }[] = [];

    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return;

    const cell = Phaser.Utils.Array.GetRandom(emptyCells);
    this.grid[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;

    this.bestTile = Math.max(this.bestTile, this.grid[cell.row][cell.col]);
  }

  private move(direction: Direction) {
    if (this.gameOver || this.isAnimating) return;

    const before = this.grid.map((row) => [...row]);

    if (direction === "LEFT") {
      this.grid = this.grid.map((row) => this.mergeLine(row));
    }

    if (direction === "RIGHT") {
      this.grid = this.grid.map((row) =>
        this.mergeLine([...row].reverse()).reverse()
      );
    }

    if (direction === "UP") {
      for (let col = 0; col < this.SIZE; col++) {
        const line = this.grid.map((row) => row[col]);
        const merged = this.mergeLine(line);

        for (let row = 0; row < this.SIZE; row++) {
          this.grid[row][col] = merged[row];
        }
      }
    }

    if (direction === "DOWN") {
      for (let col = 0; col < this.SIZE; col++) {
        const line = this.grid.map((row) => row[col]).reverse();
        const merged = this.mergeLine(line).reverse();

        for (let row = 0; row < this.SIZE; row++) {
          this.grid[row][col] = merged[row];
        }
      }
    }

    const changed = JSON.stringify(before) !== JSON.stringify(this.grid);

    if (!changed) {
      this.cameras.main.shake(45, 0.002);
      return;
    }

    this.isAnimating = true;

    this.time.delayedCall(90, () => {
      this.addRandomTile();
      this.updateHUD();
      this.render();
      this.isAnimating = false;

      if (!this.hasMovesLeft()) {
        this.endGame();
      }
    });
  }

  private mergeLine(line: number[]) {
    const numbers = line.filter((value) => value !== 0);
    const merged: number[] = [];

    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === numbers[i + 1]) {
        const value = numbers[i] * 2;
        merged.push(value);

        this.score += value;
        this.bestTile = Math.max(this.bestTile, value);

        i++;
      } else {
        merged.push(numbers[i]);
      }
    }

    while (merged.length < this.SIZE) {
      merged.push(0);
    }

    return merged;
  }

  private hasMovesLeft() {
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (this.grid[row][col] === 0) return true;

        const current = this.grid[row][col];
        const right = this.grid[row]?.[col + 1];
        const down = this.grid[row + 1]?.[col];

        if (current === right || current === down) {
          return true;
        }
      }
    }

    return false;
  }

  private updateHUD() {
    this.scoreText.setText(`SCORE ${this.score}`);
    this.bestText.setText(`BEST ${this.bestTile}`);
  }

  private render() {
    this.clearRenderObjects();

    const boardSize =
      this.SIZE * this.TILE_SIZE + (this.SIZE - 1) * this.TILE_GAP;

    const board = this.add
      .rectangle(
        this.GAME_WIDTH / 2,
        this.gridY + boardSize / 2,
        boardSize + 26,
        boardSize + 26,
        0x2a2926,
        0.9
      )
      .setStrokeStyle(6, 0xefefe9)
      .setDepth(1);

    this.renderObjects.push(board);

    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        const x =
          this.gridX +
          col * (this.TILE_SIZE + this.TILE_GAP) +
          this.TILE_SIZE / 2;

        const y =
          this.gridY +
          row * (this.TILE_SIZE + this.TILE_GAP) +
          this.TILE_SIZE / 2;

        const value = this.grid[row][col];

        const tile = this.add
          .rectangle(
            x,
            y,
            this.TILE_SIZE,
            this.TILE_SIZE,
            value === 0 ? 0x11100f : this.getTileColor(value),
            value === 0 ? 0.55 : 1
          )
          .setStrokeStyle(4, 0x11100f)
          .setDepth(5);

        this.renderObjects.push(tile);

        if (value > 0) {
          const text = this.add
            .text(x, y, String(value), {
              fontSize: value >= 1024 ? "34px" : "42px",
              color: value === 2 || value === 4 ? "#11100f" : "#efefe9",
              fontFamily: "monospace",
              stroke: "#000000",
              strokeThickness: value === 2 || value === 4 ? 0 : 4,
            })
            .setOrigin(0.5)
            .setDepth(6);

          this.renderObjects.push(text);
        }
      }
    }
  }

  private getTileColor(value: number) {
    const colors: Record<number, number> = {
      2: 0xefefe9,
      4: 0xb9b9b3,
      8: 0xff8c00,
      16: 0xbe001c,
      32: 0x8b0000,
      64: 0x1f6feb,
      128: 0x2ea043,
      256: 0x8b5cf6,
      512: 0x00c2ff,
      1024: 0xfacc15,
      2048: 0xbe001c,
    };

    return colors[value] || 0xefefe9;
  }

  private clearRenderObjects() {
    this.renderObjects.forEach((item) => item.destroy());
    this.renderObjects = [];
  }

  private endGame() {
    if (this.gameOver) return;

    this.gameOver = true;

    window.dispatchEvent(
      new CustomEvent("twenty48-score", {
        detail: {
          score: this.score,
          bestTile: this.bestTile,
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
      .text(cx, cy - 30, `BEST TILE ${this.bestTile}`, {
        fontSize: "26px",
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

    retryBtn.on("pointerover", () => retryBtn.setFillStyle(0x11100f));
    retryBtn.on("pointerout", () => retryBtn.setFillStyle(0xbe001c));
    retryBtn.on("pointerdown", () => this.scene.restart());
  }
}