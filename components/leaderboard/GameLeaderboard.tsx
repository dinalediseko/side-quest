"use client";

import { useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, query, where } from "firebase/firestore";

import {
  watchLeaderboard,
  type LeaderboardEntry,
} from "@/firebase/leaderboard";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/authStore";

type PersonalScoreEntry = {
  id: string;
  uid: string;
  username?: string;
  gameId: string;
  score: number;
  medal?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export default function GameLeaderboard({ gameId }: { gameId: string }) {
  const user = useAuthStore((s) => s.user);

  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [personalScores, setPersonalScores] = useState<PersonalScoreEntry[]>(
    [],
  );

  useEffect(() => {
    const unsub = watchLeaderboard(gameId, setPlayers, 20);

    return () => unsub();
  }, [gameId]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const personalQuery = query(
      collection(db, "scores"),
      where("uid", "==", user.uid),
      where("gameId", "==", gameId),
    );

    const unsub = onSnapshot(
      personalQuery,
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

        setPersonalScores(entries);
      },
      (error) => {
        console.error("Personal leaderboard scores error:", error);
      },
    );

    return () => unsub();
  }, [gameId, user?.uid]);

  const topPersonalScores = useMemo(() => {
    return personalScores
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [personalScores]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="pixel-card space-y-5">
        <div className="space-y-1">
          <h2 className="pixel text-lg leading-loose">GLOBAL TOP SCORES</h2>

          <p className="pixel-small opacity-70">
            THE HIGHEST SAVED SCORES FOR THIS GAME.
          </p>
        </div>

        {players.length === 0 ? (
          <p className="pixel-small opacity-70">NO SCORES YET</p>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-4 border-b-2 border-[var(--sq-black)] pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="pixel-small">
                    #{index + 1} {player.username || "Player"}
                  </p>
                </div>

                <p className="pixel-small text-[var(--sq-red)]">
                  {player.bestScore || player.score || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pixel-card space-y-5">
        <div className="space-y-1">
          <h2 className="pixel text-lg leading-loose">YOUR PERSONAL BESTS</h2>

          <p className="pixel-small opacity-70">
            YOUR TOP 5 SAVED SCORES FOR THIS GAME.
          </p>
        </div>

        {!user?.uid ? (
          <p className="pixel-small opacity-70">
            SIGN IN TO VIEW YOUR PERSONAL BESTS.
          </p>
        ) : topPersonalScores.length === 0 ? (
          <p className="pixel-small opacity-70">
            NO PERSONAL SCORES YET. PLAY THIS GAME TO SET ONE.
          </p>
        ) : (
          <div className="space-y-3">
            {topPersonalScores.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-4 border-b-2 border-[var(--sq-black)] pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="pixel-small">#{index + 1}</p>

                  {entry.medal ? (
                    <p className="pixel-small opacity-60">{entry.medal}</p>
                  ) : null}
                </div>

                <p className="pixel-small text-[var(--sq-red)]">
                  SCORE {entry.score}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
