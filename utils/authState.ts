import { User } from "firebase/auth";

export type AuthStatus = "loading" | "logged_out" | "logged_in";

export function getAuthStatus(
  user: User | null | undefined
): AuthStatus {
  if (user === undefined) return "loading";
  if (user === null) return "logged_out";

  return "logged_in";
}