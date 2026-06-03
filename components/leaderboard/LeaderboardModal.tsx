"use client";

import { useState } from "react";

import GameLeaderboard from "./GameLeaderboard";
import LeaderboardTabs from "./LeaderboardTabs";

export default function LeaderboardModal() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("flappy");

  return (
    <>
      <button className="pixel-btn" onClick={() => setOpen(true)}>
        Leaderboard
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="pixel-card max-h-[90vh] w-full max-w-5xl space-y-6 overflow-auto">
            <button onClick={() => setOpen(false)} className="pixel-btn">
              Close
            </button>

            <LeaderboardTabs active={active} setActive={setActive} />

            <GameLeaderboard gameId={active} />
          </div>
        </div>
      ) : null}
    </>
  );
}