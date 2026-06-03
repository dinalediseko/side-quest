"use client";

import Link from "next/link";

import { useAuthStore } from "@/store/authStore";

export default function StreakBadge() {
  const profile = useAuthStore((s) => s.profile);

  const currentStreak = profile?.currentStreak || profile?.streak || 0;

  return (
    <div className="pixel-card space-y-4">
      <div className="space-y-1">
        <h3 className="pixel text-sm">word of the day</h3>

        <p className="pixel-small opacity-70">
          SIDE QUESTS ARE FUN, BUT THE MAIN QUEST IS STILL WAITING
        </p>
      </div>

      <div className="pixel-small text-[var(--sq-red)]">
        {currentStreak > 0
          ? "TODAY'S SIDE QUEST IS ACTIVE"
          : "TODAY'S SIDE QUEST IS WAITING"}
      </div>

      <Link
        href="https://portfolio.dseikou.co.za/"
        target="_blank"
        rel="noopener noreferrer"
        className="pixel-btn inline-block text-center"
      >
        BACK TO PORTFOLIO
      </Link>
    </div>
  );
}