import { GameConfig } from "@/types/game";

export const games: GameConfig[] = [
  {
    id: "flappy",
    title: "Flappy Bird",
    icon: "bird",
    type: "phaser",
    route: "/games/flappy",
    description: "Fly through the robots and survive as long as possible.",
  },
  {
    id: "blockblast",
    title: "Block Blast",
    icon: "blocks",
    type: "phaser",
    route: "/games/blockblast",
    description: "Place blocks, clear lines, and keep the board alive.",
  },
  {
    id: "tetris",
    title: "Tetris",
    icon: "boxes",
    type: "phaser",
    route: "/games/tetris",
    description: "Stack falling blocks and clear rows for the highest score.",
  },
  {
    id: "snake",
    title: "Snake",
    icon: "worm",
    type: "phaser",
    route: "/games/snake",
    description: "Eat, grow, and avoid crashing into yourself or the walls.",
  },
  {
    id: "2048",
    title: "2048",
    icon: "grid-3x3",
    type: "phaser",
    route: "/games/2048",
    description: "Merge matching tiles to build the biggest number possible.",
  },
  {
    id: "ballz",
    title: "Ballz",
    icon: "circle-dot",
    type: "phaser",
    route: "/games/ballz",
    description: "Aim balls, break bricks, and stop them reaching the bottom.",
  },
];