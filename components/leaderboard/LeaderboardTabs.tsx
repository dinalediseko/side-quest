"use client";

import { games } from "@/config/games";
import PixelGameIcon from "@/components/game/PixelGameIcon";

type LeaderboardTabsProps = {
  active: string;
  setActive: (gameId: string) => void;
};

export default function LeaderboardTabs({
  active,
  setActive,
}: LeaderboardTabsProps) {
  return (
    <div className="flex gap-3 overflow-auto pb-4">
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
  );
}