"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/store/authStore";

import {
  getGameLeaderboard,
  getPlayerRank,
  submitScore,
} from "@/firebase/score";

export default function FlappyGame() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const gameRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const profileRef = useRef<any>(null);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  // Boot Phaser once
  useEffect(() => {
    let destroyed = false;

    async function init() {
      const Phaser = (await import("phaser")).default;
      const { flappyConfig } = await import("@/phaser/flappy/config");

      if (destroyed || gameRef.current) {
        return;
      }

      gameRef.current = new Phaser.Game(flappyConfig);
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

  // Score submission → dispatch rank data back into Phaser
  useEffect(() => {
    async function scoreListener(event: Event) {
      const customEvent = event as CustomEvent<{
        score?: number;
        medal?: string;
      }>;

      const score = Math.max(
        0,
        Math.floor(Number(customEvent.detail?.score || 0))
      );

      const currentUser = userRef.current;
      const currentProfile = profileRef.current;

      if (!currentUser) {
        window.dispatchEvent(
          new CustomEvent("flappy-rank-data", {
            detail: {
              saved: false,
              message: "LOGIN TO SAVE SCORE",
              rank: null,
              bestScore: score,
              leaderboard: [],
            },
          })
        );

        return;
      }

      try {
        const username = currentProfile?.username || "Player";

        const result = await submitScore(
          currentUser.uid,
          username,
          "flappy",
          score
        );

        const [topScores, rank] = await Promise.all([
          getGameLeaderboard("flappy", 5),
          getPlayerRank("flappy", currentUser.uid),
        ]);

        const leaderboard = topScores.map((entry) => ({
          ...entry,
          isCurrentUser: entry.uid === currentUser.uid,
        }));

        window.dispatchEvent(
          new CustomEvent("flappy-rank-data", {
            detail: {
              saved: true,
              message: result.isPersonalBest
                ? "NEW ONLINE BEST"
                : "SCORE SAVED",
              rank: rank?.rank ?? null,
              bestScore: rank?.bestScore ?? score,
              leaderboard,
            },
          })
        );
      } catch (error) {
        console.error("Failed to save Flappy score:", error);

        window.dispatchEvent(
          new CustomEvent("flappy-rank-data", {
            detail: {
              saved: false,
              message: "SAVE FAILED",
              rank: null,
              bestScore: score,
              leaderboard: [],
            },
          })
        );
      }
    }

    window.addEventListener("flappy-score", scoreListener);

    return () => {
      window.removeEventListener("flappy-score", scoreListener);
    };
  }, []);

  // Phaser retry button → restart scene
  useEffect(() => {
    function restartListener() {
      const scene = gameRef.current?.scene?.getScene("FlappyScene");

      if (scene) {
        scene.scene.restart();
      }
    }

    window.addEventListener("flappy-restart", restartListener);

    return () => {
      window.removeEventListener("flappy-restart", restartListener);
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