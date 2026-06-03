import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./config";

export interface StreakLeaderboardEntry {
  id: string;
  uid?: string;
  username?: string;
  streak?: number;
  currentStreak?: number;
  longestStreak?: number;
  bestStreak?: number;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export function watchStreakLeaderboard(
  callback: (entries: StreakLeaderboardEntry[]) => void,
  count = 20
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    orderBy("bestStreak", "desc"),
    limit(count)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StreakLeaderboardEntry[];

      callback(entries);
    },
    (error) => {
      console.error("Streak leaderboard error:", error);
    }
  );
}