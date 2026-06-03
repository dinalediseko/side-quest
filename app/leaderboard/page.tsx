"use client";

import { useState } from "react";

import { games } from "@/config/games";

import BackButton from "@/components/ui/BackButton";

import GameLeaderboard from "@/components/leaderboard/GameLeaderboard";

import PixelGameIcon from "@/components/game/PixelGameIcon";

export default function LeaderboardPage() {
  const [active, setActive] = useState("flappy");

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <BackButton />
      <h1
        className="
pixel
text-3xl
"
      >
        Leaderboards
      </h1>

      <div
        className="
flex
gap-2
flex-wrap
"
      >
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setActive(game.id)}
            className="

pixel-btn

{

active===game.id

?

'opacity-100'

:

'opacity-50'

}

"
          >
            <PixelGameIcon icon={game.icon} />
            {game.title}
          </button>
        ))}
      </div>

      <GameLeaderboard gameId={active} />
    </main>
  );
}
