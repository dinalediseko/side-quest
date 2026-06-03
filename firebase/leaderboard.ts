import {
    collection,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    type Unsubscribe,
} from "firebase/firestore";

import { db } from "./config";

export interface LeaderboardEntry {
    id: string;
    uid?: string;
    username?: string;
    bestScore?: number;
    score?: number;
    gameId?: string;
    updatedAt?: unknown;
    createdAt?: unknown;
}

/*
ONE TIME FETCH
*/
export async function getLeaderboard(
    gameId: string
): Promise<LeaderboardEntry[]> {
    const q = query(
        collection(db, "leaderboards", gameId, "entries"),
        orderBy("bestScore", "desc"),
        limit(20)
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as LeaderboardEntry[];
}

/*
LIVE LEADERBOARD
*/
export function watchLeaderboard(
    gameId: string,
    callback: (entries: LeaderboardEntry[]) => void,
    count = 20
): Unsubscribe {
    const q = query(
        collection(db, "leaderboards", gameId, "entries"),
        orderBy("bestScore", "desc"),
        limit(count)
    );

    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as LeaderboardEntry[];

        callback(entries);
    });
}