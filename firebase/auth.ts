import { auth, db } from "./config";

import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User,
} from "firebase/auth";

import {
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

/* -------------------------
   AUTH PROVIDERS
--------------------------*/

export async function loginGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    await ensureUserDoc(result.user.uid, result.user.email || "");

    return result.user;
}

export async function loginEmail(
    email: string,
    password: string
): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);

    await ensureUserDoc(result.user.uid, email);

    return result.user;
}

export async function registerEmail(
    email: string,
    password: string,
    username: string
): Promise<User> {
    const cleanUsername = cleanUsernameValue(username);

    const usernameRef = doc(db, "usernames", cleanUsername);
    const existing = await getDoc(usernameRef);

    if (existing.exists()) {
        throw new Error("Username already taken");
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
        uid,
        email,
        username: cleanUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        streak: 0,
        currentStreak: 0,
        longestStreak: 0,
        bestStreak: 0,
    });

    await setDoc(usernameRef, {
        uid,
        username: cleanUsername,
        createdAt: serverTimestamp(),
    });

    return cred.user;
}

export async function logout(): Promise<void> {
    await signOut(auth);
}

/* -------------------------
   USER HELPERS
--------------------------*/

export async function ensureUserDoc(
    uid: string,
    email: string
): Promise<void> {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            uid,
            email,
            username: "",
            streak: 0,
            currentStreak: 0,
            longestStreak: 0,
            bestStreak: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return;
    }

    await setDoc(
        ref,
        {
            email,
            updatedAt: serverTimestamp(),
        },
        {
            merge: true,
        }
    );
}

export async function userNeedsUsername(uid: string): Promise<boolean> {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return true;
    }

    const data = snap.data();
    const username = data.username;

    return typeof username !== "string" || username.trim().length === 0;
}

export async function updateUser(
    uid: string,
    username: string,
    currentUsername?: string
): Promise<void> {
    const clean = cleanUsernameValue(username);

    const currentClean = currentUsername
        ? cleanUsernameValue(currentUsername)
        : "";

    if (currentClean && clean === currentClean) {
        return;
    }

    const usernameRef = doc(db, "usernames", clean);
    const existing = await getDoc(usernameRef);

    if (existing.exists()) {
        const data = existing.data();

        if (data.uid !== uid) {
            throw new Error("Username already taken");
        }
    }

    await setDoc(usernameRef, {
        uid,
        username: clean,
        createdAt: serverTimestamp(),
    });

    await setDoc(
        doc(db, "users", uid),
        {
            username: clean,
            updatedAt: serverTimestamp(),
        },
        {
            merge: true,
        }
    );

    if (currentClean) {
        await deleteDoc(doc(db, "usernames", currentClean));
    }
}

/* -------------------------
   VALIDATION HELPERS
--------------------------*/

function cleanUsernameValue(username: string): string {
    const clean = username.trim().toLowerCase().replace(/\s+/g, "-");

    if (clean.length < 3) {
        throw new Error("Username must be at least 3 characters");
    }

    if (clean.length > 24) {
        throw new Error("Username must be 24 characters or less");
    }

    if (!/^[a-z0-9-]+$/.test(clean)) {
        throw new Error("Use letters, numbers, and dashes only");
    }

    return clean;
}