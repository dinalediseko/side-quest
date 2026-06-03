"use client";

import Link from "next/link";

import { loginGoogle } from "@/firebase/auth";

export default function AuthButtons() {

  return (

    <div
      className="
flex
gap-4
flex-wrap
"
    >

      <button
        className="
pixel-btn
"
        onClick={loginGoogle}
      >
        Google Login
      </button>

      <Link
        href="/login"
      >

        <button
          className="
pixel-btn
"
        >
          Email Login
        </button>

      </Link>

      <Link
        href="/signup"
      >

        <button
          className="
pixel-btn
"
        >
          Create Account
        </button>

      </Link>

    </div>

  );

}