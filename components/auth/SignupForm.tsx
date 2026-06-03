"use client";

import { useState } from "react";

import { registerEmail } from "@/firebase/auth";

export default function SignupForm() {
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  async function save() {
    try {
      setError("");

      if (password !== confirm) {
        throw new Error("Passwords do not match");
      }

      await registerEmail(email, password, username);
      
      window.location.href = "/";
    } catch (err: any) {
      if (err.message.includes("permission")) {
        setError(
          `
Firestore blocked signup.

Go to:

Firebase → Firestore → Rules

and publish the updated rules.
`,
        );
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <div
      className="
      pixel-card
      p-6
      w-full
      max-w-md
      space-y-3
      "
    >
      <h1>Create Account</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type={showPassword ? "text" : "password"}
        placeholder="
Password
"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type={showPassword ? "text" : "password"}
        placeholder="
Confirm Password
"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <label
        className="
flex
gap-2
items-center
"
      >
        <input
          type="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
        />
        Show password
      </label>

      <button onClick={save} className="pixel-btn">
        Sign Up
      </button>

      {error && <div>{error}</div>}
    </div>
  );
}
