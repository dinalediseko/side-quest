"use client";

import { signOut } from "firebase/auth";

import { auth } from "@/firebase/config";
import { useAuthStore } from "@/store/authStore";

export default function ProfileChip() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  if (!user) return null;

  const currentStreak = profile?.currentStreak || profile?.streak || 0;
  const longestStreak = profile?.bestStreak || profile?.longestStreak || 0;

  return (
    <div className="pixel-card flex items-center justify-between gap-4">
      <div className="space-y-2">
        <p className="pixel text-[10px] leading-loose">
          {profile?.username || "Player"}
        </p>

        <div className="space-y-1">
          {currentStreak > 0 ? (
            <p className="pixel-small text-[var(--sq-red)]">
              CURRENT STREAK {currentStreak}
            </p>
          ) : (
            <p className="pixel-small text-[var(--sq-red)]">STREAK ENDED</p>
          )}

          <p className="pixel-small opacity-70">
            LONGEST STREAK {longestStreak}
          </p>
        </div>
      </div>

      <button className="pixel-btn" onClick={() => signOut(auth)}>
        LOGOUT
      </button>
    </div>
  );
}
