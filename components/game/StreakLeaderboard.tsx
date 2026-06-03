"use client";

import { useEffect, useMemo, useState } from "react";

import { watchStreakLeaderboard } from "@/firebase/streakLeaderboard";

type StreakPlayer = {
  id: string;
  username?: string;
  streak?: number;
  currentStreak?: number;
  longestStreak?: number;
  bestStreak?: number;
};

export default function StreakLeaderboard() {
  const [players, setPlayers] = useState<StreakPlayer[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsub = watchStreakLeaderboard(setPlayers, 50);

    return () => unsub();
  }, []);

  const visiblePlayers = useMemo(() => {
    if (expanded) {
      return players;
    }

    return players.slice(0, 10);
  }, [players, expanded]);

  const hasMoreThanTen = players.length > 10;

  return (
    <div className="pixel-card space-y-4">
      <div className="space-y-1">
        <h3 className="pixel text-sm">STREAK LEADERS</h3>

        <p className="pixel-small opacity-70">
          RANKED BY LONGEST STREAK
        </p>
      </div>

      {players.length === 0 ? (
        <p className="pixel-small opacity-70">NO STREAKS YET</p>
      ) : (
        <div className="space-y-3">
          {visiblePlayers.map((player, index) => {
            const bestStreak =
              player.bestStreak || player.longestStreak || 0;

            const currentStreak =
              player.currentStreak || player.streak || 0;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between gap-4 border-b-2 border-[var(--sq-black)] pb-2 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="pixel-small">
                    #{index + 1} {player.username || "Player"}
                  </p>

                  <p className="pixel-small opacity-60">
                    CURRENT {currentStreak}
                  </p>
                </div>

                <div className="text-right">
                  <p className="pixel-small text-[var(--sq-red)]">
                    LONGEST {bestStreak}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMoreThanTen ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="pixel-btn w-full"
        >
          {expanded ? "COLLAPSE" : `SEE MORE (${players.length - 10})`}
        </button>
      ) : null}
    </div>
  );
}