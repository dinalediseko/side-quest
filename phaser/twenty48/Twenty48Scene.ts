import Phaser from "phaser";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type TileEvent = {
  row: number;
  col: number;
  value: number;
  type: "new" | "merge";
};

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
  private tileEffects: TileEvent[] = [];

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
    this.tileEffects = [];

    this.grid = Array.from({ length: this.SIZE }, () =>
      Array.from({ length: this.SIZE }, () => 0),
    );

    this.drawBackground();
    this.createHUD();
    this.createControls();
    this.setupKeyboard();
    this.setupTouch();

    this.addRandomTile("new");
    this.addRandomTile("new");
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
      0x11100f,
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
    const centerX = this.GAME_WIDTH / 2;
    const centerY = 1165;
    const offset = 72;

    this.add
      .rectangle(centerX, centerY, 78, 78, 0x11100f)
      .setStrokeStyle(5, 0xb9b9b3)
      .setDepth(39);

    this.createDpadButton(centerX, centerY - offset, "UP", () =>
      this.move("UP"),
    );

    this.createDpadButton(centerX, centerY + offset, "DOWN", () =>
      this.move("DOWN"),
    );

    this.createDpadButton(centerX - offset, centerY, "LEFT", () =>
      this.move("LEFT"),
    );

    this.createDpadButton(centerX + offset, centerY, "RIGHT", () =>
      this.move("RIGHT"),
    );
  }

  private createDpadButton(
    x: number,
    y: number,
    direction: Direction,
    action: () => void,
  ) {
    const button = this.add
      .rectangle(x, y, 78, 78, 0x2a2926)
      .setStrokeStyle(5, 0xb9b9b3)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    const arrow = this.add
      .triangle(x, y, 0, -18, 24, 18, -24, 18, 0xefefe9)
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

        if (this.gameOver || this.isAnimating) return;

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

  private addRandomTile(effectType: "new" | "merge" = "new") {
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
    const value = Math.random() < 0.9 ? 2 : 4;

    this.grid[cell.row][cell.col] = value;
    this.bestTile = Math.max(this.bestTile, value);

    this.tileEffects.push({
      row: cell.row,
      col: cell.col,
      value,
      type: effectType,
    });
  }

  private move(direction: Direction) {
    if (this.gameOver || this.isAnimating) return;

    const before = this.grid.map((row) => [...row]);

    this.tileEffects = [];

    if (direction === "LEFT") {
      this.grid = this.grid.map((row, rowIndex) =>
        this.mergeLine(row, rowIndex, "row"),
      );
    }

    if (direction === "RIGHT") {
      this.grid = this.grid.map((row, rowIndex) =>
        this.mergeLine([...row].reverse(), rowIndex, "row-reverse").reverse(),
      );
    }

    if (direction === "UP") {
      for (let col = 0; col < this.SIZE; col++) {
        const line = this.grid.map((row) => row[col]);
        const merged = this.mergeLine(line, col, "col");

        for (let row = 0; row < this.SIZE; row++) {
          this.grid[row][col] = merged[row];
        }
      }
    }

    if (direction === "DOWN") {
      for (let col = 0; col < this.SIZE; col++) {
        const line = this.grid.map((row) => row[col]).reverse();
        const merged = this.mergeLine(line, col, "col-reverse").reverse();

        for (let row = 0; row < this.SIZE; row++) {
          this.grid[row][col] = merged[row];
        }
      }
    }

    const changed = JSON.stringify(before) !== JSON.stringify(this.grid);

    if (!changed) {
      this.showNotice("NO MOVE", "#be001c");
      this.cameras.main.shake(55, 0.003);
      return;
    }

    this.isAnimating = true;

    this.showMoveTrail(direction);
    this.render();

    this.time.delayedCall(120, () => {
      this.addRandomTile("new");
      this.updateHUD();
      this.render();
      this.isAnimating = false;

      if (!this.hasMovesLeft()) {
        this.endGame();
      }
    });
  }

  private mergeLine(
    line: number[],
    lineIndex: number,
    mode: "row" | "row-reverse" | "col" | "col-reverse",
  ) {
    const numbers = line.filter((value) => value !== 0);
    const merged: number[] = [];

    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === numbers[i + 1]) {
        const value = numbers[i] * 2;
        merged.push(value);

        this.score += value;

        if (value > this.bestTile) {
          this.bestTile = value;
          this.showNotice(`NEW BEST ${value}`, "#efefe9");
        }

        this.registerMergeEffect(lineIndex, merged.length - 1, value, mode);

        this.showScorePop(value);

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

  private registerMergeEffect(
    lineIndex: number,
    positionIndex: number,
    value: number,
    mode: "row" | "row-reverse" | "col" | "col-reverse",
  ) {
    let row = 0;
    let col = 0;

    if (mode === "row") {
      row = lineIndex;
      col = positionIndex;
    }

    if (mode === "row-reverse") {
      row = lineIndex;
      col = this.SIZE - 1 - positionIndex;
    }

    if (mode === "col") {
      row = positionIndex;
      col = lineIndex;
    }

    if (mode === "col-reverse") {
      row = this.SIZE - 1 - positionIndex;
      col = lineIndex;
    }

    this.tileEffects.push({
      row,
      col,
      value,
      type: "merge",
    });
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

    this.tweens.add({
      targets: this.scoreText,
      scale: 1.12,
      duration: 90,
      yoyo: true,
      ease: "Back.easeOut",
    });
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
        0.9,
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
            value === 0 ? 0.55 : 1,
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

          this.applyTileEffect(row, col, value, tile, text);
        }
      }
    }
  }

  private applyTileEffect(
    row: number,
    col: number,
    value: number,
    tile: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
  ) {
    const effect = this.tileEffects.find(
      (item) => item.row === row && item.col === col && item.value === value,
    );

    if (!effect) return;

    if (effect.type === "new") {
      tile.setScale(0.35);
      text.setScale(0.35);

      this.tweens.add({
        targets: [tile, text],
        scale: 1,
        duration: 160,
        ease: "Back.easeOut",
      });

      return;
    }

    tile.setScale(1.12);
    text.setScale(1.12);

    const flash = this.add
      .rectangle(tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE, 0xefefe9, 0.38)
      .setDepth(8);

    this.renderObjects.push(flash);

    this.tweens.add({
      targets: [tile, text],
      scale: 1,
      duration: 160,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.25,
      duration: 240,
      ease: "Cubic.easeOut",
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  private showScorePop(value: number) {
    const pop = this.add
      .text(this.GAME_WIDTH / 2, 245, `+${value}`, {
        fontSize: "26px",
        color: "#be001c",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(90)
      .setAlpha(0);

    this.tweens.add({
      targets: pop,
      alpha: 1,
      y: 215,
      duration: 120,
      yoyo: true,
      hold: 220,
      onComplete: () => {
        pop.destroy();
      },
    });
  }

  private showMoveTrail(direction: Direction) {
    const boardSize =
      this.SIZE * this.TILE_SIZE + (this.SIZE - 1) * this.TILE_GAP;

    const trail = this.add
      .rectangle(
        this.GAME_WIDTH / 2,
        this.gridY + boardSize / 2,
        boardSize + 26,
        boardSize + 26,
        0xefefe9,
        0.08,
      )
      .setDepth(2);

    if (direction === "LEFT" || direction === "RIGHT") {
      trail.setScale(0.9, 1);
    } else {
      trail.setScale(1, 0.9);
    }

    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => {
        trail.destroy();
      },
    });
  }

  private showNotice(message: string, color = "#efefe9") {
    const notice = this.add
      .text(this.GAME_WIDTH / 2, 270, message, {
        fontSize: "24px",
        color,
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(95)
      .setAlpha(0);

    this.tweens.add({
      targets: notice,
      alpha: 1,
      y: 245,
      duration: 100,
      yoyo: true,
      hold: 300,
      onComplete: () => {
        notice.destroy();
      },
    });
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