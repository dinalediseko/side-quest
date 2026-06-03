"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/authStore";

export default function SetupUsernamePage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    if (user && profile?.username) {
      router.push("/profile");
    }
  }, [user, profile?.username, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (cleanUsername.length < 3) {
      setError("USERNAME MUST BE AT LEAST 3 CHARACTERS");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      setError("USE LETTERS, NUMBERS, AND DASHES ONLY");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const usernameRef = doc(db, "usernames", cleanUsername);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        setError("USERNAME ALREADY TAKEN");
        setSaving(false);
        return;
      }

      await setDoc(usernameRef, {
        uid: user.uid,
        username: cleanUsername,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          username: cleanUsername,
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          streak: 0,
          currentStreak: 0,
          longestStreak: 0,
          bestStreak: 0,
        },
        {
          merge: true,
        }
      );

      router.push("/profile");
    } catch (err) {
      console.error("Username setup error:", err);
      setError("COULD NOT SAVE USERNAME");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="pixel-card space-y-4 text-center">
          <p className="pixel-small text-[var(--sq-red)]">
            FINAL STEP
          </p>

          <h1 className="pixel text-2xl leading-loose">
            CHOOSE YOUR PLAYER NAME
          </h1>

          <p className="pixel-small leading-loose opacity-70">
            THIS NAME WILL SHOW ON LEADERBOARDS AND PERSONAL SCORES.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="pixel-card space-y-5">
          <div className="space-y-2">
            <label className="pixel-small opacity-70">
              USERNAME
            </label>

            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="player-name"
              className="w-full border-4 border-[var(--sq-black)] bg-[var(--sq-white)] px-4 py-4 text-[var(--sq-black)] outline-none"
            />
          </div>

          {error ? (
            <p className="pixel-small text-[var(--sq-red)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="pixel-btn w-full"
          >
            {saving ? "SAVING..." : "SAVE USERNAME"}
          </button>
        </form>
      </div>
    </main>
  );
}