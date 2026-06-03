"use client";

import { useEffect, useState } from "react";

import {
  getLeaderboard,
  type LeaderboardEntry,
} from "@/firebase/leaderboard";

export default function GlobalLeaderboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await getLeaderboard(gameId);

      if (mounted) {
        setScores(data);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [gameId]);

  return (
    <div className="pixel-card space-y-4">
      <h3 className="pixel text-lg">GLOBAL TOP SCORES</h3>

      {scores.length === 0 ? (
        <p className="pixel-small opacity-70">NO SCORES YET</p>
      ) : (
        <div className="space-y-3">
          {scores.map((item, index) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 border-b-2 border-[var(--sq-black)] pb-2 last:border-b-0"
            >
              <div className="pixel-small">
                #{index + 1} {item.username || "Player"}
              </div>

              <div className="pixel-small text-[var(--sq-red)]">
                {item.bestScore || item.score || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}