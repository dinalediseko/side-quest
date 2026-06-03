"use client";

import { useEffect, useState } from "react";

import { watchLeaderboard } from "@/firebase/leaderboard";

export default function GameLeaderboard({ gameId }: { gameId: string }) {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = watchLeaderboard(
      gameId,

      setPlayers,

      20,
    );

    return () => unsub();
  }, [gameId]);

  return (
    <div
      className="
pixel-card
space-y-3
"
    >
      <h2
        className="
pixel
text-lg
"
      >
        🏆 {gameId}
      </h2>

      {players.length === 0 && <div>No scores yet</div>}

      {players.map(
        (
          player,

          index,
        ) => (
          <div
            key={player.id}
            className="
flex
justify-between
border-b
pb-2
"
          >
            <div>
              #{index + 1} {player.username || "Player"}
            </div>

            <div>
                          {player.bestScore}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
