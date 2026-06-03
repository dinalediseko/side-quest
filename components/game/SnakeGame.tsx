"use client";

import { useEffect, useRef } from "react";

import { submitScore } from "@/firebase/score";
import { useAuthStore } from "@/store/authStore";

export default function SnakeGame() {
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
      const { snakeConfig } = await import("@/phaser/snake/config");

      if (destroyed || gameRef.current) {
        return;
      }

      gameRef.current = new Phaser.Game(snakeConfig);
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
        length?: number;
        food?: number;
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

        await submitScore(currentUser.uid, username, "snake", score);
      } catch (error) {
        console.error("Failed to save Snake score:", error);
      }
    }

    window.addEventListener("snake-score", scoreListener);

    return () => {
      window.removeEventListener("snake-score", scoreListener);
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