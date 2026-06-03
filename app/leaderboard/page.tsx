"use client";

import { useState } from "react";

import { games } from "@/config/games";

import GameLeaderboard from "@/components/leaderboard/GameLeaderboard";
import PixelGameIcon from "@/components/game/PixelGameIcon";
import BackButton from "@/components/ui/BackButton";

export default function LeaderboardPage() {
  const [active, setActive] = useState("flappy");

  const activeGame = games.find((game) => game.id === active);

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <BackButton />

      <div className="space-y-3">
        <h1 className="pixel text-3xl">Leaderboards</h1>

        <p className="pixel-small max-w-2xl leading-loose opacity-70">
          CHECK THE GLOBAL TOP SCORES AND YOUR PERSONAL BESTS FOR EACH SIDE
          QUEST.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {games.map((game) => {
          const isActive = active === game.id;

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => setActive(game.id)}
              className={`pixel-btn flex items-center gap-3 ${
                isActive ? "opacity-100" : "opacity-50"
              }`}
            >
              <PixelGameIcon icon={game.icon} />
              <span>{game.title}</span>
            </button>
          );
        })}
      </div>

      {activeGame ? (
        <div className="pixel-card space-y-3">
          <p className="pixel-small text-[var(--sq-red)]">ACTIVE GAME</p>

          <h2 className="pixel text-xl leading-loose">{activeGame.title}</h2>

          <p className="pixel-small leading-loose opacity-70">
            {activeGame.description}
          </p>
        </div>
      ) : null}

      <GameLeaderboard gameId={active} />
    </main>
  );
}