import { User } from "firebase/auth";
import { create } from "zustand";

interface Profile {
  username?: string;
  email?: string;

  streak?: number;
  currentStreak?: number;

  longestStreak?: number;
  bestStreak?: number;
}

interface AuthStore {
  user: User | null | undefined;
  profile: Profile | null;
  loading: boolean;

  setUser: (user: User | null | undefined) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  profile: null,
  loading: true,

  setUser: (user) =>
    set({
      user,
    }),

  setProfile: (profile) =>
    set({
      profile,
    }),

  setLoading: (loading) =>
    set({
      loading,
    }),
}));