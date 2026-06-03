"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import GameRenderer from "@/components/game/GameRenderer";
import BackButton from "@/components/ui/BackButton";

export default function GamePage() {
  const params = useParams();

  const slug = params.slug as string;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <BackButton />

          <a href="/leaderboard" className="pixel-btn text-sm">
            BOARD
          </a>
        </div>

        <GameRenderer slug={slug} />
      </div>
    </main>
  );
}
