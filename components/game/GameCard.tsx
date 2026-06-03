import Link from "next/link";

import PixelGameIcon from "@/components/game/PixelGameIcon";
import { GameConfig } from "@/types/game";

export default function GameCard({ game }: { game: GameConfig }) {
  return (
    <Link
      href={game.route}
      className="pixel-card group block space-y-5 transition-transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-[var(--sq-red)] transition-transform group-hover:scale-110">
          <PixelGameIcon icon={game.icon} />
        </div>

        <div className="pixel-small rounded border-2 border-[var(--sq-black)] px-3 py-2 text-[var(--sq-red)]">
          PLAY
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="pixel text-lg leading-loose">
          {game.title}
        </h3>

        <p className="pixel-small leading-loose opacity-70">
          {game.description}
        </p>
      </div>
    </Link>
  );
}