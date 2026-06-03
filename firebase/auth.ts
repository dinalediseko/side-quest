import { auth, db } from "./config";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

/* -------------------------
   AUTH PROVIDERS
--------------------------*/

export async function loginGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    await ensureUserDoc(result.user.uid, result.user.email || "");

    return result.user;
}

export async function loginEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);

    await ensureUserDoc(result.user.uid, email);

    return result.user;
}

export async function registerEmail(email: string, password: string, username: string) {
    const cleanUsername = username.trim().toLowerCase();

    // 1. Check username uniqueness
    const usernameRef = doc(db, "usernames", cleanUsername);
    const existing = await getDoc(usernameRef);

    if (existing.exists()) {
        throw new Error("Username already taken");
    }

    // 2. Create auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 3. Create user profile
    await setDoc(doc(db, "users", uid), {
        uid,
        email,
        username: cleanUsername,
        createdAt: serverTimestamp(),
        streak: 0,
        longestStreak: 0,
    });

    // 4. Reserve username globally
    await setDoc(usernameRef, {
        uid,
    });

    return cred.user;
}

export async function logout() {
    return signOut(auth);
}

/* -------------------------
   USER HELPERS
--------------------------*/

export async function ensureUserDoc(uid: string, email: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            uid,
            email,
            username: null,
            streak: 0,
            longestStreak: 0,
            createdAt: serverTimestamp(),
        });
    }
}

export async function updateUser(uid: string, username: string) {
    const clean = username.trim().toLowerCase();

    const usernameRef = doc(db, "usernames", clean);
    const existing = await getDoc(usernameRef);

    if (existing.exists()) {
        throw new Error("Username already taken");
    }

    // update user
    await setDoc(
        doc(db, "users", uid),
        {
            username: clean,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );

    // reserve username
    await setDoc(usernameRef, {
        uid,
    });
}
