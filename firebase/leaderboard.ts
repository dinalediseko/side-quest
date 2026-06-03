import {

    collection,
    query,
    orderBy,
    limit,

    getDocs,

    onSnapshot

}

    from "firebase/firestore"

import {
    db
}
    from "./config"

/*
ONE TIME FETCH
*/

export async function getLeaderboard(

    gameId: string

) {

    const q =

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

            limit(
                20
            )

        )

    const snap =

        await getDocs(
            q
        )

    return snap.docs.map(

        doc => ({

            id: doc.id,

            ...doc.data()

        })

    )

}

/*
LIVE LEADERBOARD
*/

export function watchLeaderboard(

    gameId: string,

    callback: any,

    count = 20

) {

    const q =

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

            limit(
                count
            )

        )

    return onSnapshot(

        q,

        (snapshot) => {

            callback(

                snapshot.docs.map(

                    doc => ({

                        id: doc.id,

                        ...doc.data()

                    })

                )

            )

        }

    )

}