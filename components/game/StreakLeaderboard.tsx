"use client";

import { useEffect, useState } from "react";

import { watchStreakLeaderboard } from "@/firebase/streakLeaderboard";

export default function StreakLeaderboard() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = watchStreakLeaderboard(setPlayers);

    return () => unsub();
  }, []);

  return (
    <div className="pixel-card space-y-4">
      <div className="space-y-1">
        <h3 className="pixel text-sm">STREAK LEADERS</h3>

        <p className="pixel-small opacity-70">RANKED BY LONGEST STREAK</p>
      </div>

      {players.length === 0 ? (
        <p className="pixel-small opacity-70">NO STREAKS YET</p>
      ) : (
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between gap-4 border-b-2 border-[var(--sq-black)] pb-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="pixel-small">
                  #{index + 1} {player.username || "Player"}
                </p>
              </div>

              <div className="text-right">
                <p className="pixel-small text-[var(--sq-red)]">
                  {player.bestStreak || player.longestStreak || 0}{" "}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
