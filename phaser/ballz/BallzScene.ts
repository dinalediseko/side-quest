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
  view?: Phaser.GameObjects.Arc;
};

export default class BallzScene extends Phaser.Scene {
  private readonly GAME_WIDTH = 960;
  private readonly GAME_HEIGHT = 1400;

  private readonly COLS = 7;
  private readonly ROWS = 9;

  private readonly BRICK_SIZE = 104;
  private readonly BRICK_GAP = 10;

  private readonly BALL_RADIUS = 10;
  private readonly BALL_SPEED = 760;

  private gridX = 0;
  private readonly gridY = 230;

  private readonly launchY = 1180;
  private launchX = this.GAME_WIDTH / 2;

  private bricks: Brick[] = [];
  private balls: Ball[] = [];

  private ballCount = 1;
  private shotNumber = 1;
  private score = 0;

  private isAiming = false;
  private shotInProgress = false;

  private firstReturnX: number | null = null;

  private aimLine?: Phaser.GameObjects.Graphics;

  private scoreText!: Phaser.GameObjects.Text;
  private ballsText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;

  private brickViews: Phaser.GameObjects.GameObject[] = [];
  private staticViews: Phaser.GameObjects.GameObject[] = [];

  private pointerStartX = 0;
  private pointerStartY = 0;

  private gameOver = false;

  constructor() {
    super("BallzScene");
  }

  create() {
    this.gridX =
      (this.GAME_WIDTH -
        this.COLS * this.BRICK_SIZE -
        (this.COLS - 1) * this.BRICK_GAP) /
      2;

    this.bricks = [];
    this.balls = [];

    this.ballCount = 1;
    this.shotNumber = 1;
    this.score = 0;

    this.isAiming = false;
    this.shotInProgress = false;
    this.firstReturnX = null;
    this.gameOver = false;

    this.launchX = this.GAME_WIDTH / 2;

    this.drawBackground();
    this.createHUD();
    this.createLaunchPoint();
    this.setupInput();

    this.addNewRow();
    this.renderBricks();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearBrickViews();
      this.clearStaticViews();
    });
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;

    if (this.shotInProgress) {
      this.updateBalls(delta / 1000);
    }
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
      .text(this.GAME_WIDTH / 2, 62, "BALLZ", {
        fontSize: "56px",
        color: "#efefe9",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(this.GAME_WIDTH / 2, 118, "AIM. BREAK. SURVIVE.", {
        fontSize: "22px",
        color: "#b9b9b3",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const dangerLine = this.add
      .rectangle(this.GAME_WIDTH / 2, this.launchY - 58, 760, 6, 0xbe001c, 0.8)
      .setDepth(3);

    this.staticViews.push(dangerLine);

    this.add
      .text(this.GAME_WIDTH / 2, this.launchY - 85, "DANGER LINE", {
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
      .text(70, 170, "SCORE 0", {
        fontSize: "24px",
        color: "#be001c",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    this.ballsText = this.add
      .text(this.GAME_WIDTH / 2, 170, "BALLS 1", {
        fontSize: "24px",
        color: "#efefe9",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.roundText = this.add
      .text(this.GAME_WIDTH - 70, 170, "SHOT 1", {
        fontSize: "24px",
        color: "#b9b9b3",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5);
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.shotInProgress) return;

      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;

      this.isAiming = true;
      this.drawAim(pointer.x, pointer.y);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.gameOver || this.shotInProgress) return;

      this.drawAim(pointer.x, pointer.y);
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.gameOver || this.shotInProgress) return;

      this.isAiming = false;
      this.clearAim();

      const dx = pointer.x - this.launchX;
      const dy = pointer.y - this.launchY;

      if (dy > -40) {
        this.showNotice("AIM UP", "#be001c");
        return;
      }

      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 60) {
        this.showNotice("PULL FARTHER", "#be001c");
        return;
      }

      const vx = (dx / length) * this.BALL_SPEED;
      const vy = (dy / length) * this.BALL_SPEED;

      this.fireShot(vx, vy);
    });
  }

  private drawAim(pointerX: number, pointerY: number) {
    this.clearAim();

    const dx = pointerX - this.launchX;
    const dy = pointerY - this.launchY;

    if (dy > -10) return;

    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 20) return;

    const dirX = dx / length;
    const dirY = dy / length;

    this.aimLine = this.add.graphics();
    this.aimLine.setDepth(50);
    this.aimLine.lineStyle(5, 0xefefe9, 0.75);

    let x = this.launchX;
    let y = this.launchY;

    for (let i = 0; i < 9; i++) {
      const nextX = x + dirX * 52;
      const nextY = y + dirY * 52;

      this.aimLine.strokeCircle(nextX, nextY, 5);

      x = nextX;
      y = nextY;
    }
  }

  private clearAim() {
    if (this.aimLine) {
      this.aimLine.destroy();
      this.aimLine = undefined;
    }
  }

  private fireShot(vx: number, vy: number) {
    this.shotInProgress = true;
    this.firstReturnX = null;
    this.balls = [];

    for (let i = 0; i < this.ballCount; i++) {
      this.time.delayedCall(i * 65, () => {
        if (this.gameOver) return;

        const view = this.add
          .circle(this.launchX, this.launchY, this.BALL_RADIUS, 0xefefe9)
          .setStrokeStyle(3, 0x11100f)
          .setDepth(60);

        this.balls.push({
          x: this.launchX,
          y: this.launchY,
          vx,
          vy,
          active: true,
          view,
        });
      });
    }
  }

  private updateBalls(dt: number) {
    this.balls.forEach((ball) => {
      if (!ball.active) return;

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x <= this.gridX + this.BALL_RADIUS) {
        ball.x = this.gridX + this.BALL_RADIUS;
        ball.vx *= -1;
      }

      const rightWall =
        this.gridX +
        this.COLS * this.BRICK_SIZE +
        (this.COLS - 1) * this.BRICK_GAP -
        this.BALL_RADIUS;

      if (ball.x >= rightWall) {
        ball.x = rightWall;
        ball.vx *= -1;
      }

      if (ball.y <= this.gridY + this.BALL_RADIUS) {
        ball.y = this.gridY + this.BALL_RADIUS;
        ball.vy *= -1;
      }

      this.checkBrickCollisions(ball);

      if (ball.y >= this.launchY) {
        ball.active = false;
        ball.view?.destroy();

        if (this.firstReturnX === null) {
          this.firstReturnX = Phaser.Math.Clamp(
            ball.x,
            this.gridX + 20,
            rightWall - 20
          );
        }
      }

      ball.view?.setPosition(ball.x, ball.y);
    });

    const allReturned =
      this.balls.length === this.ballCount &&
      this.balls.every((ball) => !ball.active);

    if (allReturned) {
      this.finishShot();
    }
  }

  private checkBrickCollisions(ball: Ball) {
    for (const brick of [...this.bricks]) {
      const rect = this.getBrickRect(brick);

      const closestX = Phaser.Math.Clamp(ball.x, rect.left, rect.right);
      const closestY = Phaser.Math.Clamp(ball.y, rect.top, rect.bottom);

      const dx = ball.x - closestX;
      const dy = ball.y - closestY;

      const hit = dx * dx + dy * dy <= this.BALL_RADIUS * this.BALL_RADIUS;

      if (!hit) continue;

      brick.hp--;
      this.score += 5;

      if (Math.abs(dx) > Math.abs(dy)) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }

      if (brick.hp <= 0) {
        this.score += 25;
        this.bricks = this.bricks.filter((item) => item.id !== brick.id);
        this.showPop(rect.centerX, rect.centerY);
      }

      this.updateHUD();
      this.renderBricks();
      return;
    }
  }

  private finishShot() {
    this.shotInProgress = false;

    this.launchX = this.firstReturnX ?? this.GAME_WIDTH / 2;

    this.shotNumber++;

    if (this.shotNumber % 3 === 0) {
      this.ballCount++;
      this.showNotice("+1 BALL", "#efefe9");
    }

    this.shiftBricksDown();

    if (this.checkGameOver()) {
      this.endGame();
      return;
    }

    this.addNewRow();
    this.updateHUD();
    this.createLaunchPoint();
    this.renderBricks();
  }

  private shiftBricksDown() {
    this.bricks = this.bricks.map((brick) => ({
      ...brick,
      row: brick.row + 1,
    }));
  }

  private addNewRow() {
    const amount = Phaser.Math.Between(2, 5);
    const usedCols = new Set<number>();

    while (usedCols.size < amount) {
      usedCols.add(Phaser.Math.Between(0, this.COLS - 1));
    }

    const newBricks = Array.from(usedCols).map((col) => {
      const baseHp = this.shotNumber;
      const extra = Phaser.Math.Between(0, Math.max(1, Math.floor(this.shotNumber / 3)));

      return {
        id: `${Date.now()}-${Math.random()}-${col}`,
        row: 0,
        col,
        hp: baseHp + extra,
      };
    });

    this.bricks.push(...newBricks);
  }

  private checkGameOver() {
    return this.bricks.some((brick) => brick.row >= this.ROWS - 1);
  }

  private getBrickRect(brick: Brick) {
    const x =
      this.gridX + brick.col * (this.BRICK_SIZE + this.BRICK_GAP);

    const y =
      this.gridY + brick.row * (this.BRICK_SIZE + this.BRICK_GAP);

    return new Phaser.Geom.Rectangle(
      x,
      y,
      this.BRICK_SIZE,
      this.BRICK_SIZE
    );
  }

  private renderBricks() {
    this.clearBrickViews();

    this.bricks.forEach((brick) => {
      const rect = this.getBrickRect(brick);

      const color =
        brick.hp >= this.shotNumber + 6
          ? 0x8b0000
          : brick.hp >= this.shotNumber + 3
            ? 0xbe001c
            : 0x2a2926;

      const block = this.add
        .rectangle(
          rect.centerX,
          rect.centerY,
          this.BRICK_SIZE,
          this.BRICK_SIZE,
          color
        )
        .setStrokeStyle(5, 0xefefe9)
        .setDepth(10);

      const text = this.add
        .text(rect.centerX, rect.centerY, String(brick.hp), {
          fontSize: "34px",
          color: "#efefe9",
          fontFamily: "monospace",
          stroke: "#000000",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(11);

      this.brickViews.push(block, text);
    });
  }

  private createLaunchPoint() {
    const old = this.staticViews.filter((view) => view.name === "launch");
    old.forEach((view) => view.destroy());
    this.staticViews = this.staticViews.filter((view) => view.name !== "launch");

    const point = this.add
      .circle(this.launchX, this.launchY, 14, 0xefefe9)
      .setStrokeStyle(4, 0xbe001c)
      .setDepth(35);

    point.name = "launch";

    this.staticViews.push(point);
  }

  private updateHUD() {
    this.scoreText.setText(`SCORE ${this.score}`);
    this.ballsText.setText(`BALLS ${this.ballCount}`);
    this.roundText.setText(`SHOT ${this.shotNumber}`);
  }

  private showPop(x: number, y: number) {
    const pop = this.add
      .circle(x, y, 12, 0xefefe9, 0.9)
      .setDepth(80);

    this.tweens.add({
      targets: pop,
      scale: 3,
      alpha: 0,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => pop.destroy(),
    });
  }

  private showNotice(message: string, color = "#efefe9") {
    const notice = this.add
      .text(this.GAME_WIDTH / 2, 205, message, {
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
      y: 180,
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

  private clearStaticViews() {
    this.staticViews.forEach((view) => view.destroy());
    this.staticViews = [];
  }

  private endGame() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.shotInProgress = false;

    window.dispatchEvent(
      new CustomEvent("ballz-score", {
        detail: {
          score: this.score,
          shots: this.shotNumber,
          balls: this.ballCount,
        },
      })
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
      .text(cx, cy - 30, `SHOTS ${this.shotNumber}`, {
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