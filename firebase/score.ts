import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc
} from "firebase/firestore";

import { db } from "./config";

export interface LeaderboardEntry {
    id: string;
    uid: string;
    username: string;
    bestScore: number;
    medal?: string;
}

export function getMedalForScore(score: number) {
    if (score >= 5000) {
        return "🥇 GOLD";
    }

    if (score >= 500) {
        return "🥈 SILVER";
    }

    if (score >= 100) {
        return "🥉 BRONZE";
    }

    return "NO MEDAL";
}

export async function submitScore(
    uid: string,
    username: string,
    gameId: string,
    score: number
) {
    const safeScore =
        Math.max(
            0,
            Math.floor(score)
        );

    const medal =
        getMedalForScore(
            safeScore
        );

    await addDoc(
        collection(db, "scores"),
        {
            uid,
            username,
            gameId,
            score: safeScore,
            medal,
            createdAt: Date.now()
        }
    );

    const bestRef =
        doc(
            db,
            "leaderboards",
            gameId,
            "entries",
            uid
        );

    const existing =
        await getDoc(bestRef);

    const oldScore =
        existing.exists()
            ? existing.data().bestScore || 0
            : 0;

    const isPersonalBest =
        safeScore > oldScore;

    if (isPersonalBest) {
        await setDoc(
            bestRef,
            {
                uid,
                username,
                gameId,
                bestScore: safeScore,
                medal,
                updatedAt: Date.now()
            },
            {
                merge: true
            }
        );

        await setDoc(
            doc(
                db,
                "users",
                uid,
                "bests",
                gameId
            ),
            {
                gameId,
                score: safeScore,
                medal,
                updatedAt: Date.now()
            },
            {
                merge: true
            }
        );
    }

    return {
        score: safeScore,
        medal,
        previousBest: oldScore,
        isPersonalBest
    };
}

export async function getGameLeaderboard(
    gameId: string,
    count = 10
): Promise<LeaderboardEntry[]> {
    const leaderboardQuery =
        query(
            collection(
                db,
                "leaderboards",
                gameId,
                "entries"
            ),
            orderBy(
                "bestScore",
                "desc"
            ),
            limit(count)
        );

    const snapshot =
        await getDocs(
            leaderboardQuery
        );

    return snapshot.docs.map(
        (docSnap) => ({
            id: docSnap.id,
            uid: docSnap.data().uid,
            username:
                docSnap.data().username ||
                "Player",
            bestScore:
                docSnap.data().bestScore ||
                0,
            medal:
                docSnap.data().medal ||
                getMedalForScore(
                    docSnap.data().bestScore || 0
                )
        })
    );
}

export async function getPlayerRank(
    gameId: string,
    uid: string
) {
    const leaderboardQuery =
        query(
            collection(
                db,
                "leaderboards",
                gameId,
                "entries"
            ),
            orderBy(
                "bestScore",
                "desc"
            )
        );

    const snapshot =
        await getDocs(
            leaderboardQuery
        );

    const entries =
        snapshot.docs.map(
            (docSnap, index) => ({
                id: docSnap.id,
                rank: index + 1,
                uid:
                    docSnap.data().uid,
                username:
                    docSnap.data().username ||
                    "Player",
                bestScore:
                    docSnap.data().bestScore ||
                    0,
                medal:
                    docSnap.data().medal ||
                    getMedalForScore(
                        docSnap.data().bestScore || 0
                    )
            })
        );

    return (
        entries.find(
            (entry) =>
                entry.uid === uid
        ) || null
    );
}