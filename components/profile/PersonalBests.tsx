"use client";

import { useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, query, where } from "firebase/firestore";

import { games } from "@/config/games";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/authStore";

type ScoreEntry = {
  id: string;
  uid: string;
  username?: string;
  gameId: string;
  score: number;
  medal?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export default function PersonalBests() {
  const user = useAuthStore((s) => s.user);

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const scoresQuery = query(
      collection(db, "scores"),
      where("uid", "==", user.uid),
    );

    const unsub = onSnapshot(
      scoresQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            uid: String(data.uid || ""),
            username: data.username,
            gameId: String(data.gameId || ""),
            score: Number(data.score || 0),
            medal: data.medal,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        setScores(entries);
        setLoadedUid(user.uid);
      },
      (error) => {
        console.error("Personal bests error:", error);
        setLoadedUid(user.uid);
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const visibleScores = useMemo(() => {
    if (!user?.uid) {
      return [];
    }

    return scores;
  }, [scores, user?.uid]);

  const isLoading = Boolean(user?.uid && loadedUid !== user.uid);

  const scoresByGame = useMemo(() => {
    return games.map((game) => {
      const topScores = visibleScores
        .filter((score) => score.gameId === game.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return {
        game,
        topScores,
      };
    });
  }, [visibleScores]);

  if (!user?.uid) {
    return (
      <div className="pixel-card">
        <p className="pixel-small opacity-70">
          SIGN IN TO VIEW YOUR PERSONAL BESTS
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pixel-card">
        <p className="pixel-small opacity-70">LOADING SCORES...</p>
      </div>
    );
  }

  return (
    <div className="pixel-card space-y-6">
      <div className="space-y-1">
        <h2 className="pixel text-sm">PERSONAL BESTS</h2>

        <p className="pixel-small opacity-70">YOUR TOP 5 SCORES PER GAME</p>
      </div>

      {visibleScores.length === 0 ? (
        <p className="pixel-small opacity-70">
          NO SCORES YET. PLAY A SIDE QUEST TO SET YOUR FIRST BEST.
        </p>
      ) : (
        <div className="space-y-6">
          {scoresByGame.map(({ game, topScores }) => (
            <div
              key={game.id}
              className="space-y-3 border-b-2 border-[var(--sq-black)] pb-5 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="pixel-small text-[var(--sq-red)]">
                  {game.title.toUpperCase()}
                </h3>

                <span className="pixel-small opacity-60">
                  TOP {topScores.length || 0}
                </span>
              </div>

              {topScores.length === 0 ? (
                <p className="pixel-small opacity-60">NO SCORE RECORDED YET</p>
              ) : (
                <div className="space-y-2">
                  {topScores.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="pixel-small opacity-70">
                        #{index + 1}
                      </span>

                      <span className="pixel-small flex-1">
                        SCORE {entry.score}
                      </span>

                      {entry.medal ? (
                        <span className="pixel-small opacity-60">
                          {entry.medal}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
