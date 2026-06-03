"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";

import { submitScore } from "@/firebase/score";
import { useAuthStore } from "@/store/authStore";

export default function BallzGame() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const gameRef = useRef<Phaser.Game | null>(null);
  const userRef = useRef<typeof user>(user);
  const profileRef = useRef<typeof profile>(profile);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const PhaserModule = (await import("phaser")).default;
      const { ballzConfig } = await import("@/phaser/ballz/config");

      if (destroyed || gameRef.current) {
        return;
      }

      gameRef.current = new PhaserModule.Game(ballzConfig);
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
        shots?: number;
        balls?: number;
      }>;

      const score = Math.max(
        0,
        Math.floor(Number(customEvent.detail?.score || 0))
      );

      const currentUser = userRef.current;
      const currentProfile = profileRef.current;

      if (!currentUser) {
        return;
      }

      try {
        const username = currentProfile?.username || "Player";

        await submitScore(currentUser.uid, username, "ballz", score);
      } catch (error) {
        console.error("Failed to save Ballz score:", error);
      }
    }

    window.addEventListener("ballz-score", scoreListener);

    return () => {
      window.removeEventListener("ballz-score", scoreListener);
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