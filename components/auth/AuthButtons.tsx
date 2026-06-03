"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginGoogle, userNeedsUsername } from "@/firebase/auth";

export default function AuthButtons() {
  const router = useRouter();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoadingGoogle(true);
    setError("");

    try {
      const user = await loginGoogle();
      const needsUsername = await userNeedsUsername(user.uid);

      if (needsUsername) {
        router.push("/setup-username");
        return;
      }

      router.push("/profile");
    } catch (err) {
      console.error("Google login error:", err);
      setError("GOOGLE SIGN IN FAILED");
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Link href="/login" className="pixel-btn">
          Sign In
        </Link>

        <Link href="/signup" className="pixel-btn">
          Sign Up
        </Link>

        <button
          type="button"
          className="pixel-btn"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? "CONNECTING..." : "Continue with Google"}
        </button>
      </div>

      {error ? (
        <p className="pixel-small text-[var(--sq-red)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}