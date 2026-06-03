"use client";

import { useState } from "react";

import LeaderboardTabs from "./LeaderboardTabs";

import GlobalLeaderboard from "./GlobalLeaderboard";

import PersonalBest from "./PersonalBest";

export default function LeaderboardModal() {
  const [open, setOpen] = useState(false);

  const [active, setActive] = useState("flappy");

  return (
    <>
      <button
        className="
pixel-btn
"
        onClick={() => setOpen(true)}
      >
        Leaderboard
      </button>

      {open && (
        <div
          className="
fixed
inset-0
bg-black/70
flex
justify-center
items-center
z-50
"
        >
          <div
            className="
pixel-card
w-[90%]
max-w-4xl
space-y-6
"
          >
            <button
              onClick={() => setOpen(false)}
              className="
pixel-btn
"
            >
              Close
            </button>

            <LeaderboardTabs active={active} setActive={setActive} />

            <GlobalLeaderboard gameId={active} />

            <PersonalBest />
          </div>
        </div>
      )}
    </>
  );
}
