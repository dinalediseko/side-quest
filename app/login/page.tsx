"use client";

import { useState } from "react";

import { loginEmail } from "@/firebase/auth";

import BackButton from "@/components/ui/BackButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [show, setShow] = useState(false);

  async function submit() {
    try {
      await loginEmail(email, password);

      window.location.href = "/";
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <BackButton />
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type={show ? "text" : "password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={() => setShow(!show)}>👁</button>

      <button
        className="
pixel-btn
"
        onClick={submit}
      >
        Login
      </button>
    </main>
  );
}
