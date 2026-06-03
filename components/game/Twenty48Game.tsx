"use client";

import { useEffect, useRef } from "react";

import { submitScore } from "@/firebase/score";
import { useAuthStore } from "@/store/authStore";

export default function Twenty48Game() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const gameRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const profileRef = useRef<any>(null);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const Phaser = (await import("phaser")).default;
      const { twenty48Config } = await import("@/phaser/twenty48/config");

      if (destroyed || gameRef.current) {
        return;
      }

      gameRef.current = new Phaser.Game(twenty48Config);
    }

    init();

    return () => {
      destroyed = true;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function scoreListener(event: Event) {
      const customEvent = event as CustomEvent<{
        score?: number;
        bestTile?: number;
      }>;

      const score = Math.max(
        0,
        Math.floor(Number(customEvent.detail?.score || 0))
      );

      const currentUser = userRef.current;
      const currentProfile = profileRef.current;

      if (!currentUser) return;

      try {
        const username = currentProfile?.username || "Player";

        await submitScore(currentUser.uid, username, "2048", score);
      } catch (error) {
        console.error("Failed to save 2048 score:", error);
      }
    }

    window.addEventListener("twenty48-score", scoreListener);

    return () => {
      window.removeEventListener("twenty48-score", scoreListener);
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      <div
        id="game-container"
        className="w-full max-w-[480px] touch-none select-none"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}