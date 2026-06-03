import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";

import { db } from "./config";

export function watchStreakLeaderboard(
    callback: any,
    count = 20
) {
    const q = query(
        collection(db, "users"),
        orderBy("bestStreak", "desc"),
        limit(count)
    );

    return onSnapshot(
        q,
        (snapshot) => {
            callback(
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            );
        },
        (error) => {
            console.error(error);
        }
    );
}