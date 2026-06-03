"use client";

import { useEffect, useState } from "react";

import { getLeaderboard } from "@/firebase/leaderboard";

export default function GlobalLeaderboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, [gameId]);

  async function load() {
    const data = await getLeaderboard(gameId);

    setScores(data);
  }

  return (
    <div
      className="
pixel-card
space-y-4
"
    >
      <h3
        className="
pixel
"
      >
        Global Top
      </h3>

      {scores.map((item, index) => (
        <div
          key={item.id}
          className="
flex
justify-between
"
        >
          <div>
            #{index + 1}
            {item.username}
          </div>

          <div>{item.bestScore}</div>
        </div>
      ))}
    </div>
  );
}
