import {
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

import { db } from "./config";

export async function updateStreak(
    uid: string
) {
    const ref = doc(
        db,
        "users",
        uid
    );

    const snap =
        await getDoc(ref);

    if (!snap.exists())
        return;

    const data =
        snap.data();

    const today =
        new Date().toDateString();

    const yesterday =
        new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const yesterdayStr =
        yesterday.toDateString();

    const last =
        data.lastVisit
            ? new Date(
                data.lastVisit
            ).toDateString()
            : null;

    if (last === today)
        return;

    let streak = 1;

    if (
        last === yesterdayStr
    ) {
        streak =
            (data.streak || 0) + 1;
    }

    await updateDoc(
        ref,
        {
            lastVisit:
                new Date()
                    .toISOString(),

            streak,

            bestStreak:
                Math.max(
                    streak,
                    data.bestStreak || 1
                )
        }
    );
}