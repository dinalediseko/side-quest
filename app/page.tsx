"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/firebase/config";

import { useAuthStore } from "@/store/authStore";

import { updateStreak } from "@/firebase/streak";
import { watchUserProfile } from "@/firebase/user";

import { games } from "@/config/games";

import AuthButtons from "@/components/auth/AuthButtons";
import ProfileChip from "@/components/auth/ProfileChip";

import GameCard from "@/components/game/GameCard";
import StreakBadge from "@/components/game/StreakBadge";
import StreakLeaderboard from "@/components/game/StreakLeaderboard";

import LeaderboardModal from "@/components/leaderboard/LeaderboardModal";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    let profileUnsub: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) return;

      await updateStreak(u.uid);

      profileUnsub = watchUserProfile(u.uid, (profile: any) => {
        setProfile(profile);
      });
    });

    return () => {
      unsub();

      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, [setUser, setProfile]);

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="pixel text-3xl">SIDE QUEST</h1>

        <p>Main Quest Was Finishing My Portfolio</p>
      </div>

      {!user && (
        <div className="pixel-card space-y-4">
          <h2 className="pixel text-sm">Login</h2>

          <AuthButtons />
        </div>
      )}

      {user && (
        <div className="space-y-4">
          <ProfileChip />
        </div>
      )}

      <StreakBadge />

      <StreakLeaderboard />

      <LeaderboardModal />

      <section id="games" className="scroll-mt-8">
        <h2 className="pixel mb-6">Games</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}
