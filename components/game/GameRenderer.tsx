"use client";

import Link from "next/link";

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

const portfolioLines = [
  "DESIGNER WHO BUILDS THE THINGS THEY IMAGINE",
  "FRONT-END THINKING WITH FULL-STACK FOLLOW THROUGH",
  "CREATIVE SYSTEMS, PLAYFUL INTERACTIONS, REAL PRODUCTS",
  "BRANDING, UI, CODE, MOTION, AND USER EXPERIENCE",
];

export default function GameRenderer({ slug }: { slug: string }) {
  const user = useAuthStore((s) => s.user);

  if (user === undefined) {
    return (
      <div className="pixel-card relative overflow-hidden p-8 text-center">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="h-full w-full bg-[linear-gradient(90deg,var(--sq-white)_1px,transparent_1px),linear-gradient(var(--sq-white)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center border-4 border-[var(--sq-white)] bg-[var(--sq-red)] shadow-[8px_8px_0_var(--sq-black)]">
            <span className="pixel text-2xl text-[var(--sq-white)]">D</span>
          </div>

          <div className="space-y-3">
            <p className="pixel text-sm text-[var(--sq-red)]">
              LOADING SIDE QUEST...
            </p>

            <h2 className="pixel text-lg leading-loose">
              WHILE THE GAME LOADS, MEET THE BUILDER
            </h2>

            <p className="pixel-small mx-auto max-w-xl leading-loose opacity-70">
              I do not just design screens — I build interactive digital
              experiences that turn ideas into working products.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {portfolioLines.map((line) => (
              <div
                key={line}
                className="border-2 border-[var(--sq-black)] bg-[var(--sq-white)] px-4 py-3 text-left shadow-[4px_4px_0_var(--sq-black)]"
              >
                <p className="pixel-small leading-loose text-[var(--sq-black)]">
                  {line}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="https://portfolio.dseikou.co.za/"
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-btn inline-block"
          >
            VIEW MAIN PORTFOLIO
          </Link>

          <div className="mx-auto h-3 w-full max-w-sm overflow-hidden border-2 border-[var(--sq-white)] bg-[var(--sq-black)]">
            <div className="h-full w-1/2 animate-[loadingBar_1.1s_ease-in-out_infinite] bg-[var(--sq-red)]" />
          </div>
        </div>
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