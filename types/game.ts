export type GameType = "phaser" | "react";

export type GameIcon =
  | "bird"
  | "blocks"
  | "boxes"
  | "worm"
  | "grid-3x3"
  | "circle-dot";

export interface GameConfig {
  id: string;
  title: string;
  icon: GameIcon;
  type: GameType;
  route: string;
  description: string;
}