import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
}
    from "firebase/firestore"

import { db }
    from "./config"

import {
    onSnapshot
}
    from "firebase/firestore"

export function watchUserProfile(

    uid: string,

    callback: any

) {

    const ref =

        doc(
            db,
            "users",
            uid
        )

    return onSnapshot(

        ref,

        (snapshot) => {

            if (
                snapshot.exists()
            ) {

                callback(

                    snapshot.data()

                )

            }

        }

    )

}

export async function createOrUpdateUser(

    uid: string,
    username: string

) {

    const ref =
        doc(
            db,
            "users",
            uid
        );

    const existing =
        await getDoc(ref);

    if (!existing.exists()) {

        await setDoc(

            ref,

            {

                username,

                createdAt:
                    serverTimestamp(),

                lastVisit:
                    new Date()
                        .toISOString(),

                streak: 0,

                longestStreak: 0

            }

        );

        return;

    }

    await setDoc(

        ref,

        {

            username

        },

        {

            merge: true

        }

    );

}

export async function getUserProfile(

    uid: string

) {

    const ref =

        doc(
            db,
            "users",
            uid
        )

    const snap =

        await getDoc(
            ref
        )

    if (!snap.exists())
        return null

    return snap.data()

}