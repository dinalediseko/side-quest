"use client";

import { games } from "@/config/games";
import PixelGameIcon from "@/components/game/PixelGameIcon";

export default function LeaderboardTabs({ active, setActive }: any) {
  return (
    <div
      className="
flex
gap-3
overflow-auto
pb-4
"
    >
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => setActive(game.id)}
          className="pixel-btn"
        >
          <PixelGameIcon icon={game.icon} />
        </button>
      ))}
    </div>
  );
}
