"use client";

import { useState } from "react";

import { updateUser } from "@/firebase/auth";
import { useAuthStore } from "@/store/authStore";

export default function UsernameEditor() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateUser(user.uid, username, profile?.username);

      setMessage("USERNAME UPDATED");
    } catch (err) {
      console.error("Username update error:", err);
      setError(
        err instanceof Error ? err.message.toUpperCase() : "USERNAME UPDATE FAILED"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pixel-card space-y-5">
      <div className="space-y-1">
        <h2 className="pixel text-sm">CHANGE USERNAME</h2>

        <p className="pixel-small opacity-70">
          UPDATE THE NAME SHOWN ON LEADERBOARDS.
        </p>
      </div>

      <div className="space-y-2">
        <label className="pixel-small opacity-70">USERNAME</label>

        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="player-name"
          className="w-full border-4 border-[var(--sq-black)] bg-[var(--sq-white)] px-4 py-4 text-[var(--sq-black)] outline-none"
        />
      </div>

      {message ? (
        <p className="pixel-small text-[var(--sq-red)]">{message}</p>
      ) : null}

      {error ? (
        <p className="pixel-small text-[var(--sq-red)]">{error}</p>
      ) : null}

      <button type="submit" disabled={saving} className="pixel-btn w-full">
        {saving ? "SAVING..." : "SAVE USERNAME"}
      </button>
    </form>
  );
}