"use client";

import { useAuthStore } from "@/store/authStore";

import BallzGame from "@/components/game/BallzGame";
import BlockBlastGame from "@/components/game/BlockBlastGame";
import FlappyGame from "@/components/game/FlappyGame";
import SnakeGame from "@/components/game/SnakeGame";
import TetrisGame from "@/components/game/TetrisGame";
import Twenty48Game from "@/components/game/Twenty48Game";

const gameMap: Record<string, React.ComponentType> = {
  flappy: FlappyGame,
  blockblast: BlockBlastGame,
  tetris: TetrisGame,
  snake: SnakeGame,
  "2048": Twenty48Game,
  ballz: BallzGame,
};

export default function GameRenderer({ slug }: { slug: string }) {
  const user = useAuthStore((s) => s.user);

  if (user === undefined) {
    return (
      <div className="pixel-card p-6 text-center">
        LOADING PLAYER SESSION...
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="pixel-card p-6 text-center space-y-4">
        <p className="pixel text-sm">LOGIN REQUIRED</p>

        <p className="pixel-small opacity-70">
          SIGN IN TO PLAY AND SAVE YOUR SCORE
        </p>
      </div>
    );
  }

  const GameComponent = gameMap[slug];

  if (!GameComponent) {
    return (
      <div className="pixel-card p-6 text-center space-y-4">
        <p className="pixel text-sm">GAME NOT FOUND</p>

        <p className="pixel-small opacity-70">
          THIS SIDE QUEST IS NOT READY YET
        </p>
      </div>
    );
  }

  return <GameComponent key={slug} />;
}