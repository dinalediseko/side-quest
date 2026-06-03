import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./config";

export interface UserProfile {
  username?: string;
  email?: string;

  streak?: number;
  currentStreak?: number;

  longestStreak?: number;
  bestStreak?: number;

  createdAt?: unknown;
  updatedAt?: unknown;
  lastVisit?: string;
}

export function watchUserProfile(
  uid: string,
  callback: (profile: UserProfile) => void
): Unsubscribe {
  const ref = doc(db, "users", uid);

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }

    callback(snapshot.data() as UserProfile);
  });
}

export async function createOrUpdateUser(
  uid: string,
  username: string
): Promise<void> {
  const ref = doc(db, "users", uid);

  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      username,
      createdAt: serverTimestamp(),
      lastVisit: new Date().toISOString(),
      streak: 0,
      currentStreak: 0,
      longestStreak: 0,
      bestStreak: 0,
    });

    return;
  }

  await setDoc(
    ref,
    {
      username,
    },
    {
      merge: true,
    }
  );
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as UserProfile;
}